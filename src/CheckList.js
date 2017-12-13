import React, {Component} from 'react';

class CheckList extends Component {
  render() {
    return (
      <li>
        <input
          onChange={(e) => this.props.onChange(e)}
          name="pageId" id={this.props.pageId}
          type="checkbox"
          checked={this.props.checked ? "checked" : ""}
        />
        <label htmlFor={this.props.pageId}>
          <span>{this.props.name}</span>
          <i className="checkbox-circle" />
        </label>
      </li>
    );
  }
}
export default CheckList;
