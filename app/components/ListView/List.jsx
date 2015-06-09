/** @jsx React.DOM */
var React   = require("react");
var Item    = require('../ListView/Item.jsx');
var d3      = require('d3');
var helpers = require("../../utils/helpers");


var _selectedJournal, currentDate, currentScrollDatestamp, datestampToItem, storiesDirty;
var anchors = [];
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
    storiesDirty = false;
    currentScrollDatestamp = null;
    currentDate = null;
    cached.anchors = {};
    datestampToItem = {};
  },

  // logic for how component responds to updates
  componentDidUpdate: function() {

    if (storiesDirty && (this.props.selectedKey !== _selectedJournal)) {
      storiesDirty = false;

      if (!this.isEmpty(this.props.selectedKey)) {
        storiesDirty = false;
        currentScrollDatestamp = null;
        currentDate = null;
        cached.anchors = {};
        datestampToItem = {};
        return;
      }

      // try to make cache
      anchors = [];
      cached.anchors = {};
      d3.select(cached.storyContainer).selectAll('.storyview-item').each(function(item){
        anchors.push({
          top: this.offsetTop,
          datestamp: this.getAttribute('data-datestamp')
        });
        cached.anchors[this.getAttribute('data-datestamp')] = d3.select(this).select('a');
      });

      // check if cache is made
      // if so, represents the initial state of the StoryView
      if (anchors.length) {
        _selectedJournal = this.props.selectedKey;
        currentDate = this.props.selectedDate || null;

        if (currentDate ) {
          var d = createDateStamp(this.props.selectedDate);
          currentScrollDatestamp = d;
        } else {
          currentScrollDatestamp = anchors[0].datestamp;
        }

        this.setStoryPosition(currentScrollDatestamp);

      } else {
        currentScrollDatestamp = null;
      }

    // This should be called when a date changes and we're in StoryView
    } else if (this.props.selectedDate !== currentDate && anchors.length) {
      currentDate = this.props.selectedDate;
      var d = createDateStamp(currentDate);

      if (currentScrollDatestamp !== d) {
        currentScrollDatestamp = d;
        this.setStoryPosition(d);
      }

    }
  },

  // utility to check for empty values
  isEmpty: function(val) {
    if (typeof val === 'undefined' || val === null) return false;
    if (!val.length) return false;
    return true;
  },

  // sets scroll position to a datestamp when
  // a Diarist is selected
  setStoryPosition: function(datestamp) {
    if (datestamp in cached.anchors) {
      var top = cached.anchors[datestamp].node().offsetTop;
      if (top) cached.storyContainer.scrollTop = top;
    }
  },

  // handles storyview scroll
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

      if ((prev !== currentScrollDatestamp)){
        if (this.props.onStoryScroll) this.props.onStoryScroll(datestampToItem[currentScrollDatestamp]);
      }
    }
  },

  // would only need to use this, if the storyview entries
  // aren't be rendered on update
  highlightAnchors: function(datestamp) {
    if (!cached.anchors) return;
    datestamp = datestamp || currentScrollDatestamp;

    for(var a in cached.anchors) {
      cached.anchors[a].classed('highlighted', false);
    }

    if (datestamp in cached.anchors) {
      cached.anchors[datestamp].classed('highlighted', true);
    }
  },

  // handles a click from a story entry anchor
  storyClicked: function(evt){
    if (typeof this.props.onStoryItemClick === 'function') {
      if (evt.currentTarget.getAttribute('data-date')) {
        var dt = new Date(+evt.currentTarget.getAttribute('data-date'));
        if (!isNaN(dt)) this.props.onStoryItemClick(dt);
      }
    }
  },

  // renders the list of Diarist's
  renderItems: function() {
    if (!this.props.items) return;
    var that = this;
    return this.props.items.map(function(item) {
        var selected = (item.key == that.props.selectedKey) ? true : false;
        return <Item key={item.key} item={item} selected={selected} onItemClick={that.props.onListItemClick} />;
      });
  },

  // renders a list of entries when a Diarist is selected
  renderStories: function() {
    if (!this.props.selectedKey) return "";
    var that = this;

    var selectedStories = this.props.items.filter(function(item){
      return item.key == that.props.selectedKey;
    });

    // initialize lookup
    datestampToItem = {};

    // bail if could find a journal
    if (!selectedStories.length) return "";

    storiesDirty = true;

    var selectedDateStamp = createDateStamp(this.props.selectedDate),
        trailCSS = selectedStories[0].trail.toLowerCase().replace(' ', '-');

    // filter, sort, create storyview items
    var entries = selectedStories[0].values
      .filter(function(d){
        return d.entry.length > 1;
      })
      .sort(function(a,b){
        return d3.ascending(a.date, b.date);
      })
      .map(function(item) {
        var dt = createDateStamp(item.date);
        datestampToItem[item.datestamp] = item;

        var highlighted = (selectedDateStamp === dt) ? " highlighted" : "";
        //if (highlighted.length) currentDate = that.props.selectedDate;
        return (
          <div key={item['cartodb_id']} className={"storyview-item " + trailCSS} data-datestamp={item.datestamp}>
          <a name={item.datestamp} className={highlighted} data-date={item.ts} onClick={that.storyClicked}><span className="circle"></span>{storyEntryDateFormatter(item.date)}</a>
          <p className="storyview-entry">{item.entry}</p>
          </div>
          );
      });

    // add citation
    if (!selectedStories[0].citation) return entries;

    if (selectedStories[0].citation.url) {
      entries.push((<div key={"citation-"+selectedStories[0].key} className="citiation storyview-entry"><a href={selectedStories[0].citation.url} target="_blank">{selectedStories[0].citation.text}</a></div>));
    } else {
      entries.push((<div key={"citation-"+selectedStories[0].key} className="citiation storyview-entry">{selectedStories[0].citation.text}</div>));
    }

    return entries;
  },

  // component render
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