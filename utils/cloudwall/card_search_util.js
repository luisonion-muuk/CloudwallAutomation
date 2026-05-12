// cardSearchUtil.js

const { queryDatabase } = require('../db_util');

/**
 * Waits for talent to be reindexed by checking the card search indexing queue.
 *
 * @param {string|string[]} personIds - Single person ID or array of person IDs
 * @param {number} retryTimes - Maximum number of retry attempts
 * @returns {Promise<boolean>} - True if all talents were reindexed, false if timed out
 */
async function waitForTalentToBeReindexed(personIds, retryTimes) {
  const personIdConcatStr = Array.isArray(personIds) && personIds.length > 1
    ? personIds.join(',')
    : String(personIds);

  let inQueCount = Array.isArray(personIds) && personIds.length > 1
    ? personIds.length
    : 1;

  let index = 0;

  while (inQueCount > 0 && index < retryTimes) {
    const inQue = await queryDatabase(
      `select * from talent_search_update_queue where person_id IN (${personIdConcatStr})`
    );
    inQueCount = inQue.length;
    index++;
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  return inQueCount === 0;
}

/**
 * Clears the talent search indexing queue.
 */
async function clearIndexingQueue() {
  await queryDatabase('delete from talent_search_update_queue where 1=1;');
}

module.exports = {
  waitForTalentToBeReindexed,
  clearIndexingQueue,
};
