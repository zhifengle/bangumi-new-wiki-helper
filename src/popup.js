import React from 'react';
import ReactDOM from 'react-dom';
import browser from 'webextension-polyfill';
import './css/index.less';

import CheckList from './CheckList';

const SelectItem = (props) => {
  let options = null;
  if (props.items) {
    let c = { ...props.items };
    options = Object.keys(c).map((key) => {
      return (<option
        value={key}
        key={key}>
        {c[key].description}
        </option>
    );
    });
  }
  return <li>
    <span>{props.name}</span>
    <select
      className="select-list"
      id={props.selectId}
      value={props.value}
      onChange={props.onChange}
    >
      {options}
    </select>
  </li>;
};

class Popup extends React.Component {
  constructor(props) {
    super(props);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSelectChange = this.handleSelectChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.state = {
      configs: null,
      currentConfig: null,
      searchSubject: true,
      newSubjectType: 1,
      bangumiDomain: 'bgm.tv'
    };
  }

  handleInputChange(e) {
    if (e.target.id === "search-subject") {
      browser.storage.local.set({
        searchSubject: e.target.checked
      });
      this.setState({
        searchSubject: e.target.checked
      });
    }
  }
  // @TODO: 统一保存设置，当popup 失去焦点
  handleSelectChange(e) {
    if (e.target.id === "model-config") {
      browser.storage.local.set({
        currentConfig: e.target.value
      });
      this.setState({
        currentConfig: e.target.value
      });
    }
    if (e.target.id === "type-config") {
      browser.storage.local.set({
        newSubjectType: e.target.value
      });
      this.setState({
        newSubjectType: e.target.value
      });
    }
    if (e.target.id === "domain-config") {
      browser.storage.local.set({
        bangumiDomain: e.target.value
      });
      this.setState({
        bangumiDomain: e.target.value
      });
    }
  }

  handleClick(e) {
    browser.storage.local.set({
      subjectCover: null,
      subjectInfoList: null,
    });
    console.log('clear storage success!');
  }

  componentDidMount() {
    browser.storage.local.get()
      .then(obj => {
        // var configs = {};
        // for (const prop in obj) {
        //   if (obj[prop].type === 'config') {
        //     configs[prop] = obj[prop];
        //   }
        // }
        this.setState({
          configs: obj.configModel,
          currentConfig: obj.currentConfig,
          searchSubject: obj.searchSubject,
          newSubjectType: obj.newSubjectType,
          bangumiDomain: obj.bangumiDomain
        });
      });
  }

  render() {
    const {configs, currentConfig} = this.state;
    const typeItems = {
      '1': {
        description: '图书'
      },
      '2': {
        description: '动画'
      },
      '3': {
        description: '音乐'
      },
      '4': {
        description: '游戏'
      }
    };
    const domainItems = {
      'bgm.tv': {
        description: 'bgm.tv'
      },
      'bangumi.tv': {
        description: 'bangumi.tv'
      }
    };
    return (
      <div>
        <h1>设置</h1>
        <div className="setting-container">
          <ul>
            <CheckList
              onChange={(e) => this.handleInputChange(e)}
              pageId="search-subject"
              name="检测条目是否存在"
              checked={this.state.searchSubject}
            />
            <SelectItem
              name="选择配置"
              selectId="model-config"
              value={currentConfig}
              onChange={this.handleSelectChange}
              items={configs}
            />
            <SelectItem
              name="条目类型"
              items={typeItems}
              value={this.state.newSubjectType}
              onChange={this.handleSelectChange}
              selectId="type-config" />
            <SelectItem
              name="Bangumi域名"
              items={domainItems}
              value={this.state.bangumiDomain}
              onChange={this.handleSelectChange}
              selectId="domain-config" />
            <li>
              <input
                onClick={this.handleClick}
                type="button" value="清空缓存"/>
            </li>
          </ul>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Popup/>, document.getElementById('app'));
