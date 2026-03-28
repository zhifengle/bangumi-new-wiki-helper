import { LogMsg } from '../interface/types';
import {
  CheckSubjectExistPayload,
  CreateNewSubjectPayload,
} from '../interface/messages';
import { DraftStore } from './draftStore';

export type RuntimeFetchHeaders = Record<string, string>;

export interface RuntimeTransport {
  fetchHtml(url: string): Promise<string>;
  fetchImage?(url: string, headers?: RuntimeFetchHeaders): Promise<string>;
}

export interface RuntimeNavigator {
  openTab(url: string): Promise<void>;
}

export type RuntimeNotifyPayload = LogMsg & Record<string, string | number>;

export interface RuntimeNotifier {
  notify(message: RuntimeNotifyPayload): void | Promise<void>;
}

export interface RuntimeCapabilities {
  transport: RuntimeTransport;
  storage: DraftStore;
  navigator?: RuntimeNavigator;
  notifier?: RuntimeNotifier;
  subjectCreation?: {
    checkSubjectExist(payload: CheckSubjectExistPayload): Promise<void>;
    createNewSubject(payload: CreateNewSubjectPayload): Promise<void>;
    createNewCharacter(): Promise<void>;
  };
}
