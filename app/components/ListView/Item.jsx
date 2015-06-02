/** @jsx React.DOM */
var React   = require("react");
var d3 = require('d3');
var Actions = require("../../actions/app");
var dateFormat = d3.time.format("%x");
var Icon = require("../Icon.jsx");

var Item = React.createClass({

  toggle: function() {
    //console.log('click: ', this.props.item);
    Actions.listItemSelected({content: {
        key: this.props.item.key,
        selected: !this.props.selected
      }
    });
  },

  render: function() {
    var trailClass = this.props.item.trail.toLowerCase().replace(' ', '-');
    var selectedClass = (this.props.selected) ? " selected" : "";

    return (
      <li className={"list-group-item pointer " + trailClass + selectedClass} onClick={this.toggle}>
        <div className="list-group-disabler"></div>

        <div className="icon-spot"><Icon iconName={"writer " + trailClass + " " + this.props.item.gender}/></div>
        <div className="list-group-item-content">
          <p><span className="item-name">{this.props.item.name}</span> - <span className="item-trail">{this.props.item.trail}</span></p>
          <p className="item-meta">Diary begins {dateFormat(this.props.item.begins)} <span className="item-count">({this.props.item.values.length} entries)</span></p>
        </div>
        <Icon iconName="right-arrow"/>


      </li>
    );

  }

});

module.exports = Item;