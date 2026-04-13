/**
 * 下载内容
 * https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
 * @example
 * download(csvContent, 'dowload.csv', 'text/csv;encoding:utf-8');
 * BOM: data:text/csv;charset=utf-8,\uFEFF
 * @param content 内容
 * @param fileName 文件名
 * @param mimeType 文件类型
 */
export function downloadFile(
  content: BlobPart | BlobPart[],
  fileName: string,
  mimeType: string = 'application/octet-stream'
) {
  const a = document.createElement('a');
  const objectUrl = URL.createObjectURL(
    new Blob(Array.isArray(content) ? content : [content], {
      type: mimeType,
    })
  );
  a.href = objectUrl;
  a.style.display = 'none';
  a.setAttribute('download', fileName);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}
