import invitationApi from '../api/invitation.api';
import { retryRequest } from './utils/retry';
import { publishMetrics } from './utils/metrics';
import { workspaceEventBus } from '../application/session';
import { MutationLock } from './utils/MutationLock';

export class RestInvitationRepository {
  constructor() {
    this.lock = new MutationLock();
  }

  async create(workspaceId, data) {
    const lockKey = data.email || `inv_${Date.now()}`;
    return await this.lock.acquire(lockKey, async () => {
      const startTime = performance.now();
      try {
        const result = await retryRequest(async () => {
          return await invitationApi.createInvitation(data);
        });
        
        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'invitation:create',
          duration,
          success: true,
          workspaceId,
          entityId: result?.data?.invitation?.id
        });

        if (workspaceEventBus) {
          workspaceEventBus.emit('invitation.created', result?.data?.invitation);
        }

        return result?.data?.invitation || result;
      } catch (error) {
        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'invitation:create',
          duration,
          success: false,
          workspaceId,
          error: error.message
        });
        throw error;
      }
    }, data);
  }

  async listByWorkspace(workspaceId) {
    try {
      const result = await retryRequest(async () => {
        return await invitationApi.getWorkspaceInvitations();
      });
      return result?.data?.invitations || [];
    } catch (error) {
      console.error('Failed to list workspace invitations:', error);
      return [];
    }
  }

  async listMy() {
    try {
      const result = await retryRequest(async () => {
        return await invitationApi.getMyInvitations();
      });
      return result?.data?.invitations || [];
    } catch (error) {
      console.error('Failed to list my invitations:', error);
      return [];
    }
  }

  async validateToken(token) {
    try {
      const result = await invitationApi.validateToken(token);
      return result?.data || null;
    } catch (error) {
      throw error;
    }
  }

  async accept(idOrToken) {
    try {
      const result = await retryRequest(async () => {
        return await invitationApi.acceptInvitation(idOrToken);
      });
      
      if (workspaceEventBus) {
        workspaceEventBus.emit('invitation.accepted', { idOrToken });
      }

      return result?.data || result;
    } catch (error) {
      throw error;
    }
  }

  async decline(idOrToken) {
    try {
      const result = await retryRequest(async () => {
        return await invitationApi.declineInvitation(idOrToken);
      });
      
      if (workspaceEventBus) {
        workspaceEventBus.emit('invitation.declined', { idOrToken });
      }

      return result?.data || null;
    } catch (error) {
      throw error;
    }
  }

  async cancel(id) {
    try {
      const result = await retryRequest(async () => {
        return await invitationApi.cancelInvitation(id);
      });
      
      if (workspaceEventBus) {
        workspaceEventBus.emit('invitation.cancelled', { id });
      }

      return result?.data || null;
    } catch (error) {
      throw error;
    }
  }

  async resend(id, data = {}) {
    try {
      const result = await retryRequest(async () => {
        return await invitationApi.resendInvitation(id, data);
      });
      
      if (workspaceEventBus) {
        workspaceEventBus.emit('invitation.resent', result?.data?.invitation);
      }

      return result?.data?.invitation || result;
    } catch (error) {
      throw error;
    }
  }

  subscribe(workspaceId, callback) {
    return () => {};
  }

  unsubscribe() {}
}
