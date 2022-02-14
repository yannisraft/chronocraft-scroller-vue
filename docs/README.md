---
home: true 
heroText: Chronocraft Scroller for Vue3.0
heroImage: /img/dummy200.jpg
tagline: Dynamic and Versatile High Performance Infinite Scroller Component
actions: 
    - text: Get Started
      link: /getstarted
      type: primary
---

# A Vue 3 Dynamic and Versatile High Performance Infinite Scroller Component

The Chronocraft Scroller is a Vue 3 flexible scroller library infinite scroling support created for Vue3.
It supports both vertical and horizontal orientations
It provides smooth infinite scrolling with drag and mouse wheel navigation

## Demo
Here is a working Demo of the component
Demo: [Chronocraft Scroller Demo](https://codesandbox.io/s/chronocraft-vue3-infinite-scroller-demo-gvmb2?file=/src/App.vue){:target="_blank"}

### Features
- Vuejs 3.0 Based Code
- Infinite Scroller
- Horizontal and Vertical Support
- Dynamic length of rows and columns
- Mouse Wheel Support
- Touch and Drag support

## Usage of Scroller

Using the Library as a Plugin

```javascript
import { ChronoCraftScroller } from 'chronocraft-scroller-vue';
    ...
app.use(ChronoCraftScroller)
```

#### Using seperate components of the library inside you project

When you want to import a specific component from the library into a dedicated place inside your code

```javascript
import { Scroller } from 'chronocraft-scroller-vue';
...
components:{
Scroller
}
```