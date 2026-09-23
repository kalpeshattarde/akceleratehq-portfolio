/*******************************************************
 * PAYMENT TRACKER
 * FILE 1: Config.gs
 *******************************************************/

const CONFIG = {

  // ====================================================
  // SHEET NAMES
  // ====================================================

  MASTER_SHEET_NAME: 'Master',
  AUDIT_SHEET_NAME: 'Audit Log',
  ERROR_SHEET_NAME: 'Error Log',
  TEST_SHEET_NAME: 'Test Results',

  // ====================================================
  // PROGRAM CONFIGURATION
  // CHANGE PRICES/CODES HERE ONLY
  // ====================================================

  PROGRAMS: {

    'SIGNATURE MENTORING': {
      name: 'Signature Mentoring',
      code: 'SM',
      price: 299999
    },

    'ELITE MENTORING': {
      name: 'Elite Mentoring',
      code: 'EL',
      price: 499999
    }

  },

  // Backward-compatible lookup tables used by older code/tests.
  PROGRAM_PRICES: {
    'Signature Mentoring': 299999,
    'Elite Mentoring': 499999,
    'SIGNATURE MENTORING': 299999,
    'ELITE MENTORING': 499999
  },

  PROGRAM_CODES: {
    'Signature Mentoring': 'SM',
    'Elite Mentoring': 'EL',
    'SIGNATURE MENTORING': 'SM',
    'ELITE MENTORING': 'EL'
  },

  GST_RATE: 0.18,

  // ====================================================
  // PAYMENT ID
  // ====================================================

  PAYMENT_ID_PREFIX: 'PAY',
  MANUAL_PAYMENT_PREFIX: 'PAY',

  // ====================================================
  // CLIENT ID
  // ====================================================

  CLIENT_ID_PREFIX: 'WV',
  CLIENT_ID_DIGITS: 4,

  // ====================================================
  // PROCESSING STATUS
  // ====================================================

  SUCCESS_STATUS: 'SUCCESS',
  PENDING_STATUS: 'PENDING',
  ERROR_STATUS: 'ERROR',

  // Backward-compatible aliases used by Code.gs.
  STATUS_SUCCESS: 'SUCCESS',
  STATUS_PENDING: 'PENDING',
  STATUS_ERROR: 'ERROR',

  // ====================================================
  // PAYMENT STATUS VALUES
  // ====================================================

  PAYMENT_STATUS_PENDING: 'Pending',
  PAYMENT_STATUS_PARTIAL: 'Partially Paid',
  PAYMENT_STATUS_PAID: 'Paid',

  // ====================================================
  // SHEET HEADERS
  // DO NOT CHANGE ORDER
  // ====================================================

  MASTER_HEADERS: [
    'Mentorship Client Id',
    'Client Name',
    'Phone',
    'Email',
    'Enrollment Date',
    'Program Name',
    'DNA Warrior Access Status',
    'Graphy Access',
    'DGM Access Count',
    'Program Price',
    'Actual Selling Price',
    'Discount',
    'Program Price Excluding GST',
    'Agent Assigned',
    'Payment Method',
    'Payment Date',
    'Payment No',
    'Payment Amount',
    'Payment ID',
    'Total Amount Received',
    'Pending Amount',
    'Payment Status',
    'Latest Payment Date',
    'Total Days Since Last Payment',
    'Recent Amount Received',
    'Processing Status',
    'Processing Error'
  ],

  AUDIT_HEADERS: [
    'Timestamp',
    'User',
    'Action',
    'Client ID',
    'Payment ID',
    'Row',
    'Details'
  ],

  ERROR_HEADERS: [
    'Timestamp',
    'User',
    'Function',
    'Row',
    'Payment ID',
    'Error'
  ],

  TEST_HEADERS: [
    'Test',
    'Status',
    'Error',
    'Timestamp',
    'Duration (ms)'
  ],

  // ====================================================
  // COLUMN NUMBERS â€” 1 BASED
  // ====================================================

  COL: {
    CLIENT_ID: 1,
    CLIENT_NAME: 2,
    PHONE: 3,
    EMAIL: 4,
    ENROLLMENT_DATE: 5,
    PROGRAM_NAME: 6,
    DNA_STATUS: 7,
    GRAPHY_ACCESS: 8,
    DGM_ACCESS_COUNT: 9,
    PROGRAM_PRICE: 10,
    SELLING_PRICE: 11,
    DISCOUNT: 12,
    EX_GST: 13,
    AGENT: 14,
    PAYMENT_METHOD: 15,
    PAYMENT_DATE: 16,
    PAYMENT_NO: 17,
    PAYMENT_AMOUNT: 18,
    PAYMENT_ID: 19,
    TOTAL_RECEIVED: 20,
    PENDING_AMOUNT: 21,
    PAYMENT_STATUS: 22,
    LATEST_PAYMENT_DATE: 23,
    DAYS_SINCE_LAST_PAYMENT: 24,
    RECENT_AMOUNT: 25,
    PROCESSING_STATUS: 26,
    PROCESSING_ERROR: 27
  },

  MAX_PAYMENT_AMOUNT: +00 0000 0000,
  MAX_PAYMENT_NO: 1000,

  // ====================================================
  // AUTOMATION
  // ====================================================

  HOURLY_TRIGGER_FUNCTION: 'hourlyProcessPending',

  // ====================================================
  // FRONTEND
  // ====================================================

  FRONTEND_TITLE: 'Mentorship Payment Tracker'

};


/**
 * Normalize a program name to the canonical configuration key.
 */
function normalizeProgramName_(value) {

  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');

  if (
    normalized === 'SIGNATURE' ||
    normalized === 'SIGNATURE MENTORING'
  ) {
    return 'SIGNATURE MENTORING';
  }

  if (
    normalized === 'ELITE' ||
    normalized === 'ELITE MENTORING'
  ) {
    return 'ELITE MENTORING';
  }

  return normalized;
}


/**
 * Get program configuration.
 */
function getProgramConfig_(programName) {

  const key = normalizeProgramName_(programName);
  const program = CONFIG.PROGRAMS[key];

  if (!program) {
    throw new Error(
      'Unknown Program Name: ' +
      programName +
      '. Use Signature Mentoring or Elite Mentoring.'
    );
  }

  return program;
}

