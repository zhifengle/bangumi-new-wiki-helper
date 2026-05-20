import { Notyf, NotyfNotification } from 'notyf';
import { LogMsg } from '../interface/types';

let notyf: Notyf | null = null;
const NOTYF_LIST: NotyfNotification[] = [];

function waitForBody() {
  if (document.body) {
    return Promise.resolve(true);
  }
  if (document.readyState !== 'loading') {
    return Promise.resolve(false);
  }
  return new Promise<boolean>((resolve) => {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        resolve(!!document.body);
      },
      { once: true }
    );
  });
}

async function getNotyf() {
  if (notyf) {
    return notyf;
  }
  if (!(await waitForBody())) {
    return null;
  }
  notyf = new Notyf({
    duration: 3000,
    types: [
      {
        type: 'success',
        // background: '#F09199',
      },
      {
        type: 'info',
        background: '#F09199',
      },
      {
        type: 'error',
        duration: 0,
        dismissible: true,
      },
    ],
    position: {
      x: 'right',
      y: 'top',
    },
  });
  return notyf;
}

export async function logMessage(
  request: LogMsg & Record<string, string | number>
) {
  if (request.cmd === 'dismissAll') {
    notyf?.dismissAll();
    NOTYF_LIST.length = 0;
  } else if (request.cmd === 'dismissNotError') {
    for (const obj of NOTYF_LIST) {
      obj && notyf?.dismiss(obj);
    }
    NOTYF_LIST.length = 0;
  }
  // 消息为空时
  if (request.message === '') {
    return;
  }
  const notyfInstance = await getNotyf();
  if (!notyfInstance) {
    return;
  }
  let newNotyf: NotyfNotification | undefined;
  switch (request.type) {
    case 'succuss':
      newNotyf = notyfInstance.success(request);
      break;
    case 'error':
      notyfInstance.error(request);
      break;
    case 'info':
      newNotyf = notyfInstance.open(request);
      // notyf.success(request.msg);
      break;
  }
  newNotyf && NOTYF_LIST.push(newNotyf);
}
