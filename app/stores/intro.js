var intro = require("intro.js").introJs;
var OverlandTrailsCopy = require("./overland-trails-copy.js");

var IntroManager = {
  state: false,
  intro: null,
  opened: false,
  init: function() {
    if (this.intro) return;
    this.intro = intro(document.querySelector("body"));

    this.intro.setOptions({
      "steps": [
        {
          element: "#narrative-wrapper",
          intro: OverlandTrailsCopy.diaristPanel,
          position: "left"
        },
        {
          element: "#flow-map-wrapper",
          intro: OverlandTrailsCopy.flowMap,
          position: "top"
        },
        {
          element: "#marey-chart-wrapper",
          intro: OverlandTrailsCopy.mareyChart,
          position: "top"
        }
      ],
      "showStepNumbers": false
    });

    this.intro.refresh();

    // events
    var that = this;
    this.intro.onchange(function(e) {
      var step = that.intro._currentStep;
      console.log("INTRO: CHANGE - STEP: ", step);
    });

    this.intro.onexit(function(){
      that.state = false;
    });
  },

  open: function(e) {
    if (!this.intro) return;
    this.state = true;
    var step = (e && e.currentTarget) ? parseInt(e.currentTarget.getAttribute("data-step")) : null;
    console.log("INTRO: OPEN GOTO STEP: ", step);

    // Fixes a problem where step indexes are different
    // when initially called
    if (e && !this.opened) step += 1;

    if (step) {
      this.intro.refresh().goToStep(step).start();
    } else {
      this.intro.start();
    }

    this.opened = true;
  },

  close: function() {
    if (!this.intro) return;
    this.intro.exit();
  },

  destroy: function() {
    this.intro = null;
  }
};

module.exports = IntroManager;