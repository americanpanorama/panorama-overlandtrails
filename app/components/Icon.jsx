/** @jsx React.DOM */
var React   = require("react");

var Icon = React.createClass({

  render: function() {
    return (
      <span className={"icon " + this.props.iconName} aria-hidden="true"/>
    );

  }

});

module.exports = Icon;