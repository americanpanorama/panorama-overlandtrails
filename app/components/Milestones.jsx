var React   = require("react");
var Leaflet = require("leaflet");

var Milestones = React.createClass({
  isManager: true,
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

  getInitialState: function () {
    return {};
  },

  setMap: function(map) {
    this.map = map;
  },

  componentDidMount: function() {
    this.props.leafletLayer = this;
  },

  componentWillUnmount: function() {
    this.map = null;
  },

  componentDidUpdate: function() {
    if (this.props.features && !this.loaded) {
      this.loaded = true;
      this.draw(this.props.features);
    }
  },

  draw: function(data) {
    return;
    if (!this.svg) {
      this.svg = d3.select(this.map._container).select('svg');
      this.container = this.svg.append("g").attr('class', 'milestones-container');
    }

    var that = this;
    var line = d3.svg.line()
    .x(function(d) { return that.map.latLngToLayerPoint(d).x; })
    .y(function(d) { return that.map.latLngToLayerPoint(d).y; })
    .interpolate("linear");

    data.features.forEach(function(f){
      var props = f.properties,
          type  = f.geometry.type;

      var coords;
      if (type  === 'MultiPoint') {
        coords = f.geometry.coordinates[0].reverse();
        var pt = that.map.latLngToLayerPoint(coords);
        if (props.type === 'icon') {
          that.container
            .append('circle')
              .attr('cx', pt.x + 'px')
              .attr('cy', pt.y + 'px')
              .attr('r', 3);
        }

        if (props.justify) {
          var ta = (props.justify === 'left') ? 'start' : 'end';
          that.container
            .append('text')
              .attr('x', pt.x + 'px')
              .attr('y', pt.y + 'px')
              .attr('text-anchor', ta)
              .text(props.location);
        }



      } else if (type === 'LineString') {
        /*
        coords = f.geometry.coordinates[0];
        coords.forEach(function(c){
          c.reverse();
        });

        that.container.append('path')
          .attr('d', line(coords));
        */
      }

    });
  },

  render: function() {

    return false;

  }

});
module.exports = Milestones;