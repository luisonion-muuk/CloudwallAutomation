// db_util.js

const { Client } = require('pg');
const { Client: SSHClient } = require('ssh2');
const fs = require('fs');
const path = require('path');
const net = require('net');

// Module-level tunnel state so all connections share a single SSH tunnel
let _tunnelServer = null;
let _sshClient = null;
let _tunnelPort = null;
let _tunnelReady = null; // Promise that resolves when tunnel is ready

/**
 * Gets the environment name from SERVER_HOST.
 * Returns 'dev' if running locally.
 *
 * @returns {string}
 */
function getEnvName() {
  const serverHost = process.env.SERVER_HOST || '';
  if (serverHost === 'localhost') {
    return 'dev';
  }
  // Extract env name from SERVER_HOST (e.g. 'cw-alpha.corp.aquent.io' → 'alpha')
  const parts = serverHost.split(/[.\-]/);
  return parts[1] || 'dev';
}

/**
 * Resolves the path to the SSH private key.
 * Checks DB_SSH_KEY env var first, then falls back to ~/.ssh/id_ed25519.
 *
 * @returns {string}
 */
function getSshKeyPath() {
  if (process.env.DB_SSH_KEY) {
    return process.env.DB_SSH_KEY;
  }
  return path.join(process.env.HOME || process.env.USERPROFILE || '', '.ssh', 'id_ed25519');
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
 * Enabled by default for local development; disabled when DB_HOST is explicitly set
 * (e.g. in CI where the DB is directly reachable or a manual tunnel is already running).
 *
 * @returns {boolean}
 */
function useSshTunnel() {
  // If DB_HOST is set, the caller is handling connectivity themselves
  if (process.env.DB_HOST) {
    return false;
  }
  // If explicitly opted out
  if (process.env.DB_SSH_TUNNEL === 'false') {
    return false;
  }
  return true;
}

/**
 * Starts a local TCP server that forwards connections through the SSH tunnel.
 * The tunnel is shared across all DB connections in the same process.
 * Automatically selects a free local port.
 *
 * @returns {Promise<number>} The local port to connect to
 */
function ensureTunnel() {
  if (_tunnelReady) {
    return _tunnelReady;
  }

  _tunnelReady = new Promise((resolve, reject) => {
    const sshHost = process.env.DB_SSH_HOST || '35.86.108.64';
    const sshPort = parseInt(process.env.DB_SSH_PORT || '22', 10);
    const sshUser = process.env.DB_SSH_USER || 'pwright-user';
    const keyPath = getSshKeyPath();

    if (!fs.existsSync(keyPath)) {
      reject(new Error(
        `SSH key not found at "${keyPath}". ` +
        'Set the DB_SSH_KEY env var to point to your private key, ' +
        'or place it at ~/.ssh/id_ed25519.'
      ));
      return;
    }

    const dbHost = getDbHost();
    const dbPort = parseInt(process.env.DB_PORT || '5432', 10);

    const ssh = new SSHClient();
    _sshClient = ssh;

    ssh.on('ready', () => {
      // Create a local TCP server that forwards to the remote DB through SSH
      const server = net.createServer((localSocket) => {
        ssh.forwardOut(
          '127.0.0.1', localSocket.localPort,
          dbHost, dbPort,
          (err, stream) => {
            if (err) {
              localSocket.destroy();
              return;
            }
            localSocket.pipe(stream).pipe(localSocket);
          }
        );
      });

      // Listen on port 0 = OS picks a free port
      server.listen(0, '127.0.0.1', () => {
        _tunnelServer = server;
        const addr = server.address();
        _tunnelPort = typeof addr === 'object' && addr !== null ? addr.port : 0;
        resolve(_tunnelPort);
      });

      server.on('error', (err) => {
        reject(err);
      });
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
 * Closes the shared SSH tunnel. Call this during global teardown if desired.
 */
async function closeTunnel() {
  if (_tunnelServer) {
    _tunnelServer.close();
    _tunnelServer = null;
  }
  if (_sshClient) {
    _sshClient.end();
    _sshClient = null;
  }
  _tunnelPort = null;
  _tunnelReady = null;
}

/**
 * Creates a PostgreSQL database connection.
 *
 * Connection modes (in priority order):
 *
 *   1. Manual tunnel / direct connection:
 *      Set DB_HOST (and optionally DB_PORT) to connect directly.
 *      Example: DB_HOST=localhost npx playwright test
 *
 *   2. Automatic SSH tunnel (default for local dev):
 *      When DB_HOST is NOT set, an SSH tunnel is created automatically using
 *      the settings from your IntelliJ/IDE configuration:
 *        - SSH host:  DB_SSH_HOST  (default: 35.86.108.64)
 *        - SSH user:  DB_SSH_USER  (default: pwright-user)
 *        - SSH key:   DB_SSH_KEY   (default: ~/.ssh/id_ed25519)
 *        - DB host:   DB_REMOTE_HOST (default: cw-{env}-db.corp.aquent.io)
 *
 *   3. Disable tunnel explicitly:
 *      DB_SSH_TUNNEL=false npx playwright test
 *
 * @returns {Promise<Client>} Connected pg Client
 */
async function createDbConnection() {
  let host, port, ssl;

  if (useSshTunnel()) {
    // Automatic SSH tunnel
    const localPort = await ensureTunnel();
    host = '127.0.0.1';
    port = localPort;
    ssl = { rejectUnauthorized: false };
  } else {
    // Direct or manual tunnel
    const envName = getEnvName() === 'localhost' ? 'dev' : getEnvName();
    host = process.env.DB_HOST || `cw-${envName}-db.corp.aquent.io`;
    port = parseInt(process.env.DB_PORT || '5432', 10);
    ssl = process.env.DB_HOST === 'localhost' ? false : { rejectUnauthorized: false };
  }

  const clientOpts = {
    host,
    port,
    database: 'aquent_cdb',
    user: 'testautomation',
    password: process.env.DB_PASSWORD || '',
    ssl,
  };

  const client = new Client(clientOpts);

  await client.connect();
  return client;
}

/**
 * Creates a database connection, runs the query, closes the connection, then returns the result.
 *
 * @param {string} query - SQL query string
 * @returns {Promise<Object[]>} Array of row objects from the query result
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
 * Finds a row in query results where the specified field matches the given value.
 *
 * @param {Object[]} queryResult - Array of row objects
 * @param {string} field - Column name to search
 * @param {*} value - Value to match
 * @returns {Object|undefined} The matching row, or undefined if not found
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