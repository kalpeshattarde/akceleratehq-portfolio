function setupCampaignSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const definitions = {
    [CONFIG.SHEETS.CAMPAIGNS]: [
      'campaign_id','request_id','campaign_name','campaign_type','reminder_type','session_date','session_time','timezone','status','dry_run','total_recipients','subject','template_name','language_code','joining_link','passcode','duration','created_at','started_at','completed_at','last_error'
    ],
    [CONFIG.SHEETS.RECIPIENTS]: [
      'snapshot_id','campaign_id','recipient_id','name','phone','email','whatsapp_opt_in','email_opt_in','eligible','template_variables','created_at'
    ],
    [CONFIG.SHEETS.JOBS]: [
      'job_id','campaign_id','snapshot_id','recipient_id','channel','sending_mode','status','idempotency_key','attempts','claimed_at','lease_token','provider_reference','last_error','created_at','updated_at','completed_at'
    ],
    [CONFIG.SHEETS.LOGS]: [
      'log_id','request_id','campaign_id','job_id','level','event','message','details','created_at'
    ],
    [CONFIG.SHEETS.SETTINGS]: ['key','value','updated_at']
  };

  Object.keys(definitions).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    if (sheet.getLastRow() === 0) sheet.appendRow(definitions[name]);
  });

  setDefaultSetting_('MAX_JOBS_PER_RUN', String(CONFIG.DEFAULTS.MAX_JOBS_PER_RUN));
  setDefaultSetting_('BATCH_SIZE', String(CONFIG.DEFAULTS.BATCH_SIZE));
  setDefaultSetting_('MAX_RETRIES', String(CONFIG.DEFAULTS.MAX_RETRIES));
  setDefaultSetting_('LEASE_MINUTES', String(CONFIG.DEFAULTS.LEASE_MINUTES));
  return { success: true, message: 'Campaign system initialized.' };
}

function setDefaultSetting_(key, value) {
  const sheet = getSheet_(CONFIG.SHEETS.SETTINGS);
  const rows = getRows_(sheet);
  const found = rows.findIndex(r => String(r.key) === key);
  const record = { key, value, updated_at: nowIso_() };
  if (found >= 0) {
    sheet.getRange(found + 2, 1, 1, 3).setValues([[record.key, record.value, record.updated_at]]);
  } else {
    sheet.appendRow([record.key, record.value, record.updated_at]);
  }
}

function getSetting_(key, fallback) {
  const rows = getRows_(getSheet_(CONFIG.SHEETS.SETTINGS));
  const row = rows.find(r => String(r.key) === key);
  return row ? row.value : fallback;
}

