var intro = require("intro.js").introJs;
var OverlandTrailsCopy = require("./overland-trails-copy.js");

var IntroManager = {
  state: false,
  intro: null,
  opened: false,
  init: function() {
    this.intro = intro(document.querySelector("body"));

    this.intro.setOptions({
      "steps": [
        {
          element: "#map-wrapper .button-group",
          intro: OverlandTrailsCopy.trails,
          position: "bottom"
        },
        {
          element: "#narrative-wrapper",
          intro: OverlandTrailsCopy.diaristPanel,
          position: "left"
        },
        {
          element: "#marey-chart-wrapper",
          intro: OverlandTrailsCopy.mareyChart,
          position: "top"
        },
        {
          element: "#flow-map-wrapper",
          intro: OverlandTrailsCopy.flowMap,
          position: "top"
        }

      ],
      "showStepNumbers": false,
      'skipLabel': '×',
      'nextLabel': '⟩',
      'prevLabel': '⟨',
      'doneLabel': '×'
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

    // Fixes a problem where step indexes are different
    // when initially called
    //if (e && !this.opened) step += 1;

    if (step) {
      if (!this.opened) {
        this.intro.goToStep(step).start().nextStep();
      } else {
        this.intro.goToStep(step).start();
      }


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