<template>
<div :id="scrollerId" class="scroller">
    <div :id="viewportId" class="scroller-viewport">
        <div :id="containerId" class="scroller-container" :style="[{ 'height': GetContainerHeight()}]">

        </div>
    </div>
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

export default defineComponent({
    name: "VScroller",
    components: {},
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
            default: 4
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
        wheelScrollSpeed: {
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

        // ---- Attributes        
        let translatePositionPrevious = translatePosition.value;
        const loadedCells = 75;
        const indexInitial = 1000;
        let indexForward = indexInitial;
        let indexBackward = indexInitial;
        let indexTopForward = 0;
        let indexTopBackward = 0;
        let indexLeft = 0;
        let momentumID = "";
        let velocityCurrent = 0;
        const velocityMomentum = 0.97;
        let timeSinceLastScroll = 0;
        let container = null;
        let viewport = null;

        // ---- Methods Public
        function GetContainerHeight() {
            let finalHeight = props.height + "px";
            if (props.height === -1) {
                finalHeight = "100%";
            }
            return finalHeight;
        }

        // ---- Methods Private
        function AnimateScroller() {
            if (container) {
                container.style.transform = "translateY(" + translatePosition.value + "px)";
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
                var diff = -indexTopBackward;// * (cellHeight.value + props.gap*2) - translatePosition.value - 300;
                /* if (direction === -1) {
                    if (diff > cellHeight.value) {
                        var times = parseInt(diff / cellHeight.value);
                    }
                } else {

                } */
                console.log("indexTopBackward: ", indexTopBackward);
                //console.log("diff: ", diff);

                if (Math.abs(diff) > cellHeight.value) {
                   UpdateCells(direction);
                }
            }
        }

        function UpdateCells(direction) {
            if (direction === 1) {
                // Add Cells Forward
                for (var i = 1; i <= props.numberOfColumns; i++) {
                    console.log("ADD FORWARD");
                    var leftval = indexLeft * (cellWidth.value + props.gap*2);
                    var topval = indexTopForward * (cellHeight.value + props.gap*2);

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
                    indexLeft++;
                    if (indexLeft > props.numberOfColumns - 1) {
                        indexLeft = 0;
                        indexTopForward++;
                    }
                }

                // Remove Cells Backwards
                for (var i = 0; i < props.numberOfColumns; i++) {
                    var _cell = cells.value[i];
                    container.removeChild(_cell);
                    indexBackward++;
                }
                indexTopBackward++;
                cells.value.splice(0, props.numberOfColumns);
            } else {
                // Add Items Backward                
                for (var i = 1; i <= props.numberOfColumns; i++) {
                    var leftval = indexLeft * (cellWidth.value + props.gap*2);
                    var topval = indexTopBackward * (cellHeight.value + props.gap*2);

                    var item = document.createElement("div");
                    item.id = "item" + indexBackward;
                    item.classList.add("scroller-cell-v");
                    item.style.left = leftval + "px";
                    item.style.top = topval + "px";
                    item.style.backgroundColor = "#a5c79e";
                    item.innerHTML = indexBackward;
                    cells.value.prepend(item);
                    this.items.unshift(item);

                    indexBackward--;
                    indexLeft++;
                    if (indexLeft > props.numberOfColumns - 1) {
                        indexLeft = 0;
                        indexTopBackward--;
                    }
                }

                for (var i = 0; i < props.numberOfColumns; i++) {
                    var _cell = cells.value[cells.value.length - i - 1];
                    container.removeChild(_cell);
                    indexForward--;
                }
                indexTopForward--;
                cells.value.splice(cells.value.length - props.numberOfColumns, cells.value.length);
            }
        }

        function GenerateInitialCells() {
            indexTopForward = 0;
            indexTopBackward = 0;
            indexLeft = 0;

            for (let i = 0; i < loadedCells; i++) {
                let leftval = indexLeft * (cellWidth.value + props.gap*2);
                let topval = indexTopForward * (cellHeight.value + props.gap*2);                

                var item = document.createElement("div");
                item.id = "item" + indexForward;
                item.classList.add("scroller-cell-v");
                item.innerHTML = indexForward;
                item.style.left = leftval + "px";
                item.style.top = topval + "px";
                container.appendChild(item);
                cells.value.push(item);

                indexForward++;
                indexLeft++;
                if (indexLeft > props.numberOfColumns - 1) {
                    indexLeft = 0;
                    indexTopForward++;
                }
            }

            container.style.transform = "translateY(" + translatePosition.value + "px)";
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
            let finalScrollSpeed = props.wheelScrollSpeed;
            if (timediff < 10) {
                finalScrollSpeed = props.wheelScrollSpeed * 3;
            }

            const direction = Math.sign(e.deltaY);
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

            // Methods Public
            GetContainerHeight
        };
    }
});
</script>

<style lang="css">
@import "./scroller.css";
</style>
