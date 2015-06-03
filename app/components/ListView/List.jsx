/** @jsx React.DOM */
var React   = require("react");
var Item = require('../ListView/Item.jsx');
var d3 = require('d3');


var _selectedKey, _selectedDate, currentData;
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
  shouldComponentUpdate: function(nextProps, nextState) {
    return true;
  },

  componentDidUpdate: function() {
    if (this.props.selectedKey !== _selectedKey) {
      _selectedKey = this.props.selectedKey;

      // only jump to top when we have a new selectedKey
      if (_selectedKey) {
        var storyContainer = React.findDOMNode(this.refs.storyContainer);
        storyContainer.scrollTop = 0;
      }

    }

    if (this.props.selectedDate && _selectedKey) {
      // make key
      var d = [this.props.selectedDate.getMonth()+1, this.props.selectedDate.getDate(), this.props.selectedDate.getFullYear()].join('');
      var anchor = document.getElementsByName(d);

      if (anchor && anchor.length) {
        d3.selectAll('.storyview-item').classed('highlighted', false);
        d3.select(anchor[0]).classed('highlighted', true);

        var top = anchor[0].offsetTop;
        if (top) {
          var dom  = React.findDOMNode(this.refs.storyContainer);
          dom.scrollTop = top;
        }
      }
    }
  },

  renderItems: function() {
    var that = this;
    return this.props.items.map(function(item) {
            var selected = (item.key == that.props.selectedKey) ? true : false;
            return <Item key={item.key} item={item} selected={selected} />;
        });
  },

  renderStories: function() {
    if (!this.props.selectedKey) return "";
    var that = this;

    var selectedStories = this.props.items.filter(function(item){
      return item.key == that.props.selectedKey;
    });

    if (!selectedStories.length) return "";

    var trailCSS = selectedStories[0].trail.toLowerCase().replace(' ', '-');
    return selectedStories[0].values.map(function(item) {
        var dt = [item.date.getMonth()+1, item.date.getDate(), item.date.getFullYear()].join('/');

        return (
          <div key={item['cartodb_id']} className={"storyview-item " + trailCSS}>
          <a name={item.datestamp}><span className="circle"></span>{dt}</a>
          <p className="storyview-entry">{item.entry}</p>
          </div>
          );
    });



  },

  render: function() {
    var hgt = (this.props.height) ?  this.props.height + 'px' : '100%';
    var baseClass = 'component list-view';
    baseClass += (this.props.selectedKey) ? ' selected' : '';

    return (
      <div className={baseClass} style={{height: hgt}}>
        <div className="list-view-wrapper">
          <ul className="list-group">
            {this.renderItems()}
          </ul>
          <div ref="storyContainer" className="storyview">
            <div className="storyview-content">
              {this.renderStories()}
            </div>
          </div>
        </div>
      </div>
    );

  }

});

module.exports = List;