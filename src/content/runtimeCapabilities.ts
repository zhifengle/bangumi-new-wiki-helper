import { RuntimeCapabilities } from '../runtime/capabilities';
import { contentDraftStore } from './draftStore';
import { backgroundMessageClient } from './messageClient';

export const contentRuntimeCapabilities: RuntimeCapabilities = {
  transport: {
    fetchHtml(url: string) {
      return backgroundMessageClient.fetchHtml(url);
    },
    fetchImage(url: string, headers?: Record<string, string>) {
      return backgroundMessageClient.fetchImage(url, headers);
    },
  },
  storage: contentDraftStore,
  subjectCreation: {
    checkSubjectExist(payload) {
      return backgroundMessageClient.checkSubjectExist(payload);
    },
    createNewSubject(payload) {
      return backgroundMessageClient.createNewSubject(payload);
    },
    createNewCharacter() {
      return backgroundMessageClient.createNewCharacter();
    },
  },
};
