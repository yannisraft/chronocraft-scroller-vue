<template>
<Scroller orientation="horizontal" 
          :cellwidth="200" 
          :numcols="4" 
          :numrows="4" 
          :contentpadding="30" 
          :wheelscrollspeed="20" 
          :data="scrollerdata" 
          :cellsquared="true" 
          @on-scroll="OnScroll" 
          @on-update-data-next="onUpdateDataNext" 
          @on-update-data-previous="onUpdateDataPrevious">
</Scroller>
</template>

<script>
import Scroller from './components/scroller/Scroller.vue';

export default {
    name: 'App',
    components: {
        Scroller
    },
    data: function () {
        return {
            scrollerdata: [],
            lastid: 10000
        }
    },
    methods: {
        OnScroll() {
            //
        },
        onUpdateDataNext(done) {
            console.log('update-next');

            var newdata = [];
            for (var f = this.lastid; f < this.lastid + 20; f++) {
                newdata.push({
                    id: f + 1
                });
            }

            this.lastid = this.lastid+20;

            done(newdata);
        },
        onUpdateDataPrevious(done) {
            console.log('update-previous');

            var newdata = [];
            for (var f = this.lastid; f < this.lastid + 20; f++) {
                newdata.push({
                    id: f + 1
                });
            }

            this.lastid = this.lastid + 20;

            done(newdata);
        }
    },
    mounted() {
        for (var f = this.lastid; f < this.lastid + 60; f++) {
            this.scrollerdata.push({
                id: f + 1
            });
        }
        this.lastid = this.lastid + 120;
    }
};
</script>

<style lang="scss">
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
</style>
