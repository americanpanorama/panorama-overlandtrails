module.exports = (function(){

  return {

    debounce: function(fn, delay) {
      var timeout;
      return function() {
        clearTimeout(timeout);
        var that = this, args = arguments;
        timeout = setTimeout(function() {
          fn.apply(that, args);
        }, delay);
      };
    },
    createDateStamp: function(date) {
      return [date.getMonth()+1, date.getDate(), date.getFullYear()].join('');
    }

  };

})();