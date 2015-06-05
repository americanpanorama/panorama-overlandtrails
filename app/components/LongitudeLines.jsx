var React   = require("react");
var Leaflet = require("leaflet");
var proj4   = require('proj4');

var LongitudeLines = React.createClass({
  isManager: true,
  defs: {
    "EPSG:2163": "+proj=laea +lat_0=45 +lon_0=-100 +x_0=0 +y_0=0 +a=6370997 +b=6370997 +units=m +no_defs"
  },
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

  // Takes [y,x]
  // Returns transformed [y,x]
  transFormLatLng: function(ll) {
    ll = ll.reverse();
    ll = proj4(this.defs["EPSG:2163"], ll);
    return proj4(proj4.defs('EPSG:3857'), proj4.defs('EPSG:4326'), ll).reverse();
  },

  getInitialState: function () {
    return {};
  },

  setMap: function(map) {
    this.map = map;
    var that = this;

    setTimeout(function(){
      that.draw();
    }, 1000);
  },

  line: function(north, south, lon) {
    return [
       this.map.latLngToLayerPoint([north, lon]),
       this.map.latLngToLayerPoint([south, lon])
     ]
  },

  draw: function() {
    /*
     north = 37.37015718405753
     east = 89.47265625
     west = -85.341796875
     south = -47.04018214480664

     maxBounds: [[-47.0401, -85.3417], [37.3701,89.4726]]
    */
    var north = 37.37015718405753;
    var south = -47.04018214480664;
    var west = -17.830810546875;//this.transFormLatLng([37.37015718405753, -123])[1];
    var east = 9.810791015625;//this.transFormLatLng([-47.04018214480664, -86])[1];

    // just using SVG from map object...
    var svg = d3.select(this.map._container).select('svg');
    var g = svg.append("g");//.attr("class", "leaflet-zoom-hide");
    var westLine = g.append('line').attr('class', 'longitude-line');//.style('stroke', '#666').style('stroke-dasharray', "5, 6");
    var eastLine = g.append('line').attr('class', 'longitude-line');
    var westText = g.append('text').attr('class', 'longitude-text').text('123ºW');
    var eastText = g.append('text').attr('class', 'longitude-text').text('86ºW');

     var that = this;
     this.map.on("viewreset", reset);
     this.map.on("move", updateText);

     function updateText() {

      var bds = that.map.getBounds();
      var xyWest = that.map.latLngToLayerPoint( [bds.getSouth(), west] );
      var xyEast = that.map.latLngToLayerPoint( [bds.getSouth(), east] );

      westText
        .attr('x', xyWest.x - 10)
        .attr('y', xyWest.y - 13);

      eastText
        .attr('x', xyEast.x - 10)
        .attr('y', xyEast.y - 10);
     }

     function reset() {
      var westLinePoints = that.line(north,south,west);
      var eastLinePoints = that.line(north,south,east);
      updateText();

      westLine
        .attr("x1", westLinePoints[0].x)
        .attr("y1", westLinePoints[0].y)
        .attr("x2", westLinePoints[1].x)
        .attr("y2", westLinePoints[1].y);

      eastLine
        .attr("x1", eastLinePoints[0].x)
        .attr("y1", eastLinePoints[0].y)
        .attr("x2", eastLinePoints[1].x)
        .attr("y2", eastLinePoints[1].y);
     }

     reset();
  },


  componentDidMount: function() {
    this.props.leafletLayer = this;

  },

  componentWillUnmount: function() {
    this.map = null;

  },

  componentDidUpdate: function() {

  },

  render: function() {

    return false;

  }

});
module.exports = LongitudeLines;