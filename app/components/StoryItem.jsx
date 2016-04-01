var d3 = require('d3');
var React = require("react");

var storyEntryDateFormatter = d3.time.format('%B %e, %Y');

var StoryItem = React.createClass({

  getInitialState: function () {
    return {};
  },

  render: function() {
    return (
      <div className={"storyview-item " + this.props.trailCSS} data-datestamp={this.props.datestamp}>
        <a name={this.props.datestamp} className={this.props.highlighted} data-date={this.props.ts} onClick={this.props.onClick}><span className="circle"></span>{storyEntryDateFormatter(this.props.date)}</a>
        <p className="storyview-entry">{this.props.entry}</p>
      </div>
    );
  }
});

module.exports = StoryItem;
