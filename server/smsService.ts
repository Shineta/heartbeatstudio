import twilio from 'twilio';

let twilioClient: twilio.Twilio | null = null;

function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }
    
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

export function isTwilioConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID && 
    process.env.TWILIO_AUTH_TOKEN && 
    process.env.TWILIO_PHONE_NUMBER
  );
}

export async function sendPasswordResetSMS(to: string, resetLink: string): Promise<boolean> {
  try {
    if (!isTwilioConfigured()) {
      console.log('[SMS] Twilio not configured, skipping SMS');
      return false;
    }
    
    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (!fromNumber) {
      console.log('[SMS] No Twilio phone number configured');
      return false;
    }
    
    const message = await client.messages.create({
      body: `Heartbeat Studio: Reset your password using this link (expires in 10 minutes): ${resetLink}`,
      from: fromNumber,
      to: to,
    });
    
    console.log(`[SMS] Password reset SMS sent to ${to}, SID: ${message.sid}`);
    return true;
  } catch (error: any) {
    console.error('[SMS] Failed to send password reset SMS:', error.message);
    return false;
  }
}

export async function sendVerificationSMS(to: string, code: string): Promise<boolean> {
  try {
    if (!isTwilioConfigured()) {
      console.log('[SMS] Twilio not configured, skipping SMS');
      return false;
    }
    
    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (!fromNumber) {
      console.log('[SMS] No Twilio phone number configured');
      return false;
    }
    
    const message = await client.messages.create({
      body: `Your Heartbeat Studio verification code is: ${code}. This code expires in 10 minutes.`,
      from: fromNumber,
      to: to,
    });
    
    console.log(`[SMS] Verification SMS sent to ${to}, SID: ${message.sid}`);
    return true;
  } catch (error: any) {
    console.error('[SMS] Failed to send verification SMS:', error.message);
    return false;
  }
}
