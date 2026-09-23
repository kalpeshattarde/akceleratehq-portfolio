function processPendingJobs() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return { success: false, skipped: true, reason: 'Another worker is running.' };
  try {
    const maxJobs = Number(getSetting_('MAX_JOBS_PER_RUN', CONFIG.DEFAULTS.MAX_JOBS_PER_RUN));
    const jobs = claimJobs_(maxJobs);
    const results = [];
    jobs.forEach(job => {
      try {
        const result = processJob_(job);
        results.push({ job_id: job.job_id, success: true, result });
      } catch (err) {
        updateJob_(job.job_id, { status: CONFIG.JOB_STATUS.FAILED, last_error: err.message });
        logEvent_({ campaign_id: job.campaign_id, job_id: job.job_id, level: 'ERROR', event: 'JOB_FAILED', message: err.message, details: job });
        results.push({ job_id: job.job_id, success: false, error: err.message });
      }
    });
    refreshCampaignStatuses_();
    return { success: true, processed: jobs.length, results };
  } finally {
    lock.releaseLock();
  }
}

function processJob_(job) {
  const recipient = getRecipientSnapshot_(job.snapshot_id, job.recipient_id);
  const campaign = getCampaign_(job.campaign_id);
  if (!recipient || !campaign) throw new Error('Recipient snapshot or campaign not found.');
  let result;
  if (job.channel === CONFIG.CHANNELS.WHATSAPP) result = sendWhatsAppSingle_(recipient, campaign);
  else if (job.channel === CONFIG.CHANNELS.EMAIL) result = sendEmailSingle_(recipient, campaign);
  else throw new Error('Unsupported channel: ' + job.channel);
  updateJob_(job.job_id, { status: CONFIG.JOB_STATUS.SUBMITTED, provider_reference: result.provider_reference || result.message_id || '', last_error: '' });
  logEvent_({ campaign_id: job.campaign_id, job_id: job.job_id, level: 'INFO', event: 'JOB_SUBMITTED', message: 'Job submitted.', details: result });
  return result;
}

function refreshCampaignStatuses_() {
  const campaigns = getRows_(getSheet_(CONFIG.SHEETS.CAMPAIGNS));
  const jobs = getRows_(getSheet_(CONFIG.SHEETS.JOBS));
  campaigns.forEach(c => {
    const related = jobs.filter(j => String(j.campaign_id) === String(c.campaign_id));
    if (!related.length) return;
    const pending = related.some(j => ['QUEUED', 'PROCESSING'].includes(String(j.status)));
    const failed = related.some(j => String(j.status) === 'FAILED');
    const submitted = related.some(j => ['SUBMITTED', 'COMPLETED'].includes(String(j.status)));
    if (pending) updateCampaignStatus_(c.campaign_id, 'PROCESSING');
    else if (failed) updateCampaignStatus_(c.campaign_id, 'PARTIAL_FAILURE');
    else if (submitted) updateCampaignStatus_(c.campaign_id, 'COMPLETED');
  });
}

/**
 * Processes only FAILED records that are eligible for retry.
 * The original campaign/batch size is ignored; each failed job is retried independently.
 */
function retryFailedJobsOnly() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return { success: false, skipped: true, reason: 'Another worker is running.' };
  try {
    const maxJobs = Number(getSetting_('MAX_JOBS_PER_RUN', CONFIG.DEFAULTS.MAX_JOBS_PER_RUN));
    const jobs = claimFailedJobsOnly_(maxJobs);
    const results = [];
    jobs.forEach(job => {
      try {
        const result = processJob_(job);
        results.push({ job_id: job.job_id, success: true, result });
      } catch (err) {
        updateJob_(job.job_id, { status: CONFIG.JOB_STATUS.FAILED, last_error: err.message });
        logEvent_({ campaign_id: job.campaign_id, job_id: job.job_id, level: 'ERROR', event: 'RETRY_FAILED', message: err.message, details: job });
        results.push({ job_id: job.job_id, success: false, error: err.message });
      }
    });
    refreshCampaignStatuses_();
    return { success: true, retried: jobs.length, results };
  } finally {
    lock.releaseLock();
  }
}

