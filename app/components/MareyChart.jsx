/** @jsx React.DOM */
var React   = require("react");
var d3      = require("d3");

//
// Button Group
//
var MareyChart = React.createClass({
  svgElm: null,
  margin: {top: 30, right: 80, bottom: 12, left: 40},
  width: null,
  height: null,
  xscale: null,
  yscale: null,
  line: null,
  color: null,
  xAxis: null,
  yAxis: null,

  setXYScales: function() {
    this.xscale = d3.time.scale()
      .range([0, this.width])
      .domain([new Date("Jan 1, 1840"), new Date("Dec 31, 1860")]);

    this.yscale = d3.scale.linear()
      .range([0, this.height])
      .domain([-85,-124]);
  },

  setLine: function() {
    var that = this;
    this.line = d3.svg.line()
      .x(function(d) { return that.xscale(d.date); })
      .y(function(d) { return that.yscale(d.mercatorCoords[1]); });
  },

  setColorScale: function() {
    this.color = d3.scale.ordinal()
      .range(["#1b9e77","#d95f02","#7570b3","#e7298a","#66a61e","#e6ab02","#a6761d","#666666"]);
  },

  setXYAxis: function () {
    this.xAxis = d3.svg.axis()
      .scale(this.xscale)
      .orient("top")
      .tickSize(-this.height);

    this.yAxis = d3.svg.axis()
                  .scale(this.yscale)
                  .orient("left")
                  .tickValues([-86, -123])
                  .tickSize(-this.width)
                  .tickFormat(function(d) { return (-d) + "°W"; });
  },

  setWidth: function (x) {
    this.width = x - this.margin.left - this.margin.right;
  },

  setHeight: function(y) {
    this.height = y - this.margin.top - this.margin.bottom;
  },

  getInitialState: function () {
    return {};
  },


  componentDidMount: function() {
    var container = this.getDOMNode();
    console.log(container.offsetHeight)
    var that = this;
    this.setWidth(container.offsetWidth);
    this.setHeight(container.offsetHeight);
    this.setXYScales();
    this.setLine();
    this.setColorScale();
    this.setXYAxis();

    this.svgElm = d3.select(container).append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height  + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
  },

  componentWillUnmount: function() {

  },

  componentDidUpdate: function() {

    if (!this.props.chartdata.hasOwnProperty('entries')) return;

    this.visualize(
      this.props.chartdata.entries,
      this.props.chartdata.source
    );
  },

  visualize: function(data, journals) {
    var that = this;

    data = data.filter(function(d) {
      return (d.mercatorCoords[1] > that.yscale.domain()[1]) && (d.mercatorCoords[1] < that.yscale.domain()[0]);
    })
    .filter(function(d) {
      return (d.date > that.xscale.domain()[0]) && (d.date < that.xscale.domain()[1]);
    }).sort(function(a,b) {
      return d3.ascending(a.date, b.date);
    });


    this.svgElm.append("g")
      .attr("class", "y axis")
      .call(that.yAxis)
      .selectAll("line")
      .attr("stroke-dasharray", "2,2");

    this.svgElm.append("g")
      .attr("class", "x axis")
      .call(that.xAxis);

    var nested = d3.nest()
      .key(function(d) { return d.journal_id; })
      .entries(data);

    this.svgElm.selectAll(".journey")
      .data(nested)
    .enter().append("path")
      .attr("class", "journey")
      .attr("d", function(d) {return that.line(d.values); })
      .style("stroke", function(d) { return d.key in journals ? that.color(journals[d.key].trail) : "#d0d0d0"; })
      .on("mouseover", function(d) {
        console.log(d);
      });

    d3.select("#legend").selectAll("span")
      .data(that.color.domain())
      .enter().append("span")
      .text(String)
      .style("margin-right", "12px")
      .style("color", function(d) { return that.color(d); });
  },

  render: function() {
    return (
        <div className="component marey-chart">
        </div>
    );

  }

});

module.exports = MareyChart;