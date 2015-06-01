var AppDispatcher = require("../dispatchers/app");
var EventEmitter  = require("events").EventEmitter;
var dslClient     = require("../lib/dslClient");
var assign        = require("object-assign");

var CHANGE_EVENT  = "change";
var QUERY         = "SELECT * FROM site_diarylines_materialized";

var data = null;
var state = {
  loaded: false
}

function setData(newData) {

  data = newData;
  state.loaded = true;
  DiaryLinesStore.emitChange();

}

function getInitialData(_state) {
  dslClient.sqlRequest(QUERY, function(err, response) {

    if (err) {

      return false;
    }

    setData(response);

  }, {"format":"geojson"});
}

var nullResponse = {
  features: []
};

var currentKlass;
var DiaryLinesStore = assign({}, EventEmitter.prototype, {

  onEachFeature: function(feature, layer) {
    var trail = layer.feature.properties.trail || "unknown";
    var klass = "";
    switch(trail) {
      case "California Trail":
        klass = "california-trail";
      break;

      case "Oregon Trail":
        klass = "oregon-trail";
      break;

      case "Mormon Trail":
        klass = "mormon-trail";
      break;

      default:
        klass = "unknown-trail";
      break;
    }
    layer.options.className += " " + klass;
  },

  getData: function() {
    return data || nullResponse;
  },

  setFiltered: function(trail) {
    var bdy = document.querySelector('body');
    if (currentKlass) L.DomUtil.removeClass(bdy, currentKlass);
    currentKlass = (trail != 'all') ? 'trail-show-' + trail : null;

    if (currentKlass) {
      L.DomUtil.addClass(bdy, currentKlass);
    }
  },

  emitChange: function(_caller) {

    this.emit(CHANGE_EVENT, {
      state:  state,
      data:   data,
      caller: _caller
    });

  },

  /**
   * @param {function} callback
   */
  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  /**
   * @param {function} callback
   */
  removeChangeListener: function(callback) {
    if (callback) {
      this.removeListener(CHANGE_EVENT, callback);
    }
  }

});

// Register callback to handle all updates
AppDispatcher.register(function(action) {

  switch(action.actionType) {

    case "getInitialData":

      getInitialData(action.state);

      break;


    default:
      // no op
  }
});

module.exports = DiaryLinesStore;