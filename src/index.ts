export interface ColoredTextOptions {
  color: string
}

import { App as Application, Plugin } from "vue";
import { setVueInstance } from "./utils/config/index";


import * as components from './components';


const Plugin: Plugin = {
  install(app: Application, options: ColoredTextOptions) {
    Object.entries(components).forEach(([componentName, component]) => {
      app.component(componentName, component);
    });
  }
}

// Default export is library as a whole, registered via Vue.use()
export default Plugin;

// Allow component use individually
export * from './components';