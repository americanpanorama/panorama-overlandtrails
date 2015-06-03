var intro = require("intro.js").introJs;
var OverlandTrailsCopy = require("./overland-trails-copy.js");

var IntroManager = {

  intro: null,

  init: function() {
    if (this.intro) return;
    this.intro = intro(document.querySelector("body"));

    this.intro.setOptions({
      "steps": [
        {
          element: "#about-btn",
          intro: OverlandTrailsCopy.infoPanel,
          position: "bottom"
        },
        {
          element: "#diarist-help-btn",
          intro: OverlandTrailsCopy.diaristPanel,
          position: "bottom"
        },
        {
          element: "#flow-map-info-btn",
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


    var that = this;
    this.intro.onchange(function(e) {
      var step = that.intro._currentStep;
      console.log("INTRO: CHANGE - STEP: ", step);
    });
  },

  open: function(e) {
    if (!this.intro) return;

    if (e && e.currentTarget) {
      var step = parseInt(e.currentTarget.getAttribute("data-step"));
      console.log("INTRO: OPEN GOTO STEP: ", step);
      if (step) {
        this.intro.refresh().goToStep(step).start();
      } else {
        this.intro.start();
      }
    } else {
      console.log("INTRO: OPEN START");
      this.intro.start();
    }
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