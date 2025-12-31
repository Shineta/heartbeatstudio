import { storage } from "./storage";
import { sendCreationShareEmail } from "./emailService";
import { sendCreationShareSMS, isTwilioConfigured } from "./smsService";

function getBaseUrl(): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }
  if (process.env.NODE_ENV === 'production' && process.env.REPLIT_DOMAINS) {
    const domains = process.env.REPLIT_DOMAINS.split(',');
    return `https://${domains[0]}`;
  }
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }
  return 'http://localhost:5000';
}

async function processScheduledDeliveries() {
  try {
    const pendingDeliveries = await storage.getPendingScheduledDeliveries();
    
    if (pendingDeliveries.length === 0) {
      return;
    }
    
    console.log(`[Scheduler] Processing ${pendingDeliveries.length} pending deliveries`);
    
    for (const delivery of pendingDeliveries) {
      try {
        const creation = await storage.getCreationById(delivery.creationId);
        if (!creation) {
          console.error(`[Scheduler] Creation ${delivery.creationId} not found for delivery ${delivery.id}`);
          await storage.updateScheduledDelivery(delivery.id, { 
            status: 'failed',
            failureReason: 'Creation not found'
          });
          continue;
        }
        
        const user = await storage.getUser(delivery.userId);
        if (!user) {
          console.error(`[Scheduler] User ${delivery.userId} not found for delivery ${delivery.id}`);
          await storage.updateScheduledDelivery(delivery.id, { 
            status: 'failed',
            failureReason: 'User not found'
          });
          continue;
        }
        
        const senderName = user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.firstName || user.email.split('@')[0];
        
        const shareLink = creation.shareableLink 
          ? `${getBaseUrl()}/share/${creation.shareableLink}`
          : `${getBaseUrl()}/share/${creation.id}`;
        
        const creationTitle = creation.title || 'Untitled Creation';
        const creationType = creation.type || 'song';
        
        let emailSent = false;
        let smsSent = false;
        const errors: string[] = [];
        
        if (delivery.recipientEmail) {
          try {
            await sendCreationShareEmail(
              delivery.recipientEmail,
              creationTitle,
              shareLink,
              creationType,
              senderName
            );
            emailSent = true;
            console.log(`[Scheduler] Email sent for delivery ${delivery.id} to ${delivery.recipientEmail}`);
          } catch (error: any) {
            console.error(`[Scheduler] Email failed for delivery ${delivery.id}:`, error.message);
            errors.push(`Email: ${error.message}`);
          }
        }
        
        if (delivery.recipientPhone && isTwilioConfigured()) {
          try {
            const sent = await sendCreationShareSMS(
              delivery.recipientPhone,
              creationTitle,
              shareLink,
              creationType,
              senderName
            );
            smsSent = sent;
            if (sent) {
              console.log(`[Scheduler] SMS sent for delivery ${delivery.id} to ${delivery.recipientPhone}`);
            }
          } catch (error: any) {
            console.error(`[Scheduler] SMS failed for delivery ${delivery.id}:`, error.message);
            errors.push(`SMS: ${error.message}`);
          }
        }
        
        if (emailSent || smsSent) {
          await storage.updateScheduledDelivery(delivery.id, { 
            status: 'sent',
            deliveredAt: new Date()
          });
          console.log(`[Scheduler] Delivery ${delivery.id} marked as sent`);
        } else if (errors.length > 0) {
          await storage.updateScheduledDelivery(delivery.id, { 
            status: 'failed',
            failureReason: errors.join('; ')
          });
          console.log(`[Scheduler] Delivery ${delivery.id} marked as failed`);
        }
        
      } catch (error: any) {
        console.error(`[Scheduler] Error processing delivery ${delivery.id}:`, error.message);
        await storage.updateScheduledDelivery(delivery.id, { 
          status: 'failed',
          failureReason: error.message || 'Unknown error'
        });
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error fetching pending deliveries:', error);
  }
}

let schedulerInterval: NodeJS.Timeout | null = null;

export function startScheduler(intervalMs: number = 60000) {
  if (schedulerInterval) {
    console.log('[Scheduler] Already running');
    return;
  }
  
  console.log(`[Scheduler] Starting with ${intervalMs}ms interval`);
  
  processScheduledDeliveries();
  
  schedulerInterval = setInterval(processScheduledDeliveries, intervalMs);
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[Scheduler] Stopped');
  }
}
