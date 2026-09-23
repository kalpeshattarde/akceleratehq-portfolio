function validateCampaignPayload_(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') errors.push('Payload must be an object.');
  const campaign = payload && payload.campaign;
  if (!campaign || !campaign.campaign_id) errors.push('campaign.campaign_id is required.');
  if (!campaign || !campaign.campaign_name) errors.push('campaign.campaign_name is required.');
  if (!payload || !payload.request_id) errors.push('request_id is required.');
  if (!Array.isArray(payload && payload.recipients)) errors.push('recipients must be an array.');
  if (errors.length) throw new Error(errors.join(' '));

  // IMPORTANT: Email addresses and mobile numbers are intentionally NOT normalized.
  // The upstream/other team owns data cleanup and formatting.
  // Values are preserved exactly as received, including case, spaces and symbols.
  const recipients = payload.recipients;
  const seenRecipientIds = {};
  const clean = [];

  recipients.forEach((r, index) => {
    const recipient = r || {};
    const email = recipient.email == null ? '' : String(recipient.email);
    const phone = recipient.phone == null ? '' : String(recipient.phone);
    const eligible = recipient.eligible !== false;
    const emailOptIn = recipient.email_opt_in !== false;
    const whatsappOptIn = recipient.whatsapp_opt_in !== false;
    const key = String(recipient.recipient_id || email || phone || index);

    if (!eligible) return;
    if (seenRecipientIds[key]) return;
    seenRecipientIds[key] = true;

    clean.push({
      recipient_id: key,
      name: String(recipient.name || ''),
      email,
      phone,
      email_opt_in: emailOptIn,
      whatsapp_opt_in: whatsappOptIn,
      eligible: true,
      template_variables: recipient.template_variables || { name: String(recipient.name || '') }
    });
  });

  return { campaign, recipients: clean };
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
}

function validateRecipientForChannel_(recipient, channel) {
  if (channel === CONFIG.CHANNELS.EMAIL) {
    return isValidEmail_(recipient.email) && recipient.email_opt_in !== false;
  }
  if (channel === CONFIG.CHANNELS.WHATSAPP) {
    return Boolean(recipient.phone) && recipient.whatsapp_opt_in !== false;
  }
  return false;
}

