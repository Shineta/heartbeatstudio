import sgMail from '@sendgrid/mail';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=sendgrid',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key || !connectionSettings.settings.from_email)) {
    throw new Error('SendGrid not connected');
  }
  return {apiKey: connectionSettings.settings.api_key, email: connectionSettings.settings.from_email};
}

async function getUncachableSendGridClient() {
  const {apiKey, email} = await getCredentials();
  sgMail.setApiKey(apiKey);
  return {
    client: sgMail,
    fromEmail: email
  };
}

export async function sendMagicLinkEmail(to: string, magicLink: string) {
  const {client, fromEmail} = await getUncachableSendGridClient();
  
  const msg = {
    to,
    from: fromEmail,
    subject: 'Your Magic Link to Heartbeat Studio',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #FF4D8C; font-family: 'Fredoka', sans-serif;">Welcome to Heartbeat Studio!</h1>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          Click the button below to sign in to your account. This link will expire in 10 minutes.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${magicLink}" 
             style="display: inline-block; background-color: #FF4D8C; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Sign In to Heartbeat Studio
          </a>
        </div>
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          If you didn't request this email, you can safely ignore it.
        </p>
        <p style="font-size: 14px; color: #666;">
          Or copy and paste this link into your browser:<br>
          <a href="${magicLink}" style="color: #FF4D8C;">${magicLink}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">
          Heartbeat Studio by Horton's Tech Innovations<br>
          Making celebrations effortless and joyful
        </p>
      </div>
    `,
  };

  await client.send(msg);
}
