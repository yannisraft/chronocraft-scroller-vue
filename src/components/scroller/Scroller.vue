<template>
<div class="scroller-container" :style="[{ 'height': height + 'px'}]">
    <div :class="['scroller', orientation === 'vertical' ? 'vertical-scroller' : 'horizontal-scroller' ]" :style="[{ 'height': height + 'px'}]">
        <div :class="['scroller-content', orientation === 'vertical' ? 'vertical-container' : 'horizontal-container' ]" :style="[{ 'gap': gap + 'px'}, { 'padding': contentpadding + 'px'} ]">
            <slot name="content">

                <div v-for="datacell in cellsdata" ref="cellRef" :key="datacell.id" :class="['scroller-cell', orientation === 'vertical' ? 'vertical-cell' : 'horizontal-cell', datacell.debug ? 'debugcellstyle' : '']" :style="{ 'flex-basis': cellFlexBasis, 'height': cellH, 'width': cellW}">
                    <slot name="cell">
                        <span class="cell-text">{{ datacell.id }}</span>
                    </slot>
                </div>

            </slot>
        </div>
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
    onMounted,
    onUpdated
} from "vue";

export default defineComponent({
    name: "Scroller",
    components: {},
    props: {
        data: {
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
        let alerttext = ref("");

        let cellsdata = ref(props.data);

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
            if (width === undefined) {
                div = document.createElement('div');
                div.innerHTML = '<div style="width:50px;height:50px;position:absolute;left:-50px;top:-50px;overflow:auto;"><div style="width:1px;height:100px;"></div></div>';
                div = div.firstChild;
                document.body.appendChild(div);
                width = getScrollbarWidth.width = div.offsetWidth - div.clientWidth;
                document.body.removeChild(div);
            }
            return width;
        }

        function GenerateNextData(newdata) {
            // Add new data
            cellsdata.value = [...cellsdata.value, ...newdata];

            // Remove Last n Cells where n=newdata.length
            //
            cellsdata.value.splice(0, newdata.length);

            let cell = document.querySelector(".scroller-cell");
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

            setTimeout(() => {
                loadingCells = false;
            }, 100);
        }

        function GeneratePreviousData(newdata) {

            // Add new data
            cellsdata.value = [...newdata, ...cellsdata.value];

            // Remove Last n Cells where n=newdata.length
            //
            cellsdata.value.splice(cellsdata.value.length - newdata.length, cellsdata.value.length - 1);

            let cell = document.querySelector(".scroller-cell");
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
                targetPosition = previousScrollPos + (cellwidth * rowsloaded);
                scroller.scrollLeft = targetPosition;

                diff = previousScrollPos - movescrollPos;
                movescrollPos = targetPosition - diff;

            }

            setTimeout(() => {
                loadingCells = false;
            }, 100);
        }

        async function detectScrollEdges(sign, dragging, e) {
            // Detect Scroll on Edges
            // ----------------------
            if (sign === 1) {
                if (props.orientation === 'vertical') {
                    if (scroller.scrollTop + scroller.offsetHeight >=
                        scroller.scrollHeight - scrollLoadingOffset) {
                        if (!loadingCells && !justLoaded) {
                            loadingCells = true;
                            context.emit("on-update-data-next", (newdata) => {
                                GenerateNextData(newdata);
                            });
                        }
                    }
                } else {
                    if (scroller.scrollLeft + scroller.offsetWidth >=
                        scroller.scrollWidth - scrollLoadingOffset || scroller.scrollLeft === (scroller.scrollWidth - scroller.clientWidth)) {
                        if (!loadingCells && !justLoaded) {
                            loadingCells = true;
                            context.emit("on-update-data-next", (newdata) => {
                                setTimeout(() => {
                                    GenerateNextData(newdata);
                                }, 10);
                            });
                        }
                    }
                }
            }

            if (sign === -1) {
                if (props.orientation === 'vertical') {
                    if (scroller.scrollTop < scrollLoadingOffset) {
                        if (!loadingCells && !justLoaded) {
                            loadingCells = true;
                            context.emit("on-update-data-previous", (newdata) => {
                                // done
                                GeneratePreviousData(newdata);
                            });
                        }
                    }
                } else {
                    if (scroller.scrollLeft < scrollLoadingOffset) {
                        if (!loadingCells && !justLoaded) {
                            loadingCells = true;
                            context.emit("on-update-data-previous", (newdata) => {
                                // done
                                setTimeout(() => {
                                    GeneratePreviousData(newdata);
                                }, 10);
                            });
                        }
                    }
                }
            }
        }

        function GetTotalVisibleCells() {
            let cell = document.querySelector(".scroller-cell");
            let cellheight = cell.offsetHeight + props.gap;
            let cellwidth = cell.offsetWidth + props.gap;
            scroller = document.querySelector(".scroller");

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

            if (minimumRequiredInitialCells > cellsdata.value.length) {
                console.log("Error: Minimum Cells Required to load at start should be: ", minimumRequiredInitialCells);

                alertvisible.value = true;
                alerttext.value = "Error: Minimum Cells Required to load at start should be: " + minimumRequiredInitialCells + ". This value is relevant to the scroller width and to the number of new cells added each time.";
            }
        }

        function Initialize() {
            console.log('Initialize');
            scroller = document.querySelector(".scroller");
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

                    //console.log("scroller.scrollLeft: ", scroller.scrollLeft);
                    //console.log("scroller.scrollWidth: ", scroller.scrollWidth - scroller.clientWidth);
                    if (scroller.scrollLeft === (scroller.scrollWidth - scroller.clientWidth)) {
                        console.log("detectScrollEdges");
                        var dirsign = 1;
                        var delta = 0;
                        dirsign = parseInt(delta / Math.abs(delta));
                        detectScrollEdges(dirsign, false, e);
                    }
                }

                context.emit("on-scroll");
                beginMomentumTracking();
            });

            scroller.addEventListener("scroll", (e) => {
                var delta = 0;
                var dirsign = 1;

                if (props.orientation === 'vertical') {
                    let scroll = scroller.scrollTop;
                    delta = scroll - previousScrollPos;
                    dirsign = parseInt(delta / Math.abs(delta));
                    detectScrollEdges(dirsign, false, e);
                    previousScrollPos = scroll;
                } else {
                    let scroll = scroller.scrollLeft;
                    delta = scroll - previousScrollPos;
                    dirsign = parseInt(delta / Math.abs(delta));
                    detectScrollEdges(dirsign, false, e);
                    previousScrollPos = scroll;
                }
            });
        }

        function WindowResized(e) {
            Initialize();
        }

        onMounted(() => {
            window.addEventListener("resize", WindowResized);
            Initialize();
        });

        onUpdated(() => {
            GetTotalVisibleCells();
        });

        return {
            cellW,
            cellH,
            cellFlexBasis,
            scroller,
            cellRef,
            isMouseDown,
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
            alerttext
        };
    }
});
</script>

<style lang="css" scoped>
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
