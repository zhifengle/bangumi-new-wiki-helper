import {
  CheckSubjectAndOpenPayload,
  CreateSubjectEntryPayload,
} from './subjectCreation';

export type BackgroundFetchHeaders = Record<string, string>;

export type CheckSubjectExistMessage = {
  action: 'check_subject_exist';
  payload: CheckSubjectAndOpenPayload;
};

export type CreateNewSubjectMessage = {
  action: 'create_new_subject';
  payload: CreateSubjectEntryPayload;
};

export type CreateNewCharacterMessage = {
  action: 'create_new_character';
};

export type FetchImageMessage = {
  action: 'fetch_data_bg';
  payload: {
    type: 'img';
    url: string;
    headers?: BackgroundFetchHeaders;
  };
};

export type FetchHtmlMessage = {
  action: 'fetch_data_bg';
  payload: {
    type: 'html';
    url: string;
  };
};

export type BackgroundFetchMessage = FetchImageMessage | FetchHtmlMessage;

export type BackgroundMessage =
  | CheckSubjectExistMessage
  | CreateNewSubjectMessage
  | CreateNewCharacterMessage
  | BackgroundFetchMessage;

export type CheckSubjectExistPayload = CheckSubjectExistMessage['payload'];
export type CreateNewSubjectPayload = CreateNewSubjectMessage['payload'];

export type BackgroundMessageResult<T extends BackgroundMessage> =
  T extends BackgroundFetchMessage ? string : void;
