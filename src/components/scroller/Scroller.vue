<template>
<div class="scroller-container" :style="[{ 'height': height + 'px'}]">
    <div :id="scrollerid" :class="['scroller', orientation === 'vertical' ? 'vertical-scroller' : 'horizontal-scroller' ]" :style="[{ 'height': height + 'px'}, {'overflow-x': GetOverflowX()+' !important', 'overflow-y': GetOverflowY()+' !important'}]">

        <div :class="['scroller-content', orientation === 'vertical' ? 'vertical-container' : 'horizontal-container', {'animate-next': (animatedirection === 1)}, {'animate-previous': (animatedirection === -1)} ]" :style="[{ 'gap': gap + 'px'}, { 'padding': contentpadding + 'px'} ]">
            <slot name="content">
                <div v-for="datacell in cellsdata" :id="'cell_'+datacell.id" ref="cellRef" :key="datacell.id" :class="['scroller-cell', orientation === 'vertical' ? 'vertical-cell' : 'horizontal-cell', datacell.debug ? 'debugcellstyle' : '']" :style="{ 'flex-basis': cellFlexBasis, 'height': cellH, 'width': cellW, 'z-index': datacell.index}">
                    <slot name="cell" :data="datacell">
                        <span class="cell-text">{{ datacell.id }}</span>
                    </slot>
                </div>
            </slot>
        </div>
    </div>
    <div class="overlay">
        <slot name="overlay">

        </slot>
    </div>
    <div :class="['preload-overlay', 'noselect',{'preloadvisible': preloadvisible}]">
        <div class="preloaderimg"></div>
    </div>
    <div class="alert-overlay" v-if="alertvisible">
        <h3>{{ alerttext }}</h3>
    </div>
</div>
</template>

<script>
import {
    defineComponent,
    ref,
    reactive,
    onBeforeMount,
    onMounted,
    onActivated,
    onUpdated,
    watch
} from "vue";

export default defineComponent({
    name: "Scroller",
    components: {},
    props: {
        modelValue: {
            type: Array,
            default: () => {
                return []
            }
        },
        orientation: {
            type: String,
            default: "vertical",
        },
        height: {
            type: Number,
            default: 400
        },
        numcols: {
            type: Number,
            default: 4
        },
        numrows: {
            type: Number,
            default: 4
        },
        gap: {
            type: Number,
            default: 10
        },
        contentpadding: {
            type: Number,
            default: 10
        },
        cellheight: {
            type: Number,
            default: 100
        },
        cellwidth: {
            type: Number,
            default: 100
        },
        cellsquared: {
            type: Boolean,
            default: true,
        },
        wheelscrollspeed: {
            type: Number,
            default: 6
        },
        newcellslength: {
            type: Number,
            default: 10
        },
        manualmode: {
            type: Boolean,
            default: false,
        },
        static: {
            type: Boolean,
            default: false,
        },
        hasscrollbar: {
            type: Boolean,
            default: true,
        },
        animatescroll: {
            type: Number,
            default: 0
        }
    },
    setup(props, context) {
        let cellW = ref(props.cellwidth + "px");
        let cellH = ref(props.cellheight + "px");
        let cellFlexBasis = ref("100%");
        let scroller = null;
        const cellRef = ref(null);

        let veloc = 0;
        let momentumID = 0;
        let velocity = 0.97;
        let isMouseDown = false;
        let startPos;
        let startscrollPos;
        let movescrollPos;
        let scrollerMoving = false;
        let previousPos = 0;
        let previousScrollPos = 0;
        let scrollbarWidth = 0;
        let justLoaded = false;
        let scrollLoadingOffset = 200;
        let loadingCells = false;
        let alertvisible = ref(false);
        let preloadvisible = ref(false);
        let alerttext = ref("");
        let dirsign = 1;
        let inczindex = 10000000; // Incremental z-index
        let animatedirection = ref(0);
        let scrollerid = "scroller_"+(Math.floor(Math.random() * 999999)+1000000);

        const cellsdata = ref(props.modelValue);

        function GetOverflowX() {
            let overflowx = 'hidden';
            if (props.orientation === 'horizontal') {
                if (props.hasscrollbar) {
                    overflowx = 'auto';
                }
            }
            return overflowx;
        }

        function GetOverflowY() {
            let overflowy = 'hidden';
            if (props.orientation === 'vertical') {
                if (props.hasscrollbar) {
                    overflowy = 'auto';
                }
            }
            return overflowy;
        }

        function momentumLoop() {
            if (props.orientation === 'vertical') {
                scroller.scrollTop += veloc;
            } else {
                scroller.scrollLeft += veloc;
            }

            veloc *= velocity;
            if (Math.abs(veloc) > 0.5) {
                momentumID = requestAnimationFrame(momentumLoop);
            }
        }

        function cancelMomentumTracking() {
            cancelAnimationFrame(momentumID);
        }

        function beginMomentumTracking() {
            cancelMomentumTracking();
            momentumID = requestAnimationFrame(momentumLoop);
        }

        function getScrollbarWidth() {
            var div, width = getScrollbarWidth.width;
            if (props.hasscrollbar) {
                if (width === undefined) {
                    div = document.createElement('div');
                    div.innerHTML = '<div style="width:50px;height:50px;position:absolute;left:-50px;top:-50px;overflow:auto;"><div style="width:1px;height:100px;"></div></div>';
                    div = div.firstChild;
                    document.body.appendChild(div);
                    width = getScrollbarWidth.width = div.offsetWidth - div.clientWidth;
                    document.body.removeChild(div);
                }
            } else {
                width = 0;
            }

            return width;
        }

        function GenerateNextData(newdata) {
            // For each of the data set the index
            inczindex -= cellsdata.value.length - 1;
            for (let i = 0; i < newdata.length; i++) {
                newdata[i].index = inczindex - i;
            }

            // Add new data
            cellsdata.value = [...cellsdata.value, ...newdata];

            // Remove Last n Cells where n=newdata.length
            //
            cellsdata.value.splice(0, newdata.length);

            oncellsdataChange();

            let cell = document.querySelector(".scroller-cell");
            if (cell) {
                let cellheight = cell.offsetHeight + props.gap;
                let cellwidth = cell.offsetWidth + props.gap;

                var diff = 0;
                var targetPosition = 0;
                if (props.orientation === 'vertical') {
                    var colsloaded = parseInt(newdata.length / props.numcols);
                    targetPosition = previousScrollPos; // - (cellheight * colsloaded);
                    scroller.scrollTop = targetPosition;

                    diff = previousScrollPos - movescrollPos;
                    movescrollPos = targetPosition - diff;
                } else {
                    var rowsloaded = parseInt(newdata.length / props.numrows);
                    targetPosition = previousScrollPos - (cellwidth * rowsloaded);
                    scroller.scrollLeft = targetPosition;

                    diff = previousScrollPos - movescrollPos;
                    movescrollPos = targetPosition - diff;
                }
            }

            setTimeout(() => {
                loadingCells = false;
            }, 400);

            //context.emit("on-data-updated", JSON.parse(JSON.stringify(cellsdata.value)));
        }

        function GeneratePreviousData(newdata) {
            // For each of the data set the index
            /* for (let i = newdata.length - 1; i > 0; i--) {
                inczindex++;
                newdata[i].index = inczindex;
            } */
            for (let i = 0; i < newdata.length; i++) {
                newdata[i].index = inczindex + newdata.length - i;
            }
            inczindex += newdata.length - 1;

            // Add new data
            cellsdata.value = [...newdata, ...cellsdata.value];

            // Remove Last n Cells where n=newdata.length
            //
            cellsdata.value.splice(cellsdata.value.length - newdata.length, cellsdata.value.length - 1);

            oncellsdataChange();

            let cell = document.querySelector(".scroller-cell");
            if (cell) {
                let cellheight = cell.offsetHeight + props.gap;
                let cellwidth = cell.offsetWidth + props.gap;

                var diff = 0;
                var targetPosition = 0;
                if (props.orientation === 'vertical') {
                    var colsloaded = Math.floor(newdata.length / props.numcols);

                    if (previousScrollPos === 0) {
                        targetPosition = (cellheight * colsloaded);

                        setTimeout(() => {
                            scroller.scrollTop = targetPosition;
                        }, 0);
                    } else {
                        targetPosition = previousScrollPos;
                        scroller.scrollTop = targetPosition;
                    }

                    diff = previousScrollPos - movescrollPos;
                    movescrollPos = targetPosition - diff;
                } else {
                    var rowsloaded = parseInt(newdata.length / props.numrows);
                    targetPosition = previousScrollPos + (cellwidth * rowsloaded);
                    scroller.scrollLeft = targetPosition;

                    diff = previousScrollPos - movescrollPos;
                    movescrollPos = targetPosition - diff;
                }
            }

            setTimeout(() => {
                loadingCells = false;
            }, 400);

            //context.emit("on-data-updated", JSON.parse(JSON.stringify(cellsdata.value)));
        }

        async function detectScrollEdges(sign, dragging, e) {
            // Detect Scroll on Edges
            // ----------------------
            if (sign === 1) {
                if (props.orientation === 'vertical') {
                    if (scroller.scrollTop + scroller.offsetHeight >=
                        scroller.scrollHeight - scrollLoadingOffset) {

                        if (!loadingCells && !justLoaded) {

                            if (cellsdata.value) {
                                loadingCells = true;
                                var firstid = cellsdata.value[0].id;
                                var lastid = cellsdata.value[cellsdata.value.length - 1].id;
                                context.emit("on-update-data-next", (newdata) => {
                                    GenerateNextData(newdata);
                                }, firstid, lastid);
                            }
                        }
                    }
                } else {
                    if (scroller.scrollLeft + scroller.offsetWidth >=
                        scroller.scrollWidth - scrollLoadingOffset || scroller.scrollLeft === (scroller.scrollWidth - scroller.clientWidth)) {
                        if (!loadingCells && !justLoaded) {
                            if (cellsdata.value) {
                                loadingCells = true;
                                var firstid = cellsdata.value[0].id;
                                var lastid = cellsdata.value[cellsdata.value.length - 1].id;
                                context.emit("on-update-data-next", (newdata) => {
                                    setTimeout(() => {
                                        GenerateNextData(newdata);
                                    }, 10);
                                }, firstid, lastid);
                            }
                        }
                    }
                }
            }

            if (sign === -1) {
                if (props.orientation === 'vertical') {
                    if (scroller.scrollTop < scrollLoadingOffset) {
                        if (!loadingCells && !justLoaded) {
                            if (cellsdata.value) {
                                loadingCells = true;
                                var firstid = cellsdata.value[0].id;
                                var lastid = cellsdata.value[cellsdata.value.length - 1].id;
                                context.emit("on-update-data-previous", (newdata) => {
                                    // done
                                    GeneratePreviousData(newdata);
                                }, firstid, lastid);
                            }
                        }
                    }
                } else {
                    if (scroller.scrollLeft < scrollLoadingOffset) {
                        if (!loadingCells && !justLoaded) {
                            if (cellsdata.value) {
                                loadingCells = true;
                                var firstid = cellsdata.value[0].id;
                                var lastid = cellsdata.value[cellsdata.value.length - 1].id;
                                context.emit("on-update-data-previous", (newdata) => {
                                    // done
                                    setTimeout(() => {
                                        GeneratePreviousData(newdata);
                                    }, 10);
                                }, firstid, lastid);
                            }
                        }
                    }
                }
            }
        }

        function GetTotalVisibleCells() {
            let cell = document.querySelector(".scroller-cell");

            if (cell) {
                let cellheight = cell.offsetHeight + props.gap;
                let cellwidth = cell.offsetWidth + props.gap;
                scroller = document.querySelector("#"+scrollerid);

                var totalVisibleCells = 0;
                if (props.orientation === 'vertical') {
                    var totalH = scroller.offsetHeight;
                    var totalCellsAtY = totalH / cellheight;
                    totalVisibleCells = parseInt(Math.round(totalCellsAtY) * props.numcols);
                } else {
                    // Calculate the total visible cells
                    var totalW = scroller.offsetWidth;
                    var totalCellsAtX = totalW / cellwidth;
                    totalVisibleCells = parseInt(Math.round(totalCellsAtX) * props.numrows);
                }

                var minimumRequiredInitialCells = totalVisibleCells + 3 * props.newcellslength;

                // The Minimum Initial Loading Cells should Be:
                // The ( Total visible cells ) + ( New cells added each time) * 3
                // Otherwise the scrolling will not be working correctly

                if (!props.static) {
                    if (minimumRequiredInitialCells > cellsdata.value.length) {
                        console.log("Error: Minimum Cells Required to load at start should be: ", minimumRequiredInitialCells);

                        alertvisible.value = true;
                        alerttext.value = "Error: Minimum Cells Required to load at start should be: " + minimumRequiredInitialCells + ". This value is relevant to the scroller width and to the number of new cells added each time.";
                    }
                }

            }

        }

        function ScrollTo(position) {
            if (typeof position === 'number') {
                if (props.orientation === 'vertical') {
                    scroller.scrollTo({
                        top: position,
                        left: 0,
                        behavior: "smooth",
                    });
                } else {
                    scroller.scrollTo({
                        top: 0,
                        left: position,
                        behavior: "smooth",
                    });
                }
            }
        }

        function ScrollBy(position) {
            if (typeof position === 'number') {
                if (props.orientation === 'vertical') {
                    scroller.scrollBy({
                        top: position,
                        left: 0,
                        behavior: "smooth",
                    });
                } else {
                    scroller.scrollBy({
                        top: 0,
                        left: position,
                        behavior: "smooth",
                    });
                }
            }
        }

        function GetCellsPosition(id) {
            var foundcell_position = -1;
            var foundcell = null;
            for (var k = 0; k < cellsdata.value.length; k++) {
                if (cellsdata.value[k]) {
                    if (cellsdata.value[k].id === id) {
                        foundcell = cellsdata.value[k];
                        var cellid = "cell_" + cellsdata.value[k].id;
                        var cellelement = document.getElementById(cellid);
                        var cellboundingrect = cellelement.getBoundingClientRect();

                        var content = document.querySelector(".scroller-content");

                        if (props.orientation === 'vertical') {
                            var contentpadding = parseInt(content.style.paddingTop);
                            foundcell_position = cellelement.offsetTop - contentpadding + props.gap;
                        } else {
                            var contentpadding = parseInt(content.style.paddingRight);
                            foundcell_position = parseInt(cellboundingrect.left - props.gap - contentpadding);
                        }
                        break;
                    }
                }
            }

            return foundcell_position;
        }

        function ScrollToCell(id) {
            var cell_posotion = GetCellsPosition(id);
            ScrollTo(cell_posotion);
        }

        /* function TestCell(id) {
            if(id === 10000)
            {
                console.log("id: ", id);
            }            
        } */

        function Initialize() {
            scroller = document.querySelector("#"+scrollerid);
            scrollbarWidth = getScrollbarWidth();

            var totalgap = 0;
            var totalgappercent = 0;

            var newCellW = 0;
            var newCellH = 0;
            if (props.orientation === 'vertical') {
                totalgap = (props.numcols - 1) * props.gap + scrollbarWidth;
                totalgappercent = totalgap / scroller.offsetWidth * 100;

                newCellW = (scroller.offsetWidth - totalgap - props.contentpadding * 2) / props.numcols;
                cellW.value = String(newCellW + '%');

                cellFlexBasis.value = String(newCellW + 'px');

                if (props.cellsquared) {
                    newCellH = (scroller.clientWidth - totalgap - props.contentpadding * 2) / props.numcols;
                    cellH.value = newCellH + "px";
                }
            } else {
                totalgap = (props.numrows - 1) * props.gap + scrollbarWidth;
                totalgappercent = totalgap / scroller.offsetHeight * 100;

                newCellH = (scroller.offsetHeight - totalgap - props.contentpadding * 2) / props.numrows;

                //var newCellFlexBasis = ((100 - totalgappercent) / props.numrows);
                var newCellFlexBasis = (scroller.offsetHeight - totalgap - props.contentpadding * 2) / props.numrows;

                cellH.value = String(newCellH + 'px');
                //cellFlexBasis.value = String(newCellFlexBasis + '%');
                cellFlexBasis.value = String(newCellFlexBasis + 'px');

                if (props.cellsquared) {
                    newCellW = newCellH;
                    cellW.value = newCellW + "px";
                }
            }

            // ---- Add Scroller Events ----
            scroller.addEventListener("mousedown", (e) => {
                isMouseDown = true;
                scroller.classList.add("active");

                if (props.orientation === 'vertical') {
                    startPos = e.pageY - scroller.offsetTop;
                    startscrollPos = e.pageY;
                    movescrollPos = scroller.scrollTop;
                    previousPos = e.clientY;
                } else {
                    startPos = e.pageX - scroller.offsetLeft;
                    startscrollPos = e.pageX;
                    movescrollPos = scroller.scrollLeft;
                    previousPos = e.clientX;
                }

                cancelMomentumTracking();
            });

            scroller.addEventListener("mouseleave", () => {
                isMouseDown = false;
                scroller.classList.remove("active");
            });

            var _context = context;
            scroller.addEventListener("mouseup", (e) => {
                isMouseDown = false;
                scrollerMoving = false;
                scroller.classList.remove("active");
                beginMomentumTracking();

                var scrolldiff = 0;

                if (props.orientation === 'vertical') {
                    scrolldiff = startscrollPos - e.pageY;
                } else {
                    scrolldiff = startscrollPos - e.pageX;
                }

                if (Math.abs(scrolldiff) > 10) {
                    context.emit("on-scroll");
                }
            });

            scroller.addEventListener("mousemove", (e) => {
                if (!isMouseDown) return;

                e.preventDefault();
                scrollerMoving = true;

                var pos = 0;
                var walk = 0;
                var prevscrollPos = 0;

                if (props.orientation === 'vertical') {
                    pos = e.pageY - scroller.offsetTop;
                    walk = (pos - startPos) * 2; //scroll-fast

                    prevscrollPos = scroller.scrollTop;
                    scroller.scrollTop = movescrollPos - walk;
                    veloc = scroller.scrollTop - prevscrollPos;
                    scroller.scrollTop = movescrollPos - walk;
                } else {
                    pos = e.pageX - scroller.offsetLeft;
                    walk = (pos - startPos) * 2; //scroll-fast

                    prevscrollPos = scroller.scrollLeft;
                    scroller.scrollLeft = movescrollPos - walk;
                    veloc = scroller.scrollLeft - prevscrollPos;
                    scroller.scrollLeft = movescrollPos - walk;
                }

                //UpdateCurrentMonth();
            });

            scroller.addEventListener("wheel", (e) => {
                cancelMomentumTracking();

                if (props.orientation === 'vertical') {
                    const deltaY = Math.sign(e.deltaY);
                    const walk = deltaY * props.wheelscrollspeed;

                    const prevscrollTop = scroller.scrollTop;
                    scroller.scrollTop += walk;
                    veloc = scroller.scrollTop - prevscrollTop;
                } else {
                    const deltaX = Math.sign(e.deltaY);
                    const walk = deltaX * props.wheelscrollspeed;

                    const prevscrollLeft = scroller.scrollLeft;
                    scroller.scrollLeft += walk;
                    veloc = scroller.scrollLeft - prevscrollLeft;

                    if (scroller.scrollLeft === (scroller.scrollWidth - scroller.clientWidth)) {
                        //var dirsign = 1;
                        //var delta = 0;
                        //dirsign = parseInt(delta / Math.abs(delta));
                        //detectScrollEdges(dirsign, false, e);
                    }
                }

                context.emit("on-scroll");
                beginMomentumTracking();
            });

            scroller.addEventListener("scroll", (e) => {
                var delta = 0;
                ///var dirsign = 1;

                if (props.orientation === 'vertical') {
                    let scroll = scroller.scrollTop;
                    delta = scroll - previousScrollPos;
                    if (delta != 0) dirsign = parseInt(delta / Math.abs(delta));

                    //detectScrollEdges(dirsign, false, e);
                    previousScrollPos = scroll;
                } else {
                    let scroll = scroller.scrollLeft;
                    delta = scroll - previousScrollPos;
                    if (delta != 0) dirsign = parseInt(delta / Math.abs(delta));
                    //detectScrollEdges(dirsign, false, e);
                    previousScrollPos = scroll;
                }
            });

            if (!props.static) {
                var detectEdgesInterval = setInterval(() => {
                    var delta = 0;

                    if (props.orientation === 'vertical') {
                        detectScrollEdges(dirsign, false);
                    } else {
                        detectScrollEdges(dirsign, false);
                    }
                }, 200);

                var scrollPosInterval = setInterval(() => {

                    if (props.orientation === 'vertical') {
                        let scroll = scroller.scrollTop;
                        previousScrollPos = scroll;
                    } else {
                        let scroll = scroller.scrollLeft;
                        previousScrollPos = scroll;
                    }
                }, 50);
            }
        }

        function SetAnimateNext(nextdata, callback) {
            animatedirection.value = 1;
            preloadvisible.value = true;

            setTimeout(() => {
                cellsdata.value = nextdata;
                oncellsdataChange();

                animatedirection.value = 0;
                ScrollTo(0);
                callback();
            }, 2000);

            setTimeout(() => {
                preloadvisible.value = false;
            }, 2100);
        }

        function SetAnimatePrevious(nextdata, callback) {
            animatedirection.value = -1;
            preloadvisible.value = true;

            setTimeout(() => {
                cellsdata.value = nextdata;
                oncellsdataChange();

                animatedirection.value = 0;
                ScrollTo(0);
                callback();
            }, 2000);

            setTimeout(() => {
                preloadvisible.value = false;
            }, 2100);
        }

        function WindowResized(e) {
            Initialize();
        }

        onBeforeMount(() => {
            //console.log('onBeforeMount');
            setTimeout(() => {
                for (var k = 0; k < cellsdata.value.length; k++) {
                    cellsdata.value[k].index = inczindex - k;
                    //inczindex--;
                }

                oncellsdataChange();
                //console.log('cellsdata: ', cellsdata.value);
            }, 10);
        });

        onMounted(() => {
            window.addEventListener("resize", WindowResized);

            Initialize();
            //context.emit("on-data-updated", JSON.parse(JSON.stringify(cellsdata.value)));
        });

        onUpdated(() => {
            GetTotalVisibleCells();
        });

        watch(() => props.animatescroll, (first, second) => {
            animatedirection.value = first;
            /* console.log(
                "Watch props.animatescroll function called with args:",
                first,
                second
            ); */
            console.log("animatedirection: ", animatedirection);
            // Animate on Direction                  
        });

        watch(() => props.modelValue, (first, second) => {
            cellsdata.value = first;
        });

        const oncellsdataChange = () => {
            context.emit("update:modelValue", cellsdata.value);
        }

        return {
            cellW,
            cellH,
            cellFlexBasis,
            scroller,
            cellRef,
            isMouseDown,
            ScrollTo,
            ScrollBy,
            ScrollToCell,
            GetCellsPosition,
            GetOverflowX,
            GetOverflowY,
            SetAnimateNext,
            SetAnimatePrevious,
            startPos,
            startscrollPos,
            movescrollPos,
            scrollerMoving,
            previousPos,
            scrollbarWidth,
            justLoaded,
            scrollLoadingOffset,
            cellsdata,
            alertvisible,
            alerttext,
            dirsign,
            preloadvisible,
            animatedirection,
            scrollerid
        };
    }
});
</script>

<style lang="css">
@import "./scroller.css";

.scroller {
    background: #eaeaea;
    position: relative;
}

.vertical-scroller {
    overflow-y: auto;
    overflow-x: hidden;
}

.horizontal-scroller {
    overflow-y: hidden;
    overflow-x: auto;
}

.scroller-content {
    align-content: flex-start;
    flex-direction: row;
    flex-wrap: wrap;
}

.vertical-container {
    display: flex;
}

.horizontal-container {
    display: inline-flex;
    flex-flow: column wrap !important;
    height: inherit !important;
    align-content: flex-start;
    width: 100%;
}

.scroller-cell {

    background: #b6b6b6;

    flex: inherit;
    flex-grow: 0;
    flex-shrink: 0;
    flex-basis: 25%;

    /* for theme */
    background: #ffffff;
    /* box-shadow: 2px 2px 2px 2px rgb(221 221 221 / 60%); */
    box-shadow: rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px;
    border-radius: 5px;

    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}

.vertical-cell {
    display: inline-block;
    height: 50px;
}

.horizontal-cell {
    display: inline-flex;
    height: unset !important;
    width: 90px;
}

.dummycell {
    height: 20px;
}

.cell-text {
    width: 100%;
    text-align: center;
    font-size: 18pt;

    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}
</style>
