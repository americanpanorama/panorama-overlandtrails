var React   = require("react");
var Leaflet = require("leaflet");

var Milestones = React.createClass({
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
    /*
    this.map = map;
    this.map.on('viewreset', this.position);
    this.map.on('zoomend', this.position);
    if (this.dirty) {
      this.draw(this.props.features);
    }
    */
  },

  addTo: function(map) {
    this.onAdd(map);
  },

  onAdd: function (map) {

    this.map = map;

    this._el = L.DomUtil.create('div', 'milestones-layer leaflet-zoom-hide');
    this.map.getPanes().overlayPane.appendChild(this._el);

    this.map.on('viewreset', this._reset, this);
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

  _reset: function() {
    var bounds = this.map.getBounds(),
        topLeft = this.map.latLngToLayerPoint(bounds.getNorthWest()),
        bottomRight = this.map.latLngToLayerPoint(bounds.getSouthEast());

    if (this.svg) {
      this.svg
        .style("width", this.map.getSize().x + 'px')
        .style("height", this.map.getSize().y + 'px')
        .style("margin-left", topLeft.x + "px")
        .style("margin-top", topLeft.y + "px");

      this.container.attr("transform", "translate(" + (-topLeft.x) + "," + (-topLeft.y) + ")");
    }
    this.filter();
    this.position();
  },

  componentDidMount: function() {
    this.milestones = [];
    this.props.leafletLayer = this;
  },

  componentWillUnmount: function() {
    this.map.getPanes().overlayPane.removeChild(this._el);
    this.map.off('viewreset', this._reset, this);
    this.milestones = [];
    this.line = null;
  },

  componentDidUpdate: function() {
    if ((this.props.features && this.props.features.features.length) && !this.loaded) {
      this.loaded = true;
      this.draw(this.props.features);
    }

    if (this.props.currentDate !== this.currentDate) {
      this.currentDate = this.props.currentDate;
      this.filter();
    }
  },

  filter: function() {
    if (!this.map) return;
    var date = this.props.currentDate || null;
    var zoom = this.map.getZoom();
    this.milestones.forEach(function(m) {
      m.show = 'none';

      if (date) {
        if (zoom >= m.zoomStart && zoom <= m.zoomEnd) {
          if (!m.start) {
            m.show = 'block';
          } else if (!m.end && date >= m.start) {
            m.show = 'block';
          } else if (date >= m.start && date <= m.end) {
            m.show = 'block';
          }
        }
      }

      m.elm.style('display', m.show);
    });
  },

  position: function() {
    if (this.milestones && this.map) {
      var that = this;
      this.milestones.forEach(function(m){
        if (m.show === 'none') return;

        var pt;
        if (m.markerType === 'icon') {
          pt = that.map.latLngToLayerPoint(m.coords);
          m.elm
            .attr('cx', pt.x + 'px')
            .attr('cy', pt.y + 'px');

        } else if(m.markerType === 'label') {
          pt = that.map.latLngToLayerPoint(m.coords);
          m.elm
            .attr('x', pt.x + 'px')
            .attr('y', pt.y + 'px');

        } else if(m.markerType === 'line') {
          m.elm.attr('d', that.line(m.coords));
        }
      });
    }
  },

  draw: function(data) {
    if (!data) return;

    if (!this.map) {
      this.dirty = true;
      return;
    }

    this.dirty = false;
    var that = this;

    var bounds = this.map.getBounds(),
        topLeft = this.map.latLngToLayerPoint(bounds.getNorthWest()),
        bottomRight = this.map.latLngToLayerPoint(bounds.getSouthEast());

    if (!this.svg) {
      this.svg = d3.select(this._el).append("svg")
            .style("width", this.map.getSize().x + 'px')
            .style("height", this.map.getSize().y + 'px')
            .style("margin-left", topLeft.x + "px")
            .style("margin-top", topLeft.y + "px");
      this.container = this.svg.append("g").attr('class', 'milestones-container')
        .attr("transform", "translate(" + (-topLeft.x) + "," + (-topLeft.y) + ")");
    }


    if (this.milestones.length) return position();


    this.line = d3.svg.line()
    .x(function(d) { return that.map.latLngToLayerPoint(d).x; })
    .y(function(d) { return that.map.latLngToLayerPoint(d).y; })
    .interpolate("linear");

    this.milestones = [];

    data.features.forEach(function(f){
      var props = f.properties,
          type  = f.geometry.type;

      var coords, m, pt;
      if (props.maptype === 'icon') {
        coords = f.geometry.coordinates[0].reverse();
        pt = that.map.latLngToLayerPoint(coords);
        m = that.container
          .append('circle')
            .attr('class', 'milestone-' + [props.maptype,props.type].join(' '))
            .attr('cx', pt.x + 'px')
            .attr('cy', pt.y + 'px')
            .attr('r', 3);

      } else if (props.maptype === 'label') {
        coords = f.geometry.coordinates[0].reverse();
        pt = that.map.latLngToLayerPoint(coords);
        var ta = (props.justify === 'left') ? 'start' : 'end';
        m = that.container
          .append('text')
            .attr('class', 'milestone-' + [props.maptype, props.type].join(' '))
            .attr('x', pt.x + 'px')
            .attr('y', pt.y + 'px')
            .attr('text-anchor', ta)
            .text(props.location);


      } else if (props.maptype === 'line') {
        coords = f.geometry.coordinates;
        coords.forEach(function(c){
          c.reverse();
        });
        m = that.container.append('path')
          .attr('class', 'milestone-' + [props.maptype,props.type].join(' '))
          .attr('d', that.line(coords));
      }

      if (m) {
        that.milestones.push({
          elm: m,
          coords: coords,
          geometryType: type,
          markerType: props.maptype || '',
          start: props['start_year'] ? new Date(props['start_year']) : null,
          end: props['end_year'] ? new Date(props['end_year']) : null,
          zoomStart: props['startzoom'] ? +props['startzoom'] : that.map.minZoom,
          zoomEnd: props['endzoom'] ? +props['endzoom'] : that.map.maxZoom
        });
      } else {
        console.error('Unknown feature: ', f);
      }

    });

    this.filter();
  },

  render: function() {

    return false;

  }

});
module.exports = Milestones;