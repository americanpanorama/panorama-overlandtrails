/** @jsx React.DOM */
var React   = require("react");
var Item = require('../ListView/Item.jsx');

//
// Button Group
//
var List = React.createClass({

  getInitialState: function () {
    return {items: []};
  },


  componentDidMount: function() {

  },

  componentWillUnmount: function() {

  },

  componentWillReceiveProps: function(nextProps) {

  },

  componentDidUpdate: function() {

  },

  renderItems: function() {
    return this.props.items.map(function(item) {
            return <Item key={item.key} item={item} />;
        });
  },

  render: function() {

    return (
      <div className="component list-view">
        <div className="list-view-wrapper">
          <ul className="list-group">
            {this.renderItems()}
          </ul>
        </div>
      </div>
    );

  }

});

module.exports = List;