<template>
  <div style="padding: 20px; display: flex; height: 500px">
    <div style="width: 50%">
      <!-- <Scroller v-model="scrollerdata" ref="scroller_ref" orientation="vertical" :hasscrollbar="true" :cellwidth="200" :numcols="7" :numrows="4" :contentpadding="30" :wheelscrollspeed="3" :newcellslength="newcellslength" :cellsquared="false" @on-scroll="OnScroll" @on-update-data-next="onUpdateDataNext" @on-update-data-previous="onUpdateDataPrevious">
            <template v-slot:cell="slotProps">
                <span>{{ slotProps.data.id }}</span>
            </template>
            <template v-slot:overlay>
                <span>Overlay Content</span>
            </template>
        </Scroller> -->
    </div>
    <div style="width: 50%">
      <!-- Infinite -->
      <VScroller
        v-model="scrollerdata"
        :isInfinite="true"
        :scrollSpeed="3"
        :gap="3"
        :hasScrollbar="true"
        orientation="vertical"
        :numberOfRows="6"
        @on-initilized="onInitialized"
        @on-update-data-next="onUpdateDataNext"
        @on-update-data-previous="onUpdateDataPrevious"
      >
      </VScroller>

      <!-- Finite -->
      <!-- <VScroller v-model="finitescrollerdata" :isInfinite="false" :scrollSpeed="3" :gap="3" :hasScrollbar="true" orientation="vertical" :numberOfRows="6">
        </VScroller> -->
    </div>
  </div>
  <h1>Chronocraft Library Test Playground</h1>

  <!-- <Scroller v-model="dayviewdata" :height="400" :numcols="1" :static="true" :cellheight="1280">
    <template v-slot:cell="slotProps">
        <div class="timings">
        </div>
        <div class="days" id="events">

        </div>
    </template>
</Scroller> -->
  <br />
  <button class="testbutton" type="button" @click="ScrollBy()">
    Scroll By
  </button>
  <button class="testbutton" type="button" @click="ScrollTo()">
    Scroll To
  </button>
  <button class="testbutton" type="button" @click="AnimatePrevious()">
    Load Previous
  </button>
  <button class="testbutton" type="button" @click="AnimateNext()">
    Load Next
  </button>
</template>

<script>
import Scroller from "./components/Scroller/Scroller.vue";
import VScroller from "./components/VScroller/VScroller.vue";

export default {
  name: "App",
  components: {
    Scroller,
    VScroller
  },
  data: function () {
    return {
      scrollerdata: {},
      finitescrollerdata: [],
      firstindex: 100,
      lastindex: 100,
      total: 200,
      newcellslength: 50,
      scrolltoposition: 0,
      dayviewdata: [
        {
          id: 1
        },
        {
          id: 2
        }
      ]
    };
  },
  methods: {
    OnScroll() {
      //
    },
    onInitialized() {
        console.log("onInitialized");
        this.lastindex += this.total;
        for (var f = this.firstindex; f < this.lastindex; f++) {
            this.scrollerdata[f] = { id: "id_"+f };
        }
    },
    onUpdateDataNext(done, _firstindex, _lastindex) {
      var newdata = {};
      for (var f = _lastindex; f < _lastindex + this.newcellslength; f++) {
        newdata[f] = { id: "id_"+f };
      }

      done(newdata);
    },
    onUpdateDataPrevious(done, _firstindex, _lastindex) {
      var newdata = {};
      for (var f = _firstindex - this.newcellslength; f < _firstindex; f++) {
        newdata[f] = { id: "id_"+f };
      }

      done(newdata);
    },
    ScrollBy() {
      this.$refs.scroller_ref.ScrollBy(100);
    },
    ScrollTo() {
      //this.$refs.scroller_ref.ScrollTo(this.scrolltoposition);
    },
    AnimatePrevious() {
      this.firstindex = 9000;
      this.firslastindex = 9000;
      var nextdata = [];

      this.lastindex += this.total;
      for (var f = this.firstindex; f < this.lastindex; f++) {
        nextdata.push({
          id: f
        });
      }

      this.$refs.scroller_ref.SetAnimatePrevious(nextdata, () => {});
    },
    AnimateNext() {
      this.firstindex = 20000;
      this.lastindex = 20000;
      var nextdata = [];

      this.lastindex += this.total;
      for (var f = this.firstindex; f < this.lastindex; f++) {
        nextdata.push({
          id: f
        });
      }

      this.$refs.scroller_ref.SetAnimateNext(nextdata, () => {});
    }
  },
  mounted() {
    // TODO
    // TODO This should be updated on CUSTOM EVENT On Initialized Component
    /* this.lastindex += this.total;
    for (var f = this.firstindex; f < this.lastindex; f++) {
      this.scrollerdata[f] = { id: "id_"+f };
    } */

    //this.scrollerdata[0] = { id: this.firstindex };
    //console.log("this.scrollerdata.length: ", Object.keys(this.scrollerdata).length);
  }
};
</script>

<style>
#app {
  font-family: "Advent Pro", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

h1 {
  font-weight: 400 !important;
}

.widget-container {
  border: 0px solid;
  box-shadow: rgb(0 0 0 / 24%) 0px 3px 8px;
  text-indent: 10px;
  font-size: 16pt;
  padding: 20px;
  margin: 0px auto;
  max-width: 50%;
  margin-bottom: 20px;
  position: relative;
}

.widget-container h3 {
  margin-top: 10px;
  font-family: "Advent Pro", sans-serif;
  font-weight: 300 !important;
}

.madewith {
  position: absolute;
  bottom: 10px;
  right: 10px;
  font-size: 12pt;
}

.testbutton {
  background: #b6b6b6;

  /* for theme */
  background: #f0ecec;
  /* box-shadow: 2px 2px 2px 2px rgb(221 221 221 / 60%); */
  box-shadow: rgba(50, 50, 93, 0.25) 0px 2px 5px -1px,
    rgba(0, 0, 0, 0.3) 0px 1px 3px -1px;
  border-radius: 5px;
  border: 0px solid;
  padding: 10px;

  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;

  margin-left: 10px;
}

.testbutton:active {
  background: #d4d0d0;
}

@media screen and (max-width: 600px) {
  .widget-container {
    max-width: 90%;
  }
}

@media screen and (max-width: 960px) {
  .widget-container {
    max-width: 70%;
  }
}
</style>
