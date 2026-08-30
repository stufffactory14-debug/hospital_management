const sendSms = async ({ to, message }) => {
  // Provider integration is intentionally isolated. No provider means no delivery claim.
  if (!process.env.SMS_PROVIDER || !process.env.SMS_API_URL || !process.env.SMS_API_KEY) {
    return { status: 'provider_not_configured' };
  }

  if (process.env.SMS_PROVIDER !== 'webhook') {
    return { status: 'provider_not_configured' };
  }

  try {
    const response = await fetch(process.env.SMS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.SMS_API_KEY}` },
      body: JSON.stringify({ to, message }),
    });
    if (!response.ok) return { status: 'failed', error: `SMS provider returned HTTP ${response.status}` };
    return { status: 'sent' };
  } catch (error) {
    return { status: 'failed', error: 'SMS provider request failed' };
  }
};

module.exports = { sendSms };
