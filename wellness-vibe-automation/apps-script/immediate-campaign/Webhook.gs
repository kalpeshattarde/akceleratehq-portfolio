function doPost(e) {
  try {
    const payload = parseJson_(e && e.postData ? e.postData.contents : '{}', null);
    const result = handleCampaignRequest_(payload);
    return ContentService.createTextOutput(json_(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    const response = { success: false, error: err.message, timestamp: nowIso_() };
    return ContentService.createTextOutput(json_(response)).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : 'health';
  let result;
  if (action === 'health') result = { success: true, service: 'wellness-vibe-campaigns', timestamp: nowIso_() };
  else if (action === 'dashboard') result = getDashboardSummary_();
  else result = { success: false, error: 'Unknown action.' };
  return ContentService.createTextOutput(json_(result)).setMimeType(ContentService.MimeType.JSON);
}

function handleCampaignRequest_(payload) {
  const action = String(payload && payload.action || 'SEND_NOW').toUpperCase();
  if (!['SEND_NOW', 'ENQUEUE'].includes(action)) throw new Error('Unsupported action: ' + action);
  const validated = validateCampaignPayload_(payload);
  const existing = findCampaignByRequestId_(payload.request_id);
  if (existing) return { success: true, duplicate: true, campaign_id: existing.campaign_id, status: existing.status };

  const campaignId = validated.campaign.campaign_id;
  const record = createCampaign_(payload.request_id, validated.campaign, validated.recipients.length, payload.metadata || {});
  const snapshotId = createRecipientSnapshot_(campaignId, validated.recipients);
  const jobs = createJobs_(payload, campaignId, snapshotId, validated.recipients);
  updateCampaignStatus_(campaignId, 'QUEUED');
  logEvent_({ request_id: payload.request_id, campaign_id: campaignId, level: 'INFO', event: 'CAMPAIGN_QUEUED', message: 'Campaign queued.', details: { jobs: jobs.length, action } });

  if (action === 'SEND_NOW' && payload.process_immediately !== false) {
    const workerResult = processPendingJobs();
    return { success: true, campaign_id: campaignId, queued_jobs: jobs.length, worker: workerResult };
  }
  return { success: true, campaign_id: campaignId, queued_jobs: jobs.length, status: 'QUEUED' };
}

