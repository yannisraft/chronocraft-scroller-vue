<template>
<div :id="scrollerId" class="scroller noselect">
    <div :id="viewportId" class="scroller-viewport">
        <div :id="containerId" :key="renderKey" class="scroller-container" :style="[{ height: GetContainerHeight() }]">
            <VScrollerRow v-for="(row, rowkey) in alldata" :key="rowkey" :calculatedRowSize="calculatedRowSize" :sidegap="sidegap" :row="row" :orientation="orientation">
            </VScrollerRow>
        </div>
    </div>
    <VScrollerScrollBar :active="hasScrollbar" :orientation="orientation" :mode="isInfinite ? 'infinite' : 'normal'" @onChange="OnScrollBarChanged" @onBackwardsClicked="onBackwardsClicked" @onForwardClicked="onForwardClicked" :viewportId="viewportId" />
</div>
</template>

<script>
import {
    defineComponent,
    ref,
    onBeforeUpdate,
    onMounted,
    watch
} from "vue";

//import VScrollerScrollBar from "./VScrollerScrollBar";
//import VScrollerScrollBar from "@/VScrollerScrollBar";
/* const VScrollerScrollBar = () => import("~/VScrollerScrollBar");
import VScrollerRow from "@/VScrollerRow"; */
/* let VScrollerScrollBar = null;
let VScrollerRow = null; */

/* console.log(process.env);
process.env.DEV = true;
if (process.env.DEV) {
  VScrollerScrollBar = require("./VScrollerScrollBar");
  VScrollerRow = require("./VScrollerRow");
}
 */
/* console.log(process.env);
if(process.env.NODE_ENV)
{
    VScrollerScrollBar = require("./VScrollerScrollBar").default;
    VScrollerRow = require("./VScrollerRow").default;
} else {
    VScrollerScrollBar = require("VScrollerScrollBar").default;
    VScrollerRow = require("VScrollerRow").default;
} */

// TESTING
//import VScrollerScrollBar from "./../VScrollerScrollBar/VScrollerScrollBar";
//import VScrollerRow from "VScrollerRow";

//import VScrollerScrollBar from "./VScrollerScrollBar";
//import VScrollerRow from "./VScrollerRow";

// BUILD
/* import VScrollerScrollBar from "VScrollerScrollBar";
import VScrollerRow from "VScrollerRow"; */

console.log(process.env.NODE_ENV);

export default defineComponent({
    name: "VScroller",
    components: {
        VScrollerScrollBar,
        VScrollerRow
        //VScrollerScrollBar: () => import('./VScrollerScrollBar'),
        //VScrollerRow: () => import('./VScrollerRow')
    },
    props: {
        modelValue: {
            type: Object,
            default: () => {
                return {};
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
        sidegap: {
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
            default: false
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
        let IDGenerated = Math.floor(Math.random() * 999999) + 1000000;

        // ---- Reactive Attributes
        const scrollerId = ref("scroller_" + IDGenerated);
        const containerId = ref("container_" + IDGenerated);
        const viewportId = ref("viewport_" + IDGenerated);
        let cellWidthVal = ref(props.cellWidth);
        let cellHeightVal = ref(props.cellHeight);
        let translatePosition = ref(0);
        const cellsdata = ref({}); //ref(props.modelValue);
        const cells = ref([]);
        const divs = ref([]);
        let scrollbarPosition = ref(0);
        const alldata = ref({});
        let calculatedRowSize = ref(props.cellHeight);

        // ---- Attributes
        let renderKey = 0;
        let translatePositionPrevious = translatePosition.value;
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
        let maxVelocity = 30;
        let velocityMomentum = 0.95;
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
        let previousscrolldirection = 0;
        let finalScrollSpeed = props.scrollSpeed;
        let scrollercache = {};
        var cellSizeOriented = cellHeightVal.value;
        let cellsNumberOriented = 0;
        let newcellslength = 50;
        let updateTime = 5;
        let resizeWindowTimeout = null;
        let resizeWindowData = {};
        let currentRowElement = null;

        // ---- Initial Setup based on Orientation
        if (props.orientation === "horizontal") {
            translatePositionString = "X";
            calculatedRowSize.value = props.cellWidth;
        }

        // ---- Methods Public
        //
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
                previousscrolldirection = -1;
                if (props.orientation === 'horizontal') {
                    scrolldirection = 1;
                    previousscrolldirection = 1;
                }
            } else if (newvalue > 50) {
                // Move Forward
                scrolldirection = 1;
                previousscrolldirection = 1;
                if (props.orientation === 'horizontal') {
                    scrolldirection = -1;
                    previousscrolldirection = -1;
                }
            }

            if (scrolldirection !== 0) {
                if (scrollInterval === null) {
                    scrollInterval = setInterval(() => {
                        UpdatePosition();
                    }, 10);
                }
            } else {
                clearInterval(scrollInterval);
                scrollInterval = null;
            }
        }

        function onBackwardsClicked() {
            scrolldirection = -1;
            previousscrolldirection = -1;
            finalScrollSpeed = props.scrollSpeed * 3;

            UpdatePosition();
            BeginMomentumTracking();

            scrolldirection = 0;
            finalScrollSpeed = props.scrollSpeed;
        }

        function onForwardClicked() {
            scrolldirection = 1;
            previousscrolldirection = 1;
            finalScrollSpeed = props.scrollSpeed * 3;

            UpdatePosition();
            BeginMomentumTracking();

            scrolldirection = 0;
            finalScrollSpeed = props.scrollSpeed;
        }

        // ---- Methods Private
        //
        function UpdatePosition() {
            const walk = scrolldirection * finalScrollSpeed;
            const _translatePositionPrevious = translatePosition.value;
            translatePosition.value += -walk;
            velocityCurrent = translatePosition.value - _translatePositionPrevious;
        }

        function AnimateScroller() {
            if (container) {
                container.style.transform =
                    "translate" +
                    translatePositionString +
                    "(" +
                    translatePosition.value +
                    "px)";

                if (translatePosition.value == translatePositionPrevious) {
                    previousscrolldirection = 1;
                } else if (translatePosition.value > translatePositionPrevious) {
                    previousscrolldirection = -1;
                }

                DetectEdges(scrolldirection);
                translatePositionPrevious = translatePosition.value;
            }
        }

        function DetectEdges(direction) {
            if (viewport) {
                var viewportSize = viewport.clientHeight;
                let cellSizeWithGap = cellSizeOriented + props.sidegap * 2;

                if (props.orientation === "horizontal") {
                    viewportSize = viewport.clientWidth;
                }

                cellSizeWithGap = calculatedRowSize.value;

                var diff = 0;
                let diffcache = 0;

                if (direction === 0 && previousscrolldirection !== 0) direction = previousscrolldirection;
                if (direction === -1) { // Backwards
                    diff = -indexRowBackward * cellSizeWithGap - translatePosition.value - viewportSize;
                    diffcache = indexCacheRowBackward * cellSizeWithGap + translatePosition.value + parseInt(newcellslength / cellsNumberOriented);

                    let updatePositionTest = -parseInt(newcellslength / cellsNumberOriented) * cellSizeWithGap;
                    if (diffcache > updatePositionTest) {
                        UpdateScrollerCache(direction);
                    }

                    if (diff < -cellSizeWithGap) {
                        UpdateCells(direction, cellSizeOriented);
                    }
                } else if (direction === 1) { // Forward
                    diff = (indexRowForward - 1) * cellSizeWithGap + translatePosition.value - viewportSize;
                    diffcache = indexCacheRowForward * cellSizeWithGap + translatePosition.value - viewportSize + parseInt(newcellslength / cellsNumberOriented);

                    let updatePositionTest = parseInt(newcellslength / cellsNumberOriented) * cellSizeWithGap + viewportSize;
                    if (diffcache < updatePositionTest) {
                        UpdateScrollerCache(direction);
                    }

                    if (diff < 0) {
                        UpdateCells(direction, cellSizeOriented);
                    }
                }
            }
        }

        function UpdateScrollerCache(direction) {
            if (direction === 1) { // Forward
                context.emit("on-update-data-next", (newdata) => {
                    newcellslength = Object.keys(newdata).length;
                    indexCacheForward += Object.keys(newdata).length;
                    indexCacheRowForward += parseInt(Object.keys(newdata).length / cellsNumberOriented);

                    // Clear Data regarding Backward Cache
                    for (let i = 0; i < Math.abs(indexBackward - indexCacheBackward); i++) {
                        if (scrollercache[indexCacheBackward + i]) {
                            delete scrollercache[indexCacheBackward + i];
                        }
                    }

                    indexCacheBackward = indexBackward;
                    indexCacheRowBackward = indexRowBackward;

                    scrollercache = {
                        ...newdata,
                        ...scrollercache
                    };
                }, indexBackward, indexCacheForward);
            } else { // Backward
                context.emit("on-update-data-previous", (newdata) => {
                    newcellslength = Object.keys(newdata).length;
                    indexCacheBackward -= Object.keys(newdata).length;
                    indexCacheRowBackward -= parseInt(Object.keys(newdata).length / cellsNumberOriented);

                    // Clear Data regarding Forward Cache
                    for (let i = 0; i < Math.abs(indexForward - indexCacheForward); i++) {
                        if (scrollercache[indexCacheForward + i]) {
                            delete scrollercache[indexCacheForward + i];
                        }
                    }

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
                if (direction === 1) { // Add Cells Forward                    
                    //console.log("Add Cells Forward");

                    // Get all the cells that required to be loaded
                    var cellsToAdd = [];
                    let totalCellsToAdd = cellsNumberOriented - indexLeftForward;
                    for (var i = 0; i < totalCellsToAdd; i++) {
                        var cachecell = scrollercache[indexForward + i];
                        if (cachecell) {
                            if (scrollercache[indexForward + i]) {
                                cellsToAdd.push({
                                    id: scrollercache[indexForward + i].id,
                                    item: null,
                                    index: indexForward + i
                                });
                            }
                        }
                    }

                    if (cellsToAdd.length > 0) {
                        for (var i = 0; i < cellsToAdd.length; i++) {
                            if (indexLeftForward === 0) {
                                indexRowForward++;
                            }

                            var leftval_row = 0;
                            let topval_row = indexRowForward * calculatedRowSize.value;
                            var leftval_cell = i * (cellSizeOriented + props.sidegap * 2);
                            let topval_cell = 0;

                            if (props.orientation === "horizontal") {
                                leftval_row = indexRowForward * calculatedRowSize.value;
                                topval_row = 0;
                                leftval_cell = 0;
                                topval_cell = i * (cellSizeOriented + props.sidegap * 2);
                            }

                            if (indexLeftForward === 0) {
                                AddRow(topval_row, leftval_row, indexRowForward, true);
                            }

                            let key = cellsToAdd[i].index;
                            cellsdata.value[key] = {
                                id: cellsToAdd[i].id
                            };

                            let currentRowElement = GetCurrentRowElement();
                            if (currentRowElement) {
                                if (!currentRowElement.cells[key]) {
                                    AddCell(topval_cell, leftval_cell, key);
                                }
                            }

                            indexLeftForward++;
                            indexForward++;

                            if (indexLeftForward > cellsNumberOriented - 1) {
                                indexLeftForward = 0;

                                let rowRemoved = false;
                                for (var i = 0; i < cellsToAdd.length; i++) {
                                    delete cellsdata.value[indexBackward];
                                    indexBackward++;
                                    indexCacheBackward++;

                                    if (!rowRemoved) {
                                        if (alldata.value[indexRowBackward]) {
                                            delete alldata.value[indexRowBackward];
                                        }
                                        rowRemoved = true;
                                    }
                                }

                                indexRowBackward++;
                                indexCacheRowBackward++;
                            }
                        }
                    } else {
                        if (scrolldirection === 0 && previousscrolldirection !== 0) previousscrolldirection = 0;
                    }

                    // Delete the cells we just added that are inside scrollercache
                    for (var i = 0; i < cellsToAdd.length; i++) {
                        delete scrollercache[cellsToAdd[i].index];
                    }

                    cellsToAdd = [];
                } else { // Add Items Backward                    
                    //console.log("Add Cells Backward");

                    // Get all the cells that required to be loaded
                    let totalCellsToAdd = cellsNumberOriented - indexLeftBackward;
                    var cellsToAdd = [];
                    for (var i = 1; i <= totalCellsToAdd; i++) {
                        var cachecell = scrollercache[indexBackward - i];
                        if (cachecell !== null && typeof cachecell !== "undefined") {
                            if (scrollercache[indexBackward - i]) {
                                cellsToAdd.push({
                                    id: scrollercache[indexBackward - i].id,
                                    item: null,
                                    index: indexBackward - i
                                });
                            }
                        }
                    }

                    if (cellsToAdd.length > 0) {
                        for (var i = 0; i < cellsToAdd.length; i++) {
                            if (indexLeftBackward === 0) {
                                indexRowBackward--;
                            }                            

                            var leftval_row = 0;
                            let topval_row = indexRowBackward * calculatedRowSize.value;
                            var leftval_cell = (cellsNumberOriented - 1 - indexLeftBackward) * (cellSizeOriented + props.sidegap * 2);
                            var topval_cell = 0;

                            if (props.orientation === "horizontal") {
                                leftval_row = indexRowBackward * calculatedRowSize.value;
                                topval_row = 0;

                                leftval_cell = 0;
                                topval_cell = (cellsNumberOriented - 1 - indexLeftBackward) * (cellSizeOriented + props.sidegap * 2);
                            }

                            if (indexLeftBackward === 0) {
                                AddRow(topval_row, leftval_row, indexRowBackward, true);
                            }

                            let key = cellsToAdd[i].index;
                            cellsdata.value[key] = {
                                id: cellsToAdd[i].id
                            };

                            var currentRowElement = GetCurrentRowElement();
                            if (currentRowElement) {
                                if (!currentRowElement.cells[key]) {
                                    AddCell(topval_cell, leftval_cell, key);
                                }
                            }

                            indexBackward--;
                            indexLeftBackward++;     
                            
                            if (indexLeftBackward > cellsNumberOriented - 1) {
                                indexLeftBackward = 0;

                                let rowRemoved = false;
                                for (var i = 0; i < cellsToAdd.length; i++) {
                                    var _cell = cellsdata.value[indexForward - 1];
                                    delete cellsdata.value[indexForward - 1];
                                    indexForward--;
                                    indexCacheForward--;
                                    if (!rowRemoved) {
                                        if (alldata.value[indexRowForward]) {
                                            delete alldata.value[indexRowForward];
                                        }

                                        rowRemoved = true;
                                    }
                                }

                                indexRowForward--;
                                indexCacheRowForward--;
                            }
                        }
                    } else {
                        if (scrolldirection === 0 && previousscrolldirection !== 0) previousscrolldirection = 0;
                    }

                    for (var i = 0; i < cellsToAdd.length; i++) {
                        if (cellsToAdd[i]) delete scrollercache[cellsToAdd[i].index];
                    }

                    cellsToAdd = [];
                }
            }
        }

        function AddRow(_top, _left, _index, isForward) {
            let rowHeight = parseInt(cellSizeOriented + props.sidegap * 2) + "px";
            let rowWidth = "calc(100% - " + 2 * props.sidegap + "px)";

            if (props.orientation === "horizontal") {
                rowHeight = "calc(100% - " + 2 * props.sidegap + "px)";
                rowWidth = parseInt(cellSizeOriented + props.sidegap * 2) + "px";
            }

            alldata.value[_index] = {
                index: _index,
                top: _top + "px",
                left: _left + "px",
                width: rowWidth,
                height: rowHeight,
                cells: {}
            };
            currentRowElement = alldata.value[_index];
        }

        function AddCell(_top, _left, key) {
            let cellTop = _top;
            let cellLeft = _left;

            var currentRowElement = GetCurrentRowElement();
            currentRowElement.cells[key] = {
                index: key,
                id: "item" + cellsdata.value[key].id,
                left: cellLeft + "px",
                flexbasis: (100 / cellsNumberOriented) + "%",
                top: cellTop + "px"
            };
        }

        function GetCurrentRowElement() {
            var resultElement = null;
            /* if (previousscrolldirection === -1) {
                if (alldata.value[indexRowBackward - 1] !== null && typeof alldata.value[indexRowBackward - 1] !== 'undefined') {
                    resultElement = alldata.value[indexRowBackward - 1];
                }
            } else {
                if (alldata.value[indexRowForward - 1] !== null && typeof alldata.value[indexRowForward - 1] !== 'undefined') {
                    resultElement = alldata.value[indexRowForward - 1];
                }
            } */

            resultElement = currentRowElement;

            return resultElement;
        }

        function GenerateInitialCells() {
            indexForward = Object.keys(cellsdata.value).reduce((key, v) =>
                cellsdata.value[v] < cellsdata.value[key] ? v : key
            );

            indexBackward = indexForward;
            indexRowForward = -1;
            indexRowBackward = 0;
            indexLeftForward = 0;
            indexLeftBackward = 0;

            cellSizeOriented = cellHeightVal.value;
            cellsNumberOriented = props.numberOfColumns;

            if (props.cellSquared) calculatedRowSize.value = viewport.clientWidth / cellsNumberOriented;

            if (props.orientation === "horizontal") {
                cellSizeOriented = cellWidthVal.value;
                cellsNumberOriented = props.numberOfRows;
                if (props.cellSquared) calculatedRowSize.value = viewport.clientHeight / cellsNumberOriented;
            }

            // In order have cells visible at the back of the scroller
            // set Position at the half of the cells size
            let startPos = parseInt(parseInt(Object.keys(cellsdata.value).length / 2) / cellsNumberOriented) * (cellSizeOriented + props.sidegap * 2);
            translatePosition.value -= startPos;

            //let isFirstRow = true;
            for (let key in cellsdata.value) {
                if (indexLeftForward === 0) {
                    indexRowForward++;
                }

                let leftval_row = 0;
                let topval_row = indexRowForward * calculatedRowSize.value;

                let leftval_cell = indexLeftForward * (cellSizeOriented + props.sidegap * 2);
                let topval_cell = 0;

                if (props.orientation === "horizontal") {
                    leftval_row = indexRowForward * calculatedRowSize.value;
                    topval_row = 0;
                    leftval_cell = 0;
                    topval_cell = indexLeftForward * (cellSizeOriented + props.sidegap * 2);
                }

                if (indexLeftForward === 0) {
                    AddRow(topval_row, leftval_row, indexRowForward, true);
                }

                var currentRowElement = GetCurrentRowElement();
                if (currentRowElement) {
                    if (!currentRowElement.cells[key]) {
                        AddCell(topval_cell, leftval_cell, key);
                    }
                }

                indexForward++;
                indexLeftForward++;

                if (indexLeftForward > cellsNumberOriented - 1) {
                    indexLeftForward = 0;
                }                
            }
            //console.log(alldata.value);

            indexCacheForward = indexForward;
            indexCacheBackward = indexBackward;
            indexCacheRowForward = indexRowForward;
            indexCacheRowBackward = indexRowBackward;

            container.style.transform =
                "translate" +
                translatePositionString +
                "(" +
                translatePosition.value +
                "px) ";

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

            if (props.orientation === "horizontal") velocityMomentum = 0.9;

            velocityCurrent *= velocityMomentum;
            if (Math.abs(velocityCurrent) > 0.5) {
                momentumID = requestAnimationFrame(MomentumLoop);
            }
        }

        // ---- Events
        window.addEventListener("wheel", (e) => {
            var timediff = Date.now() - timeSinceLastScroll;
            finalScrollSpeed = props.scrollSpeed * 2;
            if (timediff < 10) {
                finalScrollSpeed = props.scrollSpeed * 6;
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
        };

        window.addEventListener("resize", (e) => {
            if (props.cellSquared) {
                if (Object.keys(alldata.value).length > 0) resizeWindowData = Object.assign({}, alldata.value);
                alldata.value = {};
                calculatedRowSize.value = viewport.clientWidth / cellsNumberOriented;
                if (props.orientation === "horizontal") {
                    calculatedRowSize.value = viewport.clientHeight / cellsNumberOriented;
                }

                clearTimeout(resizeWindowTimeout);

                resizeWindowTimeout = setTimeout(() => {
                    alldata.value = resizeWindowData;
                }, 500);

            }
        });

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
                if (props.orientation === "horizontal") {
                    mouseDownStartPosition = e.pageX;
                    dragScrollPreviousPosition = e.pageX;
                }
            });

            document.addEventListener("mouseup", (e) => {
                mouseDown = false;
                mouseMoving = false;

                if (Math.abs(velocityCurrent) > maxVelocity)
                    velocityCurrent = maxVelocity * Math.sign(velocityCurrent);

                BeginMomentumTracking();
            });

            document.addEventListener("mousemove", (e) => {
                if (!mouseDown) return;

                e.preventDefault();
                mouseMoving = true;

                let moveSpeed = 1;
                var walk = e.pageY - dragScrollPreviousPosition;

                if (props.orientation === "horizontal") {
                    walk = e.pageX - dragScrollPreviousPosition;
                    dragScrollPreviousPosition = e.pageX;
                } else {
                    dragScrollPreviousPosition = e.pageY;
                }

                velocityCurrent = walk;
                translatePosition.value += walk * moveSpeed;

            });

            viewport.addEventListener("mouseleave", (e) => {
                mouseDown = false;
            });

            setInterval(() => {
                AnimateScroller();
            }, updateTime);

            context.emit("on-initilized");
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
            cellWidthVal,
            cellHeightVal,
            translatePosition,
            cellsdata,
            alldata,
            cells,
            divs,
            scrollbarPosition,
            calculatedRowSize,
            renderKey,

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
/* @import "./scroller.css"; */
</style>
