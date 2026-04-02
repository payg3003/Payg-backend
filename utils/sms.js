const axios = require('axios')

// ─── SWAP INSTRUCTIONS ────────────────────────────────────────────────────────
// To use Africa's Talking instead of Termii:
// 1. npm install africastalking
// 2. Comment out the Termii block below
// 3. Uncomment the Africa's Talking block
// ─────────────────────────────────────────────────────────────────────────────

// ─── Termii ───────────────────────────────────────────────────────────────────
const sendSMS = async (to, message) => {
  // Normalize phone: ensure it starts with 234 (international format)
  const phone = to.replace(/^0/, '234').replace(/^\+/, '')

  if (process.env.NODE_ENV !== 'production' && !process.env.TERMII_API_KEY?.startsWith('TL')) {
    // Dev mode: just log the SMS instead of sending
    console.log(`📱 [SMS DEV] To: ${phone}`)
    console.log(`   Message: ${message}`)
    return { success: true, mock: true }
  }

  try {
    const res = await axios.post(`${process.env.TERMII_BASE_URL}/sms/send`, {
      to: phone,
      from: process.env.TERMII_SENDER_ID || 'PAYG',
      sms: message,
      type: 'plain',
      api_key: process.env.TERMII_API_KEY,
      channel: 'generic',
    })
    return { success: true, data: res.data }
  } catch (err) {
    console.error('SMS send failed:', err.response?.data || err.message)
    return { success: false, error: err.message }
  }
}

// ─── Africa's Talking (uncomment to use) ──────────────────────────────────────
// const AfricasTalking = require('africastalking')
// const at = AfricasTalking({ apiKey: process.env.AT_API_KEY, username: process.env.AT_USERNAME })
// const sendSMS = async (to, message) => {
//   const phone = to.startsWith('+') ? to : `+${to.replace(/^0/, '234')}`
//   try {
//     const res = await at.SMS.send({ to: [phone], message, from: process.env.AT_SENDER_ID || 'PAYG' })
//     return { success: true, data: res }
//   } catch (err) {
//     console.error('AT SMS failed:', err)
//     return { success: false, error: err.message }
//   }
// }

// ─── Pre-built SMS templates ──────────────────────────────────────────────────
const smsTemplates = {
  otp: (code) =>
    `Your PAYG verification code is: ${code}. Valid for ${process.env.OTP_EXPIRES_MINUTES || 10} minutes. Do not share this code.`,

  paymentReceived: (amount, balance, plan) =>
    `PAYG: ₦${amount.toLocaleString()} received. Wallet balance: ₦${balance.toLocaleString()}. ${
      balance >= 0 ? `Your ${plan} coverage is active. Stay healthy! 🛡️` : ''
    }`,

  coverageActive: (plan, expiryDate) =>
    `PAYG: Your ${plan} plan is now active until ${expiryDate}. Visit any partner hospital and show your policy number. Stay protected! 🛡️`,

  coverageLow: (remaining, plan) =>
    `PAYG Reminder: You need ₦${remaining.toLocaleString()} more to maintain your ${plan} coverage. Top up now at payg.ng to stay protected.`,

  coverageExpiringSoon: (days) =>
    `PAYG Alert: Your coverage expires in ${days} day${days !== 1 ? 's' : ''}. Top up your wallet to avoid a lapse in coverage.`,

  coverageLapsed: () =>
    `PAYG: Your coverage has lapsed. Top up your wallet within 7 days to reactivate without losing your plan benefits.`,

  claimSubmitted: (ref) =>
    `PAYG: Claim ${ref} received. Our team will review it within 3 working days. You'll receive an update via SMS.`,

  claimApproved: (ref, amount) =>
    `PAYG: Great news! Claim ${ref} has been approved. ₦${amount.toLocaleString()} will be paid within 5 working days.`,

  claimRejected: (ref, reason) =>
    `PAYG: Claim ${ref} could not be approved. Reason: ${reason}. Contact support@payg.ng to appeal.`,

  welcome: (name) =>
    `Welcome to PAYG, ${name}! 🎉 Your health insurance is now set up. Top up your wallet to activate coverage. payg.ng`,
}

module.exports = { sendSMS, smsTemplates }
