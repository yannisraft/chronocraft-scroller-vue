<template>
<div :id="'item' + cellid" class="">
</div>
</template>

<script>
export default {
    name: 'VScrollerCell',
    props: {
        cellid: {
            type: String,
            default: "1"
        },
        top: {
            type: String,
            default: "0px"
        },
        left: {
            type: String,
            default: "0px"
        },
        flexbasis: {
            type: String,
            default: "0"
        }
    }
}
</script>

<style scoped>

</style>
