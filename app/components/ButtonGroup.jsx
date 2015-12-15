/** @jsx React.DOM */
var React   = require("react");

//
// Button Group
//
var ButtonGroup = React.createClass({
  selectedIndex: 0,

  getInitialState: function () {
    return {};
  },

  onButtonClick: function(e) {
    var idx = +e.target.getAttribute('data-btnidx');
    var update = this.selectedIndex !== idx;

    this.selectedIndex =  idx;

    if (update) {
      this.setSelected(this.selectedIndex);

      if (this.props.onChange) {
        this.props.onChange(e.target, idx);
      }
    }

  },

  componentDidMount: function() {
    var that = this;

    if (this.props.selectedValue) {
      this.selectedIndex = this.getIndexFromValue(this.props.selectedValue);
    } else {
      this.selectedIndex = this.props.selectedIndex || 0;
    }

    this.setSelected(this.selectedIndex);

  },

  componentWillUnmount: function() {

  },

  componentDidUpdate: function() {

  },

  getIndexFromValue: function(val) {
    var idx = 0;
    var that = this;

    Object.keys(this.refs).forEach(function(key){
      var elm = that.refs[key].getDOMNode();
      var v = elm.getAttribute('data-value')
          i = elm.getAttribute('data-btnidx');

      if (v === val) idx = +i;
    });

    return idx;
  },

  setSelectedFromValue: function(val) {
    var that = this;
    Object.keys(this.refs).forEach(function(key,i){
      var elm = that.refs[key].getDOMNode();
      var v = elm.getAttribute('data-value');

      elm.disabled = (v === val);
    });
  },

  setSelected: function(idx) {
    var that = this;
    Object.keys(this.refs).forEach(function(key,i){
      var elm = that.refs[key].getDOMNode();
      elm.disabled = (i === idx);
    });
  },

  render: function() {
    var index = 0,
      children = React.Children.map(this.props.children, function (child, i) {
        return React.cloneElement(child, {
            ref: 'btn-' + i,
            'data-btnidx': i
        });
      });
    return (
        <div className="component button-group" onClick={ this.onButtonClick }>
          {children}
        </div>
    );

  }

});

module.exports = ButtonGroup;