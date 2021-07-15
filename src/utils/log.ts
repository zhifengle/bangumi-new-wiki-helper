import { Notyf, NotyfNotification } from 'notyf';
import { LogMsg } from '../interface/types';

const notyf = new Notyf({
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
const NOTYF_LIST: NotyfNotification[] = [];
export async function logMessage(
  request: LogMsg & Record<string, string | number>
) {
  if (request.cmd === 'dismissAll') {
    notyf.dismissAll();
    NOTYF_LIST.length = 0;
  } else if (request.cmd === 'dismissNotError') {
    for (const obj of NOTYF_LIST) {
      obj && notyf.dismiss(obj);
    }
    NOTYF_LIST.length = 0;
  }
  // 消息为空时
  if (request.message === '') {
    return;
  }
  let newNotyf: NotyfNotification;
  switch (request.type) {
    case 'succuss':
      newNotyf = notyf.success(request);
      break;
    case 'error':
      notyf.error(request);
      break;
    case 'info':
      newNotyf = notyf.open(request);
      // notyf.success(request.msg);
      break;
  }
  newNotyf && NOTYF_LIST.push(newNotyf);
}
