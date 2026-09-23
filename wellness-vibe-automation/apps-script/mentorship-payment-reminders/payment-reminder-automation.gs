/************************************************************
 * WELLNESS VIBE
 * 7-21 PAYMENT REMINDER AUTOMATION
 *
 * SOURCE SHEET:
 *   Pending Payment Reminder - Auto
 *
 * LOG SHEET:
 *   Payment Reminder Logs
 *
 * AUTOMATIC SCHEDULE:
 *   7th  -> R1
 *   21st -> R2
 *   Around 10:00 AM IST
 *
 * ELIGIBILITY:
 *   Pending Amount > 0
 *
 * WHATSAPP:
 *   ComBot Meta API
 *   Template: payment_reminder_v4
 *
 * IMPORTANT:
 *   - Payment date is NOT used for reminder calculation.
 *   - Uses Script Lock to prevent concurrent executions.
 *   - Uses separate WA and Email idempotency keys.
 *   - Successful messages are never automatically resent
 *     for the same client/date/reminder/channel.
 *   - No automatic retry of ambiguous ComBot API failures.
 *   - Manual testing supports a row number directly.
 ************************************************************/


/************************************************************
 * CONFIGURATION
 ************************************************************/

const CONFIG = {

  /**********************************************************
   * SPREADSHEET
   **********************************************************/

  SPREADSHEET_URL:
    "https://docs.google.com/spreadsheets/d/REDACTED_SPREADSHEET_ID/edit",

  SOURCE_SHEET:
    "Pending Payment Reminder - Auto",

  LOG_SHEET:
    "Payment Reminder Logs",


  /**********************************************************
   * COMBOT
   **********************************************************/

  COMBOT_BASE_URL:
    "https://provider.example.invalid/api",

  COMBOT_API_KEY_PROPERTY:
    "COMBOT_API_KEY",

  COMBOT_TEMPLATE_PROPERTY:
    "COMBOT_TEMPLATE_NAME",

  META_VERSION_PROPERTY:
    "META_VERSION",

  PHONE_NUMBER_ID_PROPERTY:
    "PHONE_NUMBER_ID",


  /**********************************************************
   * PAYMENT
   **********************************************************/

  PAYMENT_LINK:
    "https://payments.example.invalid/checkout",

  DEFAULT_TEMPLATE:
    "payment_reminder_v4_with_logo",

  EMAIL_LOGO_URL:
    "https://confidentialcontent.s3.eu-west-1.wasabisys.com/6582d9afd6dbacf943e78884/ea61f141-32f0-4cb5-840d-beb03202f10f.png",


  /**********************************************************
   * SENDING
   **********************************************************/

  // Delay between customers.
  // 1000 = 1 second.
  SEND_DELAY_MS:
    1000,


  /**********************************************************
   * AUTOMATIC SCHEDULE
   **********************************************************/

  REMINDER_1_DAY:
    7,

  REMINDER_2_DAY:
    21,

  TRIGGER_HOUR:
    10,

  // Apps Script time-based triggers can execute
  // sometime during the selected hour.
  TRIGGER_MINUTE_START:
    0,

  TRIGGER_MINUTE_END:
    59,


  /**********************************************************
   * MANUAL TEST
   **********************************************************/

  // Change this whenever you want to test another row.
  //
  // Example:
  // 11 = test row 11
  //
  // Then you can simply click:
  // manualTestSpecificRow
  //
  // without providing an argument.
  MANUAL_TEST_ROW:
    11,

};


/************************************************************
 * LOG HEADERS
 ************************************************************/

const LOG_HEADERS = [

  "Timestamp",
  "Execution ID",
  "Reminder Date",
  "Reminder Number",
  "Idempotency Key",
  "Source Row",

  "Client Name",
  "Phone",
  "Email",
  "Client ID",
  "Program Name",

  "Program Price",
  "Received Amount",
  "Pending Amount",
  "Payment Link",

  "WA Variable 1 - Client Name",
  "WA Variable 2 - Program Name",
  "WA Variable 3 - Pending Amount",
  "WA Variable 4 - Payment Link",

  "WA Template",
  "WA Status",
  "WA Message ID",
  "WA Payload",
  "WA Response",
  "WA Error",

  "Email Status",
  "Email Error",

  "Overall Status"

];


/************************************************************
 * COMBOT CONFIG
 ************************************************************/

function getCombotConfig_() {

  const properties =
    PropertiesService.getScriptProperties();

  const apiKey = properties.getProperty(
      CONFIG.COMBOT_API_KEY_PROPERTY
    );

  const templateName =
    properties.getProperty(
      CONFIG.COMBOT_TEMPLATE_PROPERTY
    ) ||
    CONFIG.DEFAULT_TEMPLATE;

  const metaVersion =
    properties.getProperty(
      CONFIG.META_VERSION_PROPERTY
    );

  const phoneNumberId =
    properties.getProperty(
      CONFIG.PHONE_NUMBER_ID_PROPERTY
    );


  if (!apiKey) {
    throw new Error(
      "Missing Script Property: COMBOT_API_KEY"
    );
  }

  if (!metaVersion) {
    throw new Error(
      "Missing Script Property: META_VERSION"
    );
  }

  if (!phoneNumberId) {
    throw new Error(
      "Missing Script Property: PHONE_NUMBER_ID"
    );
  }


  return {

    apiKey: apiKey,

    templateName:
      templateName,

    metaVersion:
      metaVersion,

    phoneNumberId:
      phoneNumberId

  };

}


/************************************************************
 * CHECK COMBOT CONFIGURATION
 ************************************************************/

function checkCombotConfiguration() {

  const config =
    getCombotConfig_();

  Logger.log(
    "========================================"
  );

  Logger.log(
    "COMBOT CONFIGURATION"
  );

  Logger.log(
    "========================================"
  );

  Logger.log(
    "API Key: CONFIGURED"
  );

  Logger.log(
    "Template: " +
    config.templateName
  );

  Logger.log(
    "Meta Version: " +
    config.metaVersion
  );

  Logger.log(
    "Phone Number ID: " +
    config.phoneNumberId
  );

  Logger.log(
    "========================================"
  );

}


/************************************************************
 * SPREADSHEET
 ************************************************************/

function getSpreadsheet_() {

  const ss =
    SpreadsheetApp.openByUrl(
      CONFIG.SPREADSHEET_URL
    );

  if (!ss) {

    throw new Error(
      "Could not open spreadsheet."
    );

  }

  return ss;

}


/************************************************************
 * SOURCE SHEET
 ************************************************************/

function getSourceSheet_() {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName(
      CONFIG.SOURCE_SHEET
    );

  if (!sheet) {

    throw new Error(
      "Source sheet not found: " +
      CONFIG.SOURCE_SHEET
    );

  }

  return sheet;

}


/************************************************************
 * TEST SPREADSHEET
 ************************************************************/

function testSourceData() {

  const ss =
    getSpreadsheet_();

  const sheet =
    getSourceSheet_();

  const data =
    sheet.getDataRange().getValues();

  Logger.log(
    "========================================"
  );

  Logger.log(
    "SPREADSHEET TEST"
  );

  Logger.log(
    "========================================"
  );

  Logger.log(
    "Spreadsheet: " +
    ss.getName()
  );

  Logger.log(
    "Source Sheet: " +
    sheet.getName()
  );

  Logger.log(
    "Total Rows: " +
    data.length
  );

  if (data.length > 0) {

    Logger.log(
      "Headers: " +
      JSON.stringify(data[0])
    );

  }

  if (data.length > 1) {

    Logger.log(
      "First Data Row: " +
      JSON.stringify(data[1])
    );

  }

  Logger.log(
    "Spreadsheet connection successful."
  );

}


/************************************************************
 * READ CUSTOMER
 *
 * SOURCE COLUMNS:
 *
 * A = Client Name
 * B = Phone
 * C = Email
 * D = Client Id
 * E = Program Name
 * F = Latest Payment Date
 * G = Program Price
 * H = Received Amt
 * I = Pending Amount
 ************************************************************/

function getCustomerFromRow_(sheet, sourceRow) {

  if (
    !Number.isInteger(sourceRow) ||
    sourceRow < 2
  ) {

    throw new Error(
      "Invalid source row. Use row 2 or greater."
    );

  }


  if (
    sourceRow >
    sheet.getLastRow()
  ) {

    throw new Error(
      "Source row " +
      sourceRow +
      " does not exist."
    );

  }


  const row =
    sheet
      .getRange(
        sourceRow,
        1,
        1,
        9
      )
      .getValues()[0];


  const clientName =
    String(
      row[0] || ""
    ).trim();

  const phone =
    normalizePhone_(
      row[1]
    );

  const email =
    String(
      row[2] || ""
    ).trim();

  const clientId =
    String(
      row[3] || ""
    ).trim();

  const programName =
    String(
      row[4] || ""
    ).trim();

  const latestPaymentDate =
    row[5];

  const programPrice =
    row[6];

  const receivedAmount =
    row[7];

  const pendingAmount =
    parseAmount_(
      row[8]
    );


  /**********************************************************
   * GRAND TOTAL
   **********************************************************/

  if (
    clientName
      .toLowerCase()
      .trim() ===
    "grand total"
  ) {

    throw new Error(
      "Grand Total row."
    );

  }


  /**********************************************************
   * EMPTY ROW
   **********************************************************/

  if (
    !clientName &&
    !phone &&
    !email &&
    !clientId
  ) {

    throw new Error(
      "Empty row."
    );

  }


  /**********************************************************
   * PENDING CHECK
   **********************************************************/

  if (
    pendingAmount <= 0
  ) {

    throw new Error(
      "Not eligible. Pending Amount = " +
      pendingAmount
    );

  }


  return {

    sourceRow:
      sourceRow,

    clientName:
      clientName,

    phone:
      phone,

    email:
      email,

    clientId:
      clientId,

    programName:
      programName,

    latestPaymentDate:
      latestPaymentDate,

    programPrice:
      programPrice,

    receivedAmount:
      receivedAmount,

    pendingAmount:
      pendingAmount

  };

}


/************************************************************
 * NORMALIZE PHONE
 ************************************************************/

function normalizePhone_(value) {

  let digits =
    String(
      value || ""
    ).replace(/\D/g, "");


  if (
    digits.indexOf("00") === 0
  ) {

    digits =
      digits.substring(2);

  }


  if (
    digits.length === 10
  ) {

    digits =
      "91" +
      digits;

  }


  if (
    digits.length < 8 ||
    digits.length > 15 ||
    digits.indexOf("0") === 0
  ) {

    return "";

  }


  return digits;

}


/************************************************************
 * PARSE AMOUNT
 ************************************************************/

function parseAmount_(value) {

  if (
    typeof value === "number"
  ) {

    return value;

  }


  const cleaned =
    String(
      value || ""
    )
      .replace(/â‚¹/g, "")
      .replace(/,/g, "")
      .trim();


  if (!cleaned) {

    return 0;

  }


  const number =
    Number(
      cleaned
    );


  return isNaN(number)
    ? 0
    : number;

}


/************************************************************
 * FORMAT AMOUNT
 ************************************************************/

function formatAmount_(value) {

  const amount =
    Number(
      value
    );


  if (
    !isFinite(amount)
  ) {

    return "0";

  }


  return amount.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits:
        2
    }
  );

}


/************************************************************
 * EMAIL TEMPLATE
 ************************************************************/

function buildEmailContent_(customer) {

  const clientName =
    escapeHtml_(
      customer.clientName
    );

  const programName =
    escapeHtml_(
      customer.programName
    );

  const pendingAmount =
    escapeHtml_(
      formatAmount_(
        customer.pendingAmount
      )
    );

  const paymentLink =
    escapeHtml_(
      CONFIG.PAYMENT_LINK
    );

  const logoUrl =
    escapeHtml_(
      CONFIG.EMAIL_LOGO_URL
    );

  return {

    subject:
      "Payment Reminder - Wellness Vibe",

    body:
      "Namaste " +
      customer.clientName +
      " ji,\n\n" +
      "A gentle reminder regarding your pending payment for " +
      customer.programName +
      ".\n\n" +
      "Pending Amount: â‚¹" +
      formatAmount_(
        customer.pendingAmount
      ) +
      "\n" +
      "Payment Link: " +
      CONFIG.PAYMENT_LINK +
      "\n\n" +
      "Kindly complete the payment at your convenience to proceed with the scheduled service.\n\n" +
      "If already paid, please disregard this message.\n\n" +
      "For support:\n" +
      "Email: support@example.invalid\n" +
      "Call: +00 0000 0000\n\n" +
      "Regards\n" +
      "Team Wellness Vibe",

    htmlBody:
      '<!DOCTYPE html>' +
      '<html lang="en"><head>' +
      '<meta charset="UTF-8">' +
      '<meta name="color-scheme" content="light only">' +
      '<meta name="supported-color-schemes" content="light">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>Payment Reminder - Wellness Vibe</title>' +
      '</head><body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">' +
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#f4f6f8;padding:30px 10px;"><tr><td align="center">' +
      '<table role="presentation" width="650" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:650px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">' +
      '<tr><td align="center" bgcolor="#ffffff" style="padding:25px 20px;background:#ffffff !important;border-bottom:4px solid #2F80B5;">' +
      '<img src="' + logoUrl + '" alt="Wellness Vibe" width="280" style="display:block;width:100%;max-width:280px;height:auto;margin:auto;background-color:#ffffff !important;border:0;">' +
      '</td></tr>' +
      '<tr><td align="center" style="background:#2F80B5;padding:25px 20px;">' +
      '<h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:600;font-family:Arial,Helvetica,sans-serif;">Payment Reminder</h1>' +
      '</td></tr>' +
      '<tr><td style="padding:35px 35px 20px 35px;color:#333333;font-size:16px;line-height:1.7;">' +
      '<p>Namaste <strong>' + clientName + '</strong> ji,</p>' +
      '<p>A gentle reminder regarding your pending payment for ' + programName + '.</p>' +
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:30px;background:#f7fafc;border:1px solid #dfe7ee;border-radius:12px;">' +
      '<tr><td style="background:#eaf4fa;padding:15px 20px;border-bottom:1px solid #d7e7f0;"><strong style="color:#2F80B5;font-size:17px;">Payment Details</strong></td></tr>' +
      '<tr><td style="padding:18px 20px;border-bottom:1px solid #e5e7eb;"><div style="color:#718096;font-size:13px;margin-bottom:6px;">Program</div><div style="color:#2d3748;font-size:16px;font-weight:bold;">' + programName + '</div></td></tr>' +
      '<tr><td style="padding:18px 20px;"><div style="color:#718096;font-size:13px;margin-bottom:6px;">Pending Amount</div><div style="color:#2F80B5;font-size:28px;font-weight:bold;">â‚¹' + pendingAmount + '</div></td></tr>' +
      '</table>' +
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:35px;"><tr><td align="center">' +
      '<a href="' + paymentLink + '" style="display:inline-block;background:#2F80B5;color:#ffffff;text-decoration:none;padding:16px 38px;border-radius:8px;font-size:16px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">Complete Payment</a>' +
      '</td></tr></table>' +
      '<p>Kindly complete the payment at your convenience to proceed with the scheduled service.</p>' +
      '<p>If already paid, please disregard this message.</p>' +
      '<p style="text-align:center;color:#888888;font-size:12px;margin-top:20px;">For support:<br>Email: support@example.invalid<br>Call: +00 0000 0000</p>' +
      '<p style="margin-top:30px;">Regards<br><strong>Team Wellness Vibe</strong></p>' +
      '</td></tr>' +
      '<tr><td align="center" style="background:#f7f9fb;padding:25px 20px;border-top:1px solid #e5e7eb;">' +
      '<div style="color:#2F80B5;font-size:18px;font-weight:bold;margin-bottom:8px;">WELLNESS VIBE</div>' +
      '<div style="color:#777777;font-size:12px;line-height:1.6;">A Sound and Frequency Remedy for Better Living</div>' +
      '<div style="color:#aaaaaa;font-size:11px;margin-top:15px;">This is an automated payment reminder from Team Wellness Vibe.</div>' +
      '</td></tr></table></td></tr></table>' +
      '</body></html>'

  };

}


/************************************************************
 * SEND PAYMENT EMAIL
 ************************************************************/

function sendPaymentEmail_(customer) {

  const content =
    buildEmailContent_(
      customer
    );

  GmailApp.sendEmail(
    customer.email,
    content.subject,
    content.body,
    {
      htmlBody:
        content.htmlBody,
      name:
        "Wellness Vibe"
    }
  );

  return {
    subject:
      content.subject
  };

}


/************************************************************
 * VALIDATE EMAIL
 ************************************************************/

function isValidEmail_(email) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(
      email || ""
    ).trim()
  );

}


/************************************************************
 * ESCAPE HTML
 ************************************************************/

function escapeHtml_(value) {

  return String(
    value || ""
  )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

}


/************************************************************
 * AUTOMATIC REMINDER INFO
 ************************************************************/

function getCurrentReminderInfo_() {

  const now =
    new Date();

  const timezone =
    Session.getScriptTimeZone() ||
    "Asia/Kolkata";


  const dateString =
    Utilities.formatDate(
      now,
      timezone,
      "yyyy-MM-dd"
    );


  const day =
    Number(
      Utilities.formatDate(
        now,
        timezone,
        "d"
      )
    );


  const hour =
    Number(
      Utilities.formatDate(
        now,
        timezone,
        "H"
      )
    );


  const minute =
    Number(
      Utilities.formatDate(
        now,
        timezone,
        "m"
      )
    );


  let reminderNumber;


  if (
    day ===
    CONFIG.REMINDER_1_DAY
  ) {

    reminderNumber =
      "R1";

  } else if (
    day ===
    CONFIG.REMINDER_2_DAY
  ) {

    reminderNumber =
      "R2";

  } else {

    return null;

  }


  if (
    hour <
    CONFIG.TRIGGER_HOUR
  ) {

    return null;

  }


  return {

    date:
      dateString,

    reminderNumber:
      reminderNumber,

    timezone:
      timezone

  };

}


/************************************************************
 * MANUAL REMINDER INFO
 ************************************************************/

function getManualReminderInfo_() {

  const now =
    new Date();

  const timezone =
    Session.getScriptTimeZone() ||
    "Asia/Kolkata";


  return {

    date:
      Utilities.formatDate(
        now,
        timezone,
        "yyyy-MM-dd"
      ),

    reminderNumber:
      "MANUAL",

    timezone:
      timezone

  };

}


/************************************************************
 * SUCCESSFUL LOG KEYS
 ************************************************************/

function buildSuccessfulKeySet_(sheet) {

  const keys =
    new Set();

  if (
    sheet.getLastRow() < 2
  ) {

    return keys;

  }

  const values =
    sheet
      .getDataRange()
      .getValues();

  const headers =
    values[0].map(
      function(value) {
        return String(
          value || ""
        ).trim();
      }
    );

  const keyIndex =
    headers.indexOf(
      "Idempotency Key"
    );

  const waStatusIndex =
    headers.indexOf(
      "WA Status"
    );

  const emailStatusIndex =
    headers.indexOf(
      "Email Status"
    );

  if (
    keyIndex < 0
  ) {

    return keys;

  }

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const key =
      String(
        values[i][keyIndex] || ""
      ).trim();

    const waSent =
      waStatusIndex >= 0 &&
      String(
        values[i][waStatusIndex] || ""
      ).trim() === "SENT";

    const waAmbiguous =
      waStatusIndex >= 0 &&
      String(
        values[i][waStatusIndex] || ""
      ).trim() === "AMBIGUOUS";

    const emailSent =
      emailStatusIndex >= 0 &&
      String(
        values[i][emailStatusIndex] || ""
      ).trim() === "SENT";

    if (
      key &&
      (waSent || waAmbiguous || emailSent)
    ) {

      keys.add(
        key
      );

    }

  }

  return keys;

}


/************************************************************
 * CLIENT IDENTITY
 ************************************************************/

function createClientIdentity_(customer) {

  const identity =
    customer.clientId ||
    customer.phone ||
    customer.email ||
    customer.clientName ||
    "unknown";

  return String(
    identity
  )
    .trim()
    .toLowerCase();

}


/************************************************************
 * MAIN AUTOMATIC AUTOMATION
 ************************************************************/

function paymentReminderAutomation() {

  const executionId =
    Utilities.getUuid();

  const lock =
    LockService.getScriptLock();


  if (
    !lock.tryLock(30000)
  ) {

    Logger.log(
      "Another execution is already running."
    );

    return;

  }


  try {

    Logger.log(
      "========================================"
    );

    Logger.log(
      "PAYMENT REMINDER AUTOMATION"
    );

    Logger.log(
      "Execution ID: " +
      executionId
    );


    /********************************************************
     * CHECK SCHEDULE
     ********************************************************/

    const reminder =
      getCurrentReminderInfo_();


    if (!reminder) {

      Logger.log(
        "Not a scheduled reminder window."
      );

      return;

    }


    Logger.log(
      "Reminder: " +
      reminder.reminderNumber
    );

    Logger.log(
      "Date: " +
      reminder.date
    );


    /********************************************************
     * CONFIG
     ********************************************************/

    const combot =
      getCombotConfig_();


    const ss =
      getSpreadsheet_();

    const sourceSheet =
      getSourceSheet_();

    const logSheet =
      getOrCreateLogSheet_(
        ss
      );

    /********************************************************
     * READ EXISTING SUCCESSFUL KEYS
     ********************************************************/

    const sentKeys =
      buildSuccessfulKeySet_(
        logSheet
      );


    const data =
      sourceSheet
        .getDataRange()
        .getValues();


    let processed =
      0;

    let waSent =
      0;

    let waSkipped =
      0;

    let waFailed =
      0;

    let waAmbiguous =
      0;

    let emailSent =
      0;

    let emailSkipped =
      0;

    let emailFailed =
      0;


    /********************************************************
     * LOOP
     ********************************************************/

    for (
      let i = 1;
      i < data.length;
      i++
    ) {

      const sourceRow =
        i + 1;


      let customer;


      try {

        customer =
          getCustomerFromRow_(
            sourceSheet,
            sourceRow
          );

      } catch (error) {

        Logger.log(
          "SKIP ROW " +
          sourceRow +
          " | " +
          getErrorMessage_(error)
        );

        continue;

      }


      processed++;


      const identity =
        createClientIdentity_(
          customer
        );


      /********************************************************
       * CHANNEL-SPECIFIC KEYS
       ********************************************************/

      const waKey =
        identity +
        "_" +
        reminder.date +
        "_" +
        reminder.reminderNumber +
        "_WA";


      const emailKey =
        identity +
        "_" +
        reminder.date +
        "_" +
        reminder.reminderNumber +
        "_EMAIL";


      /********************************************************
       * WHATSAPP
       ********************************************************/

      if (!customer.phone) {

        Logger.log(
          "WA SKIP | " +
          customer.clientName +
          " | Invalid phone."
        );

        waSkipped++;

      } else if (
        sentKeys.has(waKey)
      ) {

        Logger.log(
          "WA DUPLICATE BLOCKED | " +
          customer.clientName +
          " | " +
          waKey
        );

        waSkipped++;

      } else {

        try {

          const payload =
            createWhatsAppPayload_(
              customer,
              combot
            );


          const result =
            sendWhatsApp_(
              payload,
              combot
            );


          appendLog_(
            logSheet,
            {

              timestamp:
                new Date(),

              executionId:
                executionId,

              reminderDate:
                reminder.date,

              reminderNumber:
                reminder.reminderNumber,

              idempotencyKey:
                waKey,

              sourceRow:
                customer.sourceRow,

              clientName:
                customer.clientName,

              phone:
                customer.phone,

              email:
                customer.email,

              clientId:
                customer.clientId,

              programName:
                customer.programName,

              programPrice:
                customer.programPrice,

              receivedAmount:
                customer.receivedAmount,

              pendingAmount:
                customer.pendingAmount,

              paymentLink:
                CONFIG.PAYMENT_LINK,

              waVariable1:
                customer.clientName,

              waVariable2:
                customer.programName,

              waVariable3:
                formatAmount_(
                  customer.pendingAmount
                ),

              waVariable4:
                CONFIG.PAYMENT_LINK,

              waTemplate:
                combot.templateName,

              waStatus:
                "SENT",

              waMessageId:
                result.messageId,

              waPayload:
                JSON.stringify(
                  payload
                ),

              waResponse:
                result.responseText,

              waError:
                "",

              emailStatus:
                "",

              emailError:
                "",

              overallStatus:
                "WA_SENT"

            }
          );


          sentKeys.add(
            waKey
          );

          waSent++;


          Logger.log(
            "WA SENT | " +
            customer.clientName +
            " | " +
            customer.phone
          );


        } catch (error) {

          const ambiguous =
            isAmbiguousWhatsAppError_(
              error
            );

          if (
            ambiguous
          ) {

            waAmbiguous++;

          } else {

            waFailed++;

          }


          appendLog_(
            logSheet,
            {

              timestamp:
                new Date(),

              executionId:
                executionId,

              reminderDate:
                reminder.date,

              reminderNumber:
                reminder.reminderNumber,

              idempotencyKey:
                waKey,

              sourceRow:
                customer.sourceRow,

              clientName:
                customer.clientName,

              phone:
                customer.phone,

              email:
                customer.email,

              clientId:
                customer.clientId,

              programName:
                customer.programName,

              programPrice:
                customer.programPrice,

              receivedAmount:
                customer.receivedAmount,

              pendingAmount:
                customer.pendingAmount,

              paymentLink:
                CONFIG.PAYMENT_LINK,

              waVariable1:
                customer.clientName,

              waVariable2:
                customer.programName,

              waVariable3:
                formatAmount_(
                  customer.pendingAmount
                ),

              waVariable4:
                CONFIG.PAYMENT_LINK,

              waTemplate:
                combot.templateName,

              waStatus:
                ambiguous
                  ? "AMBIGUOUS"
                  : "FAILED",

              waMessageId:
                "",

              waPayload:
                "",

              waResponse:
                "",

              waError:
                getErrorMessage_(error),

              emailStatus:
                "",

              emailError:
                "",

              overallStatus:
                ambiguous
                  ? "WA_AMBIGUOUS"
                  : "WA_FAILED"

            }
          );


          Logger.log(
            (ambiguous
              ? "WA AMBIGUOUS | "
              : "WA FAILED | ") +
            customer.clientName +
            " | " +
            getErrorMessage_(error)
          );

        }

      }


      /********************************************************
       * EMAIL
       ********************************************************/

      if (!customer.email) {

        Logger.log(
          "EMAIL SKIP | " +
          customer.clientName +
          " | Missing email."
        );

        emailSkipped++;

      } else if (
        !isValidEmail_(
          customer.email
        )
      ) {

        Logger.log(
          "EMAIL SKIP | " +
          customer.clientName +
          " | Invalid email."
        );

        emailSkipped++;

      } else if (
        sentKeys.has(emailKey)
      ) {

        Logger.log(
          "EMAIL DUPLICATE BLOCKED | " +
          customer.clientName +
          " | " +
          emailKey
        );

        emailSkipped++;

      } else {

        try {

          const result =
            sendPaymentEmail_(
              customer
            );


          appendLog_(
            logSheet,
            {

              timestamp:
                new Date(),

              executionId:
                executionId,

              reminderDate:
                reminder.date,

              reminderNumber:
                reminder.reminderNumber,

              idempotencyKey:
                emailKey,

              sourceRow:
                customer.sourceRow,

              clientName:
                customer.clientName,

              phone:
                customer.phone,

              email:
                customer.email,

              clientId:
                customer.clientId,

              programName:
                customer.programName,

              programPrice:
                customer.programPrice,

              receivedAmount:
                customer.receivedAmount,

              pendingAmount:
                customer.pendingAmount,

              paymentLink:
                CONFIG.PAYMENT_LINK,

              waVariable1:
                "",

              waVariable2:
                "",

              waVariable3:
                "",

              waVariable4:
                "",

              waTemplate:
                "",

              waStatus:
                "",

              waMessageId:
                "",

              waPayload:
                "",

              waResponse:
                "",

              waError:
                "",

              emailStatus:
                "SENT",

              emailError:
                "",

              overallStatus:
                "EMAIL_SENT"

            }
          );


          sentKeys.add(
            emailKey
          );

          emailSent++;


          Logger.log(
            "EMAIL SENT | " +
            customer.clientName +
            " | " +
            customer.email
          );


        } catch (error) {

          emailFailed++;


          appendLog_(
            logSheet,
            {

              timestamp:
                new Date(),

              executionId:
                executionId,

              reminderDate:
                reminder.date,

              reminderNumber:
                reminder.reminderNumber,

              idempotencyKey:
                emailKey,

              sourceRow:
                customer.sourceRow,

              clientName:
                customer.clientName,

              phone:
                customer.phone,

              email:
                customer.email,

              clientId:
                customer.clientId,

              programName:
                customer.programName,

              programPrice:
                customer.programPrice,

              receivedAmount:
                customer.receivedAmount,

              pendingAmount:
                customer.pendingAmount,

              paymentLink:
                CONFIG.PAYMENT_LINK,

              waVariable1:
                "",

              waVariable2:
                "",

              waVariable3:
                "",

              waVariable4:
                "",

              waTemplate:
                "",

              waStatus:
                "",

              waMessageId:
                "",

              waPayload:
                "",

              waResponse:
                "",

              waError:
                "",

              emailStatus:
                "FAILED",

              emailError:
                getErrorMessage_(error),

              overallStatus:
                "EMAIL_FAILED"

            }
          );


          Logger.log(
            "EMAIL FAILED | " +
            customer.clientName +
            " | " +
            getErrorMessage_(error)
          );

        }

      }


      /********************************************************
       * RATE / BURST CONTROL
       ********************************************************/

      if (
        CONFIG.SEND_DELAY_MS > 0
      ) {

        Utilities.sleep(
          CONFIG.SEND_DELAY_MS
        );

      }

    }


    /********************************************************
     * SUMMARY
     ********************************************************/

    Logger.log(
      "========================================"
    );

    Logger.log(
      "AUTOMATION COMPLETE"
    );

    Logger.log(
      "Processed: " +
      processed
    );

    Logger.log(
      "WA Sent: " +
      waSent
    );

    Logger.log(
      "WA Skipped: " +
      waSkipped
    );

    Logger.log(
      "WA Failed: " +
      waFailed
    );

    Logger.log(
      "WA Ambiguous: " +
      waAmbiguous
    );

    Logger.log(
      "Email Sent: " +
      emailSent
    );

    Logger.log(
      "Email Skipped: " +
      emailSkipped
    );

    Logger.log(
      "Email Failed: " +
      emailFailed
    );

    Logger.log(
      "========================================"
    );


  } finally {

    lock.releaseLock();

  }

}


/************************************************************
 * MANUAL TEST
 *
 * OPTION 1:
 *
 * manualTestSpecificRow(11)
 *
 *
 * OPTION 2:
 *
 * Change:
 *
 * MANUAL_TEST_ROW: 11
 *
 * Then click:
 *
 * manualTestSpecificRow
 *
 * in Apps Script.
 ************************************************************/

function manualTestSpecificRow(
  rowNumber
) {

  if (
    rowNumber === undefined ||
    rowNumber === null ||
    rowNumber === ""
  ) {

    rowNumber =
      CONFIG.MANUAL_TEST_ROW;

  }


  rowNumber =
    Number(
      rowNumber
    );


  validateManualRowNumber_(
    rowNumber
  );


  manualTestRowWithChannels_(
    rowNumber,
    true,
    true
  );

}


/************************************************************
 * MANUAL WHATSAPP ONLY
 *
 * Run:
 *
 * manualTestSpecificRowWhatsApp(11)
 *
 * OR simply click the function after setting
 * MANUAL_TEST_ROW.
 ************************************************************/

function manualTestSpecificRowWhatsApp(
  rowNumber
) {

  if (
    rowNumber === undefined ||
    rowNumber === null ||
    rowNumber === ""
  ) {

    rowNumber =
      CONFIG.MANUAL_TEST_ROW;

  }


  rowNumber =
    Number(
      rowNumber
    );


  validateManualRowNumber_(
    rowNumber
  );


  manualTestRowWithChannels_(
    rowNumber,
    true,
    false
  );

}


/************************************************************
 * MANUAL EMAIL ONLY
 *
 * Run:
 *
 * manualTestSpecificRowEmail(11)
 *
 * OR simply click the function after setting
 * MANUAL_TEST_ROW.
 ************************************************************/

function manualTestSpecificRowEmail(
  rowNumber
) {

  if (
    rowNumber === undefined ||
    rowNumber === null ||
    rowNumber === ""
  ) {

    rowNumber =
      CONFIG.MANUAL_TEST_ROW;

  }


  rowNumber =
    Number(
      rowNumber
    );


  validateManualRowNumber_(
    rowNumber
  );


  manualTestRowWithChannels_(
    rowNumber,
    false,
    true
  );

}


/************************************************************
 * DEFAULT MANUAL TEST
 *
 * Uses CONFIG.MANUAL_TEST_ROW.
 *
 * This is useful from Apps Script dropdown.
 ************************************************************/

function manualTestRow() {

  manualTestSpecificRow(
    CONFIG.MANUAL_TEST_ROW
  );

}


/************************************************************
 * DEFAULT WHATSAPP MANUAL TEST
 ************************************************************/

function manualTestRowWhatsAppOnly() {

  manualTestSpecificRowWhatsApp(
    CONFIG.MANUAL_TEST_ROW
  );

}


/************************************************************
 * DEFAULT EMAIL MANUAL TEST
 ************************************************************/

function manualTestRowEmailOnly() {

  manualTestSpecificRowEmail(
    CONFIG.MANUAL_TEST_ROW
  );

}


/************************************************************
 * MANUAL TEST ENGINE
 ************************************************************/

function manualTestRowWithChannels_(
  rowNumber,
  sendWhatsApp,
  sendEmail
) {

  const executionId =
    Utilities.getUuid();

  const lock =
    LockService.getScriptLock();


  if (
    !lock.tryLock(30000)
  ) {

    throw new Error(
      "Another execution is already running. Try again."
    );

  }


  try {

    Logger.log(
      "========================================"
    );

    Logger.log(
      "MANUAL PAYMENT REMINDER TEST"
    );

    Logger.log(
      "Row: " +
      rowNumber
    );

    Logger.log(
      "Execution ID: " +
      executionId
    );


    const combot =
      getCombotConfig_();

    const ss =
      getSpreadsheet_();

    const sourceSheet =
      getSourceSheet_();

    const logSheet =
      getOrCreateLogSheet_(
        ss
      );


    const customer =
      getCustomerFromRow_(
        sourceSheet,
        rowNumber
      );


    const reminder =
      getManualReminderInfo_();


    Logger.log(
      "----------------------------------------"
    );

    Logger.log(
      "CUSTOMER"
    );

    Logger.log(
      "Client Name: " +
      customer.clientName
    );

    Logger.log(
      "Phone: " +
      customer.phone
    );

    Logger.log(
      "Email: " +
      customer.email
    );

    Logger.log(
      "Client ID: " +
      customer.clientId
    );

    Logger.log(
      "Program: " +
      customer.programName
    );

    Logger.log(
      "Pending Amount: â‚¹" +
      formatAmount_(
        customer.pendingAmount
      )
    );


    /********************************************************
     * WHATSAPP MANUAL TEST
     ********************************************************/

    if (
      sendWhatsApp
    ) {

      const waKey =
          "MANUAL_" +
          executionId +
          "_" +
          rowNumber +
          "_WA";


        const payload =
          createWhatsAppPayload_(
            customer,
            combot
          );


        Logger.log(
          "----------------------------------------"
        );

        Logger.log(
          "WHATSAPP PAYLOAD"
        );

        Logger.log(
          JSON.stringify(
            payload,
            null,
            2
          )
        );


        try {

          const result =
            sendWhatsApp_(
              payload,
              combot
            );


          appendLog_(
            logSheet,
            {

              timestamp:
                new Date(),

              executionId:
                executionId,

              reminderDate:
                reminder.date,

              reminderNumber:
                "MANUAL",

              idempotencyKey:
                waKey,

              sourceRow:
                customer.sourceRow,

              clientName:
                customer.clientName,

              phone:
                customer.phone,

              email:
                customer.email,

              clientId:
                customer.clientId,

              programName:
                customer.programName,

              programPrice:
                customer.programPrice,

              receivedAmount:
                customer.receivedAmount,

              pendingAmount:
                customer.pendingAmount,

              paymentLink:
                CONFIG.PAYMENT_LINK,

              waVariable1:
                customer.clientName,

              waVariable2:
                customer.programName,

              waVariable3:
                formatAmount_(
                  customer.pendingAmount
                ),

              waVariable4:
                CONFIG.PAYMENT_LINK,

              waTemplate:
                combot.templateName,

              waStatus:
                "SENT",

              waMessageId:
                result.messageId,

              waPayload:
                JSON.stringify(
                  payload
                ),

              waResponse:
                result.responseText,

              waError:
                "",

              emailStatus:
                "",

              emailError:
                "",

              overallStatus:
                "MANUAL_WA_SENT"

            }
          );


          Logger.log(
            "========================================"
          );

          Logger.log(
            "MANUAL WHATSAPP SENT SUCCESSFULLY"
          );

          Logger.log(
            "Message ID: " +
            result.messageId
          );

          Logger.log(
            "========================================"
          );


        } catch (error) {

          appendLog_(
            logSheet,
            {

              timestamp:
                new Date(),

              executionId:
                executionId,

              reminderDate:
                reminder.date,

              reminderNumber:
                "MANUAL",

              idempotencyKey:
                waKey,

              sourceRow:
                customer.sourceRow,

              clientName:
                customer.clientName,

              phone:
                customer.phone,

              email:
                customer.email,

              clientId:
                customer.clientId,

              programName:
                customer.programName,

              programPrice:
                customer.programPrice,

              receivedAmount:
                customer.receivedAmount,

              pendingAmount:
                customer.pendingAmount,

              paymentLink:
                CONFIG.PAYMENT_LINK,

              waVariable1:
                customer.clientName,

              waVariable2:
                customer.programName,

              waVariable3:
                formatAmount_(
                  customer.pendingAmount
                ),

              waVariable4:
                CONFIG.PAYMENT_LINK,

              waTemplate:
                combot.templateName,

              waStatus:
                "FAILED",

              waMessageId:
                "",

              waPayload:
                JSON.stringify(
                  payload
                ),

              waResponse:
                "",

              waError:
                getErrorMessage_(error),

              emailStatus:
                "",

              emailError:
                "",

              overallStatus:
                "MANUAL_WA_FAILED"

            }
          );


          throw error;

        }

    }


    /********************************************************
     * EMAIL MANUAL TEST
     ********************************************************/

    if (
      sendEmail
    ) {

      const emailKey =
          "MANUAL_" +
          executionId +
          "_" +
          rowNumber +
          "_EMAIL";


        if (
          !customer.email
        ) {

          throw new Error(
            "Customer has no email address."
          );

        }


        if (
          !isValidEmail_(
            customer.email
          )
        ) {

          throw new Error(
            "Invalid email address: " +
            customer.email
          );

        }


        Logger.log(
          "----------------------------------------"
        );

        Logger.log(
          "EMAIL PREVIEW"
        );

        const emailContent =
          buildEmailContent_(
            customer
          );


        Logger.log(
          "Subject: " +
          emailContent.subject
        );

        Logger.log(
          "Body:"
        );

        Logger.log(
          emailContent.body
        );


        try {

          sendPaymentEmail_(
            customer
          );


          appendLog_(
            logSheet,
            {

              timestamp:
                new Date(),

              executionId:
                executionId,

              reminderDate:
                reminder.date,

              reminderNumber:
                "MANUAL",

              idempotencyKey:
                emailKey,

              sourceRow:
                customer.sourceRow,

              clientName:
                customer.clientName,

              phone:
                customer.phone,

              email:
                customer.email,

              clientId:
                customer.clientId,

              programName:
                customer.programName,

              programPrice:
                customer.programPrice,

              receivedAmount:
                customer.receivedAmount,

              pendingAmount:
                customer.pendingAmount,

              paymentLink:
                CONFIG.PAYMENT_LINK,

              waVariable1:
                "",

              waVariable2:
                "",

              waVariable3:
                "",

              waVariable4:
                "",

              waTemplate:
                "",

              waStatus:
                "",

              waMessageId:
                "",

              waPayload:
                "",

              waResponse:
                "",

              waError:
                "",

              emailStatus:
                "SENT",

              emailError:
                "",

              overallStatus:
                "MANUAL_EMAIL_SENT"

            }
          );


          Logger.log(
            "========================================"
          );

          Logger.log(
            "MANUAL EMAIL SENT SUCCESSFULLY"
          );

          Logger.log(
            "========================================"
          );


        } catch (error) {

          appendLog_(
            logSheet,
            {

              timestamp:
                new Date(),

              executionId:
                executionId,

              reminderDate:
                reminder.date,

              reminderNumber:
                "MANUAL",

              idempotencyKey:
                emailKey,

              sourceRow:
                customer.sourceRow,

              clientName:
                customer.clientName,

              phone:
                customer.phone,

              email:
                customer.email,

              clientId:
                customer.clientId,

              programName:
                customer.programName,

              programPrice:
                customer.programPrice,

              receivedAmount:
                customer.receivedAmount,

              pendingAmount:
                customer.pendingAmount,

              paymentLink:
                CONFIG.PAYMENT_LINK,

              waVariable1:
                "",

              waVariable2:
                "",

              waVariable3:
                "",

              waVariable4:
                "",

              waTemplate:
                "",

              waStatus:
                "",

              waMessageId:
                "",

              waPayload:
                "",

              waResponse:
                "",

              waError:
                "",

              emailStatus:
                "FAILED",

              emailError:
                getErrorMessage_(error),

              overallStatus:
                "MANUAL_EMAIL_FAILED"

            }
          );


          throw error;

        }

    }


  } finally {

    lock.releaseLock();

  }

}


/************************************************************
 * PREVIEW MANUAL ROW
 *
 * DOES NOT SEND ANYTHING.
 *
 * Run:
 *
 * previewManualTestRow(11)
 *
 * OR:
 *
 * previewManualTestRow()
 ************************************************************/

function previewManualTestRow(
  rowNumber
) {

  if (
    rowNumber === undefined ||
    rowNumber === null ||
    rowNumber === ""
  ) {

    rowNumber =
      CONFIG.MANUAL_TEST_ROW;

  }


  rowNumber =
    Number(
      rowNumber
    );


  validateManualRowNumber_(
    rowNumber
  );


  const sheet =
    getSourceSheet_();

  const customer =
    getCustomerFromRow_(
      sheet,
      rowNumber
    );


  Logger.log(
    "========================================"
  );

  Logger.log(
    "MANUAL ROW PREVIEW"
  );

  Logger.log(
    "Row: " +
    rowNumber
  );

  Logger.log(
    "========================================"
  );

  Logger.log(
    "Client Name: " +
    customer.clientName
  );

  Logger.log(
    "Phone: " +
    customer.phone
  );

  Logger.log(
    "Email: " +
    customer.email
  );

  Logger.log(
    "Client ID: " +
    customer.clientId
  );

  Logger.log(
    "Program Name: " +
    customer.programName
  );

  Logger.log(
    "Program Price: â‚¹" +
    formatAmount_(
      customer.programPrice
    )
  );

  Logger.log(
    "Received Amount: â‚¹" +
    formatAmount_(
      customer.receivedAmount
    )
  );

  Logger.log(
    "Pending Amount: â‚¹" +
    formatAmount_(
      customer.pendingAmount
    )
  );

  Logger.log(
    "Payment Link: " +
    CONFIG.PAYMENT_LINK
  );


  const combot =
    getCombotConfig_();


  const payload =
    createWhatsAppPayload_(
      customer,
      combot
    );


  Logger.log(
    "----------------------------------------"
  );

  Logger.log(
    "WHATSAPP VARIABLES"
  );

  Logger.log(
    "Variable 1: " +
    customer.clientName
  );

  Logger.log(
    "Variable 2: " +
    customer.programName
  );

  Logger.log(
    "Variable 3: â‚¹" +
    formatAmount_(
      customer.pendingAmount
    )
  );

  Logger.log(
    "Variable 4: " +
    CONFIG.PAYMENT_LINK
  );


  Logger.log(
    "----------------------------------------"
  );

  Logger.log(
    "WHATSAPP PAYLOAD"
  );

  Logger.log(
    JSON.stringify(
      payload,
      null,
      2
    )
  );


  const email =
    buildEmailContent_(
      customer
    );


  Logger.log(
    "----------------------------------------"
  );

  Logger.log(
    "EMAIL SUBJECT"
  );

  Logger.log(
    email.subject
  );


  Logger.log(
    "EMAIL BODY"
  );

  Logger.log(
    email.body
  );


  Logger.log(
    "========================================"
  );

  Logger.log(
    "PREVIEW COMPLETE - NOTHING WAS SENT"
  );

  Logger.log(
    "========================================"
  );

}


/************************************************************
 * EMAIL PREVIEW ONLY
 *
 * DOES NOT SEND.
 *
 * Run:
 *
 * previewManualEmail(11)
 *
 * OR:
 *
 * previewManualEmail()
 ************************************************************/

function previewManualEmail(
  rowNumber
) {

  if (
    rowNumber === undefined ||
    rowNumber === null ||
    rowNumber === ""
  ) {

    rowNumber =
      CONFIG.MANUAL_TEST_ROW;

  }


  rowNumber =
    Number(
      rowNumber
    );


  validateManualRowNumber_(
    rowNumber
  );


  const sheet =
    getSourceSheet_();


  const customer =
    getCustomerFromRow_(
      sheet,
      rowNumber
    );


  const content =
    buildEmailContent_(
      customer
    );


  Logger.log(
    "========================================"
  );

  Logger.log(
    "EMAIL PREVIEW"
  );

  Logger.log(
    "Row: " +
    rowNumber
  );

  Logger.log(
    "To: " +
    customer.email
  );

  Logger.log(
    "Subject: " +
    content.subject
  );

  Logger.log(
    "----------------------------------------"
  );

  Logger.log(
    content.body
  );

  Logger.log(
    "========================================"
  );

  Logger.log(
    "PREVIEW ONLY - EMAIL WAS NOT SENT"
  );

  Logger.log(
    "========================================"
  );

}


/************************************************************
 * VALIDATE MANUAL ROW
 ************************************************************/

function validateManualRowNumber_(
  rowNumber
) {

  if (
    !Number.isInteger(
      rowNumber
    ) ||
    rowNumber < 2
  ) {

    throw new Error(
      "Use a valid row number >= 2. Example: manualTestSpecificRow(11)"
    );

  }

}


/************************************************************
 * WHATSAPP PAYLOAD
 ************************************************************/

function createWhatsAppPayload_(
  customer,
  combot
) {

  return {

    to:
      customer.phone,

    recipient_type:
      "individual",

    type:
      "template",

    template: {

      language: {

        policy:
          "deterministic",

        code:
          "en"

      },

      name:
        combot.templateName,

      components: [

        {

          type:
            "header",

          parameters: [

            {
              type:
                "image",

              image: {

                link:
                  CONFIG.EMAIL_LOGO_URL

              }

            }

          ]

        },

        {

          type:
            "body",

          parameters: [

            {
              type:
                "text",

              text:
                customer.clientName
            },

            {
              type:
                "text",

              text:
                customer.programName
            },

            {
              type:
                "text",

              text:
                formatAmount_(
                  customer.pendingAmount
                )
            },

            {
              type:
                "text",

              text:
                CONFIG.PAYMENT_LINK
            }

          ]

        }

      ]

    }

  };

}


/************************************************************
 * SEND WHATSAPP
 *
 * IMPORTANT:
 * NO AUTOMATIC RETRY.
 *
 * If ComBot accepts the message but the response is lost,
 * retrying automatically could create a duplicate message.
 ************************************************************/

function sendWhatsApp_(
  payload,
  combot
) {

  /*
   * ComBot reference integration uses this URL structure:
   *   /api/meta_v2/{META_VERSION}/{PHONE_NUMBER_ID}/messages
   *
   * Example:
   *   https://provider.example.invalid/api
   *
   * IMPORTANT:
   * META_VERSION and PHONE_NUMBER_ID are path parameters here.
   * They are NOT sent as X-Meta-Version / X-Phone-Number-ID headers.
   */

  const apiUrl =
    CONFIG.COMBOT_BASE_URL.replace(/\/$/, "") +
    "/" +
    encodeURIComponent(combot.metaVersion) +
    "/" +
    encodeURIComponent(combot.phoneNumberId) +
    "/messages";


  /*
   * The reference ComBot integration sends messaging_product.
   * Add it without changing the payment_reminder_v4 body variables.
   */
  const requestPayload = JSON.parse(
    JSON.stringify(payload)
  );

  requestPayload.messaging_product = "whatsapp";


  const options = {

    method:
      "post",

    contentType:
      "application/json",

    headers: {

      Authorization:
        "Bearer " +
        combot.apiKey

    },

    payload:
      JSON.stringify(
        requestPayload
      ),

    muteHttpExceptions:
      true

  };


  Logger.log(
    "ComBot URL: " +
    apiUrl
  );

  Logger.log(
    "ComBot Meta Version: " +
    combot.metaVersion
  );

  Logger.log(
    "ComBot Phone Number ID: " +
    combot.phoneNumberId
  );

  Logger.log(
    "ComBot Payload: " +
    JSON.stringify(
      requestPayload,
      null,
      2
    )
  );


  const response =
    UrlFetchApp.fetch(
      apiUrl,
      options
    );


  const statusCode =
    response.getResponseCode();

  const responseText =
    response.getContentText();


  Logger.log(
    "ComBot HTTP Status: " +
    statusCode
  );

  Logger.log(
    "ComBot Response: " +
    responseText
  );


  let responseJson = null;

  try {

    responseJson =
      JSON.parse(
        responseText
      );

  } catch (error) {

    responseJson = null;

  }


  if (
    statusCode < 200 ||
    statusCode >= 300
  ) {

    throw new Error(
      "ComBot API returned HTTP " +
      statusCode +
      ": " +
      responseText
    );

  }


  if (!responseJson) {

    throw new Error(
      "ComBot did not return valid JSON: " +
      responseText
    );

  }


  /*
   * Reference working integration confirms success through
   * responseJson.messages.
   * Some ComBot responses may also expose success:true.
   */
  if (
    Array.isArray(
      responseJson.messages
    ) &&
    responseJson.messages.length > 0
  ) {

    return {

      statusCode:
        statusCode,

      responseText:
        responseText,

      messageId:
        extractMessageId_(
          responseText
        )

    };

  }


  if (
    responseJson.success === true
  ) {

    return {

      statusCode:
        statusCode,

      responseText:
        responseText,

      messageId:
        extractMessageId_(
          responseText
        )

    };

  }


  throw new Error(
    "ComBot did not confirm successful WhatsApp delivery: " +
    responseText
  );

}


/************************************************************
 * CLASSIFY UNCERTAIN WHATSAPP FAILURE
 ************************************************************/

function isAmbiguousWhatsAppError_(error) {

  const message =
    getErrorMessage_(
      error
    ).toLowerCase();

  return (
    /http\s+5\d\d/.test(
      message
    ) ||
    /timeout|timed out|connection|network|temporar|service unavailable|try again/.test(
      message
    )
  );

}

/************************************************************
 * EXTRACT MESSAGE ID
 ************************************************************/

function extractMessageId_(
  responseText
) {

  if (!responseText) {

    return "";

  }


  try {

    const json =
      JSON.parse(
        responseText
      );


    /******************************************************
     * Common possible locations.
     ******************************************************/

    if (
      json.message_id
    ) {

      return String(
        json.message_id
      );

    }


    if (
      json.messageId
    ) {

      return String(
        json.messageId
      );

    }


    if (
      json.id
    ) {

      return String(
        json.id
      );

    }


    if (
      json.messages &&
      json.messages.length > 0
    ) {

      if (
        json.messages[0].id
      ) {

        return String(
          json.messages[0].id
        );

      }

    }


    if (
      json.data
    ) {

      if (
        json.data.message_id
      ) {

        return String(
          json.data.message_id
        );

      }

      if (
        json.data.messageId
      ) {

        return String(
          json.data.messageId
        );

      }

      if (
        json.data.id
      ) {

        return String(
          json.data.id
        );

      }

    }

  } catch (error) {

    // Response is not JSON.
    // Keep message ID blank.

  }


  return "";

}


/************************************************************
 * CREATE / GET LOG SHEET
 ************************************************************/

function getOrCreateLogSheet_(
  ss
) {

  let sheet =
    ss.getSheetByName(
      CONFIG.LOG_SHEET
    );


  if (!sheet) {

    sheet =
      ss.insertSheet(
        CONFIG.LOG_SHEET
      );

  }


  const existingHeaders =
    sheet
      .getRange(
        1,
        1,
        1,
        Math.max(
          sheet.getLastColumn(),
          LOG_HEADERS.length
        )
      )
      .getValues()[0];


  /********************************************************
   * If sheet is completely empty, create headers.
   ********************************************************/

  const hasAnyHeader =
    existingHeaders.some(
      function(value) {
        return String(
          value || ""
        ).trim() !== "";
      }
    );


  if (!hasAnyHeader) {

    sheet
      .getRange(
        1,
        1,
        1,
        LOG_HEADERS.length
      )
      .setValues([
        LOG_HEADERS
      ]);

  } else {

    /******************************************************
     * Add any missing required headers.
     ******************************************************/

    const existingSet =
      new Set(
        existingHeaders.map(
          function(value) {
            return String(
              value || ""
            ).trim();
          }
        )
      );


    let lastColumn =
      sheet.getLastColumn();


    LOG_HEADERS.forEach(
      function(header) {

        if (
          !existingSet.has(
            header
          )
        ) {

          lastColumn++;

          sheet
            .getRange(
              1,
              lastColumn
            )
            .setValue(
              header
            );

        }

      }
    );

  }


  return sheet;

}


/************************************************************
 * APPEND LOG
 ************************************************************/

function appendLog_(
  sheet,
  data
) {

  const lastColumn =
    sheet.getLastColumn();


  const headers =
    sheet
      .getRange(
        1,
        1,
        1,
        lastColumn
      )
      .getValues()[0];


  const row =
    headers.map(
      function(header) {

        switch (
          String(
            header
          ).trim()
        ) {

          case "Timestamp":
            return data.timestamp || "";

          case "Execution ID":
            return data.executionId || "";

          case "Reminder Date":
            return data.reminderDate || "";

          case "Reminder Number":
            return data.reminderNumber || "";

          case "Idempotency Key":
            return data.idempotencyKey || "";

          case "Source Row":
            return data.sourceRow || "";

          case "Client Name":
            return data.clientName || "";

          case "Phone":
            return data.phone || "";

          case "Email":
            return data.email || "";

          case "Client ID":
            return data.clientId || "";

          case "Program Name":
            return data.programName || "";

          case "Program Price":
            return data.programPrice || "";

          case "Received Amount":
            return data.receivedAmount || "";

          case "Pending Amount":
            return data.pendingAmount || "";

          case "Payment Link":
            return data.paymentLink || "";

          case "WA Variable 1 - Client Name":
            return data.waVariable1 || "";

          case "WA Variable 2 - Program Name":
            return data.waVariable2 || "";

          case "WA Variable 3 - Pending Amount":
            return data.waVariable3 || "";

          case "WA Variable 4 - Payment Link":
            return data.waVariable4 || "";

          case "WA Template":
            return data.waTemplate || "";

          case "WA Status":
            return data.waStatus || "";

          case "WA Message ID":
            return data.waMessageId || "";

          case "WA Payload":
            return data.waPayload || "";

          case "WA Response":
            return data.waResponse || "";

          case "WA Error":
            return data.waError || "";

          case "Email Status":
            return data.emailStatus || "";

          case "Email Error":
            return data.emailError || "";

          case "Overall Status":
            return data.overallStatus || "";

          default:
            return "";

        }

      }
    );


  sheet
    .appendRow(
      row
    );

}


/************************************************************
 * TEST WHATSAPP VARIABLES
 *
 * Does NOT send.
 ************************************************************/

function testWhatsAppVariables(
  rowNumber
) {

  if (
    rowNumber === undefined ||
    rowNumber === null ||
    rowNumber === ""
  ) {

    rowNumber =
      CONFIG.MANUAL_TEST_ROW;

  }


  rowNumber =
    Number(
      rowNumber
    );


  validateManualRowNumber_(
    rowNumber
  );


  const sheet =
    getSourceSheet_();


  const customer =
    getCustomerFromRow_(
      sheet,
      rowNumber
    );


  const combot =
    getCombotConfig_();


  const payload =
    createWhatsAppPayload_(
      customer,
      combot
    );


  Logger.log(
    JSON.stringify(
      payload,
      null,
      2
    )
  );


  Logger.log(
    "No WhatsApp message was sent."
  );

}


/************************************************************
 * TEST IDEMPOTENCY KEY
 ************************************************************/

function testIdempotencyKey(
  rowNumber
) {

  if (
    rowNumber === undefined ||
    rowNumber === null ||
    rowNumber === ""
  ) {

    rowNumber =
      CONFIG.MANUAL_TEST_ROW;

  }


  rowNumber =
    Number(
      rowNumber
    );


  validateManualRowNumber_(
    rowNumber
  );


  const sheet =
    getSourceSheet_();


  const customer =
    getCustomerFromRow_(
      sheet,
      rowNumber
    );


  const reminder =
    getManualReminderInfo_();


  const identity =
    createClientIdentity_(
      customer
    );


  Logger.log(
    "Client Identity: " +
    identity
  );


  Logger.log(
    "Manual WA Key: " +
    identity +
    "_" +
    reminder.date +
    "_MANUAL_WA"
  );


  Logger.log(
    "Manual Email Key: " +
    identity +
    "_" +
    reminder.date +
    "_MANUAL_EMAIL"
  );

}


/************************************************************
 * TEST AUTOMATIC SCHEDULE
 ************************************************************/

function testReminderSchedule() {

  const now =
    new Date();

  const timezone =
    Session.getScriptTimeZone() ||
    "Asia/Kolkata";


  const day =
    Number(
      Utilities.formatDate(
        now,
        timezone,
        "d"
      )
    );


  const hour =
    Number(
      Utilities.formatDate(
        now,
        timezone,
        "H"
      )
    );


  const minute =
    Number(
      Utilities.formatDate(
        now,
        timezone,
        "m"
      )
    );


  Logger.log(
    "========================================"
  );

  Logger.log(
    "SCHEDULE TEST"
  );

  Logger.log(
    "Timezone: " +
    timezone
  );

  Logger.log(
    "Date: " +
    Utilities.formatDate(
      now,
      timezone,
      "yyyy-MM-dd HH:mm:ss"
    )
  );

  Logger.log(
    "Day: " +
    day
  );

  Logger.log(
    "Hour: " +
    hour
  );

  Logger.log(
    "Minute: " +
    minute
  );


  const reminder =
    getCurrentReminderInfo_();


  if (!reminder) {

    Logger.log(
      "Result: NOT scheduled right now."
    );

  } else {

    Logger.log(
      "Result: Scheduled."
    );

    Logger.log(
      "Reminder: " +
      reminder.reminderNumber
    );

  }


  Logger.log(
    "========================================"
  );

}


/************************************************************
 * SETUP LOG SHEET
 ************************************************************/

function setupPaymentReminderLogSheet() {

  const ss =
    getSpreadsheet_();


  const sheet =
    getOrCreateLogSheet_(
      ss
    );


  Logger.log(
    "Log sheet ready: " +
    sheet.getName()
  );

}


/************************************************************
 * SETUP AUTOMATIC TRIGGER
 *
 * Deletes old triggers for this automation and creates
 * one daily trigger around 10 AM.
 ************************************************************/

function setupPaymentReminderAutomation() {

  const ss =
    getSpreadsheet_();

  const logSheet =
    getOrCreateLogSheet_(
      ss
    );

  const triggers =
    ScriptApp.getProjectTriggers();


  triggers.forEach(
    function(trigger) {

      if (
        trigger.getHandlerFunction() ===
        "paymentReminderAutomation"
      ) {

        ScriptApp.deleteTrigger(
          trigger
        );

      }

    }
  );


  ScriptApp
    .newTrigger(
      "paymentReminderAutomation"
    )
    .timeBased()
    .everyDays(1)
    .atHour(
      CONFIG.TRIGGER_HOUR
    )
    .create();


  Logger.log(
    "Payment reminder trigger created."
  );

  Logger.log(
    "Log sheet ready: " +
    logSheet.getName()
  );

  Logger.log(
    "It will run around " +
    CONFIG.TRIGGER_HOUR +
    ":00 AM."
  );

}


/************************************************************
 * CHECK TRIGGERS
 ************************************************************/

function checkPaymentReminderTriggers() {

  const triggers =
    ScriptApp.getProjectTriggers();


  let found =
    false;


  triggers.forEach(
    function(trigger) {

      Logger.log(
        "Function: " +
        trigger.getHandlerFunction() +
        " | Type: " +
        trigger.getEventType()
      );


      if (
        trigger.getHandlerFunction() ===
        "paymentReminderAutomation"
      ) {

        found =
          true;

      }

    }
  );


  if (!found) {

    Logger.log(
      "No paymentReminderAutomation trigger found."
    );

  }

}


/************************************************************
 * GET ERROR MESSAGE
 ************************************************************/

function getErrorMessage_(
  error
) {

  if (
    error &&
    error.message
  ) {

    return error.message;

  }


  return String(
    error || "Unknown error"
  );

}
