/** @jsx React.DOM */
var React   = require("react");
var d3      = require("d3");
var topojson = require("topojson");


var flow_trails = {
  "california": {type: "LineString", coordinates: [[-90.1978, 38.1272], [-112.447278, 42.075222], [-119.7462, 39.17]]},
  "oregon": {type: "LineString", coordinates: [[-90.1978, 38.6272], [-112.447278, 42.575222], [-122.1269, 44.5672]]},
  "utah": {type: "LineString", coordinates: [[-90.1978, 38.8272], [-109.202904, 42.458464], [-111.8535, 40.1135]]}
};

var label_push = {
  "california": 13,
  "oregon": -10,
  "utah": 10
}

var FlowMap = React.createClass({
  svgElm: null,
  margin: {top: 0, right: 0, bottom: 0, left: 0},
  width: null,
  height: null,
  geo: {
    path: null,
    projection: null
  },
  thicknessScale: null,
  years: {},
  hasData: false,

  setGeo: function() {
    this.geo.projection = d3.geo.albers()
      .translate([540, 330])
      .scale(1450);

    this.geo.path = d3.geo.path()
    .projection(this.geo.projection);
  },

  setThicknessScale: function() {
    this.thicknessScale = d3.scale.linear().range([0,20]);
  },

  setWidth: function (x) {
    this.width = x - this.margin.left - this.margin.right;
  },

  setHeight: function(y) {
    this.height = y - this.margin.top - this.margin.bottom;
  },

  getInitialState: function () {
    return {year: 1840};
  },


  componentDidMount: function() {
    var that = this;
    var container = this.getDOMNode();
    this.setWidth(container.offsetWidth);
    this.setHeight(container.offsetHeight);
    this.setGeo();
    this.setThicknessScale();

    this.svgElm = d3.select('#flow-map').append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height  + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    var background = this.svgElm.append("g");

    d3.json("static/world-50m.json", function(error, world) {
      background.insert("path", ".graticule")
          .datum(topojson.feature(world, world.objects.land))
          .attr("class", "land")
          .attr("d", that.geo.path);
    });
  },

  componentWillUnmount: function() {

  },

  componentDidUpdate: function() {
    if (!this.hasData && this.props.flowdata && this.props.flowdata.length) {
      this.visualize(this.props.flowdata);
      this.hasData = true;
    }

  },

  updateYear: function(year) {
    var that = this;
    this.svgElm.select(".california")
      .style("stroke-width", this.thicknessScale(this.years[year].california));

    this.svgElm.select(".utah")
      .style("stroke-width", this.thicknessScale(this.years[year].utah));

    this.svgElm.select(".oregon")
      .style("stroke-width", this.thicknessScale(this.years[year].oregon));

    this.svgElm.selectAll(".state-label")
      .text(function(d) { return d3.format(",")(that.years[year][d]); });
  },

  visualize: function(emigrations) {
    var that = this;

    var data = emigrations.filter(function(d) {
      return +d.year;
    });

    var values = [];

    data.forEach(function(d) {
      that.years[d.year] = d;
      values.push(d.oregon);
      values.push(d.california);
      values.push(d.utah);
    });

    this.thicknessScale.domain([0, d3.max(values)]);

    this.svgElm.selectAll("path.flow")
      .data(d3.keys(flow_trails))
      .enter().append("path")
      .attr("class", function(d) { return "flow " + d; })
      .attr("d", function(d) { return that.geo.path(flow_trails[d]); });

    this.svgElm.selectAll("text.state-label")
      .data(["utah", "california", "oregon"])
      .enter().append("text")
      .attr("class", function(d) { return "state-label " + d; })
      .text(String)
      .attr("dy", function(d) { return label_push[d]; })
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("transform", function(d) { return "translate(" + that.geo.projection(flow_trails[d].coordinates[flow_trails[d].coordinates.length-1]) + ")" });

    this.updateYear(1850);

  },

   handleChange: function(e) {
    e.preventDefault();

    this.setState({year: e.target.value});
    this.updateYear(e.target.value);
  },

  render: function() {
    return (
        <div className="component flow-map">
          <input type="range" id="yearpicker" min="1840" value={this.state.year} max="1860" step="1" onChange={this.handleChange}/>
          <span id="year-output">1840</span>
          <div id="flow-map"></div>
          <div id="tooltip"></div>
        </div>
    );

  }

});

module.exports = FlowMap;