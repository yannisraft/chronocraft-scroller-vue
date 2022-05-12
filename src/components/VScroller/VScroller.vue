<template>
<div :id="scrollerId" class="scroller noselect">
    <div :id="viewportId" class="scroller-viewport">
        <div :id="containerId" :key="renderKey" class="scroller-container" :style="[{ height: GetContainerHeight() }]">
            <!-- WORKING -->
            <!-- <div v-for="(row, rowkey) in alldata" :key="rowkey" class="scroller-row-v" :style="[{'margin-left': gap+'px'}, {'background-color': '#eaeaea'},{top: row.top, left: row.left, width: row.width, height: calculatedRowSize}]"> -->

            <!-- WITHOUT ABSOLUTE -->
            <!-- <div v-for="(row, rowkey) in alldata" :key="rowkey" class="scroller-row-v" :style="[{'margin-left': gap+'px'}, {'background-color': '#eaeaea'},{top: row.index * calculatedRowSize+'px', left: row.left, width: row.width, height: calculatedRowSize+'px'}]"> -->
            <VScrollerRow v-for="(row, rowkey) in alldata" :key="rowkey" :calculatedRowSize="calculatedRowSize" :gap="gap" :row="row" :orientation="orientation">
                <!-- <slot name="row" :data="row">
                    <div v-for="(cell, cellkey) in row.cells" class="scroller-cell-v" :key="cellkey" :id="'item'+cell.id" :style="[{left: cell.left, top: cell.top, 'flex-basis': cell.flexbasis}]">
                        <slot name="cell" :data="cell">
                            <span>{{ cell.index }}</span>
                        </slot>
                    </div>
                </slot> -->
            </VScrollerRow>
            <!-- </div> -->
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
    computed,
    app,
    createApp
} from "vue";

import VScrollerScrollBar from "./VScrollerScrollBar";
import VScrollerCell from "./VScrollerCell";
import VScrollerRow from "./VScrollerRow";

export default defineComponent({
    name: "VScroller",
    components: {
        VScrollerScrollBar,
        VScrollerCell,
        VScrollerRow
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

        if (props.orientation === "horizontal") {
            calculatedRowSize.value = props.cellWidth;
        }

        let renderKey = 0;

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

        var cellSizeOriented = cellHeightVal.value;
        let cellsNumberOriented = 0;

        let newcellslength = 50;
        let currentRowElement = null;

        let resizeWindowTimeout = null;
        let resizeWindowData = {};

        // ---- Setup Orientation
        if (props.orientation === "horizontal") translatePositionString = "X";

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
                container.style.transform =
                    "translate" +
                    translatePositionString +
                    "(" +
                    translatePosition.value +
                    "px)";
                //container.style.transform = "translate(0px, " + translatePosition.value + "px)";
                let direction = 1;
                if (translatePosition.value == translatePositionPrevious) {
                    direction = 1;
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
                var viewportSize = viewport.clientHeight;
                let cellSizeWithGap = cellSizeOriented + props.gap * 2;

                if(props.orientation === "horizontal")
                {
                    viewportSize = viewport.clientWidth;
                }
                
                cellSizeWithGap = calculatedRowSize.value;

                var diff = 0;
                let diffcache = 0;

                // TODO: update topval BUG for calculatedRowSize

                /* console.log("indexRowForward: ", indexRowForward);
                        console.log("indexRowBackward: ", indexRowBackward);
                        console.log("indexCacheRowForward: ", indexRowForward);
                        console.log("indexCacheRowBackward: ", indexRowBackward); */

                if (direction === -1) {
                    // Backwards

                    diff = -indexRowBackward * cellSizeWithGap - (translatePosition.value + viewportSize);
                    diffcache = indexCacheRowBackward * cellSizeWithGap + translatePosition.value + parseInt(newcellslength / cellsNumberOriented);

                    let updatePositionTest = -parseInt(newcellslength / cellsNumberOriented) * cellSizeWithGap;

                    /* console.log("updatePositionTest: ", updatePositionTest);
                              console.log("diffcache: ", diffcache); */

                    if (diffcache > updatePositionTest) {
                        UpdateScrollerCache(direction);
                    }

                    if (diff < -cellSizeWithGap) {
                        UpdateCells(direction, cellSizeOriented);
                        //indexRowForward--;
                    }
                } else if (direction === 1) {
                    // Forward
                    diff = indexRowForward * cellSizeWithGap + translatePosition.value - viewportSize;
                    diffcache = indexCacheRowForward * cellSizeWithGap + translatePosition.value - viewportSize + parseInt(newcellslength / cellsNumberOriented);

                    let updatePositionTest = parseInt(newcellslength / cellsNumberOriented) * cellSizeWithGap + viewportSize;

                    //console.log("indexCacheRowForward: ", indexCacheRowForward);
                    //console.log("cellSizeWithGap: ", cellSizeWithGap);

                    //console.log("diffcache: ", diffcache);
                    //console.log("diff: ", diff);
                    //console.log("updatePositionTest: ", updatePositionTest);

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
            if (direction === 1) {
                //console.log("UpdateScrollerCache NEXT");
                context.emit("on-update-data-next", (newdata) => {
                    //console.log("scrollercache LENGTH: ",Object.keys(scrollercache).length);
                    /* console.log("newdata NEXT: ", newdata); */

                    newcellslength = Object.keys(newdata).length;
                    /* indexCacheForward = parseInt(
                        Object.keys(newdata).reduce((key, v) =>
                            newdata[v] >= newdata[key] ? v : key
                        )
                    )+1; */
                    indexCacheForward += Object.keys(newdata).length;
                    indexCacheRowForward += parseInt(Object.keys(newdata).length / cellsNumberOriented);

                    // Clear Data regarding Backwards Cache
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
            } else {
                //console.log("UpdateScrollerCache PREVIOUS");
                context.emit("on-update-data-previous", (newdata) => {
                    //console.log("scrollercache LENGTH: ",Object.keys(scrollercache).length);

                    newcellslength = Object.keys(newdata).length;
                    indexCacheBackward -= Object.keys(newdata).length;
                    /* indexCacheBackward = parseInt(
                        Object.keys(newdata).reduce((key, v) =>
                            newdata[v] < newdata[key] ? v : key
                        )
                    )-1;  */

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
                            if (scrollercache[indexForward + i]) {
                                cellsToAdd.push({
                                    id: scrollercache[indexForward + i].id,
                                    item: null,
                                    index: indexForward + i
                                });
                            }
                        }
                    }

                    //indexLeftForward = 0;

                    console.log("cellsToAdd.length: ", cellsToAdd.length);
                    console.log("indexLeftForward: ", indexLeftForward);

                    if (cellsToAdd.length > 0) {
                        for (var i = 0; i < cellsToAdd.length; i++) {
                            var leftval_row = 0;
                            let topval_row = indexRowForward * calculatedRowSize.value;
                            var leftval_cell = i * (cellSizeOriented + props.gap * 2);
                            let topval_cell = 0;

                            if (props.orientation === "horizontal") {
                                leftval_row = indexRowForward * calculatedRowSize.value;
                                topval_row = 0;
                                leftval_cell = 0;
                                topval_cell = i * (cellSizeOriented + props.gap * 2);
                            }

                            

                            if (i > cellsNumberOriented - 1) {
                                // Create Row
                                //CreateRow(topval);
                                /* alldata.value[indexRowForward] = {
                                    top: topval + "px",
                                    left: "0px",
                                    width: "calc(100% - " + 2 * props.gap + "px)",
                                    height: parseInt(cellSizeOriented + props.gap * 2) + "px",
                                    cells: {}
                                };
                                currentRowElement = alldata.value[indexRowForward]; */
                                AddRow(topval_row, leftval_row, indexRowForward, true);

                                indexLeftForward = 0;
                                indexRowForward++;
                            }

                            indexForward++;
                            indexLeftForward++;

                            let key = cellsToAdd[i].index;
                            cellsdata.value[key] = {
                                id: cellsToAdd[i].id
                            };

                            //CreateCell(cellsToAdd[i].index, topval, leftval);
                            if (currentRowElement) {
                                if (!currentRowElement.cells[key]) {
                                    currentRowElement.cells[key] = {
                                        index: cellsdata.value[key].id,
                                        id: "item" + cellsdata.value[key].id,
                                        left: leftval_cell + "px",
                                        flexbasis: (100 / cellsNumberOriented) + "%",
                                        top: topval_cell+"px"
                                    };
                                }
                            }
                        }
                    }

                    let rowRemoved = false;
                    for (var i = 0; i < cellsToAdd.length; i++) {
                        var _cell = cellsdata.value[indexBackward];
                        //container.removeChild(_cell.item);
                        delete cellsdata.value[indexBackward];
                        indexBackward++;
                        indexCacheBackward++;

                        if (!rowRemoved) {
                            /* if (_cell.item) {
                                if (_cell.item.parentElement.parentElement === container) {
                                    container.removeChild(_cell.item.parentElement);
                                }
                            } else {
                                console.log("!!!! _cell: ", _cell);
                            } */
                            if (alldata.value[indexRowBackward]) {
                                delete alldata.value[indexRowBackward];
                            }

                            rowRemoved = true;
                        }
                    }

                    indexRowBackward++;
                    indexCacheRowBackward++;

                    for (var i = 0; i < cellsToAdd.length; i++) {
                        delete scrollercache[cellsToAdd[i].index];
                    }

                    cellsToAdd = [];

                    //console.log("TOTAL: ", Object.keys(alldata.value).length);
                } else {
                    // Add Items Backward
                    console.log("Add Cells Backward");
                    var cellsToAdd = [];
                    for (var i = 1; i <= cellsNumberOriented; i++) {
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
                            var leftval_row = 0;
                            //var leftval = (cellsNumberOriented - 1 - indexLeftBackward) * (cellSizeOriented + props.gap * 2);
                            //var topval = indexRowBackward * (cellSizeOriented + props.gap * 2);
                            let topval_row = indexRowBackward * calculatedRowSize.value;
                            var leftval_cell = (cellsNumberOriented - 1 - indexLeftBackward) * (cellSizeOriented + props.gap * 2);
                            var topval_cell = (cellsNumberOriented - 1 - indexLeftBackward) * (cellSizeOriented + props.gap * 2);

                            if (props.orientation === "horizontal") {
                                //leftval_row = indexRowBackward * (cellSizeOriented + props.gap * 2);
                                leftval_row = indexRowBackward * calculatedRowSize.value;
                                //topval_row = (cellsNumberOriented - 1 - indexLeftBackward) * (cellSizeOriented + props.gap * 2);
                                topval_row = 0;
                            }

                            indexBackward--;
                            indexLeftBackward++;

                            if (indexLeftBackward > cellsNumberOriented - 1) {

                                // Create Row
                                //CreateRow(topval);
                                /* alldata.value[indexRowBackward] = {
                                    top: topval + "px",
                                    left: "0px",
                                    width: "calc(100% - " + 2 * props.gap + "px)",
                                    height: parseInt(cellSizeOriented + props.gap * 2) + "px",
                                    cells: {}
                                };
                                currentRowElement = alldata.value[indexRowBackward]; */
                                AddRow(topval_row, leftval_row, indexRowBackward, false);

                                indexLeftBackward = 0;
                                indexRowBackward--;
                            }

                            let key = cellsToAdd[i].index;
                            cellsdata.value[cellsToAdd[i].index] = {
                                id: cellsToAdd[i].id
                            };

                            //CreateCell(cellsToAdd[i].index, topval, leftval);
                            if (currentRowElement) {
                                if (!currentRowElement.cells[key]) {
                                    currentRowElement.cells[key] = {
                                        index: cellsdata.value[key].id,
                                        id: "item" + cellsdata.value[key].id,
                                        left: leftval_cell + "px",
                                        flexbasis: (100 / cellsNumberOriented) + "%",
                                        top: topval_cell+"px"
                                    };
                                }
                            }
                        }
                    }

                    let rowRemoved = false;
                    for (var i = 0; i < cellsToAdd.length; i++) {
                        var _cell = cellsdata.value[indexForward - 1];
                        //container.removeChild(_cell.item);
                        delete cellsdata.value[indexForward - 1];
                        indexForward--;
                        indexCacheForward--;
                        if (!rowRemoved) {
                            /* if (_cell.item.parentElement.parentElement === container) {
                                container.removeChild(_cell.item.parentElement);
                            } */
                            if (alldata.value[indexRowForward]) {
                                delete alldata.value[indexRowForward];
                            }

                            rowRemoved = true;
                        }
                    }

                    indexRowForward--;
                    indexCacheRowForward--;

                    for (var i = 0; i < cellsToAdd.length; i++) {
                        if (cellsToAdd[i]) delete scrollercache[cellsToAdd[i].index];
                    }

                    /* console.log("indexForward: "+indexForward+" indexRowForward: "+indexRowForward);
                    console.log("indexBackward: "+indexBackward+" indexRowBackward: "+indexRowBackward); */

                    cellsToAdd = [];
                }
            }
        }

        /* function UpdateCellsOLD(direction, cellSizeOriented) {
            if (Object.keys(scrollercache).length > 0) {
                if (direction === 1) {
                    // Add Cells Forward
                    console.log("Add Cells Forward");
                    //console.log("scrollercache", scrollercache);
                    var cellsToAdd = [];
                    for (var i = 0; i < cellsNumberOriented; i++) {
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
                            var leftval =
                                indexLeftForward * (cellSizeOriented + props.gap * 2);
                            var topval = indexRowForward * (cellSizeOriented + props.gap * 2);

                            if (props.orientation === "horizontal") {
                                leftval = indexRowForward * (cellSizeOriented + props.gap * 2);
                                topval = indexLeftForward * (cellSizeOriented + props.gap * 2);
                            }

                            indexForward++;
                            indexLeftForward++;

                            if (indexLeftForward > cellsNumberOriented - 1) {
                                indexLeftForward = 0;
                                indexRowForward++;

                                // Create Row
                                CreateRow(topval);
                            }

                            cellsdata.value[cellsToAdd[i].index] = {
                                id: cellsToAdd[i].id
                            };

                            CreateCell(cellsToAdd[i].index, topval, leftval);
                        }
                    }

                    let rowRemoved = false;
                    for (var i = 0; i < cellsToAdd.length; i++) {
                        var _cell = cellsdata.value[indexBackward];
                        //container.removeChild(_cell.item);
                        delete cellsdata.value[indexBackward];
                        indexBackward++;
                        indexCacheBackward++;

                        if (!rowRemoved) {
                            if (_cell.item) {
                                if (_cell.item.parentElement.parentElement === container) {
                                    container.removeChild(_cell.item.parentElement);
                                }
                            } else {
                                console.log("!!!! _cell: ", _cell);
                            }

                            rowRemoved = true;
                        }
                    }

                    indexRowBackward++;
                    indexCacheRowBackward++;

                    for (var i = 0; i < cellsToAdd.length; i++) {
                        delete scrollercache[cellsToAdd[i].index];
                    }

                    cellsToAdd = [];
                } else {
                    // Add Items Backward
                    console.log("Add Cells Backward");
                    var cellsToAdd = [];
                    for (var i = 1; i <= cellsNumberOriented; i++) {
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
                            var leftval = (cellsNumberOriented - 1 - indexLeftBackward) * (cellSizeOriented + props.gap * 2);
                            var topval = indexRowBackward * (cellSizeOriented + props.gap * 2);

                            if (props.orientation === "horizontal") {
                                leftval = indexRowBackward * (cellSizeOriented + props.gap * 2);
                                topval = (cellsNumberOriented - 1 - indexLeftBackward) * (cellSizeOriented + props.gap * 2);
                            }

                            indexBackward--;
                            indexLeftBackward++;

                            if (indexLeftBackward > cellsNumberOriented - 1) {
                                indexLeftBackward = 0;
                                indexRowBackward--;

                                // Create Row
                                CreateRow(topval);
                            }

                            cellsdata.value[cellsToAdd[i].index] = {
                                id: cellsToAdd[i].id
                            };

                            CreateCell(cellsToAdd[i].index, topval, leftval);
                        }
                    }

                    let rowRemoved = false;
                    for (var i = 0; i < cellsToAdd.length; i++) {
                        var _cell = cellsdata.value[indexForward - 1];
                        //container.removeChild(_cell.item);
                        delete cellsdata.value[indexForward - 1];
                        indexForward--;
                        indexCacheForward--;
                        if (!rowRemoved) {
                            if (_cell.item.parentElement.parentElement === container) {
                                container.removeChild(_cell.item.parentElement);
                            }
                            rowRemoved = true;
                        }
                    }

                    indexRowForward--;
                    indexCacheRowForward--;

                    for (var i = 0; i < cellsToAdd.length; i++) {
                        if (cellsToAdd[i]) delete scrollercache[cellsToAdd[i].index];
                    }

                    cellsToAdd = [];
                }
            }
        } */

        function AddRow(_top, _left, _index, isForward) {
            /* var rowElement = document.createElement("div");
            rowElement.classList.add("scroller-row-v");
            rowElement.style.top = _top + "px";
            rowElement.style.left = "0px";
            rowElement.style.position = "absolute";
            rowElement.style.width = "calc(100% - " + 2 * props.gap + "px)";
            rowElement.style.marginLeft = props.gap + "px";
            rowElement.style.height = parseInt(cellSizeOriented + props.gap * 2) + "px";
            rowElement.style.backgroundColor = "#eaeaea";
            container.appendChild(rowElement);
            currentRowElement = rowElement; */

            /* var newobj = {
                index: _index,
                top: _top + "px",
                left: "0px",
                width: "calc(100% - " + 2 * props.gap + "px)",
                height: parseInt(cellSizeOriented + props.gap * 2) + "px",
                cells: {}
            }; */

            /* if(isForward)
            {
                alldata.value = {...alldata.value, [index]: newobj};
            } else {
                alldata.value = {[index]: newobj, ...alldata.value};
            } */

            let rowHeight = parseInt(cellSizeOriented + props.gap * 2) + "px";
            let rowWidth = "calc(100% - " + 2 * props.gap + "px)";

            if (props.orientation === "horizontal") {
                rowHeight = "calc(100% - " + 2 * props.gap + "px)";
                rowWidth = parseInt(cellSizeOriented + props.gap * 2) + "px";
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

            currentRowElement.cells[key] = {
                index: cellsdata.value[key].id,
                id: "item" + cellsdata.value[key].id,
                left: cellLeft + "px",
                flexbasis: (100 / cellsNumberOriented) + "%",
                top: cellTop + "px"
            };
        }

        /* function CreateCell(key, _top, _left) {
            var ComponentApp = createApp(VScrollerCell);

            // inserting to dom
            const cellElement = document.createElement("div");
            cellElement.classList.add("scroller-cell-v");
            cellElement.style.left = _left + "px";
            cellElement.style.flexBasis = (100 / cellsNumberOriented) + "%"
            ComponentApp.mount(cellElement);

            currentRowElement.appendChild(cellElement);

            cellsdata.value[key].item = cellElement;
        } */

        // alldata Way
        function GenerateInitialCells() {
            indexForward = Object.keys(cellsdata.value).reduce((key, v) =>
                cellsdata.value[v] < cellsdata.value[key] ? v : key
            );

            indexBackward = indexForward;
            indexRowForward = 0;
            indexRowBackward = -1;
            indexLeftForward = 0;

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
            let startPos = parseInt(parseInt(Object.keys(cellsdata.value).length / 2) / cellsNumberOriented) * (cellSizeOriented + props.gap * 2);
            translatePosition.value -= startPos;

            let isFirstRow = true;
            for (let key in cellsdata.value) {
                //let leftval = indexLeftForward * (cellSizeOriented + props.gap * 2);
                let leftval_row = 0;
                //let topval = indexRowForward * (cellSizeOriented + props.gap * 2);
                let topval_row = indexRowForward * calculatedRowSize.value;

                let leftval_cell = indexLeftForward * (cellSizeOriented + props.gap * 2);
                let topval_cell = 0;

                if (props.orientation === "horizontal") {
                    leftval_row = indexRowForward * calculatedRowSize.value;
                    topval_row = 0;
                    leftval_cell = 0;
                    topval_cell = indexLeftForward * (cellSizeOriented + props.gap * 2);
                }

                if (isFirstRow) {
                    /* alldata.value[indexRowForward] = {
                        top: topval + "px",
                        left: "0px",
                        width: "calc(100% - " + 2 * props.gap + "px)",
                        height: parseInt(cellSizeOriented + props.gap * 2) + "px",
                        cells: {}
                    }; */
                    AddRow(topval_row, leftval_row, indexRowForward, true);
                    //currentRowElement = alldata.value[indexRowForward];
                    //CreateRow(topval);
                    indexLeftForward = 0;
                    indexRowForward++;
                    isFirstRow = false;
                }

                if (indexLeftForward > cellsNumberOriented - 1) {
                    //CreateRow(topval);
                    /* alldata.value[indexRowForward] = {
                        top: topval + "px",
                        left: "0px",
                        width: "calc(100% - " + 2 * props.gap + "px)",
                        height: parseInt(cellSizeOriented + props.gap * 2) + "px",
                        cells: {}
                    }; */
                    AddRow(topval_row, leftval_row, indexRowForward, true);
                    //currentRowElement = alldata.value[indexRowForward];
                    indexLeftForward = 0;
                    indexRowForward++;
                }

                //CreateCell(key, topval, leftval);

                if (currentRowElement) {
                    if (!currentRowElement.cells[key]) {
                        AddCell(topval_cell, leftval_cell, key);
                        /* currentRowElement.cells[key] = {
                            index: cellsdata.value[key].id,
                            id: "item" + cellsdata.value[key].id,
                            left: leftval + "px",
                            flexbasis: (100 / cellsNumberOriented) + "%",
                            top: topval
                        }; */
                    }
                }

                indexForward++;
                indexLeftForward++;
            }

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

            console.log(alldata.value);
        }

        function GenerateInitialCellsOLD() {
            // GET indexForward lowest value
            console.log(cellsdata.value);
            indexForward = Object.keys(cellsdata.value).reduce((key, v) =>
                cellsdata.value[v] < cellsdata.value[key] ? v : key
            );

            indexBackward = indexForward;
            indexRowForward = 0;
            indexRowBackward = -1;
            indexLeftForward = 0;

            cellSizeOriented = cellHeightVal.value;
            cellsNumberOriented = props.numberOfColumns;

            if (props.orientation === "horizontal") {
                cellSizeOriented = cellWidthVal.value;
                cellsNumberOriented = props.numberOfRows;
            }

            // In order have cells visible at the back of the scroller
            // set Position at the half of the cells size
            let startPos = parseInt(parseInt(Object.keys(cellsdata.value).length / 2) / cellsNumberOriented) * (cellSizeOriented + props.gap * 2);
            translatePosition.value -= startPos;

            let isFirstRow = true;
            for (let key in cellsdata.value) {
                let leftval = indexLeftForward * (cellSizeOriented + props.gap * 2);
                let topval = indexRowForward * (cellSizeOriented + props.gap * 2);

                if (props.orientation === "horizontal") {
                    leftval = indexRowForward * (cellSizeOriented + props.gap * 2);
                    topval = indexLeftForward * (cellSizeOriented + props.gap * 2);
                }

                if (isFirstRow) {
                    //CreateRow(topval);
                    indexLeftForward = 0;
                    indexRowForward++;
                    isFirstRow = false;
                }

                if (indexLeftForward > cellsNumberOriented - 1) {
                    //CreateRow(topval);
                    indexLeftForward = 0;
                    indexRowForward++;
                }

                //CreateCell(key, topval, leftval);

                indexForward++;
                indexLeftForward++;
            }

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
        };

        window.addEventListener("resize", (e) => {
            if (props.cellSquared) {
                // TODO: Redraw table at position
                // alldata
                //let copied_alldata = JSON.parse(JSON.stringify(alldata.value));
                if (Object.keys(alldata.value).length > 0) resizeWindowData = Object.assign({}, alldata.value);
                alldata.value = {};
                calculatedRowSize.value = viewport.clientWidth / cellsNumberOriented;
                if (props.orientation === "horizontal") {
                    calculatedRowSize.value = viewport.clientHeight / cellsNumberOriented;
                }

                clearTimeout(resizeWindowTimeout);

                resizeWindowTimeout = setTimeout(() => {
                    alldata.value = resizeWindowData;
                    //console.log(resizeWindowData);
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
                }
            });

            document.addEventListener("mouseup", (e) => {
                mouseDown = false;
                mouseMoving = false;

                if (Math.abs(velocityCurrent) > maxVelocity)
                    velocityCurrent = maxVelocity * Math.sign(velocityCurrent);

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
