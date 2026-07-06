import { RestProjectRepository } from './RestProjectRepository';
import { RestTaskRepository } from './RestTaskRepository';
import { RestMeetingRepository } from './RestMeetingRepository';
import { RestCatalogRepository } from './RestCatalogRepository';
import { RestInvitationRepository } from './RestInvitationRepository';

import { FirestoreProjectRepository } from './FirestoreProjectRepository';
import { FirestoreTaskRepository } from './FirestoreTaskRepository';
import { FirestoreMeetingRepository } from './FirestoreMeetingRepository';
import { FirestoreCatalogRepository } from './FirestoreCatalogRepository';
import { FirestoreInvitationRepository } from './FirestoreInvitationRepository';

class RepositoryFactory {
  static isFirebaseMode() {
    return import.meta.env.VITE_DATA_MODE === 'firebase';
  }

  static getProjectRepository() {
    return this.isFirebaseMode() ? new FirestoreProjectRepository() : new RestProjectRepository();
  }

  static getTaskRepository() {
    return this.isFirebaseMode() ? new FirestoreTaskRepository() : new RestTaskRepository();
  }

  static getMeetingRepository() {
    return this.isFirebaseMode() ? new FirestoreMeetingRepository() : new RestMeetingRepository();
  }

  static getCatalogRepository() {
    return this.isFirebaseMode() ? new FirestoreCatalogRepository() : new RestCatalogRepository();
  }

  static getInvitationRepository() {
    return this.isFirebaseMode() ? new FirestoreInvitationRepository() : new RestInvitationRepository();
  }
}

export default RepositoryFactory;
export { RepositoryFactory };
