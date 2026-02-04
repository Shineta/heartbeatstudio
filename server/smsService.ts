import twilio from 'twilio';

let twilioClient: twilio.Twilio | null = null;

// Normalize phone number to E.164 format for Twilio
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it already starts with +, assume it's in E.164 format
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // If it's 10 digits (US number without country code), add +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // If it's 11 digits starting with 1, add +
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  // Otherwise, assume US and add +1
  return `+1${cleaned}`;
}

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
    
    const normalizedTo = normalizePhoneNumber(to);
    console.log(`[SMS] Sending password reset to ${normalizedTo}`);
    
    const message = await client.messages.create({
      body: `Heartbeat Studio: Reset your password using this link (expires in 10 minutes): ${resetLink}`,
      from: fromNumber,
      to: normalizedTo,
    });
    
    console.log(`[SMS] Password reset SMS sent to ${normalizedTo}, SID: ${message.sid}`);
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
    
    const normalizedTo = normalizePhoneNumber(to);
    
    const message = await client.messages.create({
      body: `Your Heartbeat Studio verification code is: ${code}. This code expires in 10 minutes.`,
      from: fromNumber,
      to: normalizedTo,
    });
    
    console.log(`[SMS] Verification SMS sent to ${normalizedTo}, SID: ${message.sid}`);
    return true;
  } catch (error: any) {
    console.error('[SMS] Failed to send verification SMS:', error.message);
    return false;
  }
}

export async function sendSMSOptInRequest(to: string): Promise<boolean> {
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
    
    const normalizedTo = normalizePhoneNumber(to);
    console.log(`[SMS] Sending opt-in request to ${normalizedTo}`);
    
    const message = await client.messages.create({
      body: `Heartbeat Studio: Reply YES to confirm you want to receive SMS messages for password resets and account verification. Msg & data rates may apply. Reply STOP to cancel.`,
      from: fromNumber,
      to: normalizedTo,
    });
    
    console.log(`[SMS] Opt-in request SMS sent to ${normalizedTo}, SID: ${message.sid}`);
    return true;
  } catch (error: any) {
    console.error('[SMS] Failed to send opt-in request SMS:', error.message);
    return false;
  }
}

export async function sendSMSOptInConfirmation(to: string): Promise<boolean> {
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
    
    const normalizedTo = normalizePhoneNumber(to);
    
    const message = await client.messages.create({
      body: `Heartbeat Studio: You're now opted in to receive SMS messages! You can reply STOP at any time to unsubscribe. Reply HELP for assistance.`,
      from: fromNumber,
      to: normalizedTo,
    });
    
    console.log(`[SMS] Opt-in confirmation sent to ${normalizedTo}, SID: ${message.sid}`);
    return true;
  } catch (error: any) {
    console.error('[SMS] Failed to send opt-in confirmation SMS:', error.message);
    return false;
  }
}

export async function sendSMSOptOutConfirmation(to: string): Promise<boolean> {
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
    
    const normalizedTo = normalizePhoneNumber(to);
    
    const message = await client.messages.create({
      body: `Heartbeat Studio: You have been unsubscribed from SMS messages. Reply YES anytime to opt back in.`,
      from: fromNumber,
      to: normalizedTo,
    });
    
    console.log(`[SMS] Opt-out confirmation sent to ${normalizedTo}, SID: ${message.sid}`);
    return true;
  } catch (error: any) {
    console.error('[SMS] Failed to send opt-out confirmation SMS:', error.message);
    return false;
  }
}

export async function sendSMSHelpMessage(to: string): Promise<boolean> {
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
    
    const normalizedTo = normalizePhoneNumber(to);
    
    const message = await client.messages.create({
      body: `Heartbeat Studio SMS Help: We send password reset links and account verification codes. Reply STOP to unsubscribe. For more help, visit heartbeatstudio.org/contact`,
      from: fromNumber,
      to: normalizedTo,
    });
    
    console.log(`[SMS] Help message sent to ${normalizedTo}, SID: ${message.sid}`);
    return true;
  } catch (error: any) {
    console.error('[SMS] Failed to send help SMS:', error.message);
    return false;
  }
}

// Normalize phone number - exported for use in webhook
export { normalizePhoneNumber };

export async function sendCreationShareSMS(
  to: string, 
  creationTitle: string,
  shareLink: string,
  creationType: string,
  senderName: string
): Promise<boolean> {
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
    
    const normalizedTo = normalizePhoneNumber(to);
    
    const typeLabels: Record<string, string> = {
      song: 'personalized song',
      card: 'greeting card',
      animation: 'animation'
    };
    const typeLabel = typeLabels[creationType] || 'creation';
    
    const message = await client.messages.create({
      body: `${senderName} created a ${typeLabel} for you on Heartbeat Studio: "${creationTitle}" - Listen now: ${shareLink}`,
      from: fromNumber,
      to: normalizedTo,
    });
    
    console.log(`[SMS] Creation share SMS sent to ${normalizedTo}, SID: ${message.sid}`);
    return true;
  } catch (error: any) {
    console.error('[SMS] Failed to send creation share SMS:', error.message);
    return false;
  }
}
