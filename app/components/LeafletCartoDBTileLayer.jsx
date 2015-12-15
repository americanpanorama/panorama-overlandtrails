/** @jsx React.DOM */
var React   = require("react");
var Leaflet = require("leaflet");

//
// Leaflet cartoDB tile layer
//
var LeafletCartoDBTileLayer = React.createClass({

  getInitialState: function () {

    return {};
  },

  getCartoDBTilesTemplates: function(callback) {

    var that = this;

    cartodb.Tiles.getTiles({
      type: 'cartodb',
      user_name: this.props.userId,
      sublayers: [{
        "sql": this.props.sql,
        "cartocss": this.props.cartocss
      }]
    },
    function(tiles, err) {
      if(tiles == null) {
        callback(err);
      }

      callback(null, tiles);

    });
  },

  componentDidMount: function() {

    var that = this;

     var leafletLayer = L.tileLayer(this.props.src, this.props);
     that.props.leafletLayer = leafletLayer;

    that.getCartoDBTilesTemplates(function(error, response) {

      leafletLayer.setUrl(response.tiles[0]);

    });

  },

  render: function() {

    return false;

  }

});

module.exports = LeafletCartoDBTileLayer;