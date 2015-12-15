var AppDispatcher = require("../dispatchers/app");
var EventEmitter  = require("events").EventEmitter;
var dslClient     = require("../lib/dslClient");
var assign        = require("object-assign");

var CHANGE_EVENT  = "change";
var QUERY         = "SELECT year, california, oregon, utah, cumulative_grand_total, cumulative_west_coast_total, yearly_west_coast_total FROM site_overland_trails_emigration_numbers_materialized"


var data = {
  lastUpdated: null,
  rows: null
};

var state = {
  loaded: false
};


function setData(newData, ts) {
  if(state.loaded || ts === data.lastUpdated) return;
  data.rows = newData;
  data.lastUpdated = ts;
  state.loaded = true;
  EmigrationStore.emitChange('EmigrationStore');

}

function getInitialData(_state) {
  dslClient.sqlRequest(QUERY, function(err, response) {

    if (err) {
      return false;
    }

    setData(response.rows || [], +new Date());

  }, {"format":"JSON"});
}


var EmigrationStore = assign({}, EventEmitter.prototype, {

  getData: function() {
    return data;
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

module.exports = EmigrationStore;