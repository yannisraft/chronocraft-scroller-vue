import { DefineComponent, Plugin } from "vue";

declare const ChronoCraftScroller: Exclude<Plugin["install"], undefined>;

export default ChronoCraftScroller;

export const Scroller: Exclude<Plugin["install"], undefined> | DefineComponent;
