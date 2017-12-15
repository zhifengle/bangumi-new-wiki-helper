import React from 'react';
import ReactDOM from 'react-dom';
import browser from 'webextension-polyfill';
import models from './models';
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
      configs: models.configModel,
      currentConfig: null,
      searchSubject: true,
      newSubjectType: 1,
      bangumiDomain: 'bgm.tv',
      activeOpen: false
    };
  }

  handleInputChange(e) {
    if (e.target.id) {
      browser.storage.local.set({
        [e.target.id]: e.target.checked
      });
      this.setState({
        [e.target.id]: e.target.checked
      });
    }
  }
  // @TODO: 统一保存设置，当popup 失去焦点
  handleSelectChange(e) {
    if (e.target.id) {
      browser.storage.local.set({
        [e.target.id]: e.target.value
      });
      this.setState({
        [e.target.id]: e.target.value
      });
    }
  }

  handleClick(e) {
    browser.storage.local.set({
      subjectCover: null,
      subjectInfoList: null,
    });
    console.info('clear storage success!');
  }

  componentDidMount() {
    browser.storage.local.get([
      'currentConfig',
      'bangumiDomain', 'activeOpen', 'newSubjectType',
      'searchSubject'])
      .then(obj => {
        // var configs = {};
        // for (const prop in obj) {
        //   if (obj[prop].type === 'config') {
        //     configs[prop] = obj[prop];
        //   }
        // }
        console.log('obj: ', obj);
        this.setState({
          ...obj
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
              pageId="searchSubject"
              name="检测条目是否存在"
              checked={this.state.searchSubject}
            />
            <CheckList
              onChange={(e) => this.handleInputChange(e)}
              pageId="activeOpen"
              name="前台打开标签"
              checked={this.state.activeOpen}
            />
            <SelectItem
              name="选择配置"
              selectId="currentConfig"
              value={currentConfig}
              onChange={this.handleSelectChange}
              items={configs}
            />
            <SelectItem
              name="条目类型"
              items={typeItems}
              value={this.state.newSubjectType}
              onChange={this.handleSelectChange}
              selectId="newSubjectType" />
            <SelectItem
              name="Bangumi域名"
              items={domainItems}
              value={this.state.bangumiDomain}
              onChange={this.handleSelectChange}
              selectId="bangumiDomain" />
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
