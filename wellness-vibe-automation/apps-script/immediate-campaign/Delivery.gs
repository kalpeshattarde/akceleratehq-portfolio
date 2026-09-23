function sendWhatsAppSingle_(recipient, campaign) {
  const cfg = getConfig_();
  if (campaign.dry_run === true) return { dry_run: true, provider_reference: 'DRY-RUN-' + uuid_() };
  if (!cfg.combotApiUrl) throw new Error('COMBOT_API_URL is not configured.');
  if (!cfg.combotChannelId) throw new Error('COMBOT_CHANNEL_ID is not configured.');
  if (!recipient.phone) throw new Error('Recipient phone is missing.');

  const variables = parseJson_(recipient.template_variables || '{}', {}) || {};
  if (!variables.name) variables.name = recipient.name || '';
  const templateName = campaign.template_name || campaign.whatsapp_template_name || 'hi_alert';
  const body = {
    receivers: [{ to: recipient.phone, variables }],
    title: campaign.campaign_name || 'Wellness Vibe Notification',
    channel: cfg.combotChannelId,
    action: 'trigger',
    mode: 'immediate',
    schedule: 0,
    messages: [{
      type: 'template',
      template: {
        language: { policy: 'deterministic', code: campaign.language_code || 'en' },
        name: templateName,
        components: [{
          type: 'body',
          parameters: Object.keys(variables).map(k => ({ type: 'text', text: String(variables[k] == null ? '' : variables[k]) }))
        }]
      }
    }]
  };
  const headers = { 'Content-Type': 'application/json' };
  if (cfg.combotApiToken) headers.Authorization = 'Bearer ' + cfg.combotApiToken;
  const response = UrlFetchApp.fetch(cfg.combotApiUrl, { method: 'post', contentType: 'application/json', headers, payload: JSON.stringify(body), muteHttpExceptions: true });
  const code = response.getResponseCode();
  const text = response.getContentText();
  if (code < 200 || code >= 300) throw new Error('Com.Bot HTTP ' + code + ': ' + text.slice(0, 500));
  return { http_code: code, response: parseJson_(text, text) };
}

function sendEmailSingle_(recipient, campaign) {
  if (campaign.dry_run === true) return { dry_run: true, provider_reference: 'DRY-RUN-' + uuid_() };
  if (!isValidEmail_(recipient.email)) throw new Error('Invalid recipient email.');
  const cfg = getConfig_();
  const vars = parseJson_(recipient.template_variables || '{}', {}) || {};
  vars.name = vars.name || recipient.name || '';
  const content = buildEmailContent_(campaign, vars);
  const options = { htmlBody: content.html, name: cfg.emailSenderName };
  if (cfg.emailReplyTo) options.replyTo = cfg.emailReplyTo;
  GmailApp.sendEmail(recipient.email, content.subject, content.text, options);
  return { email: recipient.email, subject: content.subject, provider_reference: 'GMAIL-' + uuid_() };
}

function buildEmailContent_(campaign, vars) {
  const name = escapeHtml_(vars.name || 'Participant');
  const date = escapeHtml_(campaign.session_date || '');
  const time = escapeHtml_(campaign.session_time || '');
  const duration = escapeHtml_(campaign.duration || '90 Mins');
  const link = campaign.joining_link || '';
  const passcode = escapeHtml_(campaign.passcode || '');
  const reminder = String(campaign.reminder_type || '').toUpperCase();
  let intro = 'A quick reminder about your upcoming DNA Warrior Community Session.';
  if (reminder === '24_HOURS') intro = 'A quick reminder: The DNA Warrior Community Session will begin in the next 24 hours.';
  if (reminder === '60_MINUTES') intro = 'A quick reminder: The DNA Warrior Community Session will begin in the next 60 minutes.';
  if (reminder === 'SESSION_STARTED') intro = 'Reminder: Your scheduled DNA Warrior Community session has started.';
  const subject = reminder === 'SESSION_STARTED' ? 'Live Now: DNA Warrior Community Session' : (campaign.subject || 'DNA Warrior Community Session Reminder');
  const html = '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#222">' +
    '<p>Hello ' + name + ',</p>' +
    '<p>' + escapeHtml_(intro) + '</p>' +
    '<p><strong>Session:</strong> DNA Warrior Community<br>' +
    '<strong>Date:</strong> ' + date + '<br>' +
    '<strong>Time:</strong> ' + time + '<br>' +
    '<strong>Duration:</strong> ' + duration + '</p>' +
    '<p><strong>Joining Link:</strong> <a href="' + escapeAttribute_(link) + '">Join Zoom Session</a><br>' +
    '<strong>Passcode:</strong> ' + passcode + '</p>' +
    '<p>We look forward to having you in the workshop.</p>' +
    '<p>Regards,<br><strong>Team Wellness Vibe</strong></p>' +
    '</div>';
  const text = 'Hello ' + (vars.name || 'Participant') + ',\n\n' + intro + '\n\nDate: ' + campaign.session_date + '\nTime: ' + campaign.session_time + '\nDuration: ' + (campaign.duration || '90 Mins') + '\nJoining Link: ' + link + '\nPasscode: ' + (campaign.passcode || '') + '\n\nRegards\nTeam Wellness Vibe';
  return { subject, html, text };
}

function escapeHtml_(value) { return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function escapeAttribute_(value) { return escapeHtml_(value); }

function getRecipientSnapshot_(snapshotId, recipientId) {
  const rows = getRows_(getSheet_(CONFIG.SHEETS.RECIPIENTS));
  return rows.find(r => String(r.snapshot_id) === String(snapshotId) && String(r.recipient_id) === String(recipientId)) || null;
}

function getCampaign_(campaignId) {
  return getRows_(getSheet_(CONFIG.SHEETS.CAMPAIGNS)).find(r => String(r.campaign_id) === String(campaignId)) || null;
}

