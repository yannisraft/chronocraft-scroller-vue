/* eslint-disable */
import { App as Application, Plugin } from "vue";
import * as components from "./components/index";
import { setVueInstance } from "./utils/config/index";

const install: Exclude<Plugin["install"], undefined> = (
  instance: Application
) => {
  setVueInstance(instance);
  for (const componentKey in components) {
    instance.use((components as any)[componentKey]);
  }
};

export default install;

export * from "./components";
export * from './utilities';


/* export interface ColoredTextOptions {
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
export * from './utilities'; */