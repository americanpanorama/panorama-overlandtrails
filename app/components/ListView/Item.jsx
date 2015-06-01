/** @jsx React.DOM */
var React   = require("react");
var d3 = require('d3');

var dateFormat = d3.time.format("%x");

var Item = React.createClass({

  toggle: function() {
    console.log('click: ', this.props.item);
  },

  render: function() {
    var trailClass = this.props.item.trail.toLowerCase().replace(' ', '-');

    return (
      <li className={"list-group-item pointer " + trailClass} onClick={this.toggle}>
        <div className="list-group-disabler"></div>
        <p><span className="item-name">{this.props.item.name}</span> - <span className="item-trail">{this.props.item.trail}</span></p>
        <p>Diary begins {dateFormat(this.props.item.begins)} ({this.props.item.values.length} entries)</p>
      </li>
    );

  }

});

module.exports = Item;