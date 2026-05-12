// client_contact_sql_util.js

const { loadData } = require('../../utils/util');
const { createDbConnection, queryDatabase } = require('../../utils/db_util');
const { transformYaml } = require('./job_posting_util');

async function createClientSql(clientData, user, config) {
  const sqlData = loadData('data/yaml/utils/client_sql_util.yaml');
  const db = await createDbConnection();
  let params = '';
  if (clientData) {
    params = await createParamsStringClientContact(clientData, sqlData.create_client_fields, sqlData.create_client_field_types, user, db, sqlData, config);
  }
  const query = await db.query(sqlData.create_client_sql.replace('%s', params));
  await db.end();
  return query.rows[0].tad_create_client_for_rta;
}

async function createContactSql(contactData, user, config) {
  const sqlData = loadData('data/yaml/utils/client_sql_util.yaml');
  const db = await createDbConnection();
  let params = '';
  if (contactData) {
    params = await createParamsStringClientContact(contactData, sqlData.create_contact_fields, sqlData.create_contact_field_types, user, db, sqlData, config);
  }
  const query = await db.query(sqlData.create_contact_sql.replace('%s', params));
  await db.end();
  return query.rows[0].tad_create_contact_for_rta;
}

async function createParamsStringClientContact(inputData, sqlFields, sqlTypes, user, db, sqlData, config) {
  if (!user) user = config.agentUserName;
  const userIdResult = await db.query(sqlData.get_user_id.replace('%s', user));
  inputData.created_mod_by = userIdResult.rows[0].user_id;
  if (!inputData.manager_id) {
    const personIdResult = await db.query(sqlData.get_person_id.replace('%s', user));
    inputData.manager_id = parseInt(personIdResult.rows[0].person_id, 10);
  }
  let params = '';
  const fields = sqlFields.split(',');
  const fieldTypes = sqlTypes.split(';');
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i].trim();
    if (inputData[field] !== undefined && inputData[field] !== null) {
      let orderInfo = inputData[field];
      if (typeof orderInfo === 'string') {
        orderInfo = transformYaml(orderInfo);
        orderInfo = `'${orderInfo}'`;
      }
      if (params !== '') params += ', ';
      params += `v_${field} => CAST(${orderInfo} as ${fieldTypes[i].trim()})`;
    }
  }
  return params;
}

module.exports = { createClientSql, createContactSql, createParamsStringClientContact };
