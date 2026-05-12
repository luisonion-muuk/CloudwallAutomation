// db_util.js

const { Client } = require('pg');
const { Client: SSHClient } = require('ssh2');
const fs = require('fs');
const path = require('path');
const net = require('net');
const os = require('os');

// Module-level tunnel state so all connections share a single SSH tunnel
let _tunnelServer = null;
let _sshClient = null;
let _tunnelPort = null;
let _tunnelReady = null;

/**
 * Expands a leading ~ to the user's home directory.
 * Node.js does not expand ~ automatically, unlike the shell.
 *
 * @param {string} filePath
 * @returns {string}
 */
function expandHome(filePath) {
  if (!filePath) return filePath;
  if (filePath.startsWith('~/') || filePath === '~') {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

/**
 * Gets the environment name from SERVER_HOST.
 *
 * @returns {string}
 */
function getEnvName() {
  const serverHost = process.env.SERVER_HOST || '';
  if (serverHost === 'localhost') return 'dev';
  const parts = serverHost.split(/[.\-]/);
  return parts[1] || 'dev';
}

/**
 * Resolves the path to the SSH private key, expanding ~ if needed.
 *
 * @returns {string}
 */
function getSshKeyPath() {
  const keyPath = process.env.DB_SSH_KEY || path.join(os.homedir(), '.ssh', 'id_ed25519');
  return expandHome(keyPath);
}

/**
 * Returns the DB host for the current environment.
 *
 * @returns {string}
 */
function getDbHost() {
  const envName = getEnvName() === 'localhost' ? 'dev' : getEnvName();
  return process.env.DB_REMOTE_HOST || `cw-${envName}-db.corp.aquent.io`;
}

/**
 * Determines whether to use an SSH tunnel.
 *
 * @returns {boolean}
 */
function useSshTunnel() {
  if (process.env.DB_HOST) return false;
  if (process.env.DB_SSH_TUNNEL === 'false') return false;
  return true;
}

/**
 * Starts a local TCP server that forwards connections through the SSH tunnel.
 *
 * @returns {Promise<number>} The local port to connect to
 */
function ensureTunnel() {
  if (_tunnelReady) return _tunnelReady;

  _tunnelReady = new Promise((resolve, reject) => {
    const sshHost = process.env.DB_SSH_HOST || '35.86.108.64';
    const sshPort = parseInt(process.env.DB_SSH_PORT || '22', 10);
    const sshUser = process.env.DB_SSH_USER || 'pwright-user';
    const keyPath = getSshKeyPath();

    if (!fs.existsSync(keyPath)) {
      reject(new Error(
        `SSH key not found at "${keyPath}". ` +
        'Set the DB_SSH_KEY env var to point to your private key, ' +
        `or place it at ${path.join(os.homedir(), '.ssh', 'id_ed25519')}.`
      ));
      return;
    }

    const dbHost = getDbHost();
    const dbPort = parseInt(process.env.DB_PORT || '5432', 10);

    const ssh = new SSHClient();
    _sshClient = ssh;

    ssh.on('ready', () => {
      const server = net.createServer((localSocket) => {
        ssh.forwardOut(
          '127.0.0.1', localSocket.localPort,
          dbHost, dbPort,
          (err, stream) => {
            if (err) { localSocket.destroy(); return; }
            localSocket.pipe(stream).pipe(localSocket);
          }
        );
      });

      server.listen(0, '127.0.0.1', () => {
        _tunnelServer = server;
        const addr = server.address();
        _tunnelPort = typeof addr === 'object' && addr !== null ? addr.port : 0;
        resolve(_tunnelPort);
      });

      server.on('error', (err) => reject(err));
    });

    ssh.on('error', (err) => {
      _tunnelReady = null;
      reject(new Error(`SSH tunnel connection failed: ${err.message}`));
    });

    ssh.connect({
      host: sshHost,
      port: sshPort,
      username: sshUser,
      privateKey: fs.readFileSync(keyPath),
    });
  });

  return _tunnelReady;
}

/**
 * Closes the shared SSH tunnel.
 */
async function closeTunnel() {
  if (_tunnelServer) { _tunnelServer.close(); _tunnelServer = null; }
  if (_sshClient) { _sshClient.end(); _sshClient = null; }
  _tunnelPort = null;
  _tunnelReady = null;
}

/**
 * Creates a PostgreSQL database connection.
 *
 * @returns {Promise<Client>} Connected pg Client
 */
async function createDbConnection() {
  let host, port, ssl;

  if (useSshTunnel()) {
    const localPort = await ensureTunnel();
    host = '127.0.0.1';
    port = localPort;
    ssl = { rejectUnauthorized: false };
  } else {
    const envName = getEnvName() === 'localhost' ? 'dev' : getEnvName();
    host = process.env.DB_HOST || `cw-${envName}-db.corp.aquent.io`;
    port = parseInt(process.env.DB_PORT || '5432', 10);
    ssl = process.env.DB_HOST === 'localhost' ? false : { rejectUnauthorized: false };
  }

  const client = new Client({
    host,
    port,
    database: 'aquent_cdb',
    user: 'testautomation',
    password: process.env.DB_PASSWORD || 'ECMB7pMZAaRYGvXTZXoh',
    ssl,
  });

  await client.connect();
  return client;
}

/**
 * Runs a query and returns rows.
 *
 * @param {string} query
 * @returns {Promise<Object[]>}
 */
async function queryDatabase(query) {
  const db = await createDbConnection();
  try {
    const result = await db.query(query);
    return result.rows;
  } finally {
    await db.end();
  }
}

/**
 * Finds a row where a field matches a value.
 */
function getResultsRowWithValue(queryResult, field, value) {
  return queryResult.find((row) => String(row[field]) === String(value));
}

module.exports = {
  getEnvName,
  createDbConnection,
  queryDatabase,
  getResultsRowWithValue,
  closeTunnel,
};
