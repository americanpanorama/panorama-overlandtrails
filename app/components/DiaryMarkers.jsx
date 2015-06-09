var React   = require("react");
var Leaflet = require("leaflet");
var d3      = require('d3');

var DiaryMarkers = React.createClass({
  pathOptions: {
    radius: 12,
    stroke: true,
    color: '#ff0099',
    weight: 3,
    opacity: 1,
    fill: true,
    fillColor: '#000000',
    fillOpacity: 1,
    className: 'entry'
  },
  map: null,

  getInitialState: function () {
    return {};
  },

  setMap: function(map) {

  },

  addTo: function(map) {
    this.onAdd(map);
  },

  onAdd: function (map) {

    this.map = map;

    this._el = L.DomUtil.create('div', 'diarymarkers-layer leaflet-zoom-hide');
    this.map.getPanes().overlayPane.appendChild(this._el);

    this.svg = d3.select(this._el).append("svg");

    this.container = this.svg.append("g").attr('class', 'diarymarkers-container');

    this.map.on('viewreset', this._reset, this);

    this.setOverlayPosition();

    if (this.dirty) {
      this.draw(this.props.features);
    }
  },
  onRemove: function (map) {
    this.componentWillUnmount();
  },
  setZIndex: function(num) {
    if (this._el) {}
  },

  setOverlayPosition: function() {
    var bounds = this.map.getBounds(),
        topLeft = this.map.latLngToLayerPoint(bounds.getNorthWest()),
        bottomRight = this.map.latLngToLayerPoint(bounds.getSouthEast());

    if (this.svg) {
      d3.select(this._el)
        .style("width", this.map.getSize().x + 'px')
        .style("height", this.map.getSize().y + 'px')
        .style("margin-left", topLeft.x + "px")
        .style("margin-top", topLeft.y + "px");

      this.svg
        .style("width", this.map.getSize().x + 'px')
        .style("height", this.map.getSize().y + 'px')
        .attr("transform", "translate(" + (-topLeft.x) + "," + (-topLeft.y) + ")");
    }
  },

  _reset: function() {
    this.setOverlayPosition();
    this.positionMarkers();
  },

  componentDidMount: function() {
    this.markers = [];
    this.props.leafletLayer = this;
  },

  componentWillUnmount: function() {
    this.map.getPanes().overlayPane.removeChild(this._el);
    this.map.off('viewreset', this._reset, this);
    this.markers = [];
    this.line = null;
  },

  componentDidUpdate: function() {
    this.removeMarkers();
    this.addMarkers(this.props.markers);
  },

  positionMarkers: function() {
    if (this.map) {
      var that = this;
      this.markers.forEach(function(m){
      });
    }
  },

  removeMarkers: function() {
    this.markers.forEach(function(d){
      d.remove();
    });
    this.markers = [];
  },

  addMarkers: function(data) {
    if (!data || !data.length) return;

    if (!this.map) {
      this.dirty = true;
      return;
    }



    this.dirty = false;
    var that = this;

    data.forEach(function(m){
      var valid = true;
      if (that.props.filter) valid = that.props.filter(m);
      if (valid) {
        var pt = that.map.latLngToLayerPoint(m.coordinates);
        var marker = that.container
            .append('circle')
              .attr('class',  m.markerOptions.className || 'trail-dot')
              .attr('cx', pt.x + 'px')
              .attr('cy', pt.y + 'px')
              .attr('r', m.markerOptions.radius || 6);

        that.markers.push(marker);
      }

    });



  },

  render: function() {

    return false;

  }

});
module.exports = DiaryMarkers;