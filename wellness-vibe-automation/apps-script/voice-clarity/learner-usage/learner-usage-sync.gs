/************************************************************
 * VOICE CLARITY TRACK
 * ALL-TIME USAGE + LAST LOGIN SYNC
 *
 * TIMEZONE:
 *   Asia/Kolkata
 *
 * SOURCE:
 *   Voice Clarity Track Users - Retrieved
 *
 * MASTER:
 *   VCT User Master
 *
 * SUPPORT:
 *   VCT Sync Log
 *   VCT Failed Records
 *   VCT API Debug
 *
 * IMPORTANT:
 *   - Usage is ALL-TIME.
 *   - NO date parameter is sent to /usage.
 *   - We DO NOT add today's usage to previous usage.
 *   - Every sync replaces Total Seconds with Graphy's
 *     current all-time value.
 *   - Last Login comes from /public/v1/learners/{id}.
 ************************************************************/


/************************************************************
 * CONFIG
 ************************************************************/

const VCT_MASTER_CONFIG = {

  TIMEZONE:
    'Asia/Kolkata',

  SOURCE_SHEET:
    'Voice Clarity Track Users - Retrieved',

  MASTER_SHEET:
    'VCT User Master',

  LOG_SHEET:
    'VCT Sync Log',

  FAILED_SHEET:
    'VCT Failed Records',

  DEBUG_SHEET:
    'VCT API Debug',

  PRODUCT_PREFIX:
    'Voice Clarity Track',

  GRAPHY_BASE_URL:
    'https://api.ongraphy.com',

  /*
   * ALL-TIME USAGE
   *
   * NO DATE PARAMETER.
   */
  USAGE_ENDPOINT:
    '/public/v1/learners/{learnerId}/usage',

  /*
   * LEARNER PROFILE
   *
   * Contains "last login".
   */
  LEARNER_ENDPOINT:
    '/public/v1/learners/{learnerId}',

  /*
   * Parallel requests per batch.
   */
  BATCH_SIZE:
    20,

  /*
   * Maximum batches per Apps Script execution.
   *
   * 20 x 20 = 400 users/run
   */
  MAX_BATCHES_PER_RUN:
    20,

  /*
   * Retry temporary HTTP errors.
   */
  MAX_RETRIES:
    2,

  RETRY_WAIT_MS:
    1500,

  /*
   * Daily trigger.
   */
  DAILY_TRIGGER_HOUR:
    22

};


/************************************************************
 * MASTER HEADERS
 ************************************************************/

const VCT_MASTER_HEADERS = [

  'Product ID',

  'Product Name',

  'Learner ID',

  'Customer Name',

  'User Name',

  'Email',

  'Mobile',

  'Active',

  'Assigned Date',

  'Valid Till',

  'Progress',

  'Completed',

  'Total Seconds',

  'Total Hours',

  'Total Hr & Min',

  'Total Days',

  'Last Login',

  'Last Sync'

];


/************************************************************
 * SETUP
 *
 * RUN ONCE.
 *
 * This does NOT call Graphy.
 * This does NOT process learners.
 * This does NOT create a trigger.
 ************************************************************/

function VCT_SETUP() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();


  /*
   * Ensure timezone is IST/Kolkata.
   */

  ss.setSpreadsheetTimeZone(
    VCT_MASTER_CONFIG.TIMEZONE
  );


  /*
   * Create support sheets if missing.
   */

  createSheetIfMissing_(
    ss,
    VCT_MASTER_CONFIG.MASTER_SHEET
  );

  createSheetIfMissing_(
    ss,
    VCT_MASTER_CONFIG.LOG_SHEET
  );

  createSheetIfMissing_(
    ss,
    VCT_MASTER_CONFIG.FAILED_SHEET
  );

  createSheetIfMissing_(
    ss,
    VCT_MASTER_CONFIG.DEBUG_SHEET
  );


  /*
   * Setup headers.
   */

  setupMasterSheet_();

  setupLogSheet_();

  setupFailedSheet_();

  setupDebugSheet_();


  SpreadsheetApp.flush();


  SpreadsheetApp.getUi().alert(

    'VCT SETUP COMPLETED\n\n' +

    'Timezone: Asia/Kolkata\n\n' +

    'Created / verified:\n' +

    '✓ VCT User Master\n' +
    '✓ VCT Sync Log\n' +
    '✓ VCT Failed Records\n' +
    '✓ VCT API Debug\n\n' +

    'No Graphy API calls were made.\n' +
    'No trigger was created.\n\n' +

    'Next:\n' +
    'Run VCT_TEST_ALL_TIME_AND_LOGIN'

  );

}


/************************************************************
 * CREATE DAILY TRIGGER
 *
 * RUN SEPARATELY AFTER TESTING.
 ************************************************************/

function VCT_CREATE_DAILY_TRIGGER() {

  const triggers =
    ScriptApp.getProjectTriggers();


  /*
   * Remove existing VCT daily triggers.
   */

  triggers.forEach(
    trigger => {

      if (
        trigger.getHandlerFunction() ===
        'VCT_DAILY_SYNC'
      ) {

        ScriptApp.deleteTrigger(
          trigger
        );

      }

    }
  );


  /*
   * Create daily trigger.
   */

  ScriptApp.newTrigger(
    'VCT_DAILY_SYNC'
  )
    .timeBased()
    .everyDays(1)
    .atHour(
      VCT_MASTER_CONFIG.DAILY_TRIGGER_HOUR
    )
    .create();


  SpreadsheetApp.getUi().alert(

    'DAILY TRIGGER CREATED\n\n' +

    'Function:\n' +
    'VCT_DAILY_SYNC\n\n' +

    'Frequency:\n' +
    'Every day\n\n' +

    'Approximate time:\n' +
    '10 PM IST\n\n' +

    'Timezone:\n' +
    'Asia/Kolkata'

  );

}


/************************************************************
 * DAILY TRIGGER ENTRY POINT
 ************************************************************/

function VCT_DAILY_SYNC() {

  VCT_EXTRACT_USERS();

}


/************************************************************
 * MANUAL RUN
 ************************************************************/

function VCT_RUN_NOW() {

  VCT_EXTRACT_USERS();

}


/************************************************************
 * MAIN EXTRACTION
 ************************************************************/

function VCT_EXTRACT_USERS() {

  const lock =
    LockService.getScriptLock();


  /*
   * Prevent duplicate simultaneous executions.
   */

  if (
    !lock.tryLock(5000)
  ) {

    Logger.log(
      'Another VCT sync is already running.'
    );

    return;

  }


  const startTime =
    new Date();


  try {

    const ss =
      SpreadsheetApp.getActiveSpreadsheet();


    /*
     * Make absolutely sure spreadsheet timezone
     * is Asia/Kolkata.
     */

    ss.setSpreadsheetTimeZone(
      VCT_MASTER_CONFIG.TIMEZONE
    );


    const sourceSheet =
      ss.getSheetByName(
        VCT_MASTER_CONFIG.SOURCE_SHEET
      );


    const masterSheet =
      ss.getSheetByName(
        VCT_MASTER_CONFIG.MASTER_SHEET
      );


    const logSheet =
      ss.getSheetByName(
        VCT_MASTER_CONFIG.LOG_SHEET
      );


    const failedSheet =
      ss.getSheetByName(
        VCT_MASTER_CONFIG.FAILED_SHEET
      );


    if (!sourceSheet) {

      throw new Error(
        'Source sheet not found: ' +
        VCT_MASTER_CONFIG.SOURCE_SHEET
      );

    }


    if (!masterSheet) {

      throw new Error(
        'VCT User Master not found.\n\n' +
        'Run VCT_SETUP first.'
      );

    }


    /*
     * Credentials.
     */

    const credentials =
      getCredentials_();


    /*
     * Read source.
     */

    const users =
      readSourceUsers_(
        sourceSheet
      );


    Logger.log(
      'Total VCT users: ' +
      users.length
    );


    if (
      users.length === 0
    ) {

      writeSyncLog_(
        logSheet,
        startTime,
        0,
        0,
        0,
        0,
        'No VCT users found'
      );

      return;

    }


    /*
     * Read existing master.
     */

    const masterRecords =
      readMaster_(
        masterSheet
      );


    /*
     * Cursor.
     *
     * Allows large datasets to continue
     * automatically.
     */

    const properties =
      PropertiesService
        .getScriptProperties();


    const today =
      Utilities.formatDate(
        new Date(),
        VCT_MASTER_CONFIG.TIMEZONE,
        'yyyy-MM-dd'
      );


    let syncDate =
      properties.getProperty(
        'VCT_SYNC_DATE'
      );


    let cursor =
      Number(
        properties.getProperty(
          'VCT_SYNC_CURSOR'
        ) || 0
      );


    /*
     * New day = start from first learner.
     */

    if (
      syncDate !== today
    ) {

      cursor = 0;

      properties.setProperty(
        'VCT_SYNC_DATE',
        today
      );

      properties.setProperty(
        'VCT_SYNC_CURSOR',
        '0'
      );

    }


    /*
     * Safety.
     */

    if (
      cursor < 0 ||
      cursor >= users.length
    ) {

      cursor = 0;

    }


    let totalProcessed = 0;

    let totalSuccess = 0;

    let totalFailed = 0;

    let batchCount = 0;


    /*
     * ----------------------------------------------
     * BATCH PROCESSING
     * ----------------------------------------------
     */

    while (

      cursor < users.length &&

      batchCount <
        VCT_MASTER_CONFIG.MAX_BATCHES_PER_RUN

    ) {

      const batch =
        users.slice(
          cursor,
          cursor +
            VCT_MASTER_CONFIG.BATCH_SIZE
        );


      if (
        batch.length === 0
      ) {

        break;

      }


      Logger.log(
        'Processing users ' +
        (cursor + 1) +
        ' to ' +
        (cursor + batch.length)
      );


      /*
       * Each learner requires TWO API calls:
       *
       * 1. /usage
       * 2. /learners/{id}
       *
       * Both are requested in parallel.
       */

      const requests = [];


      batch.forEach(
        user => {

          requests.push({

            type:
              'usage',

            user:
              user,

            request:
              buildUsageRequest_(
                credentials,
                user
              )

          });


          requests.push({

            type:
              'learner',

            user:
              user,

            request:
              buildLearnerRequest_(
                credentials,
                user
              )

          });

        }
      );


      /*
       * Fetch all API calls in parallel.
       */

      const apiResults =
        fetchRequestsWithRetry_(
          requests
        );


      /*
       * Group results by learner.
       */

      const grouped =
        {};


      batch.forEach(
        user => {

          const key =
            createKey_(
              user.learnerId,
              user.productId
            );


          grouped[key] = {

            user:
              user,

            usage:
              null,

            learner:
              null

          };

        }
      );


      apiResults.forEach(
        (result, index) => {

          const requestInfo =
            requests[index];


          const user =
            requestInfo.user;


          const key =
            createKey_(
              user.learnerId,
              user.productId
            );


          if (
            requestInfo.type ===
            'usage'
          ) {

            grouped[key].usage =
              result;

          } else {

            grouped[key].learner =
              result;

          }

        }
      );


      /*
       * Process each learner.
       */

      batch.forEach(
        user => {

          totalProcessed++;


          const key =
            createKey_(
              user.learnerId,
              user.productId
            );


          const item =
            grouped[key];


          const usage =
            item.usage;


          const learner =
            item.learner;


          /*
           * ------------------------------------------
           * USAGE FAILURE
           * ------------------------------------------
           */

          if (
            !usage ||
            !usage.success
          ) {

            totalFailed++;


            writeFailed_(
              failedSheet,
              user,
              'USAGE',
              usage
            );


            /*
             * Do not overwrite existing master
             * usage with zero.
             */

            return;

          }


          /*
           * ------------------------------------------
           * LEARNER PROFILE FAILURE
           * ------------------------------------------
           */

          if (
            !learner ||
            !learner.success
          ) {

            totalFailed++;

            writeFailed_(
              failedSheet,
              user,
              'LEARNER PROFILE',
              learner
            );

            // Usage succeeded, so continue and update the
            // all-time usage. Preserve the previous Last Login
            // value when the learner profile call fails.
          }


          /*
           * ------------------------------------------
           * ALL-TIME USAGE
           * ------------------------------------------
           */

          const totalSeconds =
            Number(
              usage.seconds
            );


          if (
            !isFinite(totalSeconds) ||
            totalSeconds < 0
          ) {

            totalFailed++;


            writeFailed_(
              failedSheet,
              user,
              'INVALID USAGE',
              {

                success:
                  false,

                httpCode:
                  usage.httpCode,

                error:
                  'Invalid all-time seconds',

                rawResponse:
                  usage.rawResponse

              }
            );


            return;

          }


          /*
           * ------------------------------------------
           * LAST LOGIN
           * ------------------------------------------
           */

          const lastLogin =
            learner && learner.success
              ? learner.lastLogin
              : '';


          /*
           * It is possible for a learner to have
           * no login value.
           *
           * Do not treat missing last login as
           * a failure of the usage API.
           */

          const existing =
            masterRecords[key];


          /*
           * ------------------------------------------
           * UPDATE MASTER
           * ------------------------------------------
           *
           * IMPORTANT:
           *
           * totalSeconds =
           * CURRENT GRAPHY ALL-TIME VALUE
           *
           * NOT:
           *
           * previousTotal + today's usage
           */

          masterRecords[key] = {

            productId:
              user.productId,

            productName:
              user.productName,

            learnerId:
              user.learnerId,

            customerName:
              user.customerName,

            userName:
              user.userName,

            email:
              user.email,

            mobile:
              user.mobile,

            active:
              user.active,

            assignedDate:
              user.assignedDate,

            validTill:
              user.validTill,

            progress:
              user.progress,

            completed:
              user.completed,

            totalSeconds:
              totalSeconds,

            totalHours:
              totalSeconds / 3600,

            totalHrMin:
              formatHoursMinutes_(
                totalSeconds
              ),

            totalDays:
              totalSeconds / 86400,

            /*
             * Use new login if available.
             * Otherwise preserve existing value.
             */

            lastLogin:
              lastLogin
                ? parseGraphyDate_(
                    lastLogin
                  )
                : (
                    existing
                      ? existing.lastLogin
                      : ''
                  ),

            /*
             * Always record the current
             * successful sync time.
             */

            lastSync:
              new Date()

          };


          totalSuccess++;

        }
      );


      /*
       * Move cursor.
       */

      cursor +=
        batch.length;


      properties.setProperty(
        'VCT_SYNC_CURSOR',
        String(cursor)
      );


      batchCount++;

    }


    /*
     * ----------------------------------------------
     * WRITE MASTER
     * ----------------------------------------------
     */

    writeMaster_(
      masterSheet,
      masterRecords
    );


    /*
     * Remaining users.
     */

    const remaining =
      users.length -
      cursor;


    let status;


    if (
      remaining > 0
    ) {

      status =
        'Partial - ' +
        remaining +
        ' users remaining';


      createContinuationTrigger_();

    } else {

      status =
        'Completed';


      properties.deleteProperty(
        'VCT_SYNC_CURSOR'
      );

      properties.deleteProperty(
        'VCT_SYNC_DATE'
      );

    }


    /*
     * Duration.
     */

    const duration =
      Math.round(
        (
          new Date() -
          startTime
        ) / 1000
      );


    /*
     * Log.
     */

    writeSyncLog_(
      logSheet,
      startTime,
      users.length,
      totalSuccess,
      totalFailed,
      duration,
      status
    );


    SpreadsheetApp.flush();


    Logger.log(
      '======================================'
    );

    Logger.log(
      'VCT SYNC COMPLETED'
    );

    Logger.log(
      '======================================'
    );

    Logger.log(
      'Users: ' +
      users.length
    );

    Logger.log(
      'Processed: ' +
      totalProcessed
    );

    Logger.log(
      'Success: ' +
      totalSuccess
    );

    Logger.log(
      'Failed: ' +
      totalFailed
    );

    Logger.log(
      'Remaining: ' +
      remaining
    );

    Logger.log(
      'Status: ' +
      status
    );

    Logger.log(
      'Timezone: Asia/Kolkata'
    );

    Logger.log(
      '======================================'
    );


  } catch (error) {

    Logger.log(
      'VCT SYNC ERROR: ' +
      error.message
    );

    throw error;

  } finally {

    lock.releaseLock();

  }

}


/************************************************************
 * BUILD USAGE REQUEST
 *
 * NO DATE PARAMETER.
 ************************************************************/

function buildUsageRequest_(
  credentials,
  user
) {

  const endpoint =
    VCT_MASTER_CONFIG
      .USAGE_ENDPOINT
      .replace(
        '{learnerId}',
        encodeURIComponent(
          user.learnerId
        )
      );


  const url =
    VCT_MASTER_CONFIG.GRAPHY_BASE_URL +
    endpoint +
    '?mid=' +
    encodeURIComponent(
      credentials.mid
    ) +
    '&key=' +
    encodeURIComponent(
      credentials.key
    ) +
    '&productId=' +
    encodeURIComponent(
      user.productId
    );


  return {

    url:
      url,

    method:
      'get',

    muteHttpExceptions:
      true,

    headers: {

      'Accept':
        'application/json'

    }

  };

}


/************************************************************
 * BUILD LEARNER REQUEST
 ************************************************************/

function buildLearnerRequest_(
  credentials,
  user
) {

  const endpoint =
    VCT_MASTER_CONFIG
      .LEARNER_ENDPOINT
      .replace(
        '{learnerId}',
        encodeURIComponent(
          user.learnerId
        )
      );


  const url =
    VCT_MASTER_CONFIG.GRAPHY_BASE_URL +
    endpoint +
    '?mid=' +
    encodeURIComponent(
      credentials.mid
    ) +
    '&key=' +
    encodeURIComponent(
      credentials.key
    ) +
    '&productId=' +
    encodeURIComponent(
      user.productId
    );


  return {

    url:
      url,

    method:
      'get',

    muteHttpExceptions:
      true,

    headers: {

      'Accept':
        'application/json'

    }

  };

}


/************************************************************
 * FETCH REQUESTS WITH RETRY
 ************************************************************/

function fetchRequestsWithRetry_(
  requestInfos
) {

  const results =
    new Array(
      requestInfos.length
    );


  let pending =
    requestInfos.map(
      (_, index) =>
        index
    );


  for (
    let attempt = 0;

    attempt <=
      VCT_MASTER_CONFIG.MAX_RETRIES;

    attempt++
  ) {

    if (
      pending.length === 0
    ) {

      break;

    }


    const requests =
      pending.map(
        index =>
          requestInfos[index]
            .request
      );


    let responses;


    try {

      responses =
        UrlFetchApp.fetchAll(
          requests
        );

    } catch (error) {

      if (
        attempt >=
        VCT_MASTER_CONFIG.MAX_RETRIES
      ) {

        pending.forEach(
          index => {

            results[index] = {

              success:
                false,

              httpCode:
                '',

              seconds:
                null,

              lastLogin:
                '',

              rawResponse:
                '',

              error:
                'fetchAll error: ' +
                error.message

            };

          }
        );


        break;

      }


      Utilities.sleep(
        VCT_MASTER_CONFIG.RETRY_WAIT_MS
      );


      continue;

    }


    const retryIndexes =
      [];


    responses.forEach(
      (response, responseIndex) => {

        const originalIndex =
          pending[
            responseIndex
          ];


        const requestInfo =
          requestInfos[
            originalIndex
          ];


        let result;


        if (
          requestInfo.type ===
          'usage'
        ) {

          result =
            parseUsageResponse_(
              response
            );

        } else {

          result =
            parseLearnerResponse_(
              response
            );

        }


        /*
         * Retry temporary HTTP errors.
         */

        if (
          !result.success &&
          isTemporaryHttpError_(
            result.httpCode
          ) &&
          attempt <
            VCT_MASTER_CONFIG.MAX_RETRIES
        ) {

          retryIndexes.push(
            originalIndex
          );

        } else {

          results[originalIndex] =
            result;

        }

      }
    );


    pending =
      retryIndexes;


    if (
      pending.length > 0 &&
      attempt <
        VCT_MASTER_CONFIG.MAX_RETRIES
    ) {

      Utilities.sleep(
        VCT_MASTER_CONFIG.RETRY_WAIT_MS
      );

    }

  }


  return results;

}


/************************************************************
 * PARSE USAGE RESPONSE
 ************************************************************/

function parseUsageResponse_(
  response
) {

  const httpCode =
    response.getResponseCode();


  const raw =
    response.getContentText();


  if (
    httpCode < 200 ||
    httpCode >= 300
  ) {

    return {

      success:
        false,

      seconds:
        null,

      httpCode:
        httpCode,

      rawResponse:
        raw,

      error:
        'Graphy usage API HTTP ' +
        httpCode

    };

  }


  let json;


  try {

    json =
      JSON.parse(
        raw
      );

  } catch (error) {

    return {

      success:
        false,

      seconds:
        null,

      httpCode:
        httpCode,

      rawResponse:
        raw,

      error:
        'Invalid usage JSON'

    };

  }


  let seconds =
    null;


  /*
   * Root field.
   */

  if (
    Object.prototype.hasOwnProperty.call(
      json,
      'time spent in secs'
    )
  ) {

    seconds =
      Number(
        json[
          'time spent in secs'
        ]
      );

  }


  /*
   * Nested data field.
   */

  if (
    seconds === null &&
    json.data &&
    typeof json.data ===
      'object' &&
    Object.prototype.hasOwnProperty.call(
      json.data,
      'time spent in secs'
    )
  ) {

    seconds =
      Number(
        json.data[
          'time spent in secs'
        ]
      );

  }


  if (
    seconds === null ||
    !isFinite(seconds)
  ) {

    return {

      success:
        false,

      seconds:
        null,

      httpCode:
        httpCode,

      rawResponse:
        raw,

      error:
        'time spent in secs not found'

    };

  }


  return {

    success:
      true,

    seconds:
      seconds,

    httpCode:
      httpCode,

    rawResponse:
      raw,

    error:
      ''

  };

}


/************************************************************
 * PARSE LEARNER RESPONSE
 ************************************************************/

function parseLearnerResponse_(
  response
) {

  const httpCode =
    response.getResponseCode();


  const raw =
    response.getContentText();


  if (
    httpCode < 200 ||
    httpCode >= 300
  ) {

    return {

      success:
        false,

      lastLogin:
        '',

      httpCode:
        httpCode,

      rawResponse:
        raw,

      error:
        'Graphy learner API HTTP ' +
        httpCode

    };

  }


  let json;


  try {

    json =
      JSON.parse(
        raw
      );

  } catch (error) {

    return {

      success:
        false,

      lastLogin:
        '',

      httpCode:
        httpCode,

      rawResponse:
        raw,

      error:
        'Invalid learner JSON'

    };

  }


  /*
   * Confirmed Graphy field:
   *
   * "last login"
   */

  let lastLogin =
    '';


  if (
    Object.prototype.hasOwnProperty.call(
      json,
      'last login'
    )
  ) {

    lastLogin =
      json[
        'last login'
      ];

  }


  /*
   * Also support lastLogin if Graphy
   * changes the field naming.
   */

  if (
    !lastLogin &&
    Object.prototype.hasOwnProperty.call(
      json,
      'lastLogin'
    )
  ) {

    lastLogin =
      json.lastLogin;

  }


  return {

    success:
      true,

    lastLogin:
      lastLogin,

    httpCode:
      httpCode,

    rawResponse:
      raw,

    error:
      ''

  };

}


/************************************************************
 * TEMPORARY HTTP ERROR
 ************************************************************/

function isTemporaryHttpError_(
  code
) {

  return [

    408,
    429,
    500,
    502,
    503,
    504

  ].indexOf(
    Number(code)
  ) !== -1;

}


/************************************************************
 * READ SOURCE
 ************************************************************/

function readSourceUsers_(
  sheet
) {

  const values =
    sheet
      .getDataRange()
      .getValues();


  if (
    values.length < 2
  ) {

    return [];

  }


  const headers =
    values[0].map(
      header =>
        String(header)
          .trim()
          .toLowerCase()
    );


  const columns =
    {};


  headers.forEach(
    (header, index) => {

      columns[header] =
        index;

    }
  );


  function get_(
    row,
    names
  ) {

    for (
      const name of names
    ) {

      const index =
        columns[
          name
            .toLowerCase()
        ];


      if (
        index !== undefined
      ) {

        return row[index];

      }

    }


    return '';

  }


  const users =
    [];


  for (
    let rowIndex = 1;

    rowIndex < values.length;

    rowIndex++
  ) {

    const row =
      values[rowIndex];


    const productId =
      get_(
        row,
        [
          'Product ID',
          'Product Id'
        ]
      );


    const productName =
      get_(
        row,
        [
          'Product Name',
          'Product'
        ]
      );


    const learnerId =
      get_(
        row,
        [
          'Learner ID',
          'Learner Id'
        ]
      );


    if (
      !productId ||
      !learnerId
    ) {

      continue;

    }


    /*
     * Only VCT products.
     */

    if (
      productName &&
      !String(productName)
        .toLowerCase()
        .startsWith(
          VCT_MASTER_CONFIG
            .PRODUCT_PREFIX
            .toLowerCase()
        )
    ) {

      continue;

    }


    users.push({

      productId:
        String(productId)
          .trim(),

      productName:
        String(productName)
          .trim(),

      learnerId:
        String(learnerId)
          .trim(),

      customerName:
        get_(
          row,
          [
            'Customer Name'
          ]
        ),

      userName:
        get_(
          row,
          [
            'User Name',
            'Username'
          ]
        ),

      email:
        get_(
          row,
          [
            'Email'
          ]
        ),

      mobile:
        get_(
          row,
          [
            'Mobile',
            'Phone'
          ]
        ),

      active:
        get_(
          row,
          [
            'Active'
          ]
        ),

      assignedDate:
        get_(
          row,
          [
            'Assigned Date'
          ]
        ),

      validTill:
        get_(
          row,
          [
            'Valid Till'
          ]
        ),

      progress:
        get_(
          row,
          [
            'Progress'
          ]
        ),

      completed:
        get_(
          row,
          [
            'Completed'
          ]
        )

    });

  }


  /*
   * Deduplicate learner + product.
   */

  const unique =
    {};


  users.forEach(
    user => {

      const key =
        createKey_(
          user.learnerId,
          user.productId
        );


      unique[key] =
        user;

    }
  );


  return Object.values(
    unique
  );

}


/************************************************************
 * READ MASTER
 ************************************************************/

function readMaster_(
  sheet
) {

  const result =
    {};


  const lastRow =
    sheet.getLastRow();


  if (
    lastRow < 2
  ) {

    return result;

  }


  const values =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        VCT_MASTER_HEADERS.length
      )
      .getValues();


  values.forEach(
    row => {

      const productId =
        row[0];


      const learnerId =
        row[2];


      if (
        !productId ||
        !learnerId
      ) {

        return;

      }


      const key =
        createKey_(
          learnerId,
          productId
        );


      result[key] = {

        productId:
          productId,

        productName:
          row[1],

        learnerId:
          learnerId,

        customerName:
          row[3],

        userName:
          row[4],

        email:
          row[5],

        mobile:
          row[6],

        active:
          row[7],

        assignedDate:
          row[8],

        validTill:
          row[9],

        progress:
          row[10],

        completed:
          row[11],

        totalSeconds:
          Number(
            row[12]
          ) || 0,

        totalHours:
          Number(
            row[13]
          ) || 0,

        totalHrMin:
          row[14],

        totalDays:
          Number(
            row[15]
          ) || 0,

        lastLogin:
          row[16] || '',

        lastSync:
          row[17] || ''

      };

    }
  );


  return result;

}


/************************************************************
 * WRITE MASTER
 ************************************************************/

function writeMaster_(
  sheet,
  records
) {

  /*
   * Remove old data.
   */

  if (
    sheet.getLastRow() > 1
  ) {

    sheet
      .getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        VCT_MASTER_HEADERS.length
      )
      .clearContent();

  }


  const recordsArray =
    Object.values(
      records
    );


  if (
    recordsArray.length === 0
  ) {

    return;

  }


  /*
   * Sort by User Name.
   */

  recordsArray.sort(
    (a, b) =>
      String(a.userName)
        .localeCompare(
          String(b.userName)
        )
  );


  const rows =
    recordsArray.map(
      record => [

        record.productId,

        record.productName,

        record.learnerId,

        record.customerName,

        record.userName,

        record.email,

        record.mobile,

        record.active,

        record.assignedDate,

        record.validTill,

        record.progress,

        record.completed,

        record.totalSeconds,

        record.totalHours,

        record.totalHrMin,

        record.totalDays,

        record.lastLogin,

        record.lastSync

      ]
    );


  sheet
    .getRange(
      2,
      1,
      rows.length,
      VCT_MASTER_HEADERS.length
    )
    .setValues(
      rows
    );


  /*
   * Total Seconds.
   */

  sheet
    .getRange(
      2,
      13,
      rows.length,
      1
    )
    .setNumberFormat(
      '0'
    );


  /*
   * Total Hours.
   */

  sheet
    .getRange(
      2,
      14,
      rows.length,
      1
    )
    .setNumberFormat(
      '0.00'
    );


  /*
   * Total Days.
   */

  sheet
    .getRange(
      2,
      16,
      rows.length,
      1
    )
    .setNumberFormat(
      '0.0000'
    );


  /*
   * Last Login.
   */

  sheet
    .getRange(
      2,
      17,
      rows.length,
      1
    )
    .setNumberFormat(
      'dd-mmm-yyyy HH:mm:ss'
    );


  /*
   * Last Sync.
   */

  sheet
    .getRange(
      2,
      18,
      rows.length,
      1
    )
    .setNumberFormat(
      'dd-mmm-yyyy HH:mm:ss'
    );


  sheet.setFrozenRows(
    1
  );

}


/************************************************************
 * CREATE KEY
 ************************************************************/

function createKey_(
  learnerId,
  productId
) {

  return (

    String(learnerId)
      .trim() +

    '|' +

    String(productId)
      .trim()

  );

}


/************************************************************
 * FORMAT HOURS + MINUTES
 ************************************************************/

function formatHoursMinutes_(
  seconds
) {

  seconds =
    Number(seconds);


  if (
    !isFinite(seconds) ||
    seconds < 0
  ) {

    return '0 Hr 0 Min';

  }


  const totalMinutes =
    Math.floor(
      seconds / 60
    );


  const hours =
    Math.floor(
      totalMinutes / 60
    );


  const minutes =
    totalMinutes % 60;


  return (

    hours +

    ' Hr ' +

    minutes +

    ' Min'

  );

}


/************************************************************
 * CONVERT GRAPHY UTC DATE → IST
 ************************************************************/

function parseGraphyDate_(
  value
) {

  if (
    !value
  ) {

    return '';

  }


  /*
   * If already a Date object.
   */

  if (
    Object.prototype.toString.call(value) ===
    '[object Date]'
  ) {

    if (
      isNaN(
        value.getTime()
      )
    ) {

      return '';

    }

    return value;

  }


  const date =
    new Date(
      String(value)
    );


  if (
    isNaN(
      date.getTime()
    )
  ) {

    return '';

  }


  /*
   * JavaScript stores Date internally
   * as UTC milliseconds.
   *
   * Spreadsheet timezone controls display.
   *
   * Because spreadsheet timezone is
   * Asia/Kolkata, it displays in IST.
   */

  return date;

}


/************************************************************
 * FAILED RECORD
 ************************************************************/

function writeFailed_(
  sheet,
  user,
  type,
  result
) {

  if (!sheet) {

    return;

  }


  sheet.appendRow([

    new Date(),

    type,

    user.productId,

    user.productName,

    user.learnerId,

    user.customerName,

    user.userName,

    user.email,

    result
      ? result.httpCode || ''
      : '',

    result
      ? result.error || ''
      : '',

    result
      ? result.rawResponse || ''
      : ''

  ]);

}


/************************************************************
 * SYNC LOG
 ************************************************************/

function writeSyncLog_(
  sheet,
  startTime,
  users,
  success,
  failed,
  duration,
  status
) {

  if (!sheet) {

    return;

  }


  sheet.appendRow([

    new Date(),

    startTime,

    users,

    success,

    failed,

    duration,

    status

  ]);

}


/************************************************************
 * MASTER SETUP
 ************************************************************/

function setupMasterSheet_() {

  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();


  const sheet =
    ss.getSheetByName(
      VCT_MASTER_CONFIG.MASTER_SHEET
    );


  /*
   * Always ensure headers are correct.
   */

  sheet
    .getRange(
      1,
      1,
      1,
      VCT_MASTER_HEADERS.length
    )
    .setValues([
      VCT_MASTER_HEADERS
    ]);


  sheet.setFrozenRows(
    1
  );

}


/************************************************************
 * LOG SETUP
 ************************************************************/

function setupLogSheet_() {

  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();


  const sheet =
    ss.getSheetByName(
      VCT_MASTER_CONFIG.LOG_SHEET
    );


  const headers = [

    'Timestamp',

    'Start Time',

    'Users Found',

    'Success',

    'Failed',

    'Duration Seconds',

    'Status'

  ];


  sheet
    .getRange(
      1,
      1,
      1,
      headers.length
    )
    .setValues([
      headers
    ]);


  sheet.setFrozenRows(
    1
  );

}


/************************************************************
 * FAILED SETUP
 ************************************************************/

function setupFailedSheet_() {

  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();


  const sheet =
    ss.getSheetByName(
      VCT_MASTER_CONFIG.FAILED_SHEET
    );


  const headers = [

    'Timestamp',

    'Type',

    'Product ID',

    'Product Name',

    'Learner ID',

    'Customer Name',

    'User Name',

    'Email',

    'HTTP Code',

    'Error',

    'Raw Response'

  ];


  sheet
    .getRange(
      1,
      1,
      1,
      headers.length
    )
    .setValues([
      headers
    ]);


  sheet.setFrozenRows(
    1
  );

}


/************************************************************
 * DEBUG SETUP
 ************************************************************/

function setupDebugSheet_() {

  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();


  const sheet =
    ss.getSheetByName(
      VCT_MASTER_CONFIG.DEBUG_SHEET
    );


  const headers = [

    'Timestamp',

    'Type',

    'Learner ID',

    'Product ID',

    'HTTP Code',

    'URL',

    'Raw Response',

    'Extracted Value',

    'Status',

    'Error'

  ];


  sheet
    .getRange(
      1,
      1,
      1,
      headers.length
    )
    .setValues([
      headers
    ]);


  sheet.setFrozenRows(
    1
  );

}


/************************************************************
 * CREATE SHEET
 ************************************************************/

function createSheetIfMissing_(
  ss,
  name
) {

  if (
    !ss.getSheetByName(name)
  ) {

    ss.insertSheet(
      name
    );

  }

}


/************************************************************
 * CONTINUATION TRIGGER
 ************************************************************/

function createContinuationTrigger_() {

  const triggers =
    ScriptApp.getProjectTriggers();


  /*
   * Remove old continuation triggers.
   */

  triggers.forEach(
    trigger => {

      if (
        trigger.getHandlerFunction() ===
        'VCT_CONTINUE'
      ) {

        ScriptApp.deleteTrigger(
          trigger
        );

      }

    }
  );


  /*
   * Continue after 1 minute.
   */

  ScriptApp.newTrigger(
    'VCT_CONTINUE'
  )
    .timeBased()
    .after(
      60 * 1000
    )
    .create();

}


/************************************************************
 * CONTINUATION ENTRY
 ************************************************************/

function VCT_CONTINUE() {

  VCT_EXTRACT_USERS();

}


/************************************************************
 * CREDENTIALS
 ************************************************************/

function getCredentials_() {

  const properties =
    PropertiesService
      .getScriptProperties();


  const mid =
    properties.getProperty(
      'GRAPHY_MID'
    );


  const key =
    properties.getProperty(
      'GRAPHY_KEY'
    );


  if (!mid) {

    throw new Error(
      'GRAPHY_MID is missing from Script Properties.'
    );

  }


  if (!key) {

    throw new Error(
      'GRAPHY_KEY is missing from Script Properties.'
    );

  }


  return {

    mid:
      mid,

    key:
      key

  };

}


/************************************************************
 * TEST:
 * ALL-TIME USAGE + LAST LOGIN
 *
 * Tests the FIRST VCT learner only.
 *
 * Does not modify VCT User Master.
 ************************************************************/

function redactUrl_(url) {

  return String(url)
    .replace(/([?&]key=)[^&]*/i, '$1***REDACTED***');

}

function VCT_TEST_ALL_TIME_AND_LOGIN() {

  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();


  ss.setSpreadsheetTimeZone(
    VCT_MASTER_CONFIG.TIMEZONE
  );


  const sourceSheet =
    ss.getSheetByName(
      VCT_MASTER_CONFIG.SOURCE_SHEET
    );


  if (!sourceSheet) {

    throw new Error(
      'Source sheet not found.'
    );

  }


  const users =
    readSourceUsers_(
      sourceSheet
    );


  if (
    users.length === 0
  ) {

    throw new Error(
      'No VCT users found.'
    );

  }


  const user =
    users[0];


  const credentials =
    getCredentials_();


  /*
   * Build both requests.
   */

  const usageRequest =
    buildUsageRequest_(
      credentials,
      user
    );


  const learnerRequest =
    buildLearnerRequest_(
      credentials,
      user
    );


  Logger.log(
    '======================================'
  );

  Logger.log(
    'VCT TEST'
  );

  Logger.log(
    'ALL-TIME USAGE + LAST LOGIN'
  );

  Logger.log(
    '======================================'
  );

  Logger.log(
    'Learner ID: ' +
    user.learnerId
  );

  Logger.log(
    'Product ID: ' +
    user.productId
  );

  Logger.log(
    'Product Name: ' +
    user.productName
  );


  /*
   * Usage request.
   */

  const usageResponse =
    UrlFetchApp.fetch(
      redactUrl_(usageRequest.url),
      {
        method:
          'get',

        muteHttpExceptions:
          true,

        headers:
          usageRequest.headers
      }
    );


  const usageResult =
    parseUsageResponse_(
      usageResponse
    );


  Logger.log(
    '\n========== USAGE =========='
  );

  Logger.log(
    'HTTP CODE: ' +
    usageResult.httpCode
  );

  Logger.log(
    'RAW RESPONSE:'
  );

  Logger.log(
    usageResult.rawResponse
  );

  Logger.log(
    'ALL-TIME SECONDS: ' +
    usageResult.seconds
  );


  if (
    usageResult.success
  ) {

    Logger.log(
      'ALL-TIME HOURS: ' +
      (
        usageResult.seconds /
        3600
      ).toFixed(2)
    );

    Logger.log(
      'TOTAL HR & MIN: ' +
      formatHoursMinutes_(
        usageResult.seconds
      )
    );

  }


  /*
   * Learner request.
   */

  const learnerResponse =
    UrlFetchApp.fetch(
      redactUrl_(learnerRequest.url),
      {
        method:
          'get',

        muteHttpExceptions:
          true,

        headers:
          learnerRequest.headers
      }
    );


  const learnerResult =
    parseLearnerResponse_(
      learnerResponse
    );


  Logger.log(
    '\n========== LEARNER =========='
  );

  Logger.log(
    'HTTP CODE: ' +
    learnerResult.httpCode
  );

  Logger.log(
    'LAST LOGIN RAW: ' +
    learnerResult.lastLogin
  );


  if (
    learnerResult.lastLogin
  ) {

    const istDate =
      parseGraphyDate_(
        learnerResult.lastLogin
      );


    Logger.log(
      'LAST LOGIN IST: ' +
      Utilities.formatDate(
        istDate,
        VCT_MASTER_CONFIG.TIMEZONE,
        'dd-MMM-yyyy HH:mm:ss'
      )
    );

  } else {

    Logger.log(
      'LAST LOGIN: NOT AVAILABLE'
    );

  }


  /*
   * Write debug information.
   */

  const debugSheet =
    ss.getSheetByName(
      VCT_MASTER_CONFIG.DEBUG_SHEET
    );


  if (debugSheet) {

    debugSheet.appendRow([

      new Date(),

      'ALL-TIME USAGE',

      user.learnerId,

      user.productId,

      usageResult.httpCode,

      redactUrl_(usageRequest.url),

      usageResult.rawResponse,

      usageResult.success
        ? usageResult.seconds
        : '',

      usageResult.success
        ? 'SUCCESS'
        : 'FAILED',

      usageResult.error || ''

    ]);


    debugSheet.appendRow([

      new Date(),

      'LAST LOGIN',

      user.learnerId,

      user.productId,

      learnerResult.httpCode,

      redactUrl_(learnerRequest.url),

      learnerResult.rawResponse,

      learnerResult.lastLogin || '',

      learnerResult.success
        ? 'SUCCESS'
        : 'FAILED',

      learnerResult.error || ''

    ]);

  }


  Logger.log(
    '\n======================================'
  );

  Logger.log(
    'TEST COMPLETED'
  );

  Logger.log(
    'Timezone: Asia/Kolkata'
  );

  Logger.log(
    '======================================'
  );


  SpreadsheetApp.getUi().alert(

    'VCT TEST COMPLETED\n\n' +

    'Learner:\n' +
    user.userName +

    '\n\nAll-Time Usage:\n' +

    (
      usageResult.success
        ? formatHoursMinutes_(
            usageResult.seconds
          )
        : 'FAILED'
    ) +

    '\n\nLast Login IST:\n' +

    (
      learnerResult.lastLogin
        ? Utilities.formatDate(
            parseGraphyDate_(
              learnerResult.lastLogin
            ),
            VCT_MASTER_CONFIG.TIMEZONE,
            'dd-MMM-yyyy HH:mm:ss'
          )
        : 'NOT AVAILABLE'
    )

  );

}


/************************************************************
 * STATUS
 ************************************************************/

function VCT_STATUS() {

  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();


  const sheetNames = [

    VCT_MASTER_CONFIG.SOURCE_SHEET,

    VCT_MASTER_CONFIG.MASTER_SHEET,

    VCT_MASTER_CONFIG.LOG_SHEET,

    VCT_MASTER_CONFIG.FAILED_SHEET,

    VCT_MASTER_CONFIG.DEBUG_SHEET

  ];


  let message =
    'VCT STATUS\n\n';


  sheetNames.forEach(
    name => {

      message +=

        (
          ss.getSheetByName(name)
            ? '✓ '
            : '✗ '
        ) +

        name +

        '\n';

    }
  );


  const triggers =
    ScriptApp.getProjectTriggers();


  const daily =
    triggers.some(
      trigger =>
        trigger.getHandlerFunction() ===
        'VCT_DAILY_SYNC'
    );


  const continuation =
    triggers.some(
      trigger =>
        trigger.getHandlerFunction() ===
        'VCT_CONTINUE'
    );


  message +=

    '\nDaily Trigger: ' +

    (
      daily
        ? '✓ Active'
        : '✗ Not Found'
    );


  message +=

    '\nContinuation: ' +

    (
      continuation
        ? '✓ Pending'
        : 'None'
    );


  message +=

    '\n\nTimezone:\nAsia/Kolkata';


  SpreadsheetApp
    .getUi()
    .alert(
      message
    );

}


/************************************************************
 * RESET MASTER + SUPPORT DATA
 *
 * DOES NOT DELETE SOURCE USERS.
 ************************************************************/

function VCT_RESET_DATA() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();


  const sheets = [

    VCT_MASTER_CONFIG.MASTER_SHEET,

    VCT_MASTER_CONFIG.LOG_SHEET,

    VCT_MASTER_CONFIG.FAILED_SHEET,

    VCT_MASTER_CONFIG.DEBUG_SHEET

  ];


  sheets.forEach(
    name => {

      const sheet =
        ss.getSheetByName(
          name
        );


      if (!sheet) {

        return;

      }


      const lastRow =
        sheet.getLastRow();


      const lastColumn =
        sheet.getLastColumn();


      if (
        lastRow > 1 &&
        lastColumn > 0
      ) {

        sheet
          .getRange(
            2,
            1,
            lastRow - 1,
            lastColumn
          )
          .clearContent();

      }

    }
  );


  /*
   * Reset cursor.
   */

  const properties =
    PropertiesService
      .getScriptProperties();


  properties.deleteProperty(
    'VCT_SYNC_CURSOR'
  );

  properties.deleteProperty(
    'VCT_SYNC_DATE'
  );


  SpreadsheetApp
    .getUi()
    .alert(

      'VCT RESET COMPLETED\n\n' +

      'Master/support data cleared.\n\n' +

      'Source sheet was NOT changed.'

    );

}