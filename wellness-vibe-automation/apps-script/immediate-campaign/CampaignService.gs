function createCampaign_(requestId, campaign, recipientCount, metadata) {
  const sheet = getSheet_(CONFIG.SHEETS.CAMPAIGNS);
  const row = {
    campaign_id: campaign.campaign_id,
    request_id: requestId,
    campaign_name: campaign.campaign_name || '',
    campaign_type: campaign.campaign_type || '',
    reminder_type: campaign.reminder_type || '',
    session_date: campaign.session_date || '',
    session_time: campaign.session_time || '',
    timezone: campaign.timezone || getConfig_().timezone,
    status: 'CREATED',
    dry_run: metadata.dry_run === true,
    subject: campaign.subject || '',
    template_name: campaign.template_name || campaign.whatsapp_template_name || '',
    language_code: campaign.language_code || 'en',
    joining_link: campaign.joining_link || '',
    passcode: campaign.passcode || '',
    duration: campaign.duration || '90 Mins',
    total_recipients: recipientCount,
    created_at: nowIso_(),
    started_at: '',
    completed_at: '',
    last_error: ''
  };
  appendObject_(sheet, row);
  return row;
}

function updateCampaignStatus_(campaignId, status, error) {
  const sheet = getSheet_(CONFIG.SHEETS.CAMPAIGNS);
  const found = findRow_(sheet, 'campaign_id', campaignId);
  if (!found) return;
  const headers = getHeaders_(sheet);
  const values = sheet.getRange(found.row, 1, 1, headers.length).getValues()[0];
  setField_(headers, values, 'status', status);
  if (status === 'PROCESSING' && !getField_(headers, values, 'started_at')) setField_(headers, values, 'started_at', nowIso_());
  if (['COMPLETED', 'FAILED'].includes(status)) setField_(headers, values, 'completed_at', nowIso_());
  if (error) setField_(headers, values, 'last_error', error);
  sheet.getRange(found.row, 1, 1, headers.length).setValues([values]);
}

function findCampaignByRequestId_(requestId) {
  const rows = getRows_(getSheet_(CONFIG.SHEETS.CAMPAIGNS));
  return rows.find(r => String(r.request_id) === String(requestId)) || null;
}

