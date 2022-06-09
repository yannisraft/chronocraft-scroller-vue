<template>
<div class="scroller-row-v" :id="rowId" :style="[{'margin-left': gap+'px'}, {'background-color': '#eaeaea'},{top: row.top, left: row.left, width: row.width, height: row.height, 'flex-direction': flexDirection}]">
    <slot name="row" :data="row">
        <div v-for="(cell, cellkey) in row.cells" class="scroller-cell-v" :key="cellkey" :id="'item'+cell.id" :style="[{left: cell.left, top: cell.top, 'flex-basis': cell.flexbasis}]">
            <slot name="cell" :data="cell">
                <span>{{ cell.index }}</span>
            </slot>
        </div>
    </slot>
</div>
</template>

<script>
import {
    defineComponent,
    ref,
    onMounted
} from "vue";

export default defineComponent({
    name: 'VScrollerRow',
    props: {
        gap: {
            type: Number,
            default: 0
        },
        calculatedRowSize: {
            type: Number,
            default: 0
        },
        orientation: {
            type: String,
            default: "vertical"
        },
        row: {
            type: Object,
            default: () => {
                return {
                    cells: {},
                    index: 0,
                    top: "0px",
                    left: "0px",
                    width: "0px"
                }
            }
        }
    },
    setup(props, context) {
        let IDGenerated = Math.floor(Math.random() * 999999) + 1000000;

        // ---- Reactive Attributes
        let rowId = ref("row_" + IDGenerated);
        let flexDirection = ref("row");
        if(props.orientation === "horizontal") flexDirection.value = "column";

        onMounted(() => {
            let rowelement = document.getElementById(rowId.value);
            context.emit("on-rendered", rowelement.clientHeight);
        });

        return {
            rowId,
            flexDirection
        };
    }
});
</script>

<style scoped>

</style>
