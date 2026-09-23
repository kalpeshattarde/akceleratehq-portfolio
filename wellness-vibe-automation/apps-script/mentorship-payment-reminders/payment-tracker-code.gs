/*************************************************
 * PAYMENT TRACKER
 * MAIN SERVER-SIDE CODE
 *************************************************/


/**
 * ================================
 * FRONTEND
 * ================================
 */

function doGet() {

  assertAuthorized_();

  return HtmlService
    .createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Wellness Vibe Payment Tracker')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


/**
 * ================================
 * SETUP SYSTEM
 * ================================
 *
 * Run this ONCE manually.
 *
 * It will:
 * - create Master
 * - create Audit Log
 * - create Error Log
 * - create headers
 * - create hourly trigger
 */

function setupSystem() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!ss) {
    throw new Error('Spreadsheet not found.');
  }

  // Master
  const master = getOrCreateSheet_(CONFIG.MASTER_SHEET_NAME);

  setupMasterSheet_(master);


  // Audit Log
  const audit = getOrCreateSheet_(CONFIG.AUDIT_SHEET_NAME);

  setupAuditSheet_(audit);


  // Error Log
  const errorLog = getOrCreateSheet_(CONFIG.ERROR_SHEET_NAME);

  setupErrorSheet_(errorLog);


  // Hourly trigger
  createHourlyTrigger_();


  SpreadsheetApp.flush();

  return {
    success: true,
    message: 'Payment Tracker system setup completed.'
  };
}


/**
 * ================================
 * CREATE / GET SHEET
 * ================================
 */

function getOrCreateSheet_(name) {

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  return sheet;
}


/**
 * ================================
 * MASTER SETUP
 * ================================
 */

function setupMasterSheet_(sheet) {

  const headers = CONFIG.MASTER_HEADERS;

  if (sheet.getMaxColumns() < headers.length) {

    sheet.insertColumnsAfter(
      sheet.getMaxColumns(),
      headers.length - sheet.getMaxColumns()
    );
  }

  sheet
    .getRange(1, 1, 1, headers.length)
    .setValues([headers]);

  sheet
    .getRange(1, 1, 1, headers.length)
    .setFontWeight('bold');

  sheet.setFrozenRows(1);

  sheet.autoResizeColumns(1, headers.length);

  formatMasterSheet_(sheet);
}


/**
 * ================================
 * MASTER FORMATTING
 * ================================
 */

function formatMasterSheet_(sheet) {

  const rows = Math.max(sheet.getMaxRows() - 1, 1);

  sheet.getRange(2, 5, rows, 1).setNumberFormat('dd/MM/yyyy');
  sheet.getRange(2, 10, rows, 3).setNumberFormat('#,##0.00');
  sheet.getRange(2, 16, rows, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  sheet.getRange(2, 18, rows, 1).setNumberFormat('#,##0.00');
  sheet.getRange(2, 20, rows, 2).setNumberFormat('#,##0.00');
  sheet.getRange(2, 23, rows, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  sheet.getRange(2, 24, rows, 1).setNumberFormat('0');
  sheet.getRange(2, 25, rows, 1).setNumberFormat('#,##0.00');
}


/**
 * ================================
 * AUDIT LOG SETUP
 * ================================
 */

function setupAuditSheet_(sheet) {

  const headers = [
    'Timestamp',
    'User',
    'Action',
    'Client ID',
    'Payment ID',
    'Row',
    'Details'
  ];

  sheet
    .getRange(1, 1, 1, headers.length)
    .setValues([headers]);

  sheet
    .getRange(1, 1, 1, headers.length)
    .setFontWeight('bold');

  sheet.setFrozenRows(1);
}


/**
 * ================================
 * ERROR LOG SETUP
 * ================================
 */

function setupErrorSheet_(sheet) {

  const headers = [
    'Timestamp',
    'User',
    'Function',
    'Row',
    'Payment ID',
    'Error'
  ];

  sheet
    .getRange(1, 1, 1, headers.length)
    .setValues([headers]);

  sheet
    .getRange(1, 1, 1, headers.length)
    .setFontWeight('bold');

  sheet.setFrozenRows(1);
}


/**
 * ================================
 * HOURLY TRIGGER
 * ================================
 */

function createHourlyTrigger_() {

  const triggers = ScriptApp.getProjectTriggers();

  triggers.forEach(trigger => {

    if (trigger.getHandlerFunction() === 'hourlyProcessPending') {

      ScriptApp.deleteTrigger(trigger);
    }
  });


  ScriptApp
    .newTrigger('hourlyProcessPending')
    .timeBased()
    .everyHours(1)
    .create();
}


/**
 * ================================
 * HOURLY PROCESSOR
 * ================================
 */

function hourlyProcessPending() {

  try {

    processPendingRows_();

  } catch (error) {

    logError_(
      'hourlyProcessPending',
      '',
      '',
      error
    );

    throw error;
  }
}


/**
 * ================================
 * FRONTEND MANUAL PROCESS
 * ================================
 */

function processPendingFromFrontend() {

  assertAuthorized_();

  return processPendingRows_();
}


/**
 * ================================
 * PROCESS PENDING ROWS
 * ================================
 */

function processPendingRows_() {

  const lock = LockService.getScriptLock();

  lock.waitLock(30000);

  try {

    const sheet = getMasterSheet_();

    const lastRow = sheet.getLastRow();

    if (lastRow < 2) {

      return {
        success: true,
        processed: 0,
        successCount: 0,
        errorCount: 0,
        pendingCount: 0,
        message: 'No payment records found.'
      };
    }


    const data = sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        CONFIG.MASTER_HEADERS.length
      )
      .getValues();


    let processed = 0;
    let successCount = 0;
    let errorCount = 0;


    for (let i = 0; i < data.length; i++) {

      const rowNumber = i + 2;
      const row = data[i];

      const processingStatus = normalize_(row[25]);


      // Only process blank or PENDING
      if (
        processingStatus !== '' &&
        processingStatus !== CONFIG.STATUS_PENDING
      ) {
        continue;
      }


      processed++;


      try {

        processSingleRow_(
          sheet,
          rowNumber
        );

        successCount++;


      } catch (error) {

        errorCount++;

        markRowError_(
          sheet,
          rowNumber,
          error
        );
      }
    }


    return {

      success: true,

      processed: processed,

      successCount: successCount,

      errorCount: errorCount,

      pendingCount: getPendingCount_(),

      message:
        processed === 0
          ? 'No pending payments.'
          : `${successCount} payment(s) processed. ${errorCount} error(s).`
    };


  } finally {

    lock.releaseLock();
  }
}


/**
 * ================================
 * PROCESS ONE ROW
 * ================================
 */

function processSingleRow_(sheet, rowNumber) {

  const rowRange = sheet.getRange(
    rowNumber,
    1,
    1,
    CONFIG.MASTER_HEADERS.length
  );

  const row = rowRange.getValues()[0];


  // =========================================
  // READ INPUT
  // =========================================

  let clientId = normalize_(row[0]);

  let clientName = normalize_(row[1]);

  let phone = normalizePhone_(row[2]);

  let email = normalizeEmail_(row[3]);

  let enrollmentDate = row[4];

  let programName = normalize_(row[5]);

  if (programName) {
    programName = getProgramConfig_(programName).name;
  }

  let dnaStatus = normalize_(row[6]);

  let graphyAccess = normalize_(row[7]);

  let dgmAccessCount = row[8];

  let actualSellingPrice = toNumber_(row[10]);

  let discount = toNumber_(row[11]);

  let agentAssigned = normalize_(row[13]);

  let paymentMethod = normalize_(row[14]);

  let paymentDate = row[15];

  let paymentNo = toNumber_(row[16]);

  let paymentAmount = toNumber_(row[17]);

  let paymentId = normalize_(row[18]);


  // =========================================
  // VALIDATION
  // =========================================

  if (!clientName) {
    throw new Error('Client Name is required.');
  }

  if (!programName) {
    throw new Error('Program Name is required.');
  }

  try {
    getProgramConfig_(programName);
  } catch (error) {
    throw new Error(error.message);
  }


  if (!email && !phone && !clientId) {

    throw new Error(
      'At least one identifier is required: Client ID, Email or Phone.'
    );
  }


  if (!paymentDate) {

    throw new Error(
      'Payment Date is required.'
    );
  }


  if (!paymentAmount || paymentAmount <= 0) {

    throw new Error(
      'Payment Amount must be greater than 0.'
    );
  }


  if (!actualSellingPrice || actualSellingPrice <= 0) {

    throw new Error(
      'Actual Selling Price is required.'
    );
  }


  if (!paymentMethod) {

    throw new Error(
      'Payment Method is required.'
    );
  }


  // =========================================
  // GENERATE PAYMENT ID IF MANUAL
  // =========================================

  if (!paymentId) {

    paymentId = generateManualPaymentId_();

    sheet
      .getRange(rowNumber, 19)
      .setValue(paymentId);
  }


  // =========================================
  // DUPLICATE PAYMENT ID CHECK
  // =========================================

  if (
    paymentIdExists_(
      paymentId,
      rowNumber
    )
  ) {

    throw new Error(
      `Duplicate Payment ID detected: ${paymentId}`
    );
  }


  // =========================================
  // FIND EXISTING CLIENT
  // =========================================

  const clientMatch = findClientForProcessing_(
    sheet,
    clientId,
    email,
    phone,
    rowNumber
  );


  if (clientMatch) {

    clientId = clientMatch.clientId;

  } else {

    // New client
    clientId = generateClientId_(
      sheet,
      programName,
      paymentDate || enrollmentDate
    );
  }


  // =========================================
  // ENROLLMENT DATE
  // =========================================

  if (!enrollmentDate) {

    enrollmentDate = paymentDate;

    sheet
      .getRange(rowNumber, 5)
      .setValue(enrollmentDate);
  }


  // =========================================
  // PROGRAM PRICE
  // =========================================

  const programPrice =
    getProgramConfig_(programName).price;


  sheet
    .getRange(rowNumber, 10)
    .setValue(programPrice);


  // =========================================
  // CLIENT ID
  // =========================================

  sheet
    .getRange(rowNumber, 1)
    .setValue(clientId);


  // =========================================
  // PAYMENT NUMBER
  // =========================================

  if (!paymentNo || paymentNo <= 0) {

    paymentNo = getNextPaymentNumber_(
      sheet,
      clientId,
      rowNumber
    );

    sheet
      .getRange(rowNumber, 17)
      .setValue(paymentNo);
  }


  // =========================================
  // UPDATE FORMULAS
  // =========================================

  setCalculationFormulas_(
    sheet,
    rowNumber
  );

  // Keep dates/numbers displayed correctly on every processed row.
  formatMasterRow_(sheet, rowNumber);


  // =========================================
  // PROCESSING STATUS
  // =========================================

  sheet
    .getRange(rowNumber, 26)
    .setValue(CONFIG.STATUS_SUCCESS);


  sheet
    .getRange(rowNumber, 27)
    .clearContent();


  // =========================================
  // AUDIT
  // =========================================

  writeAuditLog_(
    'PAYMENT_PROCESSED',
    clientId,
    paymentId,
    rowNumber,
    `Payment No ${paymentNo}, Amount ${paymentAmount}`
  );


  SpreadsheetApp.flush();
}


function formatMasterRow_(sheet, rowNumber) {

  sheet.getRange(rowNumber, 5).setNumberFormat('dd/MM/yyyy');
  sheet.getRange(rowNumber, 10, 1, 3).setNumberFormat('#,##0.00');
  sheet.getRange(rowNumber, 16).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  sheet.getRange(rowNumber, 18).setNumberFormat('#,##0.00');
  sheet.getRange(rowNumber, 20, 1, 2).setNumberFormat('#,##0.00');
  sheet.getRange(rowNumber, 23).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  sheet.getRange(rowNumber, 24).setNumberFormat('0');
  sheet.getRange(rowNumber, 25).setNumberFormat('#,##0.00');
}


/**
 * ================================
 * CALCULATION FORMULAS
 * ================================
 */

function setCalculationFormulas_(sheet, rowNumber) {

  const r = rowNumber;


  // T = Total Amount Received
  sheet
    .getRange(r, 20)
    .setFormula(
      `=IF(A${r}="","",SUMIF($A$2:$A,A${r},$R$2:$R))`
    );


  // U = Pending Amount
  sheet
    .getRange(r, 21)
    .setFormula(
      `=IF(K${r}="","",K${r}-T${r})`
    );


  // V = Payment Status
  sheet
    .getRange(r, 22)
    .setFormula(
      `=IF(K${r}="","",IF(U${r}<=0,"Paid","Partially Paid"))`
    );


  // W = Latest Payment Date
  sheet
    .getRange(r, 23)
    .setFormula(
      `=IF(A${r}="","",MAXIFS($P$2:$P,$A$2:$A,A${r}))`
    );


  // X = Days Since Last Payment
  sheet
    .getRange(r, 24)
    .setFormula(
      `=IF(W${r}="","",TODAY()-W${r})`
    );


  // Y = Recent Amount Received
  sheet
    .getRange(r, 25)
    .setFormula(
      `=IFERROR(INDEX(FILTER($R$2:$R,$A$2:$A=A${r},$P$2:$P=W${r}),1),"")`
    );


  // M = Program Price Excluding GST
  sheet
    .getRange(r, 13)
    .setFormula(
      `=IF(K${r}="","",K${r}/(1+${CONFIG.GST_RATE}))`
    );
}


/**
 * ================================
 * FIND CLIENT
 * ================================
 */

function findClientForProcessing_(
  sheet,
  clientId,
  email,
  phone,
  currentRow
) {

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return null;
  }


  const data = sheet
    .getRange(
      2,
      1,
      lastRow - 1,
      19
    )
    .getValues();


  const matches = [];


  for (let i = 0; i < data.length; i++) {

    const rowNumber = i + 2;

    if (rowNumber === currentRow) {
      continue;
    }


    const rowClientId = normalize_(data[i][0]);
    const rowEmail = normalizeEmail_(data[i][3]);
    const rowPhone = normalizePhone_(data[i][2]);


    let matched = false;


    if (
      clientId &&
      rowClientId === clientId
    ) {
      matched = true;
    }


    if (
      !matched &&
      email &&
      rowEmail === email
    ) {
      matched = true;
    }


    if (
      !matched &&
      phone &&
      rowPhone === phone
    ) {
      matched = true;
    }


    if (matched) {

      matches.push({
        clientId: rowClientId,
        row: rowNumber
      });
    }
  }


  if (matches.length === 0) {
    return null;
  }


  const uniqueClientIds = [
    ...new Set(
      matches
        .map(x => x.clientId)
        .filter(Boolean)
    )
  ];


  if (uniqueClientIds.length > 1) {

    throw new Error(
      'The supplied email/phone matches multiple Client IDs. ' +
      'Please use the correct Mentorship Client Id.'
    );
  }


  return {
    clientId: uniqueClientIds[0]
  };
}


/**
 * ================================
 * SEARCH CLIENT
 * ================================
 */

function searchClient(identifier, searchType) {

  assertAuthorized_();


  identifier = normalize_(identifier);


  if (!identifier) {

    throw new Error(
      'Please enter Client ID, Email or Phone.'
    );
  }


  const sheet = getMasterSheet_();

  const lastRow = sheet.getLastRow();


  if (lastRow < 2) {

    return {
      found: false,
      clients: []
    };
  }


  const data = sheet
    .getRange(
      2,
      1,
      lastRow - 1,
      CONFIG.MASTER_HEADERS.length
    )
    .getValues();


  const normalizedSearch =
    searchType === 'email'
      ? normalizeEmail_(identifier)
      : searchType === 'phone'
        ? normalizePhone_(identifier)
        : identifier.toLowerCase();


  const matchedRows = [];


  for (let i = 0; i < data.length; i++) {

    const row = data[i];


    const rowClientId =
      normalize_(row[0]).toLowerCase();

    const rowEmail =
      normalizeEmail_(row[3]);

    const rowPhone =
      normalizePhone_(row[2]);


    let matched = false;


    if (searchType === 'clientId') {

      matched =
        rowClientId === normalizedSearch;
    }


    else if (searchType === 'email') {

      matched =
        rowEmail === normalizedSearch;
    }


    else if (searchType === 'phone') {

      matched =
        rowPhone === normalizedSearch;
    }


    else {

      // AUTO DETECT

      matched =
        rowClientId === normalizedSearch ||
        rowEmail === normalizedSearch ||
        rowPhone === normalizedSearch;
    }


    if (matched) {

      matchedRows.push({
        rowNumber: i + 2,
        data: row
      });
    }
  }


  if (matchedRows.length === 0) {

    return {
      found: false,
      clients: []
    };
  }


  // Group by Client ID

  const groups = {};


  matchedRows.forEach(item => {

    const clientId =
      normalize_(item.data[0]) ||
      `ROW-${item.rowNumber}`;


    if (!groups[clientId]) {
      groups[clientId] = [];
    }


    groups[clientId].push(item);
  });


  const clients = Object.keys(groups).map(
    clientId =>
      buildClientResponse_(
        clientId,
        groups[clientId]
      )
  );


  return {
    found: true,
    clients: clients
  };
}


/**
 * ================================
 * BUILD CLIENT RESPONSE
 * ================================
 */

function buildClientResponse_(
  clientId,
  matchedRows
) {

  const first = matchedRows[0].data;


  const history = matchedRows
    .map(item => item.data)
    .sort((a, b) => {

      const pa = toNumber_(a[16]);
      const pb = toNumber_(b[16]);

      return pa - pb;
    })
    .map(row => ({

      clientId: row[0],
      clientName: row[1],
      phone: row[2],
      email: row[3],

      enrollmentDate:
        formatDateForFrontend_(row[4]),

      programName: row[5],

      dnaWarriorAccessStatus: row[6],

      graphyAccess: row[7],

      dgmAccessCount: row[8],

      programPrice: row[9],

      actualSellingPrice: row[10],

      discount: row[11],

      programPriceExcludingGST: row[12],

      agentAssigned: row[13],

      paymentMethod: row[14],

      paymentDate:
        formatDateForFrontend_(row[15]),

      paymentNo: row[16],

      paymentAmount: row[17],

      paymentId: row[18],

      totalAmountReceived: row[19],

      pendingAmount: row[20],

      paymentStatus: row[21],

      latestPaymentDate:
        formatDateForFrontend_(row[22]),

      totalDaysSinceLastPayment: row[23],

      recentAmountReceived: row[24],

      processingStatus: row[25],

      processingError: row[26]
    }));


  return {

    clientId: clientId,

    clientName: first[1],

    phone: first[2],

    email: first[3],

    enrollmentDate:
      formatDateForFrontend_(first[4]),

    programName: first[5],

    dnaWarriorAccessStatus: first[6],

    graphyAccess: first[7],

    dgmAccessCount: first[8],

    programPrice: first[9],

    actualSellingPrice: first[10],

    discount: first[11],

    programPriceExcludingGST: first[12],

    agentAssigned: first[13],

    history: history
  };
}


/**
 * ================================
 * SAVE MANUAL PAYMENT
 * ================================
 */

function saveManualPayment(form) {

  assertAuthorized_();


  const lock = LockService.getScriptLock();

  lock.waitLock(30000);


  try {

    const sheet = getMasterSheet_();


    const clientId =
      normalize_(form.clientId);

    const clientName =
      normalize_(form.clientName);

    const phone =
      normalizePhone_(form.phone);

    const email =
      normalizeEmail_(form.email);

    const enrollmentDate =
      parseDate_(form.enrollmentDate);

    let programName =
      normalize_(form.programName);

    if (programName) {
      programName = getProgramConfig_(programName).name;
    }

    const dnaStatus =
      normalize_(form.dnaWarriorAccessStatus);

    const graphyAccess =
      normalize_(form.graphyAccess);

    const dgmAccessCount =
      form.dgmAccessCount === ''
        ? ''
        : Number(form.dgmAccessCount);

    const actualSellingPrice =
      Number(form.actualSellingPrice);

    const discount =
      form.discount === ''
        ? 0
        : Number(form.discount);

    const agentAssigned =
      normalize_(form.agentAssigned);

    const paymentMethod =
      normalize_(form.paymentMethod);

    const paymentDate =
      parseDate_(form.paymentDate);

    const paymentAmount =
      Number(form.paymentAmount);

    let paymentId =
      normalize_(form.paymentId);


    if (!clientName) {
      throw new Error('Client Name is required.');
    }


    if (!programName) {
      throw new Error('Program Name is required.');
    }


    try {
      getProgramConfig_(programName);
    } catch (error) {
      throw new Error(error.message);
    }


    if (
      !actualSellingPrice ||
      actualSellingPrice <= 0
    ) {
      throw new Error(
        'Actual Selling Price is required.'
      );
    }


    if (
      !paymentAmount ||
      paymentAmount <= 0
    ) {
      throw new Error(
        'Payment Amount must be greater than 0.'
      );
    }


    if (!paymentDate) {
      throw new Error(
        'Payment Date is required.'
      );
    }


    if (!paymentMethod) {
      throw new Error(
        'Payment Method is required.'
      );
    }


    if (!paymentId) {
      paymentId = generateManualPaymentId_();
    }


    if (paymentIdExists_(paymentId, null)) {

      throw new Error(
        `Payment ID already exists: ${paymentId}`
      );
    }


    // Determine client

    let finalClientId = clientId;


    if (!finalClientId) {

      const match =
        findClientForProcessing_(
          sheet,
          '',
          email,
          phone,
          null
        );


      if (match) {

        finalClientId =
          match.clientId;

      } else {

        finalClientId =
          generateClientId_(
            sheet,
            programName,
            paymentDate
          );
      }
    }


    if (!finalClientId) {

      finalClientId =
        generateClientId_(
          sheet,
          programName,
          paymentDate
        );
    }


    const paymentNo =
      getNextPaymentNumber_(
        sheet,
        finalClientId,
        null
      );


    const rowNumber =
      sheet.getLastRow() + 1;


    const programPrice =
      getProgramConfig_(programName).price;


    const values = [

      finalClientId,

      clientName,

      phone,

      email,

      enrollmentDate,

      programName,

      dnaStatus,

      graphyAccess,

      dgmAccessCount,

      programPrice,

      actualSellingPrice,

      discount,

      '',

      agentAssigned,

      paymentMethod,

      paymentDate,

      paymentNo,

      paymentAmount,

      paymentId,

      '',

      '',

      '',

      '',

      '',

      '',

      CONFIG.STATUS_SUCCESS,

      ''
    ];


    sheet
      .getRange(
        rowNumber,
        1,
        1,
        values.length
      )
      .setValues([values]);


    setCalculationFormulas_(
      sheet,
      rowNumber
    );


    writeAuditLog_(
      'MANUAL_PAYMENT_ADDED',
      finalClientId,
      paymentId,
      rowNumber,
      `Payment No ${paymentNo}, Amount ${paymentAmount}`
    );


    SpreadsheetApp.flush();


    return {

      success: true,

      clientId: finalClientId,

      paymentId: paymentId,

      paymentNo: paymentNo,

      rowNumber: rowNumber,

      message:
        'Payment added successfully.'
    };


  } finally {

    lock.releaseLock();
  }
}


/**
 * ================================
 * PAYMENT ID DUPLICATE CHECK
 * ================================
 */

function paymentIdExists_(
  paymentId,
  excludeRow
) {

  const normalizedId =
    normalize_(paymentId).toLowerCase();


  if (!normalizedId) {
    return false;
  }


  const sheet = getMasterSheet_();

  const lastRow = sheet.getLastRow();


  if (lastRow < 2) {
    return false;
  }


  const ids =
    sheet
      .getRange(
        2,
        19,
        lastRow - 1,
        1
      )
      .getValues();


  for (let i = 0; i < ids.length; i++) {

    const rowNumber = i + 2;


    if (
      excludeRow &&
      rowNumber === excludeRow
    ) {
      continue;
    }


    const existing =
      normalize_(ids[i][0])
        .toLowerCase();


    if (
      existing &&
      existing === normalizedId
    ) {
      return true;
    }
  }


  return false;
}


/**
 * ================================
 * PAYMENT NUMBER
 * ================================
 */

function getNextPaymentNumber_(
  sheet,
  clientId,
  excludeRow
) {

  const lastRow = sheet.getLastRow();


  if (lastRow < 2) {
    return 1;
  }


  const data =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        17
      )
      .getValues();


  let maxPaymentNo = 0;


  for (let i = 0; i < data.length; i++) {

    const rowNumber = i + 2;


    if (
      excludeRow &&
      rowNumber === excludeRow
    ) {
      continue;
    }


    const existingClientId =
      normalize_(data[i][0]);


    if (
      existingClientId === clientId
    ) {

      const number =
        toNumber_(data[i][16]);


      if (number > maxPaymentNo) {
        maxPaymentNo = number;
      }
    }
  }


  return maxPaymentNo + 1;
}


/**
 * ================================
 * CLIENT ID GENERATION
 * ================================
 */

function generateClientId_(
  sheet,
  programName,
  dateValue
) {

  const programConfig =
    getProgramConfig_(programName);

  const programCode =
    programConfig.code;


  if (!programCode) {

    throw new Error(
      `No Client ID code configured for ${programName}`
    );
  }


  const date =
    dateValue
      ? new Date(dateValue)
      : new Date();


  const year =
    String(
      date.getFullYear()
    ).slice(-2);


  const prefix =
    `${CONFIG.CLIENT_ID_PREFIX}-${programCode}-${year}-`;


  const lastRow =
    sheet.getLastRow();


  let maxNumber = 0;


  if (lastRow >= 2) {

    const ids =
      sheet
        .getRange(
          2,
          1,
          lastRow - 1,
          1
        )
        .getValues();


    ids.forEach(item => {

      const id =
        normalize_(item[0]);


      if (
        id.startsWith(prefix)
      ) {

        const number =
          parseInt(
            id.substring(prefix.length),
            10
          );


        if (
          !isNaN(number) &&
          number > maxNumber
        ) {
          maxNumber = number;
        }
      }
    });
  }


  const next =
    maxNumber + 1;


  return (
    prefix +
    String(next)
      .padStart(
        CONFIG.CLIENT_ID_DIGITS,
        '0'
      )
  );
}


/**
 * ================================
 * MANUAL PAYMENT ID
 * ================================
 */

function generateManualPaymentId_() {

  const year =
    String(
      new Date().getFullYear()
    ).slice(-2);


  const randomPart =
    Utilities
      .getUuid()
      .replace(/-/g, '')
      .substring(0, 8)
      .toUpperCase();


  return `${CONFIG.MANUAL_PAYMENT_PREFIX}-${year}-${randomPart}`;
}


/**
 * ================================
 * ERROR HANDLING
 * ================================
 */

function markRowError_(
  sheet,
  rowNumber,
  error
) {

  const message =
    error && error.message
      ? error.message
      : String(error);


  sheet
    .getRange(rowNumber, 26)
    .setValue(CONFIG.STATUS_ERROR);


  sheet
    .getRange(rowNumber, 27)
    .setValue(message);


  const row =
    sheet
      .getRange(
        rowNumber,
        1,
        1,
        19
      )
      .getValues()[0];


  logError_(
    'processSingleRow_',
    rowNumber,
    row[18],
    error
  );


  writeAuditLog_(
    'PAYMENT_PROCESSING_ERROR',
    row[0],
    row[18],
    rowNumber,
    message
  );
}


/**
 * ================================
 * ERROR LOG
 * ================================
 */

function logError_(
  functionName,
  rowNumber,
  paymentId,
  error
) {

  const sheet =
    getOrCreateSheet_(
      CONFIG.ERROR_SHEET_NAME
    );


  const user =
    getCurrentUserEmail_();


  sheet.appendRow([

    new Date(),

    user,

    functionName,

    rowNumber,

    paymentId,

    error && error.message
      ? error.message
      : String(error)
  ]);
}


/**
 * ================================
 * AUDIT LOG
 * ================================
 */

function writeAuditLog_(
  action,
  clientId,
  paymentId,
  rowNumber,
  details
) {

  const sheet =
    getOrCreateSheet_(
      CONFIG.AUDIT_SHEET_NAME
    );


  sheet.appendRow([

    new Date(),

    getCurrentUserEmail_(),

    action,

    clientId,

    paymentId,

    rowNumber,

    details
  ]);
}


/**
 * ================================
 * PENDING COUNT
 * ================================
 */

function getPendingCount_() {

  const sheet =
    getMasterSheet_();


  const lastRow =
    sheet.getLastRow();


  if (lastRow < 2) {
    return 0;
  }


  const statuses =
    sheet
      .getRange(
        2,
        26,
        lastRow - 1,
        1
      )
      .getValues();


  return statuses.filter(
    row => {

      const status =
        normalize_(row[0]);


      return (
        status === '' ||
        status === CONFIG.STATUS_PENDING
      );
    }
  ).length;
}


/**
 * ================================
 * FRONTEND STATUS
 * ================================
 */

function getSystemStatus() {

  assertAuthorized_();


  const sheet =
    getMasterSheet_();


  return {

    totalRows:
      Math.max(
        0,
        sheet.getLastRow() - 1
      ),

    pending:
      getPendingCount_(),

    lastUpdated:
      new Date().toISOString()
  };
}


/**
 * ================================
 * AUTHORIZATION
 * ================================
 */

function assertAuthorized_() {

  const allowed =
    CONFIG.ALLOWED_EMAILS || [];


  const email =
    getCurrentUserEmail_();


  if (
    allowed.length === 0
  ) {

    if (!email) {

      throw new Error(
        'Google account could not be identified. Please sign in with your authorized Google account.'
      );
    }


    return true;
  }


  if (
    !allowed
      .map(x => x.toLowerCase())
      .includes(email.toLowerCase())
  ) {

    throw new Error(
      `Access denied for ${email || 'unknown user'}.`
    );
  }


  return true;
}


/**
 * ================================
 * CURRENT USER
 * ================================
 */

function getCurrentUserEmail_() {

  try {

    return (
      Session
        .getActiveUser()
        .getEmail() ||
      ''
    );

  } catch (error) {

    return '';
  }
}


/**
 * ================================
 * MASTER SHEET
 * ================================
 */

function getMasterSheet_() {

  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        CONFIG.MASTER_SHEET_NAME
      );


  if (!sheet) {

    throw new Error(
      `Sheet "${CONFIG.MASTER_SHEET_NAME}" not found. Run setupSystem().`
    );
  }


  return sheet;
}


/**
 * ================================
 * UTILITIES
 * ================================
 */

function normalize_(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }


  return String(value)
    .trim();
}


function normalizeEmail_(value) {

  return normalize_(value)
    .toLowerCase();
}


function normalizePhone_(value) {

  return normalize_(value)
    .replace(/\D/g, '')
    .replace(/^91(?=\d{10}$)/, '');
}


function toNumber_(value) {

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 0;
  }


  if (typeof value === 'number') {
    return value;
  }


  const cleaned =
    String(value)
      .replace(/,/g, '')
      .replace(/[â‚¹$]/g, '')
      .trim();


  const number =
    Number(cleaned);


  return isNaN(number)
    ? 0
    : number;
}


function parseDate_(value) {

  if (!value) {
    return '';
  }


  if (
    Object.prototype.toString.call(value) ===
    '[object Date]'
  ) {

    return value;
  }


  const date =
    new Date(value);


  if (isNaN(date.getTime())) {

    throw new Error(
      `Invalid date: ${value}`
    );
  }


  return date;
}


function formatDateForFrontend_(value) {

  if (!value) {
    return '';
  }


  const date =
    new Date(value);


  if (isNaN(date.getTime())) {
    return value;
  }


  return Utilities
    .formatDate(
      date,
      Session.getScriptTimeZone(),
      'dd/MM/yyyy'
    );
}


/**
 * ================================
 * CUSTOM MENU
 * ================================
 */

function onOpen() {

  SpreadsheetApp
    .getUi()
    .createMenu('Payment Tracker')
    .addItem(
      'Process Pending Payments',
      'processPendingRows_'
    )
    .addItem(
      'Setup / Repair System',
      'setupSystem'
    )
    .addToUi();
}
