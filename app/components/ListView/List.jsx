/** @jsx React.DOM */
var React   = require("react");
var Item = require('../ListView/Item.jsx');
var d3 = require('d3');


var _selectedKey, _selectedDate, currentData, currentDate, currentScrollDatestamp, datestampToItem, storiesDirty;
var anchors = [];
var anchorsDT;
var cached = {};
var List = React.createClass({

  getInitialState: function () {
    return {items: []};
  },


  componentDidMount: function() {
    cached.storyContainer = React.findDOMNode(this.refs.storyContainer);
    cached.storyContainer.addEventListener('scroll', this.handleScroll, false);
  },

  componentWillUnmount: function() {
    cached.storyContainer.removeEventListener('scroll', this.handleScroll, false);
  },

  componentWillReceiveProps: function(nextProps) {

  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return true;
  },

  componentDidUpdate: function() {

    if (storiesDirty && (anchorsDT !== _selectedKey)) {
      storiesDirty = false;
      anchors = [];
      d3.select(cached.storyContainer).selectAll('.storyview-item').each(function(item){
        anchors.push({
          top: this.offsetTop,
          datestamp: this.getAttribute('data-datestamp')
        });
      });

      if (anchors.length) anchorsDT = _selectedKey;

      currentScrollDatestamp = (anchors.length) ? anchors[0].datestamp : null;
    }

    if (this.props.selectedKey !== _selectedKey) {
      anchorsDT = null;
      currentScrollDatestamp = null;

      _selectedKey = this.props.selectedKey;

      // only jump to top when we have a new selectedKey
      if (_selectedKey) cached.storyContainer.scrollTop = 0;
    }

    if ((this.props.selectedDate && _selectedKey)) {
      if (this.props.selectedDate !== currentDate) {

      }
      currentDate = this.props.selectedDate;
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

  handleScroll: function() {
    //console.log(cached.storyContainer.scrollTop);
    var top = cached.storyContainer.scrollTop;
    var prev = currentScrollDatestamp;
    if (anchors) {
      if (top === 0) {
        currentScrollDatestamp = anchors[0].datestamp;
      } else {
        anchors.forEach(function(item, i){
          if (item.top > top && (item.top - top < 20) ){
            if(currentScrollDatestamp !== item.datestamp) {
              currentScrollDatestamp = item.datestamp;
            }
          }
        });
      }
      if ((prev !== currentScrollDatestamp) && this.props.onStoryScroll) this.props.onStoryScroll(datestampToItem[currentScrollDatestamp]);
    }
    //console.log('scroll')
    //this.refs.storyContent.getDOMNode().style.top = document.documentElement.scrollTop + 'px';
  },

  renderItems: function() {
    var that = this;
    return this.props.items.map(function(item) {
            var selected = (item.key == that.props.selectedKey) ? true : false;
            return <Item key={item.key} item={item} selected={selected} onItemClick={that.props.onListItemClick} />;
        });
  },

  renderStories: function() {
    if (!this.props.selectedKey) return "";
    var that = this;

    var selectedStories = this.props.items.filter(function(item){
      return item.key == that.props.selectedKey;
    });

    datestampToItem = {};

    if (!selectedStories.length) return "";
    storiesDirty = true;

    var trailCSS = selectedStories[0].trail.toLowerCase().replace(' ', '-');
    return selectedStories[0].values
      .sort(function(a,b){
        return d3.ascending(a.date, b.date);
      })
      .map(function(item) {
        var dt = [item.date.getMonth()+1, item.date.getDate(), item.date.getFullYear()].join('/');
        datestampToItem[item.datestamp] = item;

        return (
          <div key={item['cartodb_id']} className={"storyview-item " + trailCSS} data-datestamp={item.datestamp}>
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
            <div ref="storyContent" className="storyview-content">
              {this.renderStories()}
            </div>
          </div>
        </div>
      </div>
    );

  }

});

module.exports = List;