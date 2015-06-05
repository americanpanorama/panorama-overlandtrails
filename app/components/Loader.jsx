/** @jsx React.DOM */
var React   = require("react");

var Icon = React.createClass({

  componentDidUpdate: function() {
    if (this.props.loaded){
      d3.select(React.findDOMNode(this.refs.loader)).classed('mounted', true);
    }
  },

  render: function() {
    return (
      <div ref="loader" className="loading-component">
        <div className="loading-component-inner">
          <div className="loader-text">...</div>
        </div>
      </div>
    );

  }

});

module.exports = Icon;