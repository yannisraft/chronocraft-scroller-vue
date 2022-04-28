<template>
<div :id="scrollerId" class="scroller noselect">
    <div :id="viewportId" class="scroller-viewport" :style="{width: '100%'}">
        <div :id="containerId" class="scroller-container" :style="[{ 'height': GetContainerHeight()}]">

        </div>
    </div>
    <VScrollerScrollBar :active="hasScrollbar" :mode="isInfinite ? 'infinite' : 'normal'" @onChange="OnScrollBarChanged" @onBackwardsClicked="onBackwardsClicked"  @onForwardClicked="onForwardClicked" :viewportId="viewportId" />
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
    watch
} from "vue";

import VScrollerScrollBar from './VScrollerScrollBar';

export default defineComponent({
    name: "VScroller",
    components: {
        VScrollerScrollBar
    },
    props: {
        modelValue: {
            type: Array,
            default: () => {
                return []
            }
        },
        height: {
            type: Number,
            default: -1
        },
        orientation: {
            type: String,
            default: "vertical",
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
            default: true,
        },
        scrollSpeed: {
            type: Number,
            default: 6
        },
        isInfinite: {
            type: Boolean,
            default: false,
        },
        hasScrollbar: {
            type: Boolean,
            default: true,
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
        const cellsdata = ref(props.modelValue);
        const cells = ref([]);
        const divs = ref([]);
        let viewportWidth = ref("100%");
        let scrollbarPosition = ref(0);
        

        // ---- Attributes        
        let translatePositionPrevious = translatePosition.value;
        const loadedCells = 75;
        const indexInitial = 1000;
        let indexForward = indexInitial;
        let indexBackward = indexInitial - 1;
        let indexTopForward = 0;
        let indexTopBackward = 0;
        let indexLeftForward = 0;
        let indexLeftBackward = 0;
        let momentumID = "";
        let velocityCurrent = 0;
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
            if(newvalue <= 30 || newvalue > 70)
            {
                finalScrollSpeed = props.scrollSpeed * 3;
            }

            scrolldirection = 0;
            if(newvalue < 50)
            {
                // Move Backwards
                scrolldirection = -1;
            } else if(newvalue > 50) {
                // Move Forward
                scrolldirection = 1;
            }

            if(scrolldirection !== 0)
            {
                if(scrollInterval === null)
                {
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
                let direction = 1;
                if (translatePosition.value > translatePositionPrevious) {
                    direction = -1;
                }

                DetectEdges(direction);
                translatePositionPrevious = translatePosition.value;
            }
        }

        function DetectEdges(direction) {
            if (viewport) {
                var viewportHeight = viewport.clientHeight;
                var cellSizeOriented = cellHeight.value;
                if (props.orientation === 'horizontal') cellSizeOriented = cellWidth.value;

                var diff = 0;
                if (direction === -1) { // Backwards
                    diff = (-indexTopBackward * (cellSizeOriented + props.gap * 2)) - (translatePosition.value + 300);
                    if (diff < -(cellSizeOriented + props.gap * 2)) {
                        UpdateCells(direction, cellSizeOriented);
                        indexTopForward--;
                    }
                } else { // Forward
                    diff = (indexTopForward * (cellSizeOriented + props.gap * 2)) + translatePosition.value - viewportHeight;
                    if (diff < 0) {
                        UpdateCells(direction, cellSizeOriented);
                        indexTopBackward++;
                        //console.log("diff: ", diff);                        
                    }
                }
            }
        }

        function UpdateCells(direction, cellSizeOriented) {
            if (direction === 1) {
                // Add Cells Forward
                let cellsNumberOriented = props.numberOfColumns;
                if (props.orientation === 'horizontal') cellsNumberOriented = props.numberOfRows;

                for (var i = 1; i <= cellsNumberOriented; i++) {
                    var leftval = indexLeftForward * (cellSizeOriented + props.gap * 2);
                    var topval = indexTopForward * (cellSizeOriented + props.gap * 2);

                    if (props.orientation === 'horizontal') {
                        leftval = indexTopForward * (cellSizeOriented + props.gap * 2);
                        topval = indexLeftForward * (cellSizeOriented + props.gap * 2);
                    }

                    var item = document.createElement("div");
                    item.id = "item" + indexForward;
                    item.classList.add("scroller-cell-v");
                    item.style.left = leftval + "px";
                    item.style.top = topval + "px";
                    item.style.backgroundColor = "#9eadc7";
                    item.innerHTML = indexForward;
                    container.appendChild(item);
                    cells.value.push(item);

                    indexForward++;
                    indexLeftForward++;

                    if (indexLeftForward > cellsNumberOriented - 1) {
                        indexLeftForward = 0;
                        indexTopForward++;
                    }

                }

                // Remove Cells Backwards
                for (var i = 0; i < cellsNumberOriented; i++) {
                    var _cell = cells.value[i];
                    container.removeChild(_cell);
                    indexBackward++;
                }

                cells.value.splice(0, cellsNumberOriented);
            } else {
                // Add Items Backward
                let cellsNumberOriented = props.numberOfColumns;
                if (props.orientation === 'horizontal') cellsNumberOriented = props.numberOfRows;

                for (var i = 1; i <= cellsNumberOriented; i++) {
                    var leftval = (cellsNumberOriented - 1 - indexLeftBackward) * (cellSizeOriented + props.gap * 2);
                    var topval = indexTopBackward * (cellSizeOriented + props.gap * 2);

                    if (props.orientation === 'horizontal') {
                        leftval = indexTopBackward * (cellSizeOriented + props.gap * 2);
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
                        indexTopBackward--;
                    }

                }

                for (var i = 0; i < cellsNumberOriented; i++) {
                    var _cell = cells.value[cells.value.length - i - 1];
                    container.removeChild(_cell);
                    indexForward--;
                }

                cells.value.splice(cells.value.length - cellsNumberOriented, cells.value.length);
            }
        }

        function GenerateInitialCells() {
            indexTopForward = 0;
            indexTopBackward = -1;
            indexLeftForward = 0;

            var cellSizeOriented = cellHeight.value;
            let cellsNumberOriented = props.numberOfColumns;

            if (props.orientation === 'horizontal') {
                cellSizeOriented = cellWidth.value;
                cellsNumberOriented = props.numberOfRows;
            }

            for (let i = 0; i < loadedCells; i++) {
                let leftval = indexLeftForward * (cellSizeOriented + props.gap * 2);
                let topval = indexTopForward * (cellSizeOriented + props.gap * 2);

                if (props.orientation === 'horizontal') {
                    leftval = indexTopForward * (cellSizeOriented + props.gap * 2);
                    topval = indexLeftForward * (cellSizeOriented + props.gap * 2);
                }

                var item = document.createElement("div");
                item.id = "item" + indexForward;
                item.classList.add("scroller-cell-v");
                item.innerHTML = indexForward;
                item.style.left = leftval + "px";
                item.style.top = topval + "px";
                container.appendChild(item);
                cells.value.push(item);

                indexForward++;
                indexLeftForward++;
                if (indexLeftForward > cellsNumberOriented - 1) {
                    indexLeftForward = 0;
                    indexTopForward++;
                }
            }

            container.style.transform = "translate" + translatePositionString + "(" + translatePosition.value + "px)";
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

        // ---- Lifecycle Hooks
        onMounted(() => {
            container = document.getElementById(containerId.value);
            viewport = document.getElementById(viewportId.value);

            // Add Container Events after its creation
            viewport.addEventListener("mousedown", (e) => {
                console.log("mousedown");
                mouseDown = true;
                dragScrollStartPosition = translatePosition.value;
                dragScrollPreviousPosition = e.pageY;
                mouseDownStartPosition = e.pageY;
                if (props.orientation === 'horizontal') {
                    mouseDownStartPosition = e.pageX;
                }
            });

            viewport.addEventListener("mouseup", (e) => {
                console.log("mouseup");
                mouseDown = false;
                mouseMoving = false;

                BeginMomentumTracking();
            });

            viewport.addEventListener("mousemove", (e) => {
                if (!mouseDown) return;

                e.preventDefault();
                mouseMoving = true;

                console.log("mousemove");
                let moveSpeed = 1;
                var walk = e.pageY - dragScrollPreviousPosition;
                velocityCurrent = walk;
                translatePosition.value += walk * moveSpeed;
                dragScrollPreviousPosition = e.pageY;
            });

            viewport.addEventListener("mouseleave", (e) => {
                mouseDown = false;
            });

            // Setup
            GenerateInitialCells();

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
