// talent_sql_util.js

const { queryDatabase } = require('../db_util');
const { loadData } = require('../util');

/**
 * Sets required fields benefit class and payroll division for a talent.
 *
 * @param {string|number} talentId - The talent/person ID
 * @param {number} [benefitsClass=5] - Benefit class ID
 * @param {number} [payrollDivision=250] - Payroll division ID
 */
async function setBenefitsClassAndPayrollDivision(talentId, benefitsClass = 5, payrollDivision = 250) {
  const sql = `UPDATE person_emp_info
SET benefit_class_id = ${benefitsClass},
    home_division_id= ${payrollDivision}
WHERE person_id = ${talentId};`;
  await queryDatabase(sql);
}

/**
 * Sets talent status to RTW and adds person role. Default market is Boston.
 *
 * @param {string|number} talentId - The talent/person ID
 * @param {Object|null} [testData=null] - Optional test data with status_id, market_id, start_date, end_date
 */
async function setTalentAsRTW(talentId, testData = {}) {
  let statusId = 20;
  let marketId = 10;
  let startDate = '';
  let endDate = 'Null';

  if (testData.status_id != null) {
    statusId = testData.status_id;
  }
  if (testData.market_id != null) {
    marketId = testData.market_id;
  }
  if (testData.start_date != null) {
    startDate = testData.start_date;
  }
  if (testData.end_date != null) {
    endDate = `CAST((CURRENT_DATE ${testData.end_date}) as timestamp)`;
  }

  const sql = `UPDATE person_emp_info
  SET employee_status_id = ${statusId}
WHERE person_id = ${talentId};

INSERT INTO person_role(
    person_id,
    person_role_id,
    market_id,
    person_type_id,
    start_date,
    end_date,
    unit_id,
    created_by,
    create_date,
    mod_by,
    mod_date
    )
Values (
        ${talentId},
         next_key_value('Person_Role'),
        ${marketId},
        7,
        CAST((CURRENT_DATE ${startDate}) as timestamp),
        ${endDate},
        8,
        'NY142',
        now(),
        'NY142',
        now());
INSERT INTO person_role(
    person_id,
    person_role_id,
    market_id,
    person_type_id,
    start_date,
    end_date,
    unit_id,
    created_by,
    create_date,
    mod_by,
    mod_date
    )
Values (
        ${talentId},
         next_key_value('Person_Role'),
        ${marketId},
        2,
        CAST((CURRENT_DATE ${startDate}) as timestamp),
        ${endDate},
        8,
        'NY142',
        now(),
        'NY142',
        now());`;
  await queryDatabase(sql);
}

/**
 * Sets opportunity status for a talent.
 *
 * Opportunity IDs:
 *   1: temp, 2: temp-to-perm, 5: perm
 *   3: part-time, 4: full-time
 *   6: on-site, 7: off-site, 8: hybrid
 *
 * @param {string|number} talentId - The talent/person ID
 * @param {number[]} opportunities - Array of opportunity IDs
 * @param {boolean} [status=true] - Whether to enable or disable the opportunity
 */
async function setTalentOpportunity(talentId, opportunities, status = true) {
  const sqlData = loadData('data/yaml/utils/talent_sql_util.yaml');

  for (const opportunityId of opportunities) {
    const sql = sqlData.set_opportunity_sql
      .replace('%s', status)
      .replace('%s', talentId)
      .replace('%s', opportunityId);
    await queryDatabase(sql);
  }
}

/**
 * Gets the week number for a given tenure date.
 *
 * @param {string} tenureDate - The tenure date
 * @param {Object|null} [db=null] - Optional existing database connection
 * @returns {Promise<string>} The week number
 */
async function getWeekNumber(tenureDate, db = null) {
  const sqlData = loadData('data/yaml/utils/talent_sql_util.yaml');
  const sql = sqlData.get_week_number_sql.replace('%s', tenureDate);

  let query;
  if (db) {
    query = await db.query(sql);
    return query.rows[0].week_number;
  } else {
    query = await queryDatabase(sql);
    return query[0].week_number;
  }
}

/**
 * Gets the total number of weeks.
 *
 * @param {Object|null} [db=null] - Optional existing database connection
 * @returns {Promise<string>} The max week
 */
async function getTotalWeeks(db = null) {
  const sqlData = loadData('data/yaml/utils/talent_sql_util.yaml');
  const sql = sqlData.get_total_weeks_sql;

  let query;
  if (db) {
    query = await db.query(sql);
    return query.rows[0].max_week;
  } else {
    query = await queryDatabase(sql);
    return query[0].max_week;
  }
}

/**
 * Gets PTO policy tiers.
 *
 * @param {Object|null} [db=null] - Optional existing database connection
 * @returns {Promise<Object[]>} Array of PTO policy tier rows
 */
async function getPtoPolicyTiers(db = null) {
  const sqlData = loadData('data/yaml/utils/talent_sql_util.yaml');
  const sql = sqlData.get_pto_policy_sql;

  if (db) {
    const query = await db.query(sql);
    return query.rows;
  } else {
    return await queryDatabase(sql);
  }
}

/**
 * Sets all required DB flags so a talent is eligible for gather emails.
 *
 * A talent is gatherable when ALL of these are true:
 *   - email_subscription.optin_global = true
 *   - sms_preference.sms_preference = true
 *   - talent_subscription.global_subscribed = 1
 *   - employee_status_id NOT IN (40, 43)
 *
 * This function upserts email_subscription, sms_preference, and talent_subscription.
 * The employee_status is handled by setTalentAsRTW (status 20).
 *
 * @param {string|number} talentId - The talent/person ID
 * @param {string} email - The talent's email address
 */
async function makeTalentGatherable(talentId, email) {
  const sql = `
    -- Email subscription: opt in globally
    INSERT INTO email_subscription (email, optin_global, create_date, mod_date)
    VALUES (normalize_email('${email}'), true, now(), now())
    ON CONFLICT (email) DO UPDATE SET optin_global = true, mod_date = now();

    -- SMS preference: opt in
    INSERT INTO sms_preference (person_id, sms_preference, sms_opt_in_reason_id, create_date, mod_date)
    VALUES (${talentId}, true, 2, now(), now())
    ON CONFLICT (person_id) DO UPDATE SET sms_preference = true, sms_opt_in_reason_id = 2, mod_date = now();

    -- Talent subscription: globally subscribed
    INSERT INTO talent_subscription (person_id, global_subscribed, create_date, mod_date)
    VALUES (${talentId}, 1, now(), now())
    ON CONFLICT (person_id) DO UPDATE SET global_subscribed = 1, mod_date = now();
  `;
  await queryDatabase(sql);
}

module.exports = {
  setBenefitsClassAndPayrollDivision,
  setTalentAsRTW,
  setTalentOpportunity,
  makeTalentGatherable,
  getWeekNumber,
  getTotalWeeks,
  getPtoPolicyTiers,
};