/** @jsx React.DOM */
var React   = require("react");
var d3      = require("d3");
//var ReactSlider = require("../components/Slider.js");


var MareyChart = React.createClass({
  svgElm: null,
  margin: {top: 30, right: 40, bottom: 12, left: 40},
  width: null,
  height: null,
  xscale: null,
  yscale: null,
  line: null,
  color: null,
  xAxis: null,
  yAxis: null,
  brush: null,
  slider: null,
  handle: null,
  hasSlider: true,
  hasData: false,

  setXYScales: function() {
    this.xscale = d3.time.scale()
      .range([0, this.width])
      .domain([new Date("Jan 1, 1840"), new Date("Dec 31, 1860")])
      .clamp(true);

    this.yscale = d3.scale.linear()
      .range([0, this.height])
      .domain([-85,-124]);
  },

  setBrush: function() {
    var that = this;
    this.brush = d3.svg.brush()
      .x(this.xscale)
      .extent([this.xscale.domain()[0], this.xscale.domain()[0]])
      .on("brush", function(e){
        that.brushed(this);
      });
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

  brushed: function(context) {

    var value = this.brush.extent()[0];

    if (d3.event.sourceEvent) { // not a programmatic event
      value = this.xscale.invert(d3.mouse(context)[0]);
      this.brush.extent([value, value]);
    }

    //console.log(value)

    this.handle.attr("transform", "translate(" + this.xscale(value) + ",0)");
   // handle.select('text').text(formatDate(value));
   if (this.props.onSliderChange) this.props.onSliderChange(value);

  },

  getInitialState: function () {
    return {};
  },


  componentDidMount: function() {
    var container = this.getDOMNode();
    var that = this;
    this.setWidth(container.offsetWidth);
    this.setHeight(container.offsetHeight);
    this.setXYScales();
    this.setLine();
    this.setColorScale();
    this.setXYAxis();
    if (this.hasSlider) this.setBrush();

    this.svgElm = d3.select(container).append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height  + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    d3.select('#marey-slider')
      .style('width', this.width + 'px')
      .style('height', this.height + 'px')
      .style('top', this.margin.top + 'px')
      .style('left', this.margin.left + 'px')
      .style('display', 'block');
  },

  componentWillUnmount: function() {

  },

  componentDidUpdate: function() {
    if (this.hasData) return;
    if (!this.props.chartdata.hasOwnProperty('entries')) return;
    this.hasData = true;
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

    this.svgElm.append("rect")
      .attr('x', this.xscale(this.xscale.domain()[0]))
      .attr('y',  this.yscale(this.yscale.domain()[0]))
      .attr('width', this.xscale(this.xscale.domain()[1]))
      .attr('height',  this.yscale(this.yscale.domain()[1]));

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

    this.svgElm.append("g")
      .attr("class", "journies")
      .selectAll(".journey")
      .data(nested)
    .enter().append("path")
      .attr("class", "journey")
      .attr("d", function(d) {return that.line(d.values); })
      .style("stroke", function(d) { return d.key in journals ? that.color(journals[d.key].trail) : "#d0d0d0"; })
      .on("mouseover", function(d) {
        console.log("mouseOver: ",d.key);
      });

    if (this.hasSlider) {
      console.log("Slider")
      this.slider = this.svgElm.append("g")
        .attr("class", "slider")
        .call(that.brush);

      this.slider.selectAll(".extent,.resize")
        .remove();

      this.slider.select(".background")
        .attr("height", this.height);

      this.handle = this.slider.append("g")
        .attr("class", "handle");

      this.handle.append("path")
        .attr("transform", "translate(0," + this.height / 2 + ")")
        .attr("d", "M 0 -20 V 20");

      this.slider
        .call(that.brush.event)
    }
  },

  /*
  handleSliderChange: function(value) {
    var pctWidth = (value/100) * this.width;
    var date = this.xscale.invert(pctWidth);
  },


  <div id="marey-slider">
    <ReactSlider defaultValue={0} step={0.1} onChange={this.handleSliderChange} />
  </div>
   */

  render: function() {
    return (
        <div className="component marey-chart">
        </div>
    );

  }

});

module.exports = MareyChart;