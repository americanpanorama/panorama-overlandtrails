/** @jsx React.DOM */

// NPM Modules
var React = require("react");
var RouterMixin = require('react-mini-router').RouterMixin;
var navigate = require('react-mini-router').navigate;

// Actions
var Actions = require("./actions/app");

// Stores
var DiaryLinesStore = require("./stores/diarylines.js");
var DiaryEntriesStore = require("./stores/diary_entries.js");
var EmigrationsStore = require("./stores/emigration.js");

// Misc
var config = require("../.env.json");
var hashUtils = require("./utils/hash");
var helpers = require("./utils/helpers");

// Components
var LeafletMap = require("./components/LeafletMap.jsx");
var TileLayer = LeafletMap.TileLayer;
var GeoJSONLayer = LeafletMap.GeoJSONLayer;
var CartoTileLayer = require("./components/LeafletCartoDBTileLayer.jsx");
var ButtonGroup = require("./components/ButtonGroup.jsx");
var MareyChart = require("./components/MareyChart.jsx");
var FlowMap = require("./components/FlowMap.jsx");
var DiaristList = require("./components/ListView/List.jsx");

var App = React.createClass({

  mixins: [RouterMixin],

  routes: {
    '/': 'home',
  },

  allowedHashParams: {
    'loc': null
  },

  getInitialState: function () {
    return {
      year: 1840
    };
  },

  componentDidMount: function() {
    Actions.getInitialData({});

    DiaryLinesStore.addChangeListener(this.onChange);
    DiaryEntriesStore.addChangeListener(this.onChange);
    EmigrationsStore.addChangeListener(this.onChange);
  },

  componentWillUnmount: function() {

  },

  componentDidUpdate: function() {
    console.log("APP DID UPDATE")
  },

  updateURL: function(params, silent) {
    var out = [];

    Object.keys(this.allowedHashParams).forEach(function(k){
      if (params.hasOwnProperty(k)) {
        if (params[k] !== null && params[k] !== '') {
          out.push(k + "=" + params[k]);
        }
      }
    });

    // TODO: how to get current path out of `react-mini-router`
    var path = '/';
    navigate(path + '?' + out.join('&'), silent);
  },

  readURL: function() {

  },

  onChange: function(e) {
    this.setState(e);
    /*
    switch(e.caller.source) {
      case 'diarylines':
        this.setState({'diaryData': true});
      break;

      case 'diaryentries':
        //this.setState({'diaryEntryData': true});
      break;
    }
    */
  },

  handleMapMove: function(evt) {
    this.updateURL({loc: hashUtils.formatCenterAndZoom(evt.target)}, true);
  },

  trailSelectorChange: function(elm, idx) {
    DiaryLinesStore.setFiltered(elm.getAttribute('data-trail'));
  },

  mareySliderChange: function(date) {
    //console.log("SLIDER CHANGE: ", date.getFullYear(), this.state.year);
    if (this.state.year != date.getFullYear()) {
      this.setState({year:date.getFullYear()});
    }
  },

  render: function() {
    return this.renderCurrentRoute();
  },

  notFound: function(path) {
    return <div class="not-found">Page Not Found: {path}</div>;
  },

  home: function(params) {
    params = params || {};

    var mapOptions = {
      scrollWheelZoom: false
    };

    var mapEvents = {
      move: helpers.debounce(this.handleMapMove, 250)
    };

    // set various things from URL params
    var loc = [-5.200,0.330];
    var zoom = 5;

    if (params.loc) {
      var o = hashUtils.parseCenterAndZoom(params.loc);
      if (o) {
        loc = o.center;
        zoom = o.zoom;
      }
    }

    return (

      <div className='container full-height'>
        <div className='row full-height'>
          <div className='columns eight full-height'>
            <header className='row'>
              <h1 className='u-full-width'>Overland Trails</h1>
            </header>
            <div id='map-wrapper' className='row'>
              <div className='columns twelve full-height'>
                <LeafletMap ref="map" location={loc} zoom={zoom} mapEvents={mapEvents} mapOptions={mapOptions}>
                  <CartoTileLayer
                    src="http://ec2-54-152-68-8.compute-1.amazonaws.com/richmond-terrain/{z}/{x}/{y}.png"
                    userId={config.cartodbAccountName}
                    sql="SELECT * FROM unified_basemap_layers order by ord"
                    cartocss="#unified_basemap_layers[layer='ne_10m_coastline_2163']{  line-color: #aacccc;  line-width: 0.75;  line-opacity: 1;  line-join: round;  line-cap: round;}#unified_basemap_layers[layer='ne_10m_lakes_2163'] {  line-color: #aacccc;  line-width: 2.5;  line-opacity: 1;  line-join: round;  line-cap: round;  /* Soften lines at lower zooms */  [zoom<=7] {    line-width: 2.5;    line-color: lighten(desaturate(#aacccc,2%),2%);  }  [zoom<=5] {    line-width: 1.5;    line-color: lighten(desaturate(#aacccc,5%),5%);  }  /* Separate attachment because seams */  ::fill {    polygon-fill: #ddeeee;    polygon-opacity: 1;  }  /* Remove small lakes at lower zooms */  [scalerank>3][zoom<=5] {    ::fill {      polygon-opacity: 0;    }    line-opacity: 0;  }  [scalerank>6][zoom<=7] {    ::fill {      polygon-opacity: 0;    }    line-opacity: 0;  }}#unified_basemap_layers[layer='ne_10m_rivers_lake_centerlines_2163'] {  line-color: #aacccc;  line-width: 1.5;  line-opacity: 1;  line-join: round;  line-cap: round;  [name='Mississippi'],  [name='St. Lawrence'],  [name='Rio Grande'] {    line-width: 4;  }  [zoom<=8][name='Mississippi'],  [zoom<=8][name='St. Lawrence'],  [zoom<=8][name='Rio Grande'] {    line-width: 2;  }  [zoom<=8][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande'],  [zoom<=6][name='Mississippi'],  [zoom<=6][name='Rio Grande'] {    line-width: 1;    line-color: lighten(desaturate(#aacccc,2%),2%);  }  [zoom<=6][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande'] {    line-width: 0.5;    line-color: lighten(desaturate(#aacccc,5%),5%);  }  [zoom<=5][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande']{    line-width: 0;  }  [zoom<=5][name='Mississippi'],  [zoom<=5][name='St. Lawrence'],  [zoom<=5][name='Rio Grande'] {    line-width: 0.5;    line-color: lighten(desaturate(#aacccc,2%),2%);  }}#unified_basemap_layers[layer='ne_10m_admin_0_countries_lakes_2163'] {  line-color: white;  line-width: 1;  line-opacity: 1;  line-join: round;  line-cap: round;  polygon-fill: white;  polygon-opacity: 1;}"/>
                  <TileLayer src="http://ec2-54-152-68-8.compute-1.amazonaws.com/richmond-terrain/{z}/{x}/{y}.png" attribution="&copy; <a href='http://osm.org/copyright'>OpenStreetMap</a> contributors | Designed by <a href='http://stamen.com?from=richmondatlas'>Stamen Design</a>" />
                  <GeoJSONLayer featuregroup={DiaryLinesStore.getData()} className='diary-lines' onEachFeature={DiaryLinesStore.onEachFeature} />
                </LeafletMap>
              </div>

              <ButtonGroup onChange={this.trailSelectorChange} selectedIndex={0}>
                <button data-trail="all">All Trails</button>
                <button data-trail="or">Oregon Trail</button>
                <button data-trail="ca">CA trail</button>
                <button data-trail="ut">UT trail</button>
              </ButtonGroup>

            </div>
            <div id="marey-chart-wrapper" className='row'>
              <div className='columns twelve full-height'>

                <MareyChart chartdata={DiaryEntriesStore.getData()} onSliderChange={this.mareySliderChange}/>
              </div>
            </div>
          </div>

          <div className='columns four full-height'>
            <div id="narrative-wrapper" className='row'>
              <div className='columns twelve full-height'>
                <DiaristList items={DiaryEntriesStore.getDiarists()}/>
              </div>
            </div>
            <div id="flow-map-wrapper" className='row'>
              <div className='columns twelve full-height'>
                <FlowMap flowdata={EmigrationsStore.getData()} year={this.state.year}/>
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  }

});

module.exports = App;