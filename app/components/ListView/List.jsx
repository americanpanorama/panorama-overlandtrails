/** @jsx React.DOM */
var React   = require("react");
var Item = require('../ListView/Item.jsx');
var d3 = require('d3');
var helpers = require("../../utils/helpers");


var _selectedKey, _selectedDate, currentData, currentDate, currentScrollDatestamp, datestampToItem, storiesDirty;
var anchors = [];
var anchorsDT;
var cached = {};
var storyEntryDateFormatter = d3.time.format('%B %e, %Y');

// helper function to make date stamps
var createDateStamp = helpers.createDateStamp;

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
      cached.anchors = {};
      d3.select(cached.storyContainer).selectAll('.storyview-item').each(function(item){
        anchors.push({
          top: this.offsetTop,
          datestamp: this.getAttribute('data-datestamp')
        });
        cached.anchors[this.getAttribute('data-datestamp')] = d3.select(this).select('a');
      });

      if (anchors.length) {
        anchorsDT = _selectedKey;
        if (currentDate) {
          var d = createDateStamp(this.props.selectedDate);
          currentScrollDatestamp = d;
        } else {
          currentScrollDatestamp = anchors[0].datestamp;
        }
      } else {
        currentScrollDatestamp = null;
      }
    }

    if (this.props.selectedKey !== _selectedKey) {
      anchorsDT = null;
      currentScrollDatestamp = null;
      currentDate = null;
      cached.anchors = {};

      _selectedKey = this.props.selectedKey;

      // only jump to top when we have a new selectedKey
      if (_selectedKey) cached.storyContainer.scrollTop = 0;
    }


    if (this.props.selectedDate && _selectedKey && (this.props.selectedDate !== currentDate)) {
      currentDate = this.props.selectedDate;
      // make key
      var d = createDateStamp(this.props.selectedDate);
      var anchor = document.getElementsByName(d);

      if (anchor && anchor.length) {
        d3.selectAll('.storyview-item').classed('highlighted', false);
        d3.select(anchor[0]).classed('highlighted', true);

        var top = anchor[0].offsetTop;
        if (top) cached.storyContainer.scrollTop = top;
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
        this.highlightAnchors();
      } else {
        anchors.forEach(function(item, i){
          if (item.top > top && (item.top - top < 20) ){
            if(currentScrollDatestamp !== item.datestamp) {
              currentScrollDatestamp = item.datestamp;
            }
          }
        });
      }
      if ((prev !== currentScrollDatestamp)){
          this.highlightAnchors();
        if (this.props.onStoryScroll) this.props.onStoryScroll(datestampToItem[currentScrollDatestamp]);
      }
    }
  },

  highlightAnchors: function() {
    if (!cached.anchors) return;

    for(var a in cached.anchors) {
      cached.anchors[a].classed('highlighted', false);
    }
    if (currentScrollDatestamp in cached.anchors) {
      cached.anchors[currentScrollDatestamp].classed('highlighted', true);
    }
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
    var entries =  selectedStories[0].values
      .filter(function(d){
        return d.entry.length > 1;
      })
      .sort(function(a,b){
        return d3.ascending(a.date, b.date);
      })
      .map(function(item) {
        var dt = createDateStamp(item.date);
        datestampToItem[item.datestamp] = item;

        return (
          <div key={item['cartodb_id']} className={"storyview-item " + trailCSS} data-datestamp={item.datestamp}>
          <a name={item.datestamp}><span className="circle"></span>{storyEntryDateFormatter(item.date)}</a>
          <p className="storyview-entry">{item.entry}</p>
          </div>
          );
      });

    if (selectedStories[0].citation.url) {
      entries.push((<div key={"citation-"+selectedStories[0].key} className="citiation storyview-entry"><a href={selectedStories[0].citation.url} target="_blank">{selectedStories[0].citation.text}</a></div>));
    } else {
      entries.push((<div key={"citation-"+selectedStories[0].key} className="citiation storyview-entry">{selectedStories[0].citation.text}</div>));
    }


    return entries;
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