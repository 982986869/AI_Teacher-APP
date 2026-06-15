'use strict'

const { config } = require('../../config/env')

// SMS-sender abstraction. No paid provider is integrated yet.
// To add one later (Twilio, MSG91, etc.), implement send() here and gate on an
// env flag — the OTP service already calls sendOtp() and is provider-agnostic.
async function sendOtp(phone, otp) {
  if (config.isDev) {
    // Development: no SMS. The OTP is also returned to the client as devOtp.
    console.log(`[SMS:dev] OTP for ${phone} is ${otp}`)
    return
  }
  // Production with no SMS provider configured: log a warning so phone auth
  // failures are visible. (devOtp is NOT returned in production.)
  console.warn(`[SMS] No SMS provider configured — OTP for ${phone} was not delivered.`)
}

module.exports = { sendOtp }
