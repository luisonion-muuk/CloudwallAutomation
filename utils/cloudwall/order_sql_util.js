// order_sql_util.js

const { loadData } = require('../../utils/util');
const { createDbConnection } = require('../../utils/db_util');
const { transformYaml } = require('./job_posting_util');

/**
 * Creates an order without a posting via SQL.
 *
 * @param {Object} orderData - Hash of order data to insert
 * @param {string} user - User set as created_by and report_to person
 * @param {Object} config - Config object containing agentUserName
 * @returns {Promise<string>} Result of tad_create_order_without_posting
 */
async function createOrderWithoutPostingSql(orderData, user, config) {
  const sqlData = loadData('data/yaml/utils/order_sql_util.yaml');
  const db = await createDbConnection();

  let params = '';
  if (orderData) {
    params = await createParamsString(orderData, sqlData.order_sql_fields, user, db, sqlData, config);
  }

  const query = await db.query(sqlData.create_order_without_posting_call.replace('%s', params));
  await db.end();
  return query.rows[0].tad_create_order_without_posting;
}

/**
 * Creates an order with a posting via SQL.
 *
 * @param {Object} orderData - Hash of order data to insert
 * @param {string} user - User set as created_by and report_to person
 * @param {Object} config - Config object containing agentUserName
 * @returns {Promise<string>} Result of tad_create_order_with_posting
 */
async function createOrderWithPostingSql(orderData, user, config) {
  const sqlData = loadData('data/yaml/utils/order_sql_util.yaml');
  const db = await createDbConnection();

  const sqlFields = sqlData.order_sql_fields + sqlData.post_sql_fields;
  let params = '';
  if (orderData) {
    params = await createParamsString(orderData, sqlFields, user, db, sqlData, config);
  }

  const query = await db.query(sqlData.create_order_with_posting_call.replace('%s', params));
  await db.end();
  return query.rows[0].tad_create_order_with_posting;
}

/**
 * Builds a SQL parameter string for order creation.
 *
 * @param {Object} inputData - Hash of data to be inserted into the SQL
 * @param {string} sqlFields - Comma-separated list of fields in order to be passed to SQL
 * @param {string} user - User set as created_by and report_to person
 * @param {Object} db - Active database connection
 * @param {Object} sqlData - Loaded SQL YAML data
 * @param {Object} config - Config object containing agentUserName
 * @returns {Promise<string>} Formatted SQL parameter string
 */
async function createParamsString(inputData, sqlFields, user, db, sqlData, config) {
  if (!user) {
    user = config.agentUserName;
  }

  // Gather ids for created_by and report_to_person_id
  const userIdResult = await db.query(sqlData.get_user_id.replace('%s', user));
  inputData.created_by = userIdResult.rows[0].user_id;

  if (!inputData.report_to_person_id) {
    const personIdResult = await db.query(sqlData.get_person_id.replace('%s', user));
    inputData.report_to_person_id = parseInt(personIdResult.rows[0].person_id, 10);
  }

  let params = '';
  const fields = sqlFields.split(',');

  for (const rawEntry of fields) {
    const dataEntry = rawEntry.trim();

    if (inputData[dataEntry] !== undefined && inputData[dataEntry] !== null) {
      const orderInfo = transformYaml(inputData[dataEntry]);

      if (params !== '') {
        params += ', ';
      }

      // Case statement for unusual fields
      if (dataEntry === 'W2_IC') {
        params += `v_W2_IC => CAST(${inputData[dataEntry]} as smallint)`;
        continue;
      }

      if (dataEntry === 'start_date' || dataEntry === 'end_date') {
        params += `v_${dataEntry} => CAST(${orderInfo} as timestamp)`;
        continue;
      }

      // Add int, boolean, or text fields
      if (Number.isInteger(inputData[dataEntry])) {
        params += `v_${dataEntry} => ${inputData[dataEntry]}`;
      } else if (orderInfo === 'true' || orderInfo === 'false') {
        params += `v_${dataEntry} => CAST(${orderInfo} as boolean)`;
      } else if (typeof orderInfo === 'string') {
        params += `v_${dataEntry} => CAST('${orderInfo}' as text)`;
      }
    }
  }

  return params;
}

module.exports = {
  createOrderWithoutPostingSql,
  createOrderWithPostingSql,
  createParamsString,
};
