/** @jsx React.DOM */
var React   = require("react");
var d3      = require("d3");
var topojson = require("topojson");
var LeafletMap = require("./LeafletMap.jsx");
var Loader = require("./Loader.jsx");
var TileLayer = LeafletMap.TileLayer;
var GeoJSONLayer = LeafletMap.GeoJSONLayer;
var CartoTileLayer = require("./LeafletCartoDBTileLayer.jsx");
var config = require("../../.env.json");
var flow_trails = {
    "type": "FeatureCollection",
    "features": [
    {
      "properties": {"name": "california"},
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [[7.69417177070106, -6.39516309021923], [-9.18780515749045, -2.22120147407118], [-15.1328776557193, -4.00294031361136]]
      }
    },
    {
      "properties": {"name": "oregon"},
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [[7.63913580164326, -5.90163567080475], [-9.11391391110076, -1.72628146636189], [-15.5022558630213, 1.70671545322927]]
      }
    },
    {
      "properties": {"name": "mormon"},
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [[7.61700700785191, -5.70407617830608], [-6.76590805400698, -2.15719606668448], [-9.02487642097471, -4.22738347260614]]
      }
    },
    {
      "properties": {"name": "california"},
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-15.1328776557193, -4.00294031361136]
      }
    },
    {
      "properties": {"name": "oregon"},
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-15.5022558630213, 1.70671545322927]
      }
    },
    {
      "properties": {"name": "mormon"},
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-9.02487642097471, -4.22738347260614]
      }
    }
  ]
}

var trailsDrawn;

var label_push = {
  "california": 13,
  "oregon": -10,
  "utah": 10
}
var trailLayers = {
  'california': null,
  'oregon': null,
  'mormon': null
}
var trailLabels = {};
var selectedYear;

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
    this.thicknessScale = d3.scale.linear().range([0.5,20]);
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
    this.setThicknessScale();
  },

  componentWillUnmount: function() {

  },

  shouldComponentUpdate: function(nextProps, nextState) {
    if(this.hasData && selectedYear !== this.props.year) {
      this.updateYear(this.props.year);
    }
    return !this.hasData;
  },

  componentDidUpdate: function() {
    var data = this.props.flowdata;

    if (!this.hasData && data.rows && data.rows.length) {
      this.visualize(data.rows);
      this.hasData = true;
      this.setState({loaded:true});
    }
  },

  updateYear: function(year) {
    selectedYear = this.props.year;
    var that = this;
    for (var layer in trailLayers) {
      var k = (layer === 'mormon') ? 'utah' : layer;
      var val = this.years[year][k];

      var weight = this.thicknessScale(val);
      var elm = d3.select('.flow.' + trailLayers[layer].feature.properties.name );

      elm.classed('no-weight', (weight < 0.6));

      trailLayers[layer].setStyle({
        weight: this.thicknessScale(val),
      });

      trailLabels[layer].updateLabelContent(d3.format(",")(val))
    }
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

    this.updateYear(this.props.year);

  },

   handleChange: function(e) {
    e.preventDefault();

    this.setState({year: e.target.value});
    this.updateYear(e.target.value);
  },

  handleMapMove: function(e) {
    //console.log(e.target.getCenter());
  },

  onEachFeature: function(feature, layer) {
    if (feature.geometry.type !== 'Point') {
      layer.options.className += " flow " + feature.properties.name;
      trailLayers[feature.properties.name] = layer;
    }
  },

  pointToLayer: function(feature, latlng) {
    var m = L.circleMarker(latlng, {radius: 1, opacity: 0}).bindLabel('',{
      noHide: true,
      offset: [-20,0],
      direction: "auto",
      className: 'flow-label ' + feature.properties.name
    });
    trailLabels[feature.properties.name] = m;
    return m;
  },
  loaded: function() {
    return this.year;
  },

  render: function() {
    var loc = [-2.28455066, -1.450195];
    var zoom = 4;
    var mapOptions = {
      zoomControl: false,
      scrollWheelZoom: false,
      attributionControl: false,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      tap: false,
      keyboard: false
    };
    var evts = {
      move: this.handleMapMove
    };

    return (
      <div className="flow-map-component">
        <Loader loaded={this.loaded}/>
        <LeafletMap ref="flowmap" location={loc} zoom={zoom} mapEvents={evts} mapOptions={mapOptions}>
          <CartoTileLayer
            src="http://sm.mapstack.stamen.com/openterrain_2163/{z}/{x}/{y}.png"
            userId={config.cartodbAccountName}
            sql="SELECT * FROM unified_basemap_layers order by ord"
            cartocss="Map { buffer-size: 128; } #unified_basemap_layers[layer='ne_10m_coastline_2163']{ line-color: #aacccc; line-width: 0.75; line-opacity: 1; line-join: round; line-cap: round; } #unified_basemap_layers[layer='ne_10m_lakes_2163'] { line-color: #aacccc; line-width: 2.5; line-opacity: 1; line-join: round; line-cap: round; /* Soften lines at lower zooms */ [zoom<=7] { line-width: 2.5; line-color: lighten(desaturate(#aacccc,2%),2%); } [zoom<=5] { line-width: 1.5; line-color: lighten(desaturate(#aacccc,5%),5%); } /* Separate attachment because seams */ ::fill { polygon-fill: #ddeeee; polygon-opacity: 1; } /* Remove small lakes at lower zooms */ [scalerank>3][zoom<=5] { ::fill { polygon-opacity: 0; } line-opacity: 0; } [scalerank>6][zoom<=7] { ::fill { polygon-opacity: 0; } line-opacity: 0; } } #unified_basemap_layers[layer='ne_10m_rivers_lake_centerlines_2163'] { line-color: #aacccc; line-width: 1.5; line-opacity: 1; line-join: round; line-cap: round; [name='Mississippi'], [name='St. Lawrence'], [name='Columbia'], [name='Snake'], [name='Platte'], [name='Missouri'], [name='Rio Grande'] { line-width: 4; } [zoom<=8][name='Mississippi'], [zoom<=8][name='St. Lawrence'], [zoom<=8][name='Columbia'], [zoom<=8][name='Snake'], [zoom<=8][name='Platte'], [zoom<=8][name='Missouri'], [zoom<=8][name='Rio Grande'] { line-width: 2; } [zoom<=8][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande'][name!='Snake'][name!='Platte'][name!='Columbia'][name!='Missouri'], [zoom<=6][name='Mississippi'], [zoom<=6][name='Columbia'], [zoom<=6][name='Snake'], [zoom<=6][name='Platte'], [zoom<=6][name='Missouri'], [zoom<=6][name='Rio Grande'] { line-width: 1; line-color: lighten(desaturate(#aacccc,2%),2%); } [zoom<=6][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande'][name!='Snake'][name!='Platte'][name!='Columbia'][name!='Missouri'] { line-width: 0.5; line-color: lighten(desaturate(#aacccc,5%),5%); } [zoom<=5][name!='Mississippi'][name!='St. Lawrence'][name!='Rio Grande'][name!='Snake'][name!='Platte'][name!='Columbia'][name!='Missouri'] { line-width: 0; } [zoom<=5][name='Mississippi'], [zoom<=5][name='St. Lawrence'], [zoom<=5][name='Columbia'], [zoom<=5][name='Snake'], [zoom<=5][name='Platte'], [zoom<=5][name='Missouri'], [zoom<=5][name='Rio Grande'] { line-width: 0.5; line-color: lighten(desaturate(#aacccc,2%),2%); } } #unified_basemap_layers[layer='ne_10m_admin_0_countries_lakes_2163'] { line-color: white; line-width: 1; line-opacity: 1; line-join: round; line-cap: round; polygon-fill: white; polygon-opacity: 1; } "/>
          <TileLayer src="http://sm.mapstack.stamen.com/openterrain_2163/{z}/{x}/{y}.png" />
          <GeoJSONLayer featuregroup={flow_trails} className='flow-trails' pointToLayer={this.pointToLayer} onEachFeature={this.onEachFeature} fitBounds={true}/>
        </LeafletMap>
      </div>
    );

  }

});

module.exports = FlowMap;


/*
  Leaflet.label, a plugin that adds labels to markers and vectors for Leaflet powered maps.
  (c) 2012-2013, Jacob Toye, Smartrak

  https://github.com/Leaflet/Leaflet.label
  http://leafletjs.com
  https://github.com/jacobtoye
*/
(function(t){var e=t.L;e.labelVersion="0.2.2-dev",e.Label=(e.Layer?e.Layer:e.Class).extend({includes:e.Mixin.Events,options:{className:"",clickable:!1,direction:"right",noHide:!1,offset:[12,-15],opacity:1,zoomAnimation:!0},initialize:function(t,i){e.setOptions(this,t),this._source=i,this._animated=e.Browser.any3d&&this.options.zoomAnimation,this._isOpen=!1},onAdd:function(t){this._map=t,this._pane=this.options.pane?t._panes[this.options.pane]:this._source instanceof e.Marker?t._panes.markerPane:t._panes.popupPane,this._container||this._initLayout(),this._pane.appendChild(this._container),this._initInteraction(),this._update(),this.setOpacity(this.options.opacity),t.on("moveend",this._onMoveEnd,this).on("viewreset",this._onViewReset,this),this._animated&&t.on("zoomanim",this._zoomAnimation,this),e.Browser.touch&&!this.options.noHide&&(e.DomEvent.on(this._container,"click",this.close,this),t.on("click",this.close,this))},onRemove:function(t){this._pane.removeChild(this._container),t.off({zoomanim:this._zoomAnimation,moveend:this._onMoveEnd,viewreset:this._onViewReset},this),this._removeInteraction(),this._map=null},setLatLng:function(t){return this._latlng=e.latLng(t),this._map&&this._updatePosition(),this},setContent:function(t){return this._previousContent=this._content,this._content=t,this._updateContent(),this},close:function(){var t=this._map;t&&(e.Browser.touch&&!this.options.noHide&&(e.DomEvent.off(this._container,"click",this.close),t.off("click",this.close,this)),t.removeLayer(this))},updateZIndex:function(t){this._zIndex=t,this._container&&this._zIndex&&(this._container.style.zIndex=t)},setOpacity:function(t){this.options.opacity=t,this._container&&e.DomUtil.setOpacity(this._container,t)},_initLayout:function(){this._container=e.DomUtil.create("div","leaflet-label "+this.options.className+" leaflet-zoom-animated"),this.updateZIndex(this._zIndex)},_update:function(){this._map&&(this._container.style.visibility="hidden",this._updateContent(),this._updatePosition(),this._container.style.visibility="")},_updateContent:function(){this._content&&this._map&&this._prevContent!==this._content&&"string"==typeof this._content&&(this._container.innerHTML=this._content,this._prevContent=this._content,this._labelWidth=this._container.offsetWidth)},_updatePosition:function(){var t=this._map.latLngToLayerPoint(this._latlng);this._setPosition(t)},_setPosition:function(t){var i=this._map,n=this._container,o=i.latLngToContainerPoint(i.getCenter()),s=i.layerPointToContainerPoint(t),a=this.options.direction,l=this._labelWidth,h=e.point(this.options.offset);"right"===a||"auto"===a&&s.x<o.x?(e.DomUtil.addClass(n,"leaflet-label-right"),e.DomUtil.removeClass(n,"leaflet-label-left"),t=t.add(h)):(e.DomUtil.addClass(n,"leaflet-label-left"),e.DomUtil.removeClass(n,"leaflet-label-right"),t=t.add(e.point(-h.x-l,h.y))),e.DomUtil.setPosition(n,t)},_zoomAnimation:function(t){var e=this._map._latLngToNewLayerPoint(this._latlng,t.zoom,t.center).round();this._setPosition(e)},_onMoveEnd:function(){this._animated&&"auto"!==this.options.direction||this._updatePosition()},_onViewReset:function(t){t&&t.hard&&this._update()},_initInteraction:function(){if(this.options.clickable){var t=this._container,i=["dblclick","mousedown","mouseover","mouseout","contextmenu"];e.DomUtil.addClass(t,"leaflet-clickable"),e.DomEvent.on(t,"click",this._onMouseClick,this);for(var n=0;i.length>n;n++)e.DomEvent.on(t,i[n],this._fireMouseEvent,this)}},_removeInteraction:function(){if(this.options.clickable){var t=this._container,i=["dblclick","mousedown","mouseover","mouseout","contextmenu"];e.DomUtil.removeClass(t,"leaflet-clickable"),e.DomEvent.off(t,"click",this._onMouseClick,this);for(var n=0;i.length>n;n++)e.DomEvent.off(t,i[n],this._fireMouseEvent,this)}},_onMouseClick:function(t){this.hasEventListeners(t.type)&&e.DomEvent.stopPropagation(t),this.fire(t.type,{originalEvent:t})},_fireMouseEvent:function(t){this.fire(t.type,{originalEvent:t}),"contextmenu"===t.type&&this.hasEventListeners(t.type)&&e.DomEvent.preventDefault(t),"mousedown"!==t.type?e.DomEvent.stopPropagation(t):e.DomEvent.preventDefault(t)}}),e.BaseMarkerMethods={showLabel:function(){return this.label&&this._map&&(this.label.setLatLng(this._latlng),this._map.showLabel(this.label)),this},hideLabel:function(){return this.label&&this.label.close(),this},setLabelNoHide:function(t){this._labelNoHide!==t&&(this._labelNoHide=t,t?(this._removeLabelRevealHandlers(),this.showLabel()):(this._addLabelRevealHandlers(),this.hideLabel()))},bindLabel:function(t,i){var n=this.options.icon?this.options.icon.options.labelAnchor:this.options.labelAnchor,o=e.point(n)||e.point(0,0);return o=o.add(e.Label.prototype.options.offset),i&&i.offset&&(o=o.add(i.offset)),i=e.Util.extend({offset:o},i),this._labelNoHide=i.noHide,this.label||(this._labelNoHide||this._addLabelRevealHandlers(),this.on("remove",this.hideLabel,this).on("move",this._moveLabel,this).on("add",this._onMarkerAdd,this),this._hasLabelHandlers=!0),this.label=new e.Label(i,this).setContent(t),this},unbindLabel:function(){return this.label&&(this.hideLabel(),this.label=null,this._hasLabelHandlers&&(this._labelNoHide||this._removeLabelRevealHandlers(),this.off("remove",this.hideLabel,this).off("move",this._moveLabel,this).off("add",this._onMarkerAdd,this)),this._hasLabelHandlers=!1),this},updateLabelContent:function(t){this.label&&this.label.setContent(t)},getLabel:function(){return this.label},_onMarkerAdd:function(){this._labelNoHide&&this.showLabel()},_addLabelRevealHandlers:function(){this.on("mouseover",this.showLabel,this).on("mouseout",this.hideLabel,this),e.Browser.touch&&this.on("click",this.showLabel,this)},_removeLabelRevealHandlers:function(){this.off("mouseover",this.showLabel,this).off("mouseout",this.hideLabel,this),e.Browser.touch&&this.off("click",this.showLabel,this)},_moveLabel:function(t){this.label.setLatLng(t.latlng)}},e.Icon.Default.mergeOptions({labelAnchor:new e.Point(9,-20)}),e.Marker.mergeOptions({icon:new e.Icon.Default}),e.Marker.include(e.BaseMarkerMethods),e.Marker.include({_originalUpdateZIndex:e.Marker.prototype._updateZIndex,_updateZIndex:function(t){var e=this._zIndex+t;this._originalUpdateZIndex(t),this.label&&this.label.updateZIndex(e)},_originalSetOpacity:e.Marker.prototype.setOpacity,setOpacity:function(t,e){this.options.labelHasSemiTransparency=e,this._originalSetOpacity(t)},_originalUpdateOpacity:e.Marker.prototype._updateOpacity,_updateOpacity:function(){var t=0===this.options.opacity?0:1;this._originalUpdateOpacity(),this.label&&this.label.setOpacity(this.options.labelHasSemiTransparency?this.options.opacity:t)},_originalSetLatLng:e.Marker.prototype.setLatLng,setLatLng:function(t){return this.label&&!this._labelNoHide&&this.hideLabel(),this._originalSetLatLng(t)}}),e.CircleMarker.mergeOptions({labelAnchor:new e.Point(0,0)}),e.CircleMarker.include(e.BaseMarkerMethods),e.Path.include({bindLabel:function(t,i){return this.label&&this.label.options===i||(this.label=new e.Label(i,this)),this.label.setContent(t),this._showLabelAdded||(this.on("mouseover",this._showLabel,this).on("mousemove",this._moveLabel,this).on("mouseout remove",this._hideLabel,this),e.Browser.touch&&this.on("click",this._showLabel,this),this._showLabelAdded=!0),this},unbindLabel:function(){return this.label&&(this._hideLabel(),this.label=null,this._showLabelAdded=!1,this.off("mouseover",this._showLabel,this).off("mousemove",this._moveLabel,this).off("mouseout remove",this._hideLabel,this)),this},updateLabelContent:function(t){this.label&&this.label.setContent(t)},_showLabel:function(t){this.label.setLatLng(t.latlng),this._map.showLabel(this.label)},_moveLabel:function(t){this.label.setLatLng(t.latlng)},_hideLabel:function(){this.label.close()}}),e.Map.include({showLabel:function(t){return this.addLayer(t)}}),e.FeatureGroup.include({clearLayers:function(){return this.unbindLabel(),this.eachLayer(this.removeLayer,this),this},bindLabel:function(t,e){return this.invoke("bindLabel",t,e)},unbindLabel:function(){return this.invoke("unbindLabel")},updateLabelContent:function(t){this.invoke("updateLabelContent",t)}})})(window,document);