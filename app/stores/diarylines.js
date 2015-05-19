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
  DiaryLinesStore.emitChange({"action":"setData", "source":"diarylines"});

}

function getInitialData(_state) {
  dslClient.sqlRequest(QUERY, function(err, response) {

    if (err) {

      return false;
    }

    console.log(response);
    setData(response);
    /*

    var trails = {};
    response.features.forEach(function(feature){
      var props = feature.properties;
      var trail = props.trail;

      if (!trails.trail) trails.trail = [];

      feature.geometry.coordinates.forEach(function(pt){
        trails.trail.push(pt);
      })

    });

    */

  }, {"format":"geojson"});
}

var nullResponse = {
  features: []
};
var DiaryLinesStore = assign({}, EventEmitter.prototype, {


  getData: function() {
    return data || nullResponse;
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