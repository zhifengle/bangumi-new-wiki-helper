import browser from 'webextension-polyfill';
import {
  BackgroundFetchMessage,
  CheckPersonExistMessage,
  CheckSubjectExistMessage,
  CreateNewPersonMessage,
  CreateNewSubjectMessage,
  CreateNewCharacterMessage,
} from '../interface/messages';
import { RuntimeCapabilities } from '../runtime/capabilities';
import {
  PersonCreationRuntime,
  checkPersonAndOpenEntry,
} from '../runtime/personCreation';
import {
  SubjectCreationRuntime,
  checkSubjectAndOpenEntry,
  createNewSubjectEntry,
} from '../runtime/subjectCreation';

export type SubjectCreationMessage =
  | CheckSubjectExistMessage
  | CreateNewSubjectMessage
  | CreateNewCharacterMessage;

export type SubjectCreationHandlerDeps = {
  checkSubjectEntry?: typeof checkSubjectAndOpenEntry;
  createSubjectEntry?: typeof createNewSubjectEntry;
};

export async function handleFetchMessage(
  request: BackgroundFetchMessage,
  capabilities: RuntimeCapabilities
): Promise<string> {
  const { payload } = request;
  if (payload.type === 'img') {
    return capabilities.transport.fetchImage!(payload.url, payload.headers);
  }
  return capabilities.transport.fetchHtml(payload.url);
}

export async function handleSubjectCreationMessage(
  request: SubjectCreationMessage,
  runtime: SubjectCreationRuntime,
  browserApi: typeof browser,
  activeOpen: boolean,
  deps: SubjectCreationHandlerDeps = {}
): Promise<void> {
  const checkSubjectEntry = deps.checkSubjectEntry ?? checkSubjectAndOpenEntry;
  const createSubjectEntry = deps.createSubjectEntry ?? createNewSubjectEntry;
  switch (request.action) {
    case 'check_subject_exist':
      return checkSubjectEntry(request.payload, runtime);
    case 'create_new_subject':
      return createSubjectEntry(request.payload, runtime);
    case 'create_new_character':
      await browserApi.tabs.create({
        url: `${runtime.bangumi.host}/character/new`,
        active: activeOpen,
      });
      return;
  }
}

export type PersonCreationMessage =
  | CheckPersonExistMessage
  | CreateNewPersonMessage;

export type PersonCreationHandlerDeps = {
  checkPersonEntry?: typeof checkPersonAndOpenEntry;
};

export async function handlePersonCreationMessage(
  request: PersonCreationMessage,
  runtime: PersonCreationRuntime,
  browserApi: typeof browser,
  activeOpen: boolean,
  deps: PersonCreationHandlerDeps = {}
): Promise<void> {
  const checkPersonEntry = deps.checkPersonEntry ?? checkPersonAndOpenEntry;
  switch (request.action) {
    case 'check_person_exist':
      return checkPersonEntry(request.payload, runtime);
    case 'create_new_person':
      await browserApi.tabs.create({
        url: `${runtime.bangumi.host}/person/new`,
        active: activeOpen,
      });
      return;
  }
}
