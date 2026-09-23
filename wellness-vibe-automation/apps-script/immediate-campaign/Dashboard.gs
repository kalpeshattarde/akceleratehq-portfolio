function getDashboardSummary_() {
  const campaigns = getRows_(getSheet_(CONFIG.SHEETS.CAMPAIGNS));
  const jobs = getRows_(getSheet_(CONFIG.SHEETS.JOBS));
  const counts = {};
  jobs.forEach(j => { counts[j.status] = (counts[j.status] || 0) + 1; });
  return {
    success: true,
    generated_at: nowIso_(),
    campaigns: campaigns.slice(-20).reverse(),
    job_counts: counts
  };
}

function getCampaignDashboard_(campaignId) {
  const campaign = getCampaign_(campaignId);
  const jobs = getRows_(getSheet_(CONFIG.SHEETS.JOBS)).filter(j => String(j.campaign_id) === String(campaignId));
  const counts = {};
  jobs.forEach(j => { counts[j.status] = (counts[j.status] || 0) + 1; });
  return { success: true, campaign, counts, jobs };
}

