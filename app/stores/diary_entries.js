var AppDispatcher = require("../dispatchers/app");
var EventEmitter  = require("events").EventEmitter;
var deepcopy      = require('deepcopy');
var dslClient     = require("../lib/dslClient");
var assign        = require("object-assign");
var CONSTANTS     = require('../Constants.json');


var CHANGE_EVENT  = "change";
var QUERY         = [
                      {
                        query: "SELECT * FROM site_overland_trails_journal_entries_materialized",
                        key: 'entries',
                        format: 'geojson',
                        parse: function(rsp) {
                          return rsp.features.map(function(row) {
                            if (!row.geometry || !row.geometry.coordinates) return false;
                            if (!row.properties) return false;

                            var obj = {};
                            for(var k in row.properties) {
                              obj[k] = row.properties[k];
                            }
                            obj.date = new Date(obj['date']);
                            if (isNaN(obj.date.getTime())) return false;


                            obj.datestamp = [obj.date.getMonth()+1, obj.date.getDate(), obj.date.getFullYear()].join(''),
                            obj.time = +obj.datestamp;
                            obj.mercatorCoords = [obj.lat, obj.long];
                            delete obj.lat;
                            delete obj.long;

                            obj['coordinates'] = [row.geometry.coordinates[1], row.geometry.coordinates[0]];

                            return obj;
                          }).sort(function(a,b){
                            return d3.ascending(a.time, b.time);
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
                            if (row.trail.indexOf('Sant') > -1 || row.trail.length < 3) return false;
                            if (row.trail.indexOf('Cali') > -1) row.trail = "California Trail";
                            if (row.trail.indexOf('Oregon') > -1) row.trail = "Oregon Trail";
                            if (row.trail.indexOf('Mormon') > -1) row.trail = "Mormon Trail";

                            row.trailColor = getTrailColor(row.trail);

                            obj[row.journal_id] = row;
                          });
                          return obj;
                        }
                      }
                    ];

var data = {
  entries: [],
  source: {},
  entriesByDate: {}
};
var state = {
  loaded: false
}

var entriesOnADate = {};

function getTrailColor(trail) {
  if(trail.toLowerCase().indexOf('california') > -1) return CONSTANTS.COLORS['california'];
  if(trail.toLowerCase().indexOf('oregon') > -1) return CONSTANTS.COLORS['oregon'];
  if(trail.toLowerCase().indexOf('mormon') > -1) return CONSTANTS.COLORS['mormon'];
  return CONSTANTS.COLORS['all'];
}

function getTrailKlass(trail) {
  return 'trail-dot ' + trail.toLowerCase().replace(' ','-');
}

function setData() {
  if(state.loaded) return false;
  state.loaded = true;

  data.entries = data.entries.filter(function(d){
    return data.source.hasOwnProperty(d.journal_id) && data.source[d.journal_id].trail.indexOf("Sant") < 0;
  });

  data.entries.forEach(function(d,i){
    d.idx = i;
    d.gender = data.source[d.journal_id].gender || 'M';
    d.markerOptions = {
      color: getTrailColor(data.source[d.journal_id].trail),
      className: getTrailKlass(data.source[d.journal_id].trail)
    }
  });

  groupEntriesByDate();

  DiaryEntriesStore.emitChange();
}

function groupEntriesByDate() {
  var entriesByTrail = {};

  var nested = d3.nest()
      .key(function(d){ return data.source[d.journal_id].trail; })
      .entries(data.entries);

  nested.forEach(function(trail){
    entriesByTrail[trail.key] = {};

    var trailGroup = d3.nest()
      .key(function(d){return d.datestamp;})
      .entries(trail.values);

    trailGroup.sort(function(a,b){
      return d3.ascending(+a.key, +b.key);
    });

    trailGroup.forEach(function(d,i){
      entriesByTrail[trail.key][d.key] = {
        values: d.values,
        next: (trailGroup[i+1]) ?  trailGroup[i+1].key : null,
        prev: (trailGroup[i-1]) ?  trailGroup[i-1].key : null
      }
    });
  });

  // get all available datestamps
  var dates = {};
  data.entries.forEach(function(d){
    dates[d.datestamp] = 1;
  });

  for (var d in dates) {
    var rsp = [];
    for(var trail in entriesByTrail) {
      if (entriesByTrail[trail].hasOwnProperty(d)) {
        deepcopy(entriesByTrail[trail][d].values).forEach(function(m){
          rsp.push(m)
        });

        if (entriesByTrail[trail][d].next) {
          deepcopy(entriesByTrail[trail][entriesByTrail[trail][d].next].values).forEach(function(m){
            m.markerOptions.className += ' minor';
            m.markerOptions.radius = 5;
            rsp.push(m)
          });
        }

        if (entriesByTrail[trail][d].prev) {
          deepcopy(entriesByTrail[trail][entriesByTrail[trail][d].prev].values).forEach(function(m){
            m.markerOptions.className += ' minor';
            m.markerOptions.radius = 5;
            rsp.push(m)
          });
        }
      }
    }

    entriesOnADate[d] = rsp;
  }

  entriesByTrail = {};
  nested = {};
}

function queryData() {
  if (state.loaded) return;
  if (!QUERY.length) return setData();

  var queryObj = QUERY.pop();
  dslClient.sqlRequest(queryObj.query, function(err, response) {

    if (!err) {
      data[queryObj.key] = queryObj.parse(response);
    }

    queryData();

  }, {"format":queryObj.format});
}

function getInitialData(_state) {
  //console.log('Initial')
  queryData();
}

var nullResponse = [];


var DiaryEntriesStore = assign({}, EventEmitter.prototype, {

  selectedDiarist: null,

  getData: function() {
    if(!state.loaded) return {};
    if (!data) return {};

    return {
      entries: this.getEntryData(),
      source: this.getSourceData()
    }
  },

  getSourceData: function() {
    if(!state.loaded) return {};
    if (!data || !data.source) return {};
    var out = {};
    for(var k in  data.source) {
      out[k] = data.source[k];
    }
    return out;
  },

  getEntryData: function() {
    if(!state.loaded) return [];
    if (!data || !data.entries) return nullResponse;
    return data.entries.slice(0);
  },

  getEntriesByDate: function(date) {
    if(!state.loaded) return [];
    if (!date || !data) return [];

    // make key
    var d = [date.getMonth()+1, date.getDate(), date.getFullYear()].join('');
    return (entriesOnADate.hasOwnProperty(d)) ? entriesOnADate[d] : [];
  },


  getDiarists: function() {
    if(!state.loaded) return [];
    if (!data || !data.entries) return [];

    var rows = this.getEntryData();
    var nested = d3.nest()
      .key(function(d){ return d['journal_id']; })
      .entries(rows);

    nested.forEach(function(row){
      row.trail = data.source[row.key].trail;
      row.gender = (row.values[0].gender === 'M') ? "male" : "female";
      row.name = row.values[0].name || '???????????';
      row.begins = d3.min(row.values, function(d){return d.date});
      row.citation = {
        text: data.source[row.key]['full_citation'],
        url: data.source[row.key]['url']
      }
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