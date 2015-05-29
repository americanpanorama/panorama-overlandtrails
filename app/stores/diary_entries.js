var AppDispatcher = require("../dispatchers/app");
var EventEmitter  = require("events").EventEmitter;
var dslClient     = require("../lib/dslClient");
var assign        = require("object-assign");

var CHANGE_EVENT  = "change";
var QUERY         = [
                      {
                        query: "SELECT * FROM site_overland_trails_journal_entries_materialized",
                        key: 'entries',
                        format: 'geojson',
                        parse: function(rsp) {
                          return rsp.features.map(function(row) {
                            if (!row.geometry || !row.geometry.coordinates) return false;
                            if(!row.properties) return false;

                            var obj = {};
                            for(var k in row.properties) {
                              obj[k] = row.properties[k];
                            }
                            obj['date'] = new Date(obj['date']);
                            obj.mercatorCoords = [obj.lat, obj.long];
                            delete obj.lat;
                            delete obj.long;

                            obj['coordinates'] = [row.geometry.coordinates[1], row.geometry.coordinates[0]];

                            return obj;
                          });
                        },
                      },
                      {
                        query: "SELECT * FROM site_overland_trails_journal_source_materialized",
                        key: 'source',
                        format: 'JSON',
                        parse : function (rsp) {
                          var obj = {};
                          rsp.rows.forEach(function(row){
                            obj[row.journal_id] = row;
                          });
                          return obj;
                        }
                      }
                    ];

var tmpData = {};
var data = null;
var state = {
  loaded: false
}

function setData() {
  if(state.loaded) return false;
  console.log(tmpData)
  data = tmpData;
  state.loaded = true;
  DiaryEntriesStore.emitChange({});
}

function queryData() {
  if (!QUERY.length) return setData();

  var queryObj = QUERY.pop();
  dslClient.sqlRequest(queryObj.query, function(err, response) {
    tmpData[queryObj.key] = null;

    if (!err) {
      tmpData[queryObj.key] = queryObj.parse(response);
    }

    queryData();

  }, {"format":queryObj.format});
}

function getInitialData(_state) {
  queryData();
}

var nullResponse = [];


var DiaryEntriesStore = assign({}, EventEmitter.prototype, {


  getData: function() {
    if (!data) return {};

    return {
      entries: this.getEntryData(),
      source: this.getSourceData()
    }
  },

  getSourceData: function() {
    if (!data || !data.source) return {};
    var out = {};
    for(var k in  data.source) {
      out[k] = data.source[k];
    }
    return out;
  },

  getEntryData: function() {
    if (!data || !data.entries) return nullResponse;

    return data.entries.filter(function(d){
      return data.source.hasOwnProperty(d.journal_id) && data.source[d.journal_id].trail !== "Santa Fe Trail";
    });
  },

  getDiarists: function() {
    if (!data || !data.entries) return [];

    var rows = this.getEntryData();
    var nested = d3.nest()
      .key(function(d){ return d['journal_id']; })
      .entries(rows);

    nested.forEach(function(row){
      row.trail = data.source[row.key].trail;
      row.name = row.values[0].name || '???????????';
      row.begins = d3.min(row.values, function(d){return d.date});
    })
    nested.sort(function(a,b){
      return d3.ascending(a.begins, b.begins);
    });

    return nested;
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

module.exports = DiaryEntriesStore;