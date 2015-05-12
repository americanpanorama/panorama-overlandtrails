/** @jsx React.DOM */
var React             = require("react");
var addons            = require("react-addons");
var Leaflet           = require("leaflet");
var config            = require("../.env.json");

var CartoMap = React.createClass({

  getInitialState: function () {
    return {};
  },

  componentDidMount: function() {

    var map = new L.Map('map', {
      zoomControl: false,
      center: [-10, 10],
      zoom: 5
    });

    this.map = map;

    var that = this;


    // create a layer with 1 sublayer
    cartodb.Tiles.getTiles({
      user_name: config.cartodbAccountName,
      type: 'cartodb',
      sublayers: [{
        sql: "SELECT * FROM unified_basemap_layers order by ord",
        cartocss: "#unified_basemap_layers[layer='ne_10m_coastline_2163']{  line-color: #aacccc;  line-width: 0.75;  line-opacity: 1;  line-join: round;  line-cap: round;}#unified_basemap_layers[layer='ne_10m_lakes_2163'] {  line-color: #aacccc;  line-width: 2.5;  line-opacity: 1;  line-join: round;  line-cap: round;  /* Soften lines at lower zooms */  [zoom<=7] {    line-width: 2.5;    line-color: lighten(desaturate(#aacccc,2%),2%);  }  [zoom<=5] {    line-width: 1.5;    line-color: lighten(desaturate(#aacccc,5%),5%);  }  /* Separate attachment because seams */  ::fill {    polygon-fill: #ddeeee;    polygon-opacity: 1;  }  /* Remove small lakes at lower zooms */  [scalerank>3][zoom<=5] {    ::fill {      polygon-opacity: 0;    }    line-opacity: 0;  }  [scalerank>6][zoom<=7] {    ::fill {      polygon-opacity: 0;    }    line-opacity: 0;  }}#unified_basemap_layers[layer='ne_10m_rivers_lake_centerlines_2163'] {  line-color: #aacccc;  line-width: 1.5;  line-opacity: 1;  line-join: round;  line-cap: round;  [name='Mississippi'],  [name='St. Lawrence'],  [name='Rio Grande'] {    line-width: 4;  }  [zoom<=8][name='Mississippi'],  [zoom<=8][name='St. Lawrence'],  [zoom<=8][name='Rio Grande'] {    line-width: 2;  }  [zoom<=8][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande'],  [zoom<=6][name='Mississippi'],  [zoom<=6][name='Rio Grande'] {    line-width: 1;    line-color: lighten(desaturate(#aacccc,2%),2%);  }  [zoom<=6][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande'] {    line-width: 0.5;    line-color: lighten(desaturate(#aacccc,5%),5%);  }  [zoom<=5][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande']{    line-width: 0;  }  [zoom<=5][name='Mississippi'],  [zoom<=5][name='St. Lawrence'],  [zoom<=5][name='Rio Grande'] {    line-width: 0.5;    line-color: lighten(desaturate(#aacccc,2%),2%);  }}#unified_basemap_layers[layer='ne_10m_admin_0_countries_lakes_2163'] {  line-color: white;  line-width: 1;  line-opacity: 1;  line-join: round;  line-cap: round;  polygon-fill: white;  polygon-opacity: 1;}"
      }]
    }, function(tiles, err){
      if (err || tiles === null) return;
        L.tileLayer(tiles.tiles[0]).addTo(map);

        L.tileLayer("http://ec2-54-152-68-8.compute-1.amazonaws.com/richmond-terrain/{z}/{x}/{y}.png", {
          attribution : "&copy; <a href=\"http://osm.org/copyright\">OpenStreetMap</a> contributors | Designed by <a href=\"http://stamen.com?from=richmondatlas\">Stamen Design</a>",
          "zIndex"    : 2
        }).addTo(map);
    })



  },

  componentWillUnmount: function() {

    this.map = null;

  },

  componentDidUpdate: function() {

  },


  getMapInstance: function() {
    return this.map;
  },

  render: function() {

    return (
        <div id="map"></div>
    );
  }

});

module.exports = CartoMap;