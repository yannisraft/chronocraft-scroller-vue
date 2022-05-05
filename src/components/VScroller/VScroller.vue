<template>
<div :id="scrollerId" class="scroller noselect">
    <div :id="viewportId" class="scroller-viewport" :style="{width: '100%'}">
        <div :id="containerId" class="scroller-container" :style="[{ 'height': GetContainerHeight()}]">
            <div v-for="datacell in cellsdata" :key="datacell.id" :id="'cell_'+datacell.id">

            </div>
        </div>
    </div>
    <VScrollerScrollBar :active="hasScrollbar" :mode="isInfinite ? 'infinite' : 'normal'" @onChange="OnScrollBarChanged" @onBackwardsClicked="onBackwardsClicked" @onForwardClicked="onForwardClicked" :viewportId="viewportId" />
    <!-- <div class="scroller-scrollbar">
        <div class="scroller-scrollbar-track"></div>
        <div class="scroller-scrollbar-thumb" :style="'top: '+scrollbarThumbPosition+'px'"></div>
        <div class="scroller-scrollbar-up" style="height: 12px;"></div>
        <div class="scroller-scrollbar-down" style="height: 12px;"></div>
    </div> -->
</div>
</template>

<script>
import {
    defineComponent,
    ref,
    reactive,
    onBeforeUpdate,
    onBeforeMount,
    onMounted,
    onCreate,
    onActivated,
    onUpdated,
    watch,
    computed
} from "vue";

import VScrollerScrollBar from './VScrollerScrollBar';

export default defineComponent({
    name: "VScroller",
    components: {
        VScrollerScrollBar
    },
    props: {
        modelValue: {
            type: Object,
            default: () => {
                return {}
            }
        },
        height: {
            type: Number,
            default: -1
        },
        orientation: {
            type: String,
            default: "vertical"
        },
        numberOfColumns: {
            type: Number,
            default: 5
        },
        numberOfRows: {
            type: Number,
            default: 5
        },
        gap: {
            type: Number,
            default: 5
        },
        cellHeight: {
            type: Number,
            default: 50
        },
        cellWidth: {
            type: Number,
            default: 50
        },
        cellSquared: {
            type: Boolean,
            default: true
        },
        scrollSpeed: {
            type: Number,
            default: 6
        },
        isInfinite: {
            type: Boolean,
            default: false
        },
        hasScrollbar: {
            type: Boolean,
            default: true
        }
    },
    setup(props, context) {
        let IDGenerated = (Math.floor(Math.random() * 999999) + 1000000);

        // ---- Reactive Attributes
        const scrollerId = ref("scroller_" + IDGenerated);
        const containerId = ref("container_" + IDGenerated);
        const viewportId = ref("viewport_" + IDGenerated);
        let cellWidth = ref(props.cellWidth);
        let cellHeight = ref(props.cellHeight);
        let translatePosition = ref(0);
        const cellsdata = ref({}); //ref(props.modelValue);
        const cells = ref([]);
        const divs = ref([]);
        let viewportWidth = ref("100%");
        let scrollbarPosition = ref(0);

        // ---- Attributes        
        let translatePositionPrevious = translatePosition.value;
        const loadedCells = 75;
        const indexInitial = 1;
        let indexForward = indexInitial;
        let indexBackward = indexInitial - 1;
        let indexRowForward = 0;
        let indexRowBackward = 0;
        let indexLeftForward = 0;
        let indexLeftBackward = 0;
        let indexCacheForward = 0;
        let indexCacheBackward = 0;
        let indexCacheRowForward = 0;
        let indexCacheRowBackward = 0;

        let momentumID = "";
        let velocityCurrent = 0;
        let maxVelocity = 80;
        const velocityMomentum = 0.97;
        let timeSinceLastScroll = 0;
        let container = null;
        let viewport = null;
        let translatePositionString = "Y";
        let mouseDown = false;
        let mouseMoving = false;
        let dragScrollStartPosition = translatePosition.value;
        let dragScrollPreviousPosition = translatePosition.value;
        let mouseDownStartPosition = 0;
        let scrollInterval = null;
        let scrolldirection = 0;
        let finalScrollSpeed = props.scrollSpeed;
        let cacheUpdatePosition = 300;
        let scrollercache = {};

        var cellSizeOriented = cellHeight.value;
        let cellsNumberOriented = 0;

        let newcellslength = 50;

        // ---- Setup Orientation
        if (props.orientation === 'horizontal') translatePositionString = "X";

        // ---- Methods Public
        function GetContainerHeight() {
            let finalHeight = props.height + "px";
            if (props.height === -1) {
                finalHeight = "100%";
            }
            return finalHeight;
        }

        function OnScrollBarChanged(newvalue) {
            finalScrollSpeed = props.scrollSpeed;
            if (newvalue <= 30 || newvalue > 70) {
                finalScrollSpeed = props.scrollSpeed * 3;
            }

            scrolldirection = 0;
            if (newvalue < 50) {
                // Move Backwards
                scrolldirection = -1;
            } else if (newvalue > 50) {
                // Move Forward
                scrolldirection = 1;
            }

            if (scrolldirection !== 0) {
                if (scrollInterval === null) {
                    scrollInterval = setInterval(() => {
                        UpdatePosition();
                    }, 20);
                }
            } else {
                clearInterval(scrollInterval);
                scrollInterval = null;
            }
        }

        function onBackwardsClicked() {
            scrolldirection = -1;
            finalScrollSpeed = props.scrollSpeed * 3;

            UpdatePosition();
            BeginMomentumTracking();

            scrolldirection = 0;
            finalScrollSpeed = props.scrollSpeed;
        }

        function onForwardClicked() {
            scrolldirection = 1;
            finalScrollSpeed = props.scrollSpeed * 3;

            UpdatePosition();
            BeginMomentumTracking();

            scrolldirection = 0;
            finalScrollSpeed = props.scrollSpeed;
        }

        // ---- Methods Private
        function UpdatePosition() {
            const walk = scrolldirection * finalScrollSpeed;

            const _translatePositionPrevious = translatePosition.value;
            translatePosition.value += -walk;
            velocityCurrent = translatePosition.value - _translatePositionPrevious;
        }

        function AnimateScroller() {
            if (container) {
                container.style.transform = "translate" + translatePositionString + "(" + translatePosition.value + "px)";
                //container.style.transform = "translate(0px, " + translatePosition.value + "px)";
                let direction = 1;
                if (translatePosition.value == translatePositionPrevious) {
                    direction = 0;
                } else if (translatePosition.value > translatePositionPrevious) {
                    direction = -1;
                }

                /* console.log("A: ", translatePosition.value);
                console.log("B: ", translatePositionPrevious); */

                DetectEdges(direction);
                translatePositionPrevious = translatePosition.value;
            }
        }

        function DetectEdges(direction) {
            if (viewport) {
                var viewportHeight = viewport.clientHeight;
                let cellSizeWithGap = (cellSizeOriented + props.gap * 2);
                var diff = 0;
                let diffcache = 0;

                /* console.log("indexRowForward: ", indexRowForward);
                console.log("indexRowBackward: ", indexRowBackward);
                console.log("indexCacheRowForward: ", indexRowForward);
                console.log("indexCacheRowBackward: ", indexRowBackward); */

                if (direction === -1) { // Backwards    

                    diff = (-indexRowBackward * cellSizeWithGap) - (translatePosition.value + viewportHeight);
                    diffcache = (indexCacheRowBackward * cellSizeWithGap) + translatePosition.value + parseInt(newcellslength / cellsNumberOriented);

                    let updatePositionTest = -parseInt(newcellslength / cellsNumberOriented) * cellSizeWithGap;

                    /* console.log("updatePositionTest: ", updatePositionTest);
                    console.log("diffcache: ", diffcache); */

                    if (diffcache > updatePositionTest) {
                        UpdateScrollerCache(direction);
                    }

                    if (diff < -cellSizeWithGap) {
                        UpdateCells(direction, cellSizeOriented);
                        indexRowForward--;
                    }

                    // WORKING
                    /* diff = (-indexRowBackward * cellSizeWithGap) - (translatePosition.value + viewportHeight);
                    diffcache = (-parseInt(indexCacheBackward / cellsNumberOriented) * cellSizeWithGap) - (translatePosition.value + viewportHeight);

                    if (diffcache < -parseInt(newcellslength / cellsNumberOriented) * cellSizeWithGap) {
                        UpdateScrollerCache(direction);                        
                    }

                    if (diff < -cellSizeWithGap) {
                        UpdateCells(direction, cellSizeOriented);
                        indexRowForward--;
                    } */
                } else if (direction === 1) { // Forward
                    diff = (indexRowForward * cellSizeWithGap) + translatePosition.value - viewportHeight;
                    diffcache = (indexCacheRowForward * cellSizeWithGap) + translatePosition.value - viewportHeight + parseInt(newcellslength / cellsNumberOriented);

                    let updatePositionTest = parseInt(newcellslength / cellsNumberOriented) * cellSizeWithGap + viewportHeight;
                    //let updatePositionTest = (parseInt(indexCacheForward / cellsNumberOriented) * cellSizeWithGap) + viewportHeight;

                    //console.log("indexCacheRowForward: ", indexCacheRowForward);
                    //console.log("cellSizeWithGap: ", cellSizeWithGap);

                    //console.log("diffcache: ", diffcache);
                    //console.log("diff: ", diff);
                    //console.log("updatePositionTest: ", updatePositionTest);

                    //if (diffcache > updatePositionTest) {
                    if (diffcache < updatePositionTest) {
                        //console.log("UpdateScrollerCache");
                        UpdateScrollerCache(direction);
                    }

                    if (diff < 0) {
                        UpdateCells(direction, cellSizeOriented);
                        //indexRowBackward++;
                    }
                }
                //console.log("translatePosition.value: ", translatePosition.value);
            }
        }

        function UpdateScrollerCache(direction) {
            if (direction === 1) {
                //console.log("UpdateScrollerCache NEXT");
                context.emit("on-update-data-next", (newdata) => {
                    console.log("scrollercache LENGTH: ", Object.keys(scrollercache).length);
                    
                    //let firstCacheIndex = 0;
                    //let firstNewDataIndex = Object.keys(newdata).reduce((key, v) => newdata[v] < newdata[key] ? v : key);
                    //if(Object.keys(scrollercache).length > 0) firstCacheIndex = Object.keys(scrollercache).reduce((key, v) => scrollercache[v] < scrollercache[key] ? v : key);
                    
                    

                    newcellslength = Object.keys(newdata).length;
                    indexCacheForward = parseInt(Object.keys(newdata).reduce((key, v) => newdata[v] >= newdata[key] ? v : key));
                    indexCacheRowForward += parseInt(Object.keys(newdata).length / cellsNumberOriented);

                    /* console.log("indexCacheBackward: ", indexCacheBackward);
                    console.log("NEW indexCacheBackward: ", indexBackward); */
                    // Clear Data regarding Backwards Cache
                    for(let i=0; i< Math.abs(indexBackward - indexCacheBackward); i++)
                    {
                        if(scrollercache[indexCacheBackward+i])
                        {
                            delete scrollercache[indexCacheBackward+i];
                        }
                    }

                    indexCacheBackward = indexBackward;
                    indexCacheRowBackward = indexRowBackward;

                    /* if(Math.abs(firstNewDataIndex - firstCacheIndex) > 50)
                    {
                        console.log("scrollercache¨", scrollercache);
                        console.log("firstNewDataIndex: ", firstNewDataIndex);
                        console.log("firstCacheIndex: ", firstCacheIndex);
                        console.log("Di: ", Math.abs(firstNewDataIndex - firstCacheIndex));
                    } */

                    scrollercache = {
                        ...newdata,
                        ...scrollercache
                    };
                    
                }, indexBackward, indexCacheForward);
            } else {
                //console.log("UpdateScrollerCache PREVIOUS");                
                context.emit("on-update-data-previous", (newdata) => {    
                    console.log("scrollercache LENGTH: ", Object.keys(scrollercache).length);
                    newcellslength = Object.keys(newdata).length;
                    indexCacheBackward -= Object.keys(newdata).length;
                    indexCacheRowBackward -= parseInt(Object.keys(newdata).length / cellsNumberOriented);
                    indexCacheForward = indexForward;
                    indexCacheRowForward = indexRowForward;

                    scrollercache = {
                        ...newdata,
                        ...scrollercache
                    };
                }, indexCacheBackward, indexForward);
            }
        }

        function UpdateCells(direction, cellSizeOriented) {
            if (Object.keys(scrollercache).length > 0) {
                if (direction === 1) {
                    // Add Cells Forward
                    //console.log("Add Cells Forward");
                    //console.log("scrollercache", scrollercache);                    
                    var cellsToAdd = [];
                    for (var i = 0; i < cellsNumberOriented; i++) {
                        var cachecell = scrollercache[indexForward + i];
                        if (cachecell) {
                            cellsToAdd.push(scrollercache[indexForward + i]);
                        }
                    }

                    if (cellsToAdd.length > 0) {                        
                        for (var i = 0; i < cellsToAdd.length; i++) {
                            var leftval = indexLeftForward * (cellSizeOriented + props.gap * 2);
                            var topval = indexRowForward * (cellSizeOriented + props.gap * 2);

                            if (props.orientation === 'horizontal') {
                                leftval = indexRowForward * (cellSizeOriented + props.gap * 2);
                                topval = indexLeftForward * (cellSizeOriented + props.gap * 2);
                            }

                            var item = document.createElement("div");
                            item.id = "item" + cellsToAdd[i].id;
                            item.classList.add("scroller-cell-v");
                            item.style.left = leftval + "px";
                            item.style.top = topval + "px";
                            item.style.backgroundColor = "#9eadc7";
                            item.innerHTML = cellsToAdd[i].id;
                            container.appendChild(item);

                            cellsdata.value[cellsToAdd[i].id] = {
                                id: cellsToAdd[i].id,
                                item: item
                            };

                            indexForward++;
                            indexLeftForward++;

                            if (indexLeftForward > cellsNumberOriented - 1) {
                                indexLeftForward = 0;
                                indexRowForward++;
                            }

                        }
                    }

                    for (var i = 0; i < cellsToAdd.length; i++) {
                        var _cell = cellsdata.value[indexBackward];
                        container.removeChild(_cell.item);
                        delete cellsdata.value[indexBackward];
                        indexBackward++;
                        indexCacheBackward++;
                    }

                    indexRowBackward++;
                    indexCacheRowBackward++;

                    for (var i = 0; i < cellsToAdd.length; i++) {
                        delete scrollercache[cellsToAdd[i].id];
                    }

                    // TODO
                    // TODO Remove Opposite Direction Cache Cells based on Position

                    cellsToAdd = [];
                } else {
                    // Add Items Backward
                    //console.log("Add Cells Backward");
                    var cellsToAdd = [];
                    for (var i = 1; i <= cellsNumberOriented; i++) {
                        var cachecell = scrollercache[indexBackward - i];
                        if (cachecell !== null && typeof cachecell !== 'undefined') {
                            cellsToAdd.push(scrollercache[indexBackward - i]);
                        }
                    }

                    if (cellsToAdd.length > 0) {
                        for (var i = 0; i < cellsToAdd.length; i++) {
                            var leftval = (cellsNumberOriented - 1 - indexLeftBackward) * (cellSizeOriented + props.gap * 2);
                            var topval = indexRowBackward * (cellSizeOriented + props.gap * 2);

                            if (props.orientation === 'horizontal') {
                                leftval = indexRowBackward * (cellSizeOriented + props.gap * 2);
                                topval = (cellsNumberOriented - 1 - indexLeftBackward) * (cellSizeOriented + props.gap * 2);
                            }

                            var item = document.createElement("div");
                            item.id = "item" + cellsToAdd[i].id;
                            item.classList.add("scroller-cell-v");
                            item.style.left = leftval + "px";
                            item.style.top = topval + "px";
                            item.style.backgroundColor = "#9eadc7";
                            item.innerHTML = cellsToAdd[i].id;
                            container.prepend(item);

                            cellsdata.value[cellsToAdd[i].id] = {
                                id: cellsToAdd[i].id,
                                item: item
                            };

                            indexBackward--;
                            indexLeftBackward++;
                            if (indexLeftBackward > cellsNumberOriented - 1) {
                                indexLeftBackward = 0;
                                indexRowBackward--;
                            }

                        }
                    }

                    for (var i = 0; i < cellsToAdd.length; i++) {
                        var _cell = cellsdata.value[indexForward - 1];
                        container.removeChild(_cell.item);
                        delete cellsdata.value[indexForward - 1];
                        indexForward--;
                        indexCacheForward--;
                    }
                    indexCacheRowForward--;

                    for (var i = 0; i < cellsToAdd.length; i++) {
                        if (cellsToAdd[i]) delete scrollercache[cellsToAdd[i].id];
                    }

                    cellsToAdd = [];

                    /* for (var i = 1; i <= cellsNumberOriented; i++) {
                        var leftval = (cellsNumberOriented - 1 - indexLeftBackward) * (cellSizeOriented + props.gap * 2);
                        var topval = indexRowBackward * (cellSizeOriented + props.gap * 2);

                        if (props.orientation === 'horizontal') {
                            leftval = indexRowBackward * (cellSizeOriented + props.gap * 2);
                            topval = (cellsNumberOriented - 1 - indexLeftBackward) * (cellSizeOriented + props.gap * 2);
                            console.log("TOPVAL: ", topval);
                        }

                        var item = document.createElement("div");
                        item.id = "item" + indexBackward;
                        item.classList.add("scroller-cell-v");
                        item.style.left = leftval + "px";
                        item.style.top = topval + "px";
                        item.style.backgroundColor = "#a5c79e";
                        item.innerHTML = indexBackward;
                        container.prepend(item);
                        cells.value.unshift(item);

                        indexBackward--;
                        indexLeftBackward++;
                        if (indexLeftBackward > cellsNumberOriented - 1) {
                            indexLeftBackward = 0;
                            indexRowBackward--;
                        }

                    } */

                    /* for (var i = 0; i < cellsNumberOriented; i++) {
                        var _cell = cells.value[cells.value.length - i - 1];
                        container.removeChild(_cell);
                        indexForward--;
                    }

                    cells.value.splice(cells.value.length - cellsNumberOriented, cells.value.length); */
                }
            }

        }

        function GenerateNextData() {

        }

        function GenerateInitialCells() {
            // GET indexForward lowest value
            indexForward = Object.keys(cellsdata.value).reduce((key, v) => cellsdata.value[v] < cellsdata.value[key] ? v : key);
            indexBackward = indexForward;
            indexRowForward = 0;
            indexRowBackward = -1;
            indexLeftForward = 0;

            cellSizeOriented = cellHeight.value;
            cellsNumberOriented = props.numberOfColumns;

            if (props.orientation === 'horizontal') {
                cellSizeOriented = cellWidth.value;
                cellsNumberOriented = props.numberOfRows;
            }

            // In order have cells visible at the back of the scroller
            // set Position at the half of the cells size
            let startPos = parseInt(parseInt(Object.keys(cellsdata.value).length / 2) / cellsNumberOriented) * (cellSizeOriented + props.gap * 2);
            translatePosition.value -= startPos;

            console.log("GenerateInitialCells: ", Object.keys(cellsdata.value).length);

            // STEPS TODO
            // 1. Calculate indexLeftForward, indexRowForward
            // 2. Add them to cellsdata.value[k] item as parameters
            // 3. For loop Generate Cells

            //for (let i = 0; i < Object.keys(cellsdata.value).length; i++) {
            for (let key in cellsdata.value) {
                //var cell = cellsdata.value[key];

                let leftval = indexLeftForward * (cellSizeOriented + props.gap * 2);
                let topval = indexRowForward * (cellSizeOriented + props.gap * 2);

                if (props.orientation === 'horizontal') {
                    leftval = indexRowForward * (cellSizeOriented + props.gap * 2);
                    topval = indexLeftForward * (cellSizeOriented + props.gap * 2);
                }

                // Add Item
                var item = document.createElement("div");
                item.id = "item" + cellsdata.value[key].id;
                item.classList.add("scroller-cell-v");
                item.innerHTML = cellsdata.value[key].id;
                item.style.left = leftval + "px";
                item.style.top = topval + "px";
                container.appendChild(item);

                cellsdata.value[key].item = item;

                indexForward++;
                indexLeftForward++;
                if (indexLeftForward > cellsNumberOriented - 1) {
                    indexLeftForward = 0;
                    indexRowForward++;
                }
            }

            indexCacheForward = indexForward;
            indexCacheBackward = indexBackward;
            indexCacheRowForward = indexRowForward;
            indexCacheRowBackward = indexRowBackward;

            container.style.transform = "translate" + translatePositionString + "(" + translatePosition.value + "px) ";
        }

        function CancelMomentumTracking() {
            cancelAnimationFrame(momentumID);
        }

        function BeginMomentumTracking() {
            CancelMomentumTracking();
            momentumID = requestAnimationFrame(MomentumLoop);
        }

        function MomentumLoop() {
            translatePosition.value += velocityCurrent;

            velocityCurrent *= velocityMomentum;
            if (Math.abs(velocityCurrent) > 0.5) {
                momentumID = requestAnimationFrame(MomentumLoop);
            }
        }

        // ---- Events
        window.addEventListener("wheel", (e) => {
            var timediff = Date.now() - timeSinceLastScroll;
            finalScrollSpeed = props.scrollSpeed;
            if (timediff < 10) {
                finalScrollSpeed = props.scrollSpeed * 3;
            }

            const deltaY = Math.sign(e.deltaY);
            const walk = deltaY * finalScrollSpeed;

            const _translatePositionPrevious = translatePosition.value;
            translatePosition.value += -walk;
            velocityCurrent = translatePosition.value - _translatePositionPrevious;

            BeginMomentumTracking();
            timeSinceLastScroll = Date.now();
        });

        const onCellsDataChanged = () => {
            context.emit("update:modelValue", cellsdata.value);
        }

        // ---- Watchers
        watch(() => props.modelValue, (first, second) => {
            if (Object.keys(cellsdata.value).length === 0 && Object.keys(first).length > 0) {
                cellsdata.value = first;
                GenerateInitialCells();
            }
        }, {
            deep: true
        });

        // ---- Lifecycle Hooks
        onMounted(() => {
            console.log("onMounted");
            container = document.getElementById(containerId.value);
            viewport = document.getElementById(viewportId.value);

            // Add Container Events after its creation
            viewport.addEventListener("mousedown", (e) => {
                mouseDown = true;
                dragScrollStartPosition = translatePosition.value;
                dragScrollPreviousPosition = e.pageY;
                mouseDownStartPosition = e.pageY;
                if (props.orientation === 'horizontal') {
                    mouseDownStartPosition = e.pageX;
                }
            });

            document.addEventListener("mouseup", (e) => {
                mouseDown = false;
                mouseMoving = false;                
                
                if(Math.abs(velocityCurrent) > maxVelocity) velocityCurrent = maxVelocity * Math.sign(velocityCurrent);

                BeginMomentumTracking();
            });

            viewport.addEventListener("mousemove", (e) => {
                if (!mouseDown) return;

                e.preventDefault();
                mouseMoving = true;

                let moveSpeed = 1;
                var walk = e.pageY - dragScrollPreviousPosition;
                velocityCurrent = walk;
                translatePosition.value += walk * moveSpeed;
                dragScrollPreviousPosition = e.pageY;
            });

            viewport.addEventListener("mouseleave", (e) => {
                mouseDown = false;
            });

            //GenerateInitialCells();

            setInterval(() => {
                AnimateScroller();
            }, 20);
        });

        // Make sure to reset the refs before each update.
        onBeforeUpdate(() => {
            divs.value = [];
        });

        return {
            // Attributes
            scrollerId,
            containerId,
            viewportId,
            cellWidth,
            cellHeight,
            translatePosition,
            cellsdata,
            cells,
            divs,
            viewportWidth,
            scrollbarPosition,

            // Methods Public
            GetContainerHeight,
            OnScrollBarChanged,
            onBackwardsClicked,
            onForwardClicked
        };
    }
});
</script>

<style lang="css">
@import "./scroller.css";
</style>
