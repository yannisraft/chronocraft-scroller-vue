<template>
<div :id="scrollbarId" v-if="active" class="scroller-scrollbar">
    <div class="scroller-scrollbar-track"></div>
    <div class="scroller-scrollbar-thumb" :style="'top: '+scrollbarThumbPosition+'px'"></div>
    <div class="scroller-scrollbar-up" @click="ScrollBackwardsClicked()" style="height: 12px;"></div>
    <div class="scroller-scrollbar-down" @click="ScrollForwardClicked()" style="height: 12px;"></div>
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
    name: "VScrollerScrollBar",
    components: {},
    props: {
        modelValue: {
            type: Array,
            default: () => {
                return []
            }
        },
        active: {
            type: Boolean,
            default: true
        },
        viewportId: {
            type: String,
            default: ""
        },
        orientation: {
            type: String,
            default: "vertical"
        },
        mode: {
            type: String,
            default: "normal"
        }
    },
    setup(props, context) {
        // ---- Attributes 
        let viewport = null;
        let scrollbarButtonDown = false;
        let previousMovePosition = -100000;
        let IDGenerated = (Math.floor(Math.random() * 999999) + 1000000);
        let scrollbarPercent = 0;
        var scrollbar;
        var scrollbar_size;
        var scrollbar_track;
        var scrollbar_thumb;
        var scrollbar_up;
        var scrollbar_track_size;
        var scrollbar_thumb_size;
        var scrollbar_up_size;
        var scrollbar_min;
        var scrollbar_max;

        // ---- Reactive Attributes
        let scrollbarThumbPosition = ref(0);
        const scrollbarId = ref("viewport_" + IDGenerated);

        // ---- Methods Public
        function ScrollBackwardsClicked() {
            context.emit("on-backwards-clicked");

            if (props.mode !== 'infinite') {
                
            }
        }

        function ScrollForwardClicked() {
            context.emit("on-forward-clicked");

            if (props.mode !== 'infinite') {

            }
        }

        // ---- Methods Private
        function SetPosition(position) {
             // Clamp new Value 
            var newValue = Math.max(scrollbar_min, Math.min(position, scrollbar_max));
            scrollbarThumbPosition.value = newValue;
            UpdatePercent();
        }

        function SetPercent(percent) {
            scrollbarPercent = percent;
            scrollbarThumbPosition.value = (scrollbarPercent * (scrollbar_max - scrollbar_min)) / 100;
            previousMovePosition = -100000;
            context.emit("on-change", scrollbarPercent);            
        }

        function UpdatePercent() {
            var flatValue = scrollbarThumbPosition.value - scrollbar_min;
            scrollbarPercent = (100 * flatValue) / (scrollbar_max - scrollbar_min);
            context.emit("on-change", scrollbarPercent);
        }

        function SetupScrollbar() {

            if (props.active) {
                if (props.viewportId !== "") {

                    scrollbar = document.querySelector("#" + scrollbarId.value);
                    scrollbar_track = document.querySelector("#" + scrollbarId.value + " .scroller-scrollbar-track");
                    scrollbar_thumb = document.querySelector("#" + scrollbarId.value + " .scroller-scrollbar-thumb");
                    scrollbar_up = document.querySelector("#" + scrollbarId.value + " .scroller-scrollbar-up");

                    scrollbar_size = scrollbar_track.clientWidth;
                    scrollbar_track_size = scrollbar_track.clientHeight;
                    scrollbar_thumb_size = scrollbar_thumb.clientHeight;
                    scrollbar_up_size = scrollbar_up.clientHeight;                    

                    scrollbar_min = scrollbar_up_size;
                    scrollbar_max = scrollbar_track_size - scrollbar_up_size - scrollbar_thumb_size;

                    if (props.orientation === 'horizontal') {
                        scrollbar_track_size = scrollbar_track.clientWidth;
                        scrollbar_thumb_size = scrollbar_thumb.clientWidth;
                        scrollbar_up_size = scrollbar_up.clientWidth;
                        scrollbar_size = scrollbar_track.clientHeight;
                    }

                    var viewportWidthInPixels = viewport.clientWidth;
                    viewport.style.width = (viewportWidthInPixels - scrollbar_size) + "px";
                    scrollbarThumbPosition.value = scrollbar_up_size;

                    if (props.mode === 'infinite') SetPercent(50);

                    scrollbar_thumb.addEventListener("mousedown", (e) => {
                        scrollbarButtonDown = true;
                    });

                    document.addEventListener("mousemove", (e) => {
                        if (!scrollbarButtonDown) return;
                        e.preventDefault();

                        if (previousMovePosition !== -100000) {
                            var diff = e.clientY - previousMovePosition;
                            SetPosition(scrollbarThumbPosition.value + diff);
                        }

                        previousMovePosition = e.clientY;
                    });

                    document.addEventListener("mouseup", (e) => {
                        scrollbarButtonDown = false;

                        if (props.mode === 'infinite') {
                            SetPercent(50);
                        }
                    });
                }

            }
        }

        onMounted(() => {
            viewport = document.querySelector("#" + props.viewportId);
            SetupScrollbar();
        });

        return {
            // Attributes
            scrollbarId,
            scrollbarThumbPosition,

            // Methods Public
            ScrollBackwardsClicked,
            ScrollForwardClicked
        };
    }

});
</script>

<style lang="css">
@import "./scroller.css";
</style>
