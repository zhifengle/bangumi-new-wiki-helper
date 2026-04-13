export function insertLogInfo($sibling: Element, txt: string): Element {
  const $log = document.createElement('div');
  $log.classList.add('e-wiki-log-info');
  $log.innerHTML = txt;
  if ($sibling.parentElement) {
    $sibling.parentElement.insertBefore($log, $sibling.nextElementSibling);
  }
  return $log;
}
