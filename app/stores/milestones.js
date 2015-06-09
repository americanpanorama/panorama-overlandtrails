var AppDispatcher = require("../dispatchers/app");
var EventEmitter  = require("events").EventEmitter;
var dslClient     = require("../lib/dslClient");
var assign        = require("object-assign");

var CHANGE_EVENT  = "change";


var data = null;

var state = {
  loaded: false
};


function setData(newData) {
  if (state.loaded) return;
  data = newData;
  state.loaded = true;
  MilestonesStore.emitChange('MilestonesStore');

}

function getInitialData(_state) {
  d3.json('static/milestones.json', function(err,data){
    setData(data);
  });
}


var MilestonesStore = assign({}, EventEmitter.prototype, {
  onEachFeature: function() {

  },

  onFilter: function() {
    return true;
  },

  getData: function() {
    if(!state.loaded) return false;
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

module.exports = MilestonesStore;