/** @jsx React.DOM */

// NPM Modules
var React = require("react");
var RouterMixin = require('react-mini-router').RouterMixin;
var navigate = require('react-mini-router').navigate;
var Modal = require('react-modal');

// Constants
var CONSTANTS = require('./Constants.json');

// Actions
var Actions = require("./actions/app");

// Stores
var DiaryLinesStore = require("./stores/diarylines.js");
var DiaryEntriesStore = require("./stores/diary_entries.js");
var EmigrationsStore = require("./stores/emigration.js");
var OverlandTrailsCopy = require("./stores/overland-trails-copy.js");
var Intro = require("./stores/intro.js");

// Misc
var config = require("../.env.json");
var hashUtils = require("./utils/hash");
var helpers = require("./utils/helpers");

// Components
var LeafletMap = require("./components/LeafletMap.jsx");
var TileLayer = LeafletMap.TileLayer;
var GeoJSONLayer = LeafletMap.GeoJSONLayer;
var MarkerLayer = LeafletMap.MarkerLayer;
var CartoTileLayer = require("./components/LeafletCartoDBTileLayer.jsx");
var ButtonGroup = require("./components/ButtonGroup.jsx");
var MareyChart = require("./components/MareyChart.jsx");
var FlowMap = require("./components/FlowMapLeaflet.jsx");
var DiaristList = require("./components/ListView/List.jsx");
var Icon = require("./components/Icon.jsx");


var currentPath = {};
var App = React.createClass({

  mixins: [RouterMixin],

  routes: {
    '/': 'home',
  },

  // These will act as defaults
  hashParams: {
    'loc'     : '5/-5.200/0.330',
    'date'    : '1/1/1840',
    'trail'   : null,
    'diarist' : null
  },

  getInitialState: function () {
    var fromHash = this.parseHash(document.location.hash);
    L.Util.extend(this.hashParams, fromHash);

    var initial = {
      currentDate: new Date(this.hashParams.date),
      trail: this.hashParams.trail,
      diarist: this.hashParams.diarist,
      heights:{}
    };

    initial.year = initial.currentDate.getFullYear();

    return initial;
  },

  componentWillMount: function() {
    this.computeHeight();
    if (this.hashParams.diarist) {
      DiaryLinesStore.selectedDiarist = this.hashParams.diarist;
      DiaryEntriesStore.selectedDiarist = this.hashParams.diarist;
    }
    if (this.hashParams.trail) DiaryLinesStore.setFiltered(this.hashParams.trail);
    Modal.setAppElement(document.querySelector("body"));
  },

  componentDidMount: function() {
    Actions.getInitialData({});

    DiaryLinesStore.addChangeListener(this.onChange);
    DiaryEntriesStore.addChangeListener(this.onChange);
    EmigrationsStore.addChangeListener(this.onChange);

    Intro.init();

    d3.select(window).on('resize', helpers.debounce(this.onResize, 250));
  },

  componentWillUnmount: function() {
    DiaryLinesStore.removeChangeListener(this.onChange);
    DiaryEntriesStore.removeChangeListener(this.onChange);
    EmigrationsStore.removeChangeListener(this.onChange);

    Intro.destroy();
  },

  componentDidUpdate: function() {
    //console.log("APP DID UPDATE")
  },

  updateURL: function(params, silent) {
    var out = [];

    //console.log(document.location.hash)
    //var hash = parseHash(document.location.hash)

    var that = this;
    for (var k in this.hashParams) {
      var v = null;
      if (k in params) {
        v = params[k];
      } else {
        v = that.hashParams[k];
      }
      if (v) {
        this.hashParams[k] = v;
        out.push(k + '=' + v);
      }
    }

    // TODO: how to get current path out of `react-mini-router`
    var path = '/';
    navigate(path + '?' + out.join('&'), true);
  },

  parseHash: function(hash) {
    var out = {};
    if (!hash) return out;

    var that = this;
    var things = hash.slice(4).split('&').map(function(d){return d.split('=');});

    things.forEach(function(thing){
      // validate location
      if (thing[0] === 'loc') {
        if ( hashUtils.parseCenterAndZoom(thing[1]) ) {
          out[thing[0]] = thing[1];
        }
      } else if (thing[0] in that.hashParams && thing[1] != '') {
        out[thing[0]] = thing[1];
      }
    });

    return out;
  },


  readURL: function() {

  },

  computeHeight: function() {
    // Everything is basically pinned from the flow-map
    // All these numbers are in "sass/core/_variables.scss"
    // So if you change any of those numbers update them here
    var h = {};
    h.diaries = window.innerHeight - 150 - 10; // WindowHeight - $flow-map-height - $flow-map-margin-top
    h.diariesInner = h.diaries - 22; // diaryHeight - $component-header-height
    h.map = h.diaries - 70; // diaryHeight - $header-height

    this.setState({ heights: h });
  },

  onResize: function(e) {
    this.computeHeight();
  },

  onChange: function(e) {
    // Update URL with selected diarist
    if (e.caller && e.caller.state && e.caller.state === 'LIST ITEM SELECTED') {
      //this.hashParams.diarist = e.caller.value;
      //this.updateURL({diarist: e.caller.value}, true);
      //this.setState({diarist: e.caller.value});
    } else {
      this.setState(e);
    }

  },

  triggerIntro: function(e){
    console.log('-----------------');
    if (this.state.showAbout) this.toggleAbout();
    Intro.open(e);
  },

  toggleAbout: function() {
    if (Intro.state) Intro.exit();
    this.setState({"showAbout":!this.state.showAbout});
  },

  handleMapMove: function(evt) {
    this.updateURL({loc: hashUtils.formatCenterAndZoom(evt.target)}, true);
  },

  trailSelectorChange: function(elm, idx) {
    var val = elm.getAttribute('data-value');
    DiaryLinesStore.setFiltered(val);

    if (val === 'all') val = '';
    if (this.state.trail === val) return;
    this.hashParams.trail = val;
    this.updateURL({trail: val}, true);
    this.setState({trail: val});
  },

  mareySliderChange: function(date) {
    this.updateURL({date: hashUtils.formatDate(date)}, true);
    this.setState({year: date.getFullYear(), currentDate: date});
  },

  onDiaryClick: function(item, selected) {
    //console.log(item, selected);
    var key = (selected) ? item.key : null;
    this.setDiarist(key, item.begins);

  },

  setDiarist: function(key, date) {
    DiaryEntriesStore.selectedDiarist = DiaryLinesStore.selectedDiarist = key;
    this.hashParams.diarist = key;
    this.updateURL({diarist: key, date: hashUtils.formatDate(date)}, true);
    this.setState({diarist: key, year: date.getFullYear(), currentDate: date});
  },

  onMarkerClick: function(marker) {
    if (marker.data_['journal_id'] === DiaryEntriesStore.selectedDiarist) return;
    this.setDiarist(marker.data_['journal_id'], marker.data_.date);
  },

  onStoryScroll: function(item) {
    //console.log(item);
    this.setState({year: item.date.getFullYear(), currentDate: item.date});
  },

  render: function() {
    return this.renderCurrentRoute();
  },

  notFound: function(path) {
    return (
      <div className='container not-found full-height'>
        <div className='row full-height'>
          <div className='columns twelve full-height'>
            <h1>Hmm, the page you’re looking for can’t be found.</h1>
            <p>Use this <a href="/">link</a> to get back to the <a href="/">home page</a>.</p>
            <div className="hands-emoticon">¯\_(ツ)_/¯</div>
          </div>
        </div>
      </div>
    );
  },

  home: function(params) {
    params = params || {};

    var mapOptions = {
      scrollWheelZoom: false,
      attributionControl: false
    };

    var mapEvents = {
      move: helpers.debounce(this.handleMapMove, 250)
    };

    // set various things from URL params
    var loc,zoom;

    var o = hashUtils.parseCenterAndZoom(this.hashParams.loc);
    loc = o.center;
    zoom = o.zoom;

    var that = this;

    return (

      <div className='container full-height'>
        <div className='row full-height'>
          <div className='columns eight full-height'>

            <header className='row'>
              <h1 className='u-full-width headline'><span className="header-wrapper">The Overland Trails<span>1840-1860</span></span></h1>
              <button id="about-btn" className="link text-small" data-step="0" onClick={this.toggleAbout}>About This Map</button>
            </header>

            <div id='map-wrapper' className='row' style={{height: this.state.heights.map + "px"}}>
              <div className='columns twelve full-height'>
                <LeafletMap ref="map" location={loc} zoom={zoom} mapEvents={mapEvents} mapOptions={mapOptions}>
                  <CartoTileLayer
                    src="http://ec2-54-152-68-8.compute-1.amazonaws.com/richmond-terrain/{z}/{x}/{y}.png"
                    userId={config.cartodbAccountName}
                    sql="SELECT * FROM unified_basemap_layers order by ord"
                    cartocss="#unified_basemap_layers[layer='ne_10m_coastline_2163']{  line-color: #aacccc;  line-width: 0.75;  line-opacity: 1;  line-join: round;  line-cap: round;}#unified_basemap_layers[layer='ne_10m_lakes_2163'] {  line-color: #aacccc;  line-width: 2.5;  line-opacity: 1;  line-join: round;  line-cap: round;  /* Soften lines at lower zooms */  [zoom<=7] {    line-width: 2.5;    line-color: lighten(desaturate(#aacccc,2%),2%);  }  [zoom<=5] {    line-width: 1.5;    line-color: lighten(desaturate(#aacccc,5%),5%);  }  /* Separate attachment because seams */  ::fill {    polygon-fill: #ddeeee;    polygon-opacity: 1;  }  /* Remove small lakes at lower zooms */  [scalerank>3][zoom<=5] {    ::fill {      polygon-opacity: 0;    }    line-opacity: 0;  }  [scalerank>6][zoom<=7] {    ::fill {      polygon-opacity: 0;    }    line-opacity: 0;  }}#unified_basemap_layers[layer='ne_10m_rivers_lake_centerlines_2163'] {  line-color: #aacccc;  line-width: 1.5;  line-opacity: 1;  line-join: round;  line-cap: round;  [name='Mississippi'],  [name='St. Lawrence'],  [name='Rio Grande'] {    line-width: 4;  }  [zoom<=8][name='Mississippi'],  [zoom<=8][name='St. Lawrence'],  [zoom<=8][name='Rio Grande'] {    line-width: 2;  }  [zoom<=8][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande'],  [zoom<=6][name='Mississippi'],  [zoom<=6][name='Rio Grande'] {    line-width: 1;    line-color: lighten(desaturate(#aacccc,2%),2%);  }  [zoom<=6][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande'] {    line-width: 0.5;    line-color: lighten(desaturate(#aacccc,5%),5%);  }  [zoom<=5][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande']{    line-width: 0;  }  [zoom<=5][name='Mississippi'],  [zoom<=5][name='St. Lawrence'],  [zoom<=5][name='Rio Grande'] {    line-width: 0.5;    line-color: lighten(desaturate(#aacccc,2%),2%);  }}#unified_basemap_layers[layer='ne_10m_admin_0_countries_lakes_2163'] {  line-color: white;  line-width: 1;  line-opacity: 1;  line-join: round;  line-cap: round;  polygon-fill: white;  polygon-opacity: 1;}"/>
                  <TileLayer src="http://ec2-54-152-68-8.compute-1.amazonaws.com/richmond-terrain/{z}/{x}/{y}.png" attribution="&copy; <a href='http://osm.org/copyright'>OpenStreetMap</a> contributors | Designed by <a href='http://stamen.com?from=richmondatlas'>Stamen Design</a>" />
                  <GeoJSONLayer featuregroup={DiaryLinesStore.getData()} className='diary-lines' filter={DiaryLinesStore.onFilter} onEachFeature={DiaryLinesStore.onEachFeature} />
                  <MarkerLayer map={null} markers={DiaryEntriesStore.getEntriesByDate(that.state.currentDate)} onMarkerClick={this.onMarkerClick}/>
                </LeafletMap>
              </div>

              <ButtonGroup onChange={this.trailSelectorChange} selectedIndex={0} selectedValue={this.state.trail}>
                <button className="text-extra-small" data-value="all">All Trails</button>
                <button className="text-extra-small" data-value="oregon-trail">Oregon Trail</button>
                <button className="text-extra-small" data-value="california-trail">Califonia trail</button>
                <button className="text-extra-small" data-value="mormon-trail">Mormon trail</button>
              </ButtonGroup>
            </div>

            <div id="marey-chart-wrapper" className='row'>
              <button id="marey-info-btn" className="link text-small" data-step="2" onClick={this.triggerIntro}><Icon iconName="info"/></button>
              <div className='columns twelve full-height'>
                <MareyChart chartdata={DiaryEntriesStore.getData()} onSliderChange={this.mareySliderChange} currentDate={this.state.currentDate}/>
              </div>
            </div>

            <div className="row">
              <div className='columns twelve'>
                <div className="row what-happened">
                  <div className="columns what-happened-label">
                    <div>What was happening in {this.state.year}?</div>
                  </div>
                  <div className="columns what-happened-content">
                    <div>{OverlandTrailsCopy.years[this.state.year]}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='columns four full-height'>

            <div id="narrative-wrapper" className='row' ref="diaries" style={{height: this.state.heights.diaries + "px"}}>
              <div className='columns twelve full-height'>
                <div className="component-header"><button id="diarist-help-btn" className="link text-small" data-step="0" onClick={this.triggerIntro}>Diarists<Icon iconName="info"/></button></div>
                <DiaristList items={DiaryEntriesStore.getDiarists()} selectedDate={this.state.currentDate} selectedKey={DiaryEntriesStore.selectedDiarist} height={this.state.heights.diariesInner} onListItemClick={this.onDiaryClick} onStoryScroll={this.onStoryScroll} />
              </div>
            </div>

            <div id="flow-map-wrapper" className='row flow-map'>
              <div className='columns twelve full-height'>
                <div className="component-header overlaid"><button id="flow-map-info-btn" className="link text-small" data-step="1" onClick={this.triggerIntro}>How Many People Traveled in 1847?<Icon iconName="info"/></button></div>
                <FlowMap flowdata={EmigrationsStore.getData()} year={this.state.year}/>
              </div>
            </div>
          </div>
        </div>

        <Modal isOpen={this.state.showAbout} onRequestClose={this.toggleAbout} className="overlay">
          <button className="close" onClick={this.toggleAbout}><span>×</span></button>
          <p>{OverlandTrailsCopy.infoPanel}</p>
        </Modal>
      </div>
    );
  }

});

module.exports = App;