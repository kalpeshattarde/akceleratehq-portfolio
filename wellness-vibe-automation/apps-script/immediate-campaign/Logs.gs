function logEvent_(event) {
  appendObject_(getSheet_(CONFIG.SHEETS.LOGS), {
    log_id: 'LOG-' + uuid_(),
    request_id: event.request_id || '',
    campaign_id: event.campaign_id || '',
    job_id: event.job_id || '',
    level: event.level || 'INFO',
    event: event.event || '',
    message: event.message || '',
    details: json_(event.details || {}),
    created_at: nowIso_()
  });
}

