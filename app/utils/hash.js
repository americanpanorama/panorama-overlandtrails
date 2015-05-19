module.exports = (function(){

  return {

    parseCenterAndZoom: function(args) {
      var args = args.split("/");
      if (args.length == 3) {
        var zoom = parseInt(args[0], 10),
        lat = parseFloat(args[1]),
        lon = parseFloat(args[2]);
        if (isNaN(zoom) || isNaN(lat) || isNaN(lon)) {
          return false;
        } else {
          return {
            center: [lat, lon],
            zoom: zoom
          };
        }
      } else {
        return false;
      }
    },

    formatCenterAndZoom: function(map) {
      var center = map.getCenter(),
          zoom = map.getZoom(),
          precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));

      return [zoom,
        center.lat.toFixed(precision),
        center.lng.toFixed(precision)
      ].join("/");
    }

  };

})();