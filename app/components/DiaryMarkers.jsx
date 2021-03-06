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
  currentZIndex: 1,

  getInitialState: function () {
    return {};
  },

  setMap: function(map) {

  },

  addTo: function(map) {
    this.onAdd(map);
  },

  onAdd: function (map) {
    var that = this;
    this.map = map;

    this._el = L.DomUtil.create('div', 'diarymarkers-layer leaflet-zoom-hide leaflet-d3-overlay');
    this.map.getPanes().overlayPane.appendChild(this._el);

    this.svg = d3.select(this._el).append("svg");

    this.container = this.svg.append("g").attr('class', 'diarymarkers-container');

    if (typeof this.props.onMarkerClick === 'function') {
      this.svg.on('click', this.onMarkerClick);
    }

    this.map.on('viewreset', this._reset, this);

    this.setZIndex(currentZIndex);
    this.setOverlayPosition();

    if (this.dirty) {
      this.draw(this.props.features);
    }
  },

  onMarkerClick: function() {
    if (d3.event.target && d3.event.target._marker) {
      this.props.onMarkerClick(d3.event.target._marker);
    }
  },

  onRemove: function (map) {
    this.componentWillUnmount();
  },

  setZIndex: function(num) {
    if (typeof num === 'undefined' || isNaN(num)) return;
    currentZIndex = num;

    if (this._el) {
      this._el.style.zIndex = currentZIndex;
    }
  },

  setOverlayPosition: function() {
    var bounds = this.map.getBounds(),
        topLeft = this.map.latLngToLayerPoint(bounds.getNorthWest()),
        bottomRight = this.map.latLngToLayerPoint(bounds.getSouthEast());

    if (this.svg) {
      d3.select(this._el)
        .style("width", this.map.getSize().x + 'px')
        .style("height", this.map.getSize().y + 'px')
        .style("margin-left","0px")
        .style("margin-top", "0px")
        .attr("transform", "translate(" + (-topLeft.x) + "," + (-topLeft.y) + ")");

      this.svg
        .style("width", this.map.getSize().x + 'px')
        .style("height", this.map.getSize().y + 'px')
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

    if (typeof this.props.onMarkerClick === 'function') {
      this.svg.off('click', this.onMarkerClick);
    }

    this.markers = [];
    this.line = null;
  },

  shouldComponentUpdate: function(nextProps, nextState) {
    return true;
  },

  componentDidUpdate: function() {
    this.removeMarkers();
    this.addMarkers(this.props.markers);
  },

  positionMarkers: function() {
    if (this.map) {
      var that = this;
      this.markers.forEach(function(marker){
        var m = marker.node()._marker;
        if (m.coordinates) {
          var pt = that.map.latLngToLayerPoint(m.coordinates);
          marker
            .attr('cx', pt.x + 'px')
            .attr('cy', pt.y + 'px');
        }
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

        marker.node()._marker = m;

        that.markers.push(marker);
      }

    });



  },

  render: function() {

    return false;

  }

});
module.exports = DiaryMarkers;