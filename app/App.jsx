/** @jsx React.DOM */

// NPM Modules
var React = require("react");
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
      },
      diaryData: [],
      mareyChartData: [],
      dairylinesData: [],
      emigrationData: [],
      milestoneData: []
    };

    initial.year = initial.currentDate.getFullYear();

    this._state = initial;

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
    MilestonesStore.addChangeListener(this.onChange);

    Intro.init();
    d3.select(window).on('resize', helpers.debounce(this.onResize, 250));
  },

  componentWillUnmount: function() {
    DiaryLinesStore.removeChangeListener(this.onChange);
    DiaryEntriesStore.removeChangeListener(this.onChange);
    EmigrationsStore.removeChangeListener(this.onChange);
    MilestonesStore.removeChangeListener(this.onChange);

    Intro.destroy();
    d3.select(window).off('resize', null);
  },

  componentDidUpdate: function() {
    //...
  },

  updateURL: function(params, silent) {
    var out = [];

    for (var k in this.hashParams) {
      var v = null;
      if (k in params) {
        v = params[k];
      } else {
        v = this.hashParams[k];
      }
      if (v) {
        this.hashParams[k] = v;
        out.push(k + '=' + v);
      }
    }

    var hash = "#" + out.join('&');
    if (document.location.hash !== hash) document.location.replace(hash);
  },

  parseHash: function(hash) {
    var out = {};
    if (!hash) return out;

    if(hash.indexOf('#') === 0) {
      hash = hash.substr(1);
    }

    var that = this;
    var things = hash.split('&').map(function(d){return d.split('=');});

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

  computeDimensions: function(silent) {
    // Everything is basically pinned from the flow-map
    // All these numbers are in "sass/core/_variables.scss"
    // So if you change any of those numbers update them here
    var d = {};
    d.heights = {};
    d.width = window.innerWidth;

    d.heights.diaries = window.innerHeight - 180 - 10 - 24; // WindowHeight - $flow-map-height - $flow-map-margin-top
    d.heights.diariesInner = d.heights.diaries - 22; // diaryHeight - $component-header-height
    d.heights.map = d.heights.diaries - 60; // diaryHeight - $header-height

    if (!silent) this.centralStateSetter({ dimensions: d })
  },

  onResize: function(e) {
    this.computeDimensions();
  },

  // Better control of all the state requests
  // Also easier to debug
  centralStateSetter: function(obj) {
    if (obj.caller) {
        // Handle store data changes
        // Faster to assign data to state, than putting function into component properties
        switch(obj.caller) {
          case "DiaryEntriesStore":
            this.setState({'mareyChartData': DiaryEntriesStore.getData(), 'diaryData': DiaryEntriesStore.getDiarists()});
          break;
          case 'DiaryLinesStore':
            this.setState({'dairylinesData': DiaryLinesStore.getData()});
          break;
          case 'EmigrationStore':
            this.setState({'emigrationData': EmigrationsStore.getData()});
          break;
          case 'MilestonesStore':
            this.setState({'milestoneData': MilestonesStore.getData()});
          break;
        }
    } else {
      var out = {};
      for (var k in obj) {
        if (this.state[k] !== obj[k] || k === 'dimensions') {
          out[k] = obj[k];
        }
      }

      if(Object.keys(out).length)this.setState(out);
    }
  },

  onChange: function(e) {
    // Update URL with selected diarist
    if (e.caller && e.caller.state && e.caller.state === 'LIST ITEM SELECTED') {
    } else {
      this.centralStateSetter(e);
    }
  },

  triggerIntro: function(e){
    if (this.state.showAbout) this.toggleAbout();
    Intro.open(e);
  },

  toggleAbout: function() {
    if (Intro.state) Intro.exit();
    this.centralStateSetter({"showAbout":!this.state.showAbout});
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
    this.centralStateSetter({trail: val});
  },

  mareySliderChange: function(date) {
    this.updateURL({date: hashUtils.formatDate(date)}, true);
    this.centralStateSetter({year: date.getFullYear(), currentDate: date});
  },

  onDiaryClick: function(item, selected) {
    var key = (selected) ? item.key : null;
    this.setDiarist(key, item.begins);
  },

  setDiarist: function(key, date) {
    DiaryEntriesStore.selectedDiarist = DiaryLinesStore.selectedDiarist = key;
    this.hashParams.diarist = key;
    this.updateURL({diarist: key, date: hashUtils.formatDate(date)}, true);
    this.centralStateSetter({diarist: key, year: date.getFullYear(), currentDate: date});
  },

  onMarkerClick: function(marker) {
    if (marker['journal_id'] != DiaryEntriesStore.selectedDiarist) {
      this.setDiarist(marker['journal_id'], marker.date);
    } else if (this.state.currentDate !== marker.date) {
      this.centralStateSetter({year: marker.date.getFullYear(), currentDate: marker.date});
    }
  },

  onStoryScroll: function(item) {
    if (item && item.hasOwnProperty('date')) this.centralStateSetter({year: item.date.getFullYear(), currentDate: item.date});
  },

  onStoryItemClick: function(date) {
    if (this.state.currentDate !== date) {
      this.centralStateSetter({year: date.getFullYear(), currentDate: date});
    }
  },

  filterMarkers: function(marker) {
    if (!this.state.diarist) return true;
    return (marker['journal_id'] == this.state.diarist);
  },

  render: function(params) {

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
                    cartocss="Map { buffer-size: 128; } #unified_basemap_layers[layer='ne_10m_coastline_2163']{ line-color: #aacccc; line-width: 0.75; line-opacity: 1; line-join: round; line-cap: round; } #unified_basemap_layers[layer='ne_10m_lakes_2163'] { line-color: #aacccc; line-width: 2.5; line-opacity: 1; line-join: round; line-cap: round; /* Soften lines at lower zooms */ [zoom<=7] { line-width: 2.5; line-color: lighten(desaturate(#aacccc,2%),2%); } [zoom<=5] { line-width: 1.5; line-color: lighten(desaturate(#aacccc,5%),5%); } /* Separate attachment because seams */ ::fill { polygon-fill: #ddeeee; polygon-opacity: 1; } /* Remove small lakes at lower zooms */ [scalerank>3][zoom<=5] { ::fill { polygon-opacity: 0; } line-opacity: 0; } [scalerank>6][zoom<=7] { ::fill { polygon-opacity: 0; } line-opacity: 0; } } #unified_basemap_layers[layer='ne_10m_rivers_lake_centerlines_2163'] { line-color: #aacccc; line-width: 1.5; line-opacity: 1; line-join: round; line-cap: round; [name='Mississippi'], [name='St. Lawrence'], [name='Columbia'], [name='Snake'], [name='Platte'], [name='Missouri'], [name='Rio Grande'] { line-width: 4; } [zoom<=8][name='Mississippi'], [zoom<=8][name='St. Lawrence'], [zoom<=8][name='Columbia'], [zoom<=8][name='Snake'], [zoom<=8][name='Platte'], [zoom<=8][name='Missouri'], [zoom<=8][name='Rio Grande'] { line-width: 2; } [zoom<=8][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande'][name!='Snake'][name!='Platte'][name!='Columbia'][name!='Missouri'], [zoom<=6][name='Mississippi'], [zoom<=6][name='Columbia'], [zoom<=6][name='Snake'], [zoom<=6][name='Platte'], [zoom<=6][name='Missouri'], [zoom<=6][name='Rio Grande'] { line-width: 1; line-color: lighten(desaturate(#aacccc,2%),2%); } [zoom<=6][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande'][name!='Snake'][name!='Platte'][name!='Columbia'][name!='Missouri'] { line-width: 0.5; line-color: lighten(desaturate(#aacccc,5%),5%); } [zoom<=5][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande'][name!='Snake'][name!='Platte'][name!='Columbia'][name!='Missouri'] { line-width: 0; } [zoom<=5][name='Mississippi'], [zoom<=5][name='St. Lawrence'], [zoom<=5][name='Columbia'], [zoom<=5][name='Snake'], [zoom<=5][name='Platte'], [zoom<=5][name='Missouri'], [zoom<=5][name='Rio Grande'] { line-width: 0.5; line-color: lighten(desaturate(#aacccc,2%),2%); } } #unified_basemap_layers[layer='ne_10m_admin_0_countries_lakes_2163'] { line-color: white; line-width: 1; line-opacity: 1; line-join: round; line-cap: round; polygon-fill: white; polygon-opacity: 1; } #unified_basemap_layers[layer='tribal_locations'][zoom>=5]::fill { text-name: [name]; text-face-name: 'Old Standard TT Bold'; text-size: 10; text-character-spacing: 5; text-line-spacing: 2; [zoom<=5] { text-size: 8; text-character-spacing: 2; text-line-spacing: 1; } text-label-position-tolerance: 0; text-fill: rgba(0,0,0,0.5); text-halo-fill: #FFF; text-halo-radius: 0.5; text-dy: 10; text-allow-overlap: true; text-placement: point; text-placement-type: dummy; text-avoid-edges: true; text-wrap-character: ' '; text-wrap-width: 10; [name='GOSHUTE'] { text-dy: 20; } [name='TETON SIOUX'][zoom=5] { text-dy: -15;} [name='TETON SIOUX'][zoom=6] { text-dx: -5; text-dy: -15;}  [name='CHEYENNE'][zoom=5] { text-dx: 5; } [name='ARAPAHO'][zoom<=6] { text-dy: 20; } [name='SHOSHONE-BANNOCK'][zoom<=6] { text-dy: -5; } [name='MADOC'][zoom=5] { text-dy: -10; } [name='WIND RIVER SHOSHONE'][zoom=5] { text-dy: -10; text-dx: -10; } }"/>
                  <TileLayer src="http://ec2-54-152-68-8.compute-1.amazonaws.com/richmond-terrain/{z}/{x}/{y}.png" attribution="&copy; <a href='http://osm.org/copyright'>OpenStreetMap</a> contributors | Designed by <a href='http://stamen.com?from=richmondatlas'>Stamen Design</a>" />
                  <GeoJSONLayer featuregroup={this.state.dairylinesData} className='diary-lines' filter={DiaryLinesStore.onFilter} onEachFeature={DiaryLinesStore.onEachFeature} featuresChange={false}/>
                  <MarkerLayer markers={DiaryEntriesStore.getEntriesByDate(this.state.currentDate)} filter={this.filterMarkers} onMarkerClick={this.onMarkerClick}/>
                  <Milestones features={this.state.milestoneData} currentDate={this.state.currentDate}/>
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
                <MareyChart chartdata={this.state.mareyChartData} onSliderChange={this.mareySliderChange} currentDate={this.state.currentDate} dimensions={this.state.dimensions}/>
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
                <DiaristList items={this.state.diaryData} selectedDate={this.state.currentDate} selectedKey={DiaryEntriesStore.selectedDiarist} height={this.state.dimensions.heights.diariesInner} onListItemClick={this.onDiaryClick} onStoryItemClick={this.onStoryItemClick} onStoryScroll={this.onStoryScroll} />
              </div>
            </div>

            <div id="flow-map-wrapper" className='row flow-map'>
              <div className='columns twelve full-height'>
                <div className="component-header overlaid rockett-bold"><button id="flow-map-info-btn" className="link text-small" data-step="1" onClick={this.triggerIntro}>{"How Many People Traveled in " + this.state.year + "?"}<Icon iconName="info"/></button></div>
                <FlowMap flowdata={this.state.emigrationData} year={this.state.year}/>
              </div>
            </div>
          </div>
        </div>

        <Modal isOpen={this.state.showAbout} onRequestClose={this.toggleAbout} className="overlay">
          <button className="close" onClick={this.toggleAbout}><span>×</span></button>
          <p>The Oregon and California Trails stretched nearly 2,000 miles from jumping-off points near the Missouri River to the Willamette Valley in Oregon and the Sacramento Valley in California; the Mormon Trail 1,300 miles from Nauvoo, Illinois, to Salt Lake City. While dozens of alternate cutoffs were developed to shorten journeys, the course of rivers—the Platte, Sweetwater, Snake, and Humboldt—that provided emigrants and their animals with water dictated the majority of the routes.</p>

          <h2>A Note on Sources and Methods</h2>

          <p>The most significant evidence for this map comes from 2000 individual entries from about two dozen Overland Trails diaries that we have plotted in time and space. Most diarist carefully noted the distance they had traveled that day and where they camped. Still, in many cases a location can only be estimated but not precisely identified. Citations for each journal are provided in the narratives column.</p>

          <p>Merrill J. Mattes's Platte River Road Narratives (Urbana: University of Illinois Press, 1988) was indispensible in helping us select diaries to transcribe and georeference. The National Park Services's national historic trails data was enormously helpful in helping us georeference diary entries.</p>

          <p>For the flow map, we use John D. Unruh's estimates of annual emigrants to Oregon, California, and Utah from The Plain's Across: The Overland Emigrants and the Trans-Mississippi West, 1840-60 ([Urbana: University of Illinois Press, 1979], 119-120, tables 1 and 2). While Unruh's estimates are generally accepted as the best that have been offered to day, his caution should be kept in mind: "no one attempting to provide statistics for the overland emigrations can offer more than educated estimates for most years, especially for the later 1850s, when the estimates of necessity become almost pure guesswork" (442).</p>

          <p>The location of Indian tribes is adapted from maps from Francis Paul Prucha, Atlas of American Indian Affairs(Lincoln: University of Nebraska Press, 1990), 5, map 2. State boundaries are from the Newberry Library's <a href="http://publications.newberry.org/ahcbp/">Atlas of Historical County Boundaries</a>.</p>

          <h2>Suggested Reading</h2>
          <ul>
              <li>Will Bagley, So Rugged and Mountainous: Blazing the Trails to Oregon and California, 1812–1848 (Norman: University of Oklahoma Press, 2010).</li>
              <li>Will Bagley, With Golden Visions Bright Before Them: Trails to the Mining West, 1849–1852 (Norman: University of Oklahoma Press, 2012).</li>
              <li>John Mack Faragher, Women and Men on the Overland Trail, 2nd edition (New Haven: Yale University Press, 2001).</li>
              <li>Merrill Mattes, Platte River Road Narratives: A Descriptive Bibliography of Travel Over the Great Centeral Overland Route to Oregon, California, Utah, Colorado, Montana, and Other Western States and Territories, 1812-1866 (Urbana: University of Illinois Press, 1988).</li>
              <li>John D. Unruh, The Plains Across: The Overland Emigrants and the Trans-Mississippi West, 1840-60 (Urbana: University of Illinois Press, 1979).</li>
              <li>Michael L. Tate, Indians and Emigrants: Encounters on the Overland Trails (University of Oklahoma Press, 2006).</li>
              <li>John G. Turner, Brigham Young: Pioneer Prophet (Cambridge: Belknap Press, 2012).</li>
          </ul>

          <h2>Acknowledgments</h2>

          <p>This map is authored by the staff of the Digital Scholarship Lab: Robert K. Nelson, Edward L. Ayers, Justin Madron, and Nathaniel Ayers. Scott Nesbit contributed substantially to the preliminary drafts.</p>

          <p>Katie Burke, Lily Calaycay, Anna Ellison, Erica Havens, Erica Ott, Barbie Savani, Beaumont Smith, and Shayna Webb transcribed and georeferenced journals.</p>

          <p>The developers, designers, and staff at Stamen Design Studio have been exceptional partners on this project. Our thanks to Sean Connelley, Kai Chang, Jon Christensen, Seth Fitzsimmons, Heather Grates, Alan McConchie, Michael Neuman, Dan Rademacher, and Eric Rodenbeck.</p>
        </Modal>
      </div>
    );
  }

});

module.exports = App;