<template>
<h1>Chronocraft Library Test Playground</h1>
<Scroller orientation="horizontal" :cellwidth="200" :numcols="7" :numrows="4" :contentpadding="30" :wheelscrollspeed="3" :newcellslength="newcellslength" :data="scrollerdata" :cellsquared="false" @on-scroll="OnScroll" @on-update-data-next="onUpdateDataNext" @on-update-data-previous="onUpdateDataPrevious" @on-data-updated="onDataUpdated">
    <!-- <template v-slot:cell="slotProps">
        <span>{{ slotProps.data.id }}</span>
    </template> -->
</Scroller>
</template>

<script>
import Scroller from './components/Scroller/Scroller.vue';

export default {
    name: 'App',
    components: {
        Scroller
    },
    data: function () {
        return {
            scrollerdata: [],
            firstid: 10000,
            lastid: 10000,
            total: 140,
            newcellslength: 28
        }
    },
    methods: {
        OnScroll() {
            //
        },
        onUpdateDataNext(done, _firstid, _lastid) {
            var newdata = [];
            for (var f = _lastid; f < _lastid + this.newcellslength; f++) {
                
                newdata.push({
                    id: f+1
                });
            }

            done(newdata);
        },
        onUpdateDataPrevious(done, _firstid, _lastid) {

            var newdata = [];
            for (var f = _firstid - this.newcellslength; f < _firstid; f++) {
                newdata.push({
                    id: f
                });
            }

            done(newdata);
        },
        onDataUpdated(data) {
            console.log("onDataUpdated: ", data);
        }
    },
    mounted() {
        this.lastid += this.total;
        for (var f = this.firstid; f < this.lastid; f++) {
            this.scrollerdata.push({
                id: f
            });
        }        
    }
};
</script>

<style>
#app {
    font-family: 'Advent Pro', Helvetica, Arial, sans-serif;
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
    font-family: 'Advent Pro', sans-serif;
    font-weight: 300 !important;
}

.madewith {
    position: absolute;
    bottom: 10px;
    right: 10px;
    font-size: 12pt;
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
