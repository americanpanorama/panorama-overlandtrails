/** @jsx React.DOM */
var React   = require("react");
var Leaflet = require("leaflet");

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

    this.setState({'zoom': 10});
    this.map = map;

    React.Children.forEach(this.props.children, function(child, i) {

      child.props.leafletLayer.setZIndex(i+10);
      child.props.leafletLayer.addTo(map);

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

    this.props.featuregroup.features.forEach(function(feature) {
      /*
      feature.geometry.coordinates = feature.geometry.coordinates.sort(function(a,b){
        return b[0]-a[0];
      });
      */
      that.layer.addData(feature);
    });


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

    this.layer.eachLayer(function(layer) {
      that.layer.removeLayer(layer);
    });

    this.addFeatures();

  },

  render: function() {

    return false;

  }

});

module.exports = LeafletMap;
module.exports.TileLayer = TileLayer;
module.exports.GeoJSONLayer = GeoJSONLayer;