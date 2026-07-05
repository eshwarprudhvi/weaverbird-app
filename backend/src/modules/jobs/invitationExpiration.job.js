const cron = require('node-cron');
const invitationRepo = require('../invitation/invitation.repository');
const EventBus = require('../../shared/services/EventBus');
const logger = require('../../config/logger');

class InvitationExpirationJob {
  constructor() {
    this.scheduleJob();
  }

  scheduleJob() {
    // Run daily at midnight
    cron.schedule('0 0 * * *', async () => {
      logger.info('Running InvitationExpirationJob...');
      try {
        const expiredInvitations = await invitationRepo.getExpiredPendingInvitations();
        
        for (const invitation of expiredInvitations) {
          await invitationRepo.updateStatus(invitation.id, 'expired', 'expiredAt');
          
          EventBus.publish('invitation.expired', {
            invitationId: invitation.id,
            workspaceId: invitation.workspaceId
          });
        }
        
        logger.info(`InvitationExpirationJob completed. Expired ${expiredInvitations.length} invitations.`);
      } catch (error) {
        logger.error({ error }, 'Failed to run InvitationExpirationJob');
      }
    });
  }
}

module.exports = new InvitationExpirationJob();
