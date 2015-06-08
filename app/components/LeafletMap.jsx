/** @jsx React.DOM */
var React   = require("react");
var Leaflet = require("leaflet");
var Loader = require("./Loader.jsx");

//
// Leaflet Base Instance
//
var LeafletMap = React.createClass({

  getInitialState: function () {
    return {};
  },

  componentDidMount: function() {
    L.Icon.Default.imagePath = "static";

    var map = L.map(this.getDOMNode().querySelector(".leaflet-container"), this.props.mapOptions || {})
      .setView(this.props.location, this.props.zoom);

    map._initPathRoot();

    this.setState({'zoom': 10});
    this.map = map;

    React.Children.forEach(this.props.children, function(child, i) {

      if (!child.props.leafletLayer.isManager) {
        child.props.leafletLayer.setZIndex(i+10);
        child.props.leafletLayer.addTo(map);
      } else {
        child.props.leafletLayer.setMap(map);
      }

    });

    var me = this;
    if (this.props.mapEvents) {
      for (var evt in this.props.mapEvents) {
        map.on(evt, me.props.mapEvents[evt]);
      }
    }

  },

  componentWillUnmount: function() {
    this.map.clearAllEventListeners();
    this.map = null;
  },

  componentDidUpdate: function() {
  },

  render: function() {
    return (
        <div className="component full-height">
          <div className="leaflet-container"></div>
          {this.props.children}
        </div>
    );
  }

});

//
// Leaflet tile layer
//
var TileLayer = React.createClass({

  getInitialState: function () {

    return {};
  },

  componentDidMount: function() {

     this.props.leafletLayer = L.tileLayer(this.props.src, this.props);

  },

  render: function() {

    return false;

  }

});

//
// Leaflet geoJSON layer
//
var GeoJSONLayer = React.createClass({

  getInitialState: function () {

    return {};
  },

  addFeatures: function() {
    var that = this;
    if (!this.props.featuregroup || !this.props.featuregroup.features) return;

    var ct = 0;
    this.props.featuregroup.features.forEach(function(feature) {
      that.layer.addData(feature);
      ct += 1;
    });

    if (ct > 0) this.loaded = true;

    if (this.props.onClick) {
      this.layer.eachLayer(function(layer) {
        layer.on("click", function(e) {
          that.props.onClick(layer, e);
        });
      });
    }

  },

  componentDidMount: function() {

    this.layer = L.geoJson(null, this.props);
    this.props.leafletLayer = this.layer;
    this.addFeatures();

  },

  componentWillUnmount: function() {

    this.layer = null;
    if (this.props.onClick) {
      this.layer.off("click", this.props.onClick);
    }

  },

  componentDidUpdate: function() {

    var that = this;
    if (!this.props.featuresChange && this.loaded) return;

    this.layer.eachLayer(function(layer) {
      that.layer.removeLayer(layer);
    });

    this.addFeatures();

  },

  render: function() {

    return false;

  }

});

var MarkerLayer = React.createClass({
  markers: [],
  isManager: true,
  needsUpdating: false,
  pathOptions: {
    radius: 6,
    stroke: true,
    color: '#ff0099',
    weight: 3,
    opacity: 1,
    fill: true,
    fillColor: '#000000',
    fillOpacity: 1,
    className: 'entry'
  },
  hasData: false,

  getInitialState: function () {
    return {};
  },

  setMap: function(map) {
    this.map = map;
    if(this.needsUpdating) this.addMarkers(this.props.markers);
  },

  onMarkerClick: function(e) {
    if (this.props.onMarkerClick) this.props.onMarkerClick(e.target || null);
  },

  addMarkers: function(markers) {
    if (!this.map) {
      this.needsUpdating = true;
      return;
    }

    this.needsUpdating = false;
    var that = this;
    markers.forEach(function(marker){
      if (that.props.filter && that.props.filter(marker)) {
        var opts = L.Util.extend({},that.pathOptions, marker.markerOptions);

        var m = L.circleMarker(marker.coordinates,opts).addTo(that.map);
        m.on('click', that.onMarkerClick);
        m.data_ = marker;
        that.markers.push(m);
      }
    });

  },

  removeMarkers: function() {
    if (!this.map) {
      return;
    }
    var that = this;
    this.markers.forEach(function(m){
      if (that.map.hasLayer(m)) {
        m.off('click', that.onMarkerClick);
        that.map.removeLayer(m);
      }
    });
    this.markers.length = 0;

  },

  componentDidMount: function() {
    this.props.leafletLayer = this;

  },

  componentWillUnmount: function() {
    this.removeMarkers();
    this.map = null;

  },

  componentDidUpdate: function() {
    this.removeMarkers();
    this.addMarkers(this.props.markers);
  },

  render: function() {

    return false;

  }

});

module.exports = LeafletMap;
module.exports.TileLayer = TileLayer;
module.exports.GeoJSONLayer = GeoJSONLayer;
module.exports.MarkerLayer = MarkerLayer;