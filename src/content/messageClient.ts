import browser from 'webextension-polyfill';
import {
  BackgroundFetchHeaders,
  BackgroundMessage,
  BackgroundMessageResult,
  CheckPersonExistPayload,
  CheckSubjectExistPayload,
  CreateNewSubjectPayload,
} from '../interface/messages';

function sendBackgroundMessage<T extends BackgroundMessage>(
  message: T
): Promise<BackgroundMessageResult<T>> {
  return browser.runtime.sendMessage(message) as Promise<
    BackgroundMessageResult<T>
  >;
}

export const backgroundMessageClient = {
  checkSubjectExist(payload: CheckSubjectExistPayload) {
    return sendBackgroundMessage({
      action: 'check_subject_exist',
      payload,
    });
  },
  createNewSubject(payload: CreateNewSubjectPayload) {
    return sendBackgroundMessage({
      action: 'create_new_subject',
      payload,
    });
  },
  createNewCharacter() {
    return sendBackgroundMessage({
      action: 'create_new_character',
    });
  },
  checkPersonExist(payload: CheckPersonExistPayload) {
    return sendBackgroundMessage({
      action: 'check_person_exist',
      payload,
    });
  },
  createNewPerson() {
    return sendBackgroundMessage({
      action: 'create_new_person',
    });
  },
  fetchHtml(url: string) {
    return sendBackgroundMessage({
      action: 'fetch_data_bg',
      payload: {
        type: 'html',
        url,
      },
    });
  },
  fetchImage(url: string, headers?: BackgroundFetchHeaders) {
    return sendBackgroundMessage({
      action: 'fetch_data_bg',
      payload: {
        type: 'img',
        url,
        headers,
      },
    });
  },
};
