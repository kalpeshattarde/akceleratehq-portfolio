function testValidateCampaignPayload_() {
  const payload = {
    request_id: 'TEST-' + uuid_(),
    campaign: { campaign_id: 'TEST-CAMPAIGN-' + uuid_(), campaign_name: 'Test Campaign' },
    recipients: [
      { recipient_id: '1', name: 'Rahul', email: 'support@example.invalid', phone: '+00 0000 0000' },
      { recipient_id: '1', name: 'Rahul Duplicate', email: 'support@example.invalid', phone: '+00 0000 0000' },
      { recipient_id: '2', name: 'Opted Out', email: 'support@example.invalid', email_opt_in: false }
    ]
  };
  const result = validateCampaignPayload_(payload);
  if (result.recipients.length !== 2) throw new Error('Expected two unique eligible recipients.');
  return { success: true, recipients: result.recipients.length };
}

function testDryRunEmailContent_() {
  const result = buildEmailContent_({ reminder_type: '24_HOURS', session_date: '23 September 2026', session_time: '08:00 PM - 09:30 PM IST', joining_link: 'https://example.com', passcode: '8436' }, { name: 'Rahul' });
  if (result.html.indexOf('Rahul') < 0) throw new Error('Name was not rendered.');
  return { success: true, subject: result.subject };
}

