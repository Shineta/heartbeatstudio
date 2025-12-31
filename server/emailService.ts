import sgMail from '@sendgrid/mail';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (xReplitToken) {
    try {
      connectionSettings = await fetch(
        'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=sendgrid',
        {
          headers: {
            'Accept': 'application/json',
            'X_REPLIT_TOKEN': xReplitToken
          }
        }
      ).then(res => res.json()).then(data => data.items?.[0]);

      const connectorApiKey = connectionSettings?.settings?.api_key;
      const connectorEmail = connectionSettings?.settings?.from_email;
      
      if (connectorApiKey && connectorEmail && connectorApiKey.startsWith('SG.')) {
        console.log('Using SendGrid credentials from Replit connector');
        return {
          apiKey: connectorApiKey, 
          email: connectorEmail
        };
      } else {
        console.warn('Replit connector returned invalid SendGrid credentials, falling back to environment variables');
      }
    } catch (error) {
      console.warn('Failed to fetch SendGrid credentials from connector, falling back to environment variables');
    }
  }

  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;

  if (!apiKey) {
    throw new Error('SendGrid API key not configured. Please add SENDGRID_API_KEY to Replit Secrets or configure the SendGrid integration.');
  }
  
  if (!fromEmail) {
    throw new Error('SendGrid from email not configured. Please add SENDGRID_FROM_EMAIL to Replit Secrets or configure the SendGrid integration.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(fromEmail)) {
    throw new Error(
      `SENDGRID_FROM_EMAIL must be a valid email address, not an API key. ` +
      `Current value appears to be a SendGrid API key. ` +
      `Please update SENDGRID_FROM_EMAIL in Replit Secrets to your verified sender email (e.g., noreply@yourdomain.com or your personal email).`
    );
  }

  console.log('Using SendGrid credentials from environment variables');
  return { apiKey, email: fromEmail };
}

async function getUncachableSendGridClient() {
  const {apiKey, email} = await getCredentials();
  console.log('SendGrid credentials check:', {
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey?.substring(0, 3),
    apiKeyLength: apiKey?.length,
    fromEmail: email
  });
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

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const {client, fromEmail} = await getUncachableSendGridClient();
  
  const msg = {
    to,
    from: fromEmail,
    subject: 'Reset Your Password - Heartbeat Studio',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #FF4D8C; font-family: 'Fredoka', sans-serif;">Reset Your Password</h1>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          Click the button below to set a new password for your Heartbeat Studio account. This link will expire in 10 minutes.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="display: inline-block; background-color: #FF4D8C; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Set New Password
          </a>
        </div>
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          If you didn't request this email, you can safely ignore it.
        </p>
        <p style="font-size: 14px; color: #666;">
          Or copy and paste this link into your browser:<br>
          <a href="${resetLink}" style="color: #FF4D8C;">${resetLink}</a>
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

export async function sendContactFormEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const {client, fromEmail} = await getUncachableSendGridClient();
  
  const subjectLabels: Record<string, string> = {
    general: 'General Question',
    billing: 'Billing & Payments',
    technical: 'Technical Issue',
    feedback: 'Feedback & Suggestions',
    partnership: 'Partnership Inquiry',
    other: 'Other'
  };
  
  const msg = {
    to: 'heartbeatstudio6@gmail.com',
    from: fromEmail,
    replyTo: data.email,
    subject: `[Contact Form] ${subjectLabels[data.subject] || data.subject} - from ${data.name}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #FF4D8C; font-family: 'Fredoka', sans-serif;">New Contact Form Submission</h1>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 8px 0;"><strong>Name:</strong> ${data.name}</p>
          <p style="margin: 8px 0;"><strong>Email:</strong> ${data.email}</p>
          <p style="margin: 8px 0;"><strong>Subject:</strong> ${subjectLabels[data.subject] || data.subject}</p>
        </div>
        <h2 style="color: #333; font-size: 18px;">Message:</h2>
        <div style="background: #fff; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
          <p style="font-size: 16px; color: #333; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">
          Sent from Heartbeat Studio Contact Form
        </p>
      </div>
    `,
  };

  await client.send(msg);
}

export async function sendCreationShareEmail(
  to: string, 
  creationTitle: string, 
  shareLink: string, 
  creationType: string,
  senderName: string
) {
  const {client, fromEmail} = await getUncachableSendGridClient();
  
  const typeLabels: Record<string, string> = {
    song: 'personalized song',
    card: 'greeting card',
    animation: 'animation'
  };
  
  const typeLabel = typeLabels[creationType] || 'creation';
  
  const msg = {
    to,
    from: fromEmail,
    subject: `${senderName} sent you a ${typeLabel} - Heartbeat Studio`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #FF4D8C; font-family: 'Fredoka', sans-serif;">You've Got a Special ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)}!</h1>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          ${senderName} has created a special ${typeLabel} just for you using Heartbeat Studio.
        </p>
        <div style="background: linear-gradient(135deg, #FF4D8C 0%, #FF8C42 100%); padding: 20px; border-radius: 12px; margin: 30px 0; text-align: center;">
          <p style="font-size: 24px; color: white; font-weight: bold; margin: 0 0 10px 0; font-family: 'Fredoka', sans-serif;">
            "${creationTitle}"
          </p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${shareLink}" 
             style="display: inline-block; background-color: #FF4D8C; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            View Your ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)}
          </a>
        </div>
        <p style="font-size: 14px; color: #666; margin-top: 30px; text-align: center;">
          Or copy and paste this link into your browser:<br>
          <a href="${shareLink}" style="color: #FF4D8C;">${shareLink}</a>
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
