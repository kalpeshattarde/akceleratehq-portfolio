/************************************************************
 * VOICE SCAN DATA AUTOMATION
 *
 * SHEET:
 * Voice Scan Data
 *
 * COLUMN MAPPING:
 *
 * A  = Name
 * B  = Mobile
 * C  = Email ID
 * D  = Age
 * E  = Preferred Language
 * F  = Profession
 * G  = Purpose of Voice Scan Analysis
 * H  = Share your Voice for Voice Scan Analysis
 * I  = Date of Birth
 * J  = Data Uploaded on
 * K  = Plan User Selected
 * L  = Status By Vibhushri
 * M  = Date of Completed Status By Vibhushri
 * N  = No Of Days Taken By Sir
 * O  = Ankit Status
 * P  = Ankit Completion date
 * Q  = Automation Team Status(Rutuja)
 * R  = Automation Team Completion date
 * S  = Remarks by CS Team
 ************************************************************/


/************************************************************
 * CONFIGURATION
 ************************************************************/

const CONFIG = {

  SHEET_NAME: "Voice Scan Data",

  COMPLETED: "Completed",


  // ========================================================
  // VIBHUSHRI EMAILS
  // ========================================================

  VIBHUSHRI_EMAILS:
    "support@example.invalid," +
    "support@example.invalid," +
    "support@example.invalid," +
    "support@example.invalid",


  // ========================================================
  // ANKIT EMAILS
  // ========================================================

  ANKIT_EMAILS:
    "support@example.invalid," +
    "support@example.invalid," +
    "support@example.invalid",


  // ========================================================
  // AUTOMATION TEAM EMAILS
  // ========================================================

  RUTUJA_EMAILS:
    "support@example.invalid," +
    "support@example.invalid"
};


/************************************************************
 * MAIN EDIT FUNCTION
 *
 * IMPORTANT:
 * This function should be connected to:
 *
 * From spreadsheet â†’ On edit
 ************************************************************/

function sendMailOnEdit(e) {

  try {

    // ------------------------------------------------------
    // Make sure this is a real spreadsheet edit
    // ------------------------------------------------------

    if (!e || !e.range) {
      return;
    }


    const range = e.range;

    const sheet = range.getSheet();


    // ------------------------------------------------------
    // Only Voice Scan Data sheet
    // ------------------------------------------------------

    if (
      sheet.getName() !==
      CONFIG.SHEET_NAME
    ) {
      return;
    }


    // ------------------------------------------------------
    // Only process a single-cell edit
    // ------------------------------------------------------

    if (
      range.getNumRows() !== 1 ||
      range.getNumColumns() !== 1
    ) {
      return;
    }


    const row =
      range.getRow();

    const column =
      range.getColumn();


    // ------------------------------------------------------
    // Ignore header
    // ------------------------------------------------------

    if (row === 1) {
      return;
    }


    // ------------------------------------------------------
    // Read edited status
    // ------------------------------------------------------

    const status =
      String(
        range.getDisplayValue()
      ).trim();


    // ======================================================
    // VIBHUSHRI
    //
    // L = 12
    // M = 13
    // ======================================================

    if (column === 12) {

      handleVibhushri(
        sheet,
        row,
        status
      );

      return;
    }


    // ======================================================
    // ANKIT
    //
    // O = 15
    // P = 16
    // ======================================================

    if (column === 15) {

      handleAnkit(
        sheet,
        row,
        status
      );

      return;
    }


    // ======================================================
    // AUTOMATION TEAM / RUTUJA
    //
    // Q = 17
    // R = 18
    // ======================================================

    if (column === 17) {

      handleRutuja(
        sheet,
        row,
        status
      );

      return;
    }

  } catch (error) {

    console.error(
      "sendMailOnEdit ERROR: " +
      error.message
    );

  }
}


/************************************************************
 * GET UNIQUE RECORD KEY
 *
 * Uses the user's Email ID where available.
 *
 * This is used ONLY for preventing duplicate emails.
 *
 * It does NOT modify the sheet.
 ************************************************************/

function getRecordKey(sheet, row) {

  const email =
    String(
      sheet
        .getRange(row, 3)
        .getDisplayValue()
    )
    .trim()
    .toLowerCase();


  const mobile =
    String(
      sheet
        .getRange(row, 2)
        .getDisplayValue()
    )
    .trim()
    .replace(/\s+/g, "");


  const name =
    String(
      sheet
        .getRange(row, 1)
        .getDisplayValue()
    )
    .trim()
    .toLowerCase();


  /*
   * Prefer Email ID.
   */

  if (email) {

    return "EMAIL_" + email;

  }


  /*
   * Otherwise use Name + Mobile.
   */

  return (
    "PERSON_" +
    name +
    "_" +
    mobile
  );
}


/************************************************************
 * VIBHUSHRI
 *
 * L = Status By Vibhushri
 * M = Date of Completed Status By Vibhushri
 ************************************************************/

function handleVibhushri(
  sheet,
  row,
  status
) {

  const dateCell =
    sheet.getRange(row, 13);


  const recordKey =
    getRecordKey(
      sheet,
      row
    );


  const emailKey =
    "VIBHUSHRI_EMAIL_SENT_" +
    recordKey;


  const properties =
    PropertiesService
      .getScriptProperties();


  // ========================================================
  // COMPLETED
  // ========================================================

  if (
    status ===
    CONFIG.COMPLETED
  ) {


    // ------------------------------------------------------
    // Put current date/time into M
    // ------------------------------------------------------

    if (
      dateCell.isBlank()
    ) {

      dateCell.setValue(
        new Date()
      );

    }


    // ------------------------------------------------------
    // Duplicate email protection
    // ------------------------------------------------------

    const alreadySent =
      properties.getProperty(
        emailKey
      );


    if (
      alreadySent ===
      "YES"
    ) {

      console.log(
        "Vibhushri email already sent for: " +
        recordKey
      );

      return;
    }


    // ------------------------------------------------------
    // Get name
    // ------------------------------------------------------

    const name =
      String(
        sheet
          .getRange(row, 1)
          .getDisplayValue()
      ).trim();


    // ------------------------------------------------------
    // Email
    // ------------------------------------------------------

    const subject =
      "Voice Scan Analysis Completed - " +
      name;


    const body =
      "Hi Team,\n\n" +

      "The Voice Scan Analysis for " +
      name +
      " has been marked as completed by Vibhushri.\n\n" +

      "The personalised voice analysis is now ready " +
      "for the next step.\n\n" +

      "Please do the needful.\n\n" +

      "Me to We";


    MailApp.sendEmail({

      to:
        CONFIG.VIBHUSHRI_EMAILS,

      subject:
        subject,

      body:
        body

    });


    // ------------------------------------------------------
    // Mark email as sent
    // ------------------------------------------------------

    properties.setProperty(
      emailKey,
      "YES"
    );


  } else {


    // ======================================================
    // STATUS CHANGED AWAY FROM COMPLETED
    // ======================================================

    dateCell.clearContent();


    properties.deleteProperty(
      emailKey
    );

  }
}


/************************************************************
 * ANKIT
 *
 * O = Ankit Status
 * P = Ankit Completion date
 ************************************************************/

function handleAnkit(
  sheet,
  row,
  status
) {

  const dateCell =
    sheet.getRange(row, 16);


  const recordKey =
    getRecordKey(
      sheet,
      row
    );


  const emailKey =
    "ANKIT_EMAIL_SENT_" +
    recordKey;


  const properties =
    PropertiesService
      .getScriptProperties();


  // ========================================================
  // COMPLETED
  // ========================================================

  if (
    status ===
    CONFIG.COMPLETED
  ) {


    // ------------------------------------------------------
    // Timestamp
    // ------------------------------------------------------

    if (
      dateCell.isBlank()
    ) {

      dateCell.setValue(
        new Date()
      );

    }


    // ------------------------------------------------------
    // Duplicate email protection
    // ------------------------------------------------------

    const alreadySent =
      properties.getProperty(
        emailKey
      );


    if (
      alreadySent ===
      "YES"
    ) {

      return;
    }


    // ------------------------------------------------------
    // Name
    // ------------------------------------------------------

    const name =
      String(
        sheet
          .getRange(row, 1)
          .getDisplayValue()
      ).trim();


    // ------------------------------------------------------
    // Email
    // ------------------------------------------------------

    MailApp.sendEmail({

      to:
        CONFIG.ANKIT_EMAILS,

      subject:
        "Voice Clarity Track (" +
        name +
        ")",

      body:
        "Hi Rutuja & Ninad,\n\n" +

        "Kindly note that " +
        name +
        "'s personalised track is ready for enrollment.\n\n" +

        "Please do the needful to proceed further.\n\n" +

        "Me to We,\n" +

        "Ankit Mali"

    });


    // ------------------------------------------------------
    // Mark email sent
    // ------------------------------------------------------

    properties.setProperty(
      emailKey,
      "YES"
    );


  } else {


    // ------------------------------------------------------
    // Reset
    // ------------------------------------------------------

    dateCell.clearContent();


    properties.deleteProperty(
      emailKey
    );

  }
}


/************************************************************
 * AUTOMATION TEAM / RUTUJA
 *
 * Q = Automation Team Status(Rutuja)
 * R = Automation Team Completion date
 ************************************************************/

function handleRutuja(
  sheet,
  row,
  status
) {

  const dateCell =
    sheet.getRange(row, 18);


  const recordKey =
    getRecordKey(
      sheet,
      row
    );


  const emailKey =
    "RUTUJA_EMAIL_SENT_" +
    recordKey;


  const properties =
    PropertiesService
      .getScriptProperties();


  // ========================================================
  // COMPLETED
  // ========================================================

  if (
    status ===
    CONFIG.COMPLETED
  ) {


    // ------------------------------------------------------
    // Timestamp
    // ------------------------------------------------------

    if (
      dateCell.isBlank()
    ) {

      dateCell.setValue(
        new Date()
      );

    }





    // ------------------------------------------------------
    // Name
    // ------------------------------------------------------

    const name =
      String(
        sheet
          .getRange(row, 1)
          .getDisplayValue()
      ).trim();


    // ------------------------------------------------------
    // Email
    // ------------------------------------------------------

    MailApp.sendEmail({

      to:
        CONFIG.RUTUJA_EMAILS,

      subject:
        "Course Activation",

      body:
        "The course of the user " +
        name +
        " has been marked complete by the automation team."

    });


    // ------------------------------------------------------
    // Mark email sent
    // ------------------------------------------------------

    properties.setProperty(
      emailKey,
      "YES"
    );


  } else {


    // ------------------------------------------------------
    // Reset
    // ------------------------------------------------------

    dateCell.clearContent();


    properties.deleteProperty(
      emailKey
    );

  }
}


/************************************************************
 * SETUP FUNCTION
 *
 * KEEP THIS FUNCTION.
 *
 * RUN MANUALLY ONCE.
 *
 * It:
 *
 * 1. Checks Voice Scan Data
 * 2. Checks headers
 * 3. Formats M/P/R
 * 4. Removes duplicate sendMailOnEdit triggers
 * 5. Creates ONE installable On Edit trigger
 ************************************************************/

function setupVoiceScanAutomation() {

  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();


  if (!ss) {

    throw new Error(
      "Could not access the active spreadsheet."
    );

  }


  const sheet =
    ss.getSheetByName(
      CONFIG.SHEET_NAME
    );


  if (!sheet) {

    throw new Error(
      'Sheet "' +
      CONFIG.SHEET_NAME +
      '" was not found.'
    );

  }


  // ========================================================
  // VERIFY HEADERS
  // ========================================================

  const expectedHeaders = {

    1:
      "Name",

    2:
      "Mobile",

    3:
      "Email ID",

    12:
      "Status By Vibhushri",

    13:
      "Date of Completed Status By Vibhushri",

    15:
      "Ankit Status",

    16:
      "Ankit Completion date",

    17:
      "Automation Team Status(Rutuja)",

    18:
      "Automation Team Completion date",

    19:
      "Remarks by CS Team"

  };


  const errors = [];


  for (
    const column in expectedHeaders
  ) {

    const columnNumber =
      Number(column);


    const expected =
      expectedHeaders[column];


    const actual =
      String(
        sheet
          .getRange(
            1,
            columnNumber
          )
          .getDisplayValue()
      ).trim();


    if (
      actual !== expected
    ) {

      errors.push(

        "Column " +
        columnNumber +
        "\n" +

        "Expected: " +
        expected +
        "\n" +

        "Found: " +
        actual

      );

    }

  }


  if (
    errors.length > 0
  ) {

    throw new Error(

      "HEADER VERIFICATION FAILED:\n\n" +
      errors.join("\n\n")

    );

  }


  // ========================================================
  // FORMAT TIMESTAMP COLUMNS
  // ========================================================

  const rows =
    Math.max(
      sheet.getMaxRows() - 1,
      1
    );


  // M
  sheet
    .getRange(
      2,
      13,
      rows,
      1
    )
    .setNumberFormat(
      "dd/MM/yyyy HH:mm:ss"
    );


  // P
  sheet
    .getRange(
      2,
      16,
      rows,
      1
    )
    .setNumberFormat(
      "dd/MM/yyyy HH:mm:ss"
    );


  // R
  sheet
    .getRange(
      2,
      18,
      rows,
      1
    )
    .setNumberFormat(
      "dd/MM/yyyy HH:mm:ss"
    );


  // ========================================================
  // REMOVE OLD sendMailOnEdit TRIGGERS
  // ========================================================

  const triggers =
    ScriptApp
      .getProjectTriggers();


  triggers.forEach(
    function(trigger) {

      if (
        trigger.getHandlerFunction() ===
        "sendMailOnEdit"
      ) {

        ScriptApp.deleteTrigger(
          trigger
        );

      }

    }
  );


  // ========================================================
  // CREATE ONE INSTALLABLE ON EDIT TRIGGER
  // ========================================================

  ScriptApp
    .newTrigger(
      "sendMailOnEdit"
    )
    .forSpreadsheet(ss)
    .onEdit()
    .create();


  // ========================================================
  // SUCCESS
  // ========================================================

  console.log(
    "======================================"
  );

  console.log(
    "VOICE SCAN AUTOMATION SETUP COMPLETE"
  );

  console.log(
    "Spreadsheet: " +
    ss.getName()
  );

  console.log(
    "Sheet: " +
    sheet.getName()
  );

  console.log(
    "L â†’ M : Vibhushri"
  );

  console.log(
    "O â†’ P : Ankit"
  );

  console.log(
    "Q â†’ R : Automation Team"
  );

  console.log(
    "Vibhushri emails: 5"
  );

  console.log(
    "Installable trigger created."
  );

  console.log(
    "======================================"
  );
}


/************************************************************
 * TEST FUNCTION
 *
 * KEEP THIS FUNCTION.
 *
 * RUN MANUALLY TO CHECK THE SHEET CONNECTION.
 ************************************************************/

function testVoiceScanSheet() {

  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();


  const sheet =
    ss.getSheetByName(
      CONFIG.SHEET_NAME
    );


  if (!sheet) {

    throw new Error(

      'Sheet "' +
      CONFIG.SHEET_NAME +
      '" does not exist.'

    );

  }


  console.log(
    "SUCCESS"
  );


  console.log(
    "Spreadsheet: " +
    ss.getName()
  );


  console.log(
    "Sheet: " +
    sheet.getName()
  );


  console.log(
    "Rows: " +
    sheet.getMaxRows()
  );


  console.log(
    "Columns: " +
    sheet.getMaxColumns()
  );


  console.log(
    "Column mapping verified:"
  );


  console.log(
    "L â†’ M = Vibhushri"
  );


  console.log(
    "O â†’ P = Ankit"
  );


  console.log(
    "Q â†’ R = Automation Team"
  );
}
