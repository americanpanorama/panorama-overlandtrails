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
var MilestonesStore = require("./stores/milestones.js");
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
var MarkerLayer = require('./components/DiaryMarkers.jsx');
var CartoTileLayer = require("./components/LeafletCartoDBTileLayer.jsx");
var ButtonGroup = require("./components/ButtonGroup.jsx");
var MareyChart = require("./components/MareyChart.jsx");
var FlowMap = require("./components/FlowMapLeaflet.jsx");
var DiaristList = require("./components/ListView/List.jsx");
var Icon = require("./components/Icon.jsx");
var Longitudes = require("./components/LongitudeLines.jsx");
var Milestones = require("./components/Milestones.jsx");


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
      dimensions:{
        widths: 0,
        heights: 0
      }
    };

    initial.year = initial.currentDate.getFullYear();

    return initial;
  },

  componentWillMount: function() {
    this.computeDimensions();
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

  computeDimensions: function() {
    // Everything is basically pinned from the flow-map
    // All these numbers are in "sass/core/_variables.scss"
    // So if you change any of those numbers update them here
    var d = {};
    d.heights = {};
    d.width = window.innerWidth;

    d.heights.diaries = window.innerHeight - 180 - 10 - 24; // WindowHeight - $flow-map-height - $flow-map-margin-top
    d.heights.diariesInner = d.heights.diaries - 22; // diaryHeight - $component-header-height
    d.heights.map = d.heights.diaries - 60; // diaryHeight - $header-height

    this.setState({ dimensions: d });
  },

  onResize: function(e) {
    this.computeDimensions();
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
    if (marker['journal_id'] === DiaryEntriesStore.selectedDiarist) return;
    this.setDiarist(marker['journal_id'], marker.date);
  },

  onStoryScroll: function(item) {
    //console.log(item);
    this.setState({year: item.date.getFullYear(), currentDate: item.date});
  },

  filterMarkers: function(marker) {
    if (!this.state.diarist) return true;
    return  (marker['journal_id'] == this.state.diarist);
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
      attributionControl: false,
      minZoom: 4,
      maxZoom: 10,
      maxBounds: [[-47.0401, -85.3417], [37.3701,89.4726]]
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
              <h1 className='u-full-width headline rockett-bold'><span className="header-wrapper">The Overland Trails<span>1840-1860</span></span></h1>
              <button id="about-btn" className="link text-small" data-step="0" onClick={this.toggleAbout}>About This Map</button>
            </header>

            <div id='map-wrapper' className='row' style={{height: this.state.dimensions.heights.map + "px"}}>
              <div className='columns twelve full-height'>
                <LeafletMap ref="map" location={loc} zoom={zoom} mapEvents={mapEvents} mapOptions={mapOptions}>
                  <CartoTileLayer
                    src="http://ec2-54-152-68-8.compute-1.amazonaws.com/richmond-terrain/{z}/{x}/{y}.png"
                    userId={config.cartodbAccountName}
                    sql="SELECT * FROM unified_basemap_layers order by ord"
                    cartocss="Map { buffer-size: 128; } #unified_basemap_layers[layer='ne_10m_coastline_2163']{ line-color: #aacccc; line-width: 0.75; line-opacity: 1; line-join: round; line-cap: round; } #unified_basemap_layers[layer='ne_10m_lakes_2163'] { line-color: #aacccc; line-width: 2.5; line-opacity: 1; line-join: round; line-cap: round; /* Soften lines at lower zooms */ [zoom<=7] { line-width: 2.5; line-color: lighten(desaturate(#aacccc,2%),2%); } [zoom<=5] { line-width: 1.5; line-color: lighten(desaturate(#aacccc,5%),5%); } /* Separate attachment because seams */ ::fill { polygon-fill: #ddeeee; polygon-opacity: 1; } /* Remove small lakes at lower zooms */ [scalerank>3][zoom<=5] { ::fill { polygon-opacity: 0; } line-opacity: 0; } [scalerank>6][zoom<=7] { ::fill { polygon-opacity: 0; } line-opacity: 0; } } #unified_basemap_layers[layer='ne_10m_rivers_lake_centerlines_2163'] { line-color: #aacccc; line-width: 1.5; line-opacity: 1; line-join: round; line-cap: round; [name='Mississippi'], [name='St. Lawrence'], [name='Columbia'], [name='Snake'], [name='Platte'], [name='Missouri'], [name='Rio Grande'] { line-width: 4; } [zoom<=8][name='Mississippi'], [zoom<=8][name='St. Lawrence'], [zoom<=8][name='Columbia'], [zoom<=8][name='Snake'], [zoom<=8][name='Platte'], [zoom<=8][name='Missouri'], [zoom<=8][name='Rio Grande'] { line-width: 2; } [zoom<=8][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande'][name!='Snake'][name!='Platte'][name!='Columbia'][name!='Missouri'], [zoom<=6][name='Mississippi'], [zoom<=6][name='Columbia'], [zoom<=6][name='Snake'], [zoom<=6][name='Platte'], [zoom<=6][name='Missouri'], [zoom<=6][name='Rio Grande'] { line-width: 1; line-color: lighten(desaturate(#aacccc,2%),2%); } [zoom<=6][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande'][name!='Snake'][name!='Platte'][name!='Columbia'][name!='Missouri'] { line-width: 0.5; line-color: lighten(desaturate(#aacccc,5%),5%); } [zoom<=5][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande'][name!='Snake'][name!='Platte'][name!='Columbia'][name!='Missouri'] { line-width: 0; } [zoom<=5][name='Mississippi'], [zoom<=5][name='St. Lawrence'], [zoom<=5][name='Columbia'], [zoom<=5][name='Snake'], [zoom<=5][name='Platte'], [zoom<=5][name='Missouri'], [zoom<=5][name='Rio Grande'] { line-width: 0.5; line-color: lighten(desaturate(#aacccc,2%),2%); } } #unified_basemap_layers[layer='ne_10m_admin_0_countries_lakes_2163'] { line-color: white; line-width: 1; line-opacity: 1; line-join: round; line-cap: round; polygon-fill: white; polygon-opacity: 1; } #unified_basemap_layers[layer='tribal_locations'][zoom>=5] { text-name: [name]; text-face-name: 'Old Standard TT Bold'; text-size: 10; text-character-spacing: 5; text-line-spacing: 5; [zoom<=5] { text-size: 8; text-character-spacing: 2; text-line-spacing: 2; } text-label-position-tolerance: 0; text-fill: rgba(0,0,0,0.5); text-halo-fill: #FFF; text-halo-radius: 0.5; text-dy: 10; text-allow-overlap: true; text-placement: point; text-placement-type: dummy; text-avoid-edges: true; text-wrap-character: ' '; text-wrap-width: 10; [name='GOSHUTE'] { text-dy: 20; } }"/>
                  <TileLayer src="http://ec2-54-152-68-8.compute-1.amazonaws.com/richmond-terrain/{z}/{x}/{y}.png" attribution="&copy; <a href='http://osm.org/copyright'>OpenStreetMap</a> contributors | Designed by <a href='http://stamen.com?from=richmondatlas'>Stamen Design</a>" />
                  <GeoJSONLayer featuregroup={DiaryLinesStore.getData()} className='diary-lines' filter={DiaryLinesStore.onFilter} onEachFeature={DiaryLinesStore.onEachFeature} featuresChange={false}/>
                  <MarkerLayer markers={DiaryEntriesStore.getEntriesByDate(that.state.currentDate)} filter={this.filterMarkers} onMarkerClick={this.onMarkerClick}/>
                  <Milestones features={MilestonesStore.getData()} currentDate = {that.state.currentDate}/>
                  <Longitudes/>
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
                <MareyChart chartdata={DiaryEntriesStore.getData()} onSliderChange={this.mareySliderChange} currentDate={this.state.currentDate} dimensions={this.state.dimensions}/>
              </div>
            </div>

            <div className="row">
              <div className='columns twelve'>
                <div className="row what-happened">
                  <div className="columns what-happened-label rockett-bold">
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

            <div id="narrative-wrapper" className='row' ref="diaries" style={{height: this.state.dimensions.heights.diaries + "px"}}>
              <div className='columns twelve full-height'>
                <div className="component-header rockett-bold"><button id="diarist-help-btn" className="link text-small" data-step="0" onClick={this.triggerIntro}>Diarists<Icon iconName="info"/></button></div>
                <DiaristList items={DiaryEntriesStore.getDiarists()} selectedDate={this.state.currentDate} selectedKey={DiaryEntriesStore.selectedDiarist} height={this.state.dimensions.heights.diariesInner} onListItemClick={this.onDiaryClick} onStoryScroll={this.onStoryScroll} />
              </div>
            </div>

            <div id="flow-map-wrapper" className='row flow-map'>
              <div className='columns twelve full-height'>
                <div className="component-header overlaid rockett-bold"><button id="flow-map-info-btn" className="link text-small" data-step="1" onClick={this.triggerIntro}>{"How Many People Traveled in " + this.state.year + "?"}<Icon iconName="info"/></button></div>
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