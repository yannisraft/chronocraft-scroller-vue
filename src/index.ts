import { App as Application, Plugin } from "vue";
import * as components from './components';

const Plugin: Plugin = {
    install(app: Application) {  
      Object.entries(components).forEach(([componentName, component]) => {
        app.component(componentName, component);
      });
    }
  }

export default Plugin

// Allow component use individually
export * from './components';