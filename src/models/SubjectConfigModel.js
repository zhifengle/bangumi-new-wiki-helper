export default class SubjectConfigModel {
  constructor(obj) {
    this.key = obj.key;
    this.description = obj.description;
    this.cover = obj.cover || null;
    this.entrySelector = obj.entrySelector;
    this.targetURL = obj.targetURL;
    this.itemList = [];
    this.type = 'config';
  }
}
