//TODO: Enable Dates to be dynamic

/** @jsx React.DOM */
var React   = require("react");
var d3      = require("d3");

var lastWindowWidth;
var fullYearFormatter = d3.time.format('%Y');
var yearFormatter = d3.time.format('%y');
var MareyChart = React.createClass({
  svgElm: null,
  margin: {top: 18, right: 1, bottom: 10, left: 40},
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
      .domain([-70,-140]);
  },

  getWidthOfAYear: function() {
    var x0 = this.xscale(new Date("Jan 1, 1840")),
        x1 = this.xscale(new Date("Dec 31, 1840"));

    return x1-x0;
  },

  setBrush: function(date) {
    date = date || this.xscale.domain()[0];
    var that = this;
    this.brush = d3.svg.brush()
      .x(this.xscale)
      .extent([date, date])
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

  setXYAxis: function () {
    this.xAxis = d3.svg.axis()
      .scale(this.xscale)
      .ticks(d3.time.years, 1)
      .orient("top")
      .tickSize(-this.height)
      .tickPadding(7)
      .tickFormat(function(d){
        if (d.getFullYear() % 10 === 0) {
          return fullYearFormatter(d);
        } else {
          return "'" + yearFormatter(d);
        }
      });

    this.yAxis = d3.svg.axis()
                  .scale(this.yscale)
                  .orient("left")
                  .tickValues([-86, -123])
                  .tickPadding(5)
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

    this.handle.attr("transform", "translate(" + this.xscale(value) + ",0)");
    this.currentDate = value;
    if (this.props.onSliderChange) this.props.onSliderChange(value);

  },
  moveBrush: function(value) {
    this.brush.extent([value, value]);
    this.handle.attr("transform", "translate(" + this.xscale(value) + ",0)");
    if (this.props.onSliderChange) this.props.onSliderChange(value);
  },

  getInitialState: function () {
    return {};
  },


  componentDidMount: function() {
    var container = this.getDOMNode();
    var that = this;
    lastWindowWidth = window.innerWidth;
    this.setWidth(container.offsetWidth);
    this.setHeight(container.offsetHeight);
    this.setXYScales();
    this.setLine();
    this.setXYAxis();
    if (this.hasSlider) this.setBrush(this.props.currentDate);
    this.currentDate = this.props.currentDate;

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
    if ((this.props.dimensions.width !== lastWindowWidth) && this.hasData) {
      lastWindowWidth = this.props.dimensions.width;
      this.updateWidth();
    }
    if (this.props.currentDate !== this.currentDate) {
      this.currentDate = this.props.currentDate;
      if (this.brush)this.moveBrush(this.currentDate);
    }

    if (this.hasData) return;
    if (!this.props.chartdata.hasOwnProperty('entries')) return;
    this.hasData = true;
    this.visualize(
      this.props.chartdata.entries,
      this.props.chartdata.source
    );

  },

  // TODO: this is all wrong but works for now
  // Should set up a resize listener inside the component
  updateWidth: function() {
    var container = this.getDOMNode();
    this.setWidth(container.offsetWidth);
    if (this.xscale) this.xscale.range([0, this.width]);

    d3.select(container).select('svg').remove();
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

    this.visualize(
      this.props.chartdata.entries,
      this.props.chartdata.source
    );

    this.brush.extent([this.currentDate, this.currentDate]);
    this.handle.attr("transform", "translate(" + this.xscale(this.currentDate) + ",0)");
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
      .attr('x', this.xscale(this.xscale.domain()[0]) - 50)
      .attr('y',  this.yscale(this.yscale.domain()[0]))
      .attr('width', this.xscale(this.xscale.domain()[1]) + 50)
      .attr('height',  this.yscale(this.yscale.domain()[1]));

    this.svgElm.append("g")
      .attr("class", "y axis")
      .call(that.yAxis)
      .selectAll("line")
      .attr("stroke-dasharray", "2,2");

    this.svgElm.append("g")
      .attr("class", "x axis")
      .call(that.xAxis);

    this.svgElm.selectAll('.x.axis .tick')
      .filter(function(d){ return d.getFullYear() % 10 === 0;})
      .select('text')
      .attr('class', 'major')

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
      .style("stroke", function(d) { return journals[d.key].trailColor || "#d0d0d0"; })
      .on("mouseover", function(d) {
        console.log("mouseOver: ",d.key);
      });

    if (this.hasSlider) {
      this.slider = this.svgElm.append("g")
        .attr("class", "slider")
        .call(that.brush);

      this.slider.selectAll(".extent,.resize")
        .remove();

      this.slider.select(".background")
        .attr("height", this.height);

      this.handle = this.slider.append("g")
        .attr("class", "handle");

      var yearWidthHalf = this.getWidthOfAYear()/2;

      /*
      this.handle.append("rect")
        .attr('class', 'handle-bounds')
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", yearWidthHalf * 2)
        .attr("height", this.height)
        .attr("transform", "translate(-" + yearWidthHalf + ",0)");
      */

      this.handle.append("path")
        .attr("transform", "translate(0," + this.height / 2 + ")")
        .attr("d", "M 0 -" +(this.height / 2)+ " V " + (this.height / 2));

      this.handle.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .style("fill", "#686562")
        .attr("width", 19)
        .attr("height", 4)
        .attr("transform", "translate(-9.5,-4)");

      this.handle.append("polygon")
        .style("fill", "#686562")
        .attr("points", "17,0 8.5,12 0,0")
        .attr("transform", "translate(-8.5, 0)");



      /*
      this.handle.append("polyline")
        .style("stroke", "#686562")
        .style("fill", "none")
        .style("stroke-width", 2)
        .style("stroke-miterlimit", 10)
        .attr("points", "1,0 1,4.4 " + yearWidthHalf + ",4.4 " + yearWidthHalf + ",0")
        .attr("transform", "translate(-" + yearWidthHalf/2 + "," + this.height + ")");
      */

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