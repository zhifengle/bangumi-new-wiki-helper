import 'whatwg-fetch'

function gmFetchBinary(url, TIMEOUT = 10 * 1000) {
  return _fetch(fetch(url, {
      method: 'GET',
      credentials: 'include',
      mode: 'cors',
      cache: 'default'
    }), TIMEOUT)
    .then(
      response => response.blob(),
      err => console.log('fetch err: ', err)
    );
}

function _fetch(fetch_promise, TIMEOUT) {
  var abort_fn = null;

  //这是一个可以被reject的promise
  var abort_promise = new Promise(function(resolve, reject) {
    abort_fn = function() {
      reject('abort promise');
    };
  });

  //这里使用Promise.race，以最快 resolve 或 reject 的结果来传入后续绑定的回调
  var abortable_promise = Promise.race([
    fetch_promise,
    abort_promise
  ]);

  setTimeout(function() {
    abort_fn();
  }, TIMEOUT);

  return abortable_promise;
}
function gmFetch(url, TIMEOUT = 10 * 1000) {

  return _fetch(fetch(url, {
      method: 'GET',
      credentials: 'include',
      mode: 'cors',
      cache: 'default'
    }), TIMEOUT)
    .then(
      response => response.text(),
      err => console.log('fetch err: ', err)
    );
}

module.exports = {
  gmFetch,
  gmFetchBinary
};
