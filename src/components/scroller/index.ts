import { App as Application } from "vue";
import Scroller from "./Scroller.vue";

import { registerComponent } from "./../../utils/plugins/index";

const Plugin = {
  install(vue: Application) {
    registerComponent(vue, Scroller);
  }
};

// use(Plugin);

export default Plugin;

export { Scroller };

