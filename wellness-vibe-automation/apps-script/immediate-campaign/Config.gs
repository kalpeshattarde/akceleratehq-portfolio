const CONFIG = Object.freeze({
  SHEETS: {
    CAMPAIGNS: 'Campaigns',
    RECIPIENTS: 'Campaign Recipients',
    JOBS: 'Campaign Jobs',
    LOGS: 'Execution Logs',
    SETTINGS: 'Settings'
  },
  JOB_STATUS: {
    QUEUED: 'QUEUED',
    PROCESSING: 'PROCESSING',
    SUBMITTED: 'SUBMITTED',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    SKIPPED: 'SKIPPED'
  },
  CHANNELS: {
    WHATSAPP: 'WHATSAPP',
    EMAIL: 'EMAIL'
  },
  DEFAULTS: {
    BATCH_SIZE: 100,
    MAX_RETRIES: 3,
    LEASE_MINUTES: 10,
    MAX_JOBS_PER_RUN: 100,
    TIMEZONE: 'Asia/Kolkata',
    EMAIL_MODE: 'INDIVIDUAL'
  }
});

function getConfig_() {
  const props = PropertiesService.getScriptProperties();
  return {
    combotApiUrl: props.getProperty('COMBOT_API_URL') || '',
    combotReportUrl: props.getProperty('COMBOT_REPORT_URL') || '',
    combotChannelId: props.getProperty('COMBOT_CHANNEL_ID') || '',
    combotApiToken: props.getProperty('COMBOT_API_TOKEN') || '',
    emailSenderName: props.getProperty('EMAIL_SENDER_NAME') || 'Wellness Vibe',
    emailReplyTo: props.getProperty('EMAIL_REPLY_TO') || '',
    timezone: props.getProperty('DEFAULT_TIMEZONE') || CONFIG.DEFAULTS.TIMEZONE
  };
}

function nowIso_() {
  return new Date().toISOString();
}

function uuid_() {
  return Utilities.getUuid();
}

function json_(value) {
  return JSON.stringify(value);
}

function parseJson_(value, fallback) {
  try { return JSON.parse(value); } catch (err) { return fallback; }
}

