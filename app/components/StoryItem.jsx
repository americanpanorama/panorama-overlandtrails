var d3 = require('d3');
var React = require("react");

var storyEntryDateFormatter = d3.time.format('%B %e, %Y');

var StoryItem = React.createClass({

  getInitialState: function () {
    return {
      expanded: false
    };
  },

  onDateClick: function (e) {
    this.setState({ expanded: !this.state.expanded });
    this.props.onClick(e);
  },

  onExpanderClick: function () {
    this.setState({ expanded: !this.state.expanded });
  },

  render: function () {
    return (
      <div className={"storyview-item " + this.props.trailCSS} data-datestamp={this.props.datestamp}>
        <div className="storyview-item-header">
          <a name={this.props.datestamp} className={this.props.highlighted} data-date={this.props.ts} onClick={this.onDateClick}>
            <span className="circle"></span>
            {storyEntryDateFormatter(this.props.date)}
          </a>
          <a className="storyview-item-expander icon right-arrow" onClick={this.onExpanderClick}></a>
        </div>
        {this.state.expanded &&
          <p className="storyview-entry">{this.props.entry}</p>
        }
      </div>
    );
  }
});

module.exports = StoryItem;
