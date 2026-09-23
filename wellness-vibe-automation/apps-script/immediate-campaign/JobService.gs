function createRecipientSnapshot_(campaignId, recipients) {
  const snapshotId = 'SNAP-' + uuid_();
  const sheet = getSheet_(CONFIG.SHEETS.RECIPIENTS);
  recipients.forEach(r => appendObject_(sheet, {
    snapshot_id: snapshotId,
    campaign_id: campaignId,
    recipient_id: r.recipient_id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    whatsapp_opt_in: r.whatsapp_opt_in,
    email_opt_in: r.email_opt_in,
    eligible: r.eligible,
    template_variables: json_(r.template_variables),
    created_at: nowIso_()
  }));
  return snapshotId;
}

function createJobs_(payload, campaignId, snapshotId, recipients) {
  const jobs = [];
  const sheet = getSheet_(CONFIG.SHEETS.JOBS);
  const channels = payload.channels || {};
  const email = channels.email || {};
  const whatsapp = channels.whatsapp || {};

  // Duplicate protection is intentionally exact-match only.
  // Do not trim, lowercase, format or otherwise normalize email/mobile values.
  const seenEmails = {};
  const seenPhones = {};

  recipients.forEach(r => {
    if (whatsapp.enabled && validateRecipientForChannel_(r, CONFIG.CHANNELS.WHATSAPP)) {
      const phoneKey = String(r.phone);
      if (!seenPhones[phoneKey]) {
        seenPhones[phoneKey] = true;
        jobs.push(createJob_(sheet, campaignId, snapshotId, r, CONFIG.CHANNELS.WHATSAPP, 'BATCH', payload));
      } else {
        logEvent_({ campaign_id: campaignId, level: 'WARN', event: 'DUPLICATE_MOBILE_SKIPPED', message: 'Duplicate mobile number skipped using exact-match comparison.', details: { phone: r.phone, recipient_id: r.recipient_id } });
      }
    }

    if (email.enabled && validateRecipientForChannel_(r, CONFIG.CHANNELS.EMAIL)) {
      const emailKey = String(r.email);
      if (!seenEmails[emailKey]) {
        seenEmails[emailKey] = true;
        jobs.push(createJob_(sheet, campaignId, snapshotId, r, CONFIG.CHANNELS.EMAIL, String(email.sending_mode || CONFIG.DEFAULTS.EMAIL_MODE).toUpperCase(), payload));
      } else {
        logEvent_({ campaign_id: campaignId, level: 'WARN', event: 'DUPLICATE_EMAIL_SKIPPED', message: 'Duplicate email skipped using exact-match comparison.', details: { email: r.email, recipient_id: r.recipient_id } });
      }
    }
  });

  return jobs;
}

function createJob_(sheet, campaignId, snapshotId, recipient, channel, sendingMode, payload) {
  const idempotencyKey = [campaignId, recipient.recipient_id, channel].join('|');
  const existing = getRows_(sheet).find(r => String(r.idempotency_key) === idempotencyKey);
  if (existing) return existing;
  const job = {
    job_id: 'JOB-' + uuid_(),
    campaign_id: campaignId,
    snapshot_id: snapshotId,
    recipient_id: recipient.recipient_id,
    channel,
    sending_mode: sendingMode,
    status: CONFIG.JOB_STATUS.QUEUED,
    idempotency_key: idempotencyKey,
    attempts: 0,
    claimed_at: '',
    lease_token: '',
    provider_reference: '',
    last_error: '',
    created_at: nowIso_(),
    updated_at: nowIso_(),
    completed_at: ''
  };
  appendObject_(sheet, job);
  return job;
}

function claimJobs_(limit) {
  const sheet = getSheet_(CONFIG.SHEETS.JOBS);
  const headers = getHeaders_(sheet);
  const rows = getRows_(sheet);
  const claimed = [];
  const now = new Date();
  const leaseMinutes = Number(getSetting_('LEASE_MINUTES', CONFIG.DEFAULTS.LEASE_MINUTES));
  rows.forEach((row, index) => {
    if (claimed.length >= limit) return;
    const status = String(row.status || '');
    const stale = status === CONFIG.JOB_STATUS.PROCESSING && row.claimed_at && ((now - new Date(row.claimed_at)) / 60000 > leaseMinutes);
    // Initial delivery: QUEUED. Retry delivery: FAILED records only.
    // Retry is per job/recipient; the original batch size is irrelevant.
    // Never retry PROCESSING, SUBMITTED, COMPLETED or SKIPPED records.
    const isInitialAttempt = status === CONFIG.JOB_STATUS.QUEUED && attempts === 0;
    const isFailedRetry = status === CONFIG.JOB_STATUS.FAILED;
    if (!isInitialAttempt && !isFailedRetry) return;
    const attempts = Number(row.attempts || 0);
    const maxRetries = Number(getSetting_('MAX_RETRIES', CONFIG.DEFAULTS.MAX_RETRIES));
    if (attempts >= maxRetries) return;
    const leaseToken = uuid_();
    const values = sheet.getRange(index + 2, 1, 1, headers.length).getValues()[0];
    setField_(headers, values, 'status', CONFIG.JOB_STATUS.PROCESSING);
    setField_(headers, values, 'claimed_at', nowIso_());
    setField_(headers, values, 'lease_token', leaseToken);
    setField_(headers, values, 'attempts', attempts + 1);
    setField_(headers, values, 'updated_at', nowIso_());
    sheet.getRange(index + 2, 1, 1, headers.length).setValues([values]);
    claimed.push(Object.assign({}, row, { status: CONFIG.JOB_STATUS.PROCESSING, lease_token: leaseToken, attempts: attempts + 1 }));
  });
  return claimed;
}

function updateJob_(jobId, patch) {
  const sheet = getSheet_(CONFIG.SHEETS.JOBS);
  const found = findRow_(sheet, 'job_id', jobId);
  if (!found) return false;
  const headers = getHeaders_(sheet);
  const values = sheet.getRange(found.row, 1, 1, headers.length).getValues()[0];
  Object.keys(patch).forEach(k => setField_(headers, values, k, patch[k]));
  setField_(headers, values, 'updated_at', nowIso_());
  sheet.getRange(found.row, 1, 1, headers.length).setValues([values]);
  return true;
}


function claimFailedJobsOnly_(limit) {
  const sheet = getSheet_(CONFIG.SHEETS.JOBS);
  const headers = getHeaders_(sheet);
  const rows = getRows_(sheet);
  const claimed = [];
  const maxRetries = Number(getSetting_('MAX_RETRIES', CONFIG.DEFAULTS.MAX_RETRIES));

  rows.forEach((row, index) => {
    if (claimed.length >= limit) return;
    if (String(row.status || '') !== CONFIG.JOB_STATUS.FAILED) return;

    const attempts = Number(row.attempts || 0);
    if (attempts >= maxRetries) return;

    const leaseToken = uuid_();
    const values = sheet.getRange(index + 2, 1, 1, headers.length).getValues()[0];
    setField_(headers, values, 'status', CONFIG.JOB_STATUS.PROCESSING);
    setField_(headers, values, 'claimed_at', nowIso_());
    setField_(headers, values, 'lease_token', leaseToken);
    setField_(headers, values, 'attempts', attempts + 1);
    setField_(headers, values, 'updated_at', nowIso_());
    sheet.getRange(index + 2, 1, 1, headers.length).setValues([values]);
    claimed.push(Object.assign({}, row, {
      status: CONFIG.JOB_STATUS.PROCESSING,
      lease_token: leaseToken,
      attempts: attempts + 1
    }));
  });

  return claimed;
}

