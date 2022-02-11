# A Vue 3 Dynamic and Versatile High Performance Infinite Scroller Component

The Chronocraft Scroller is a Vue 3 flexible scroller library infinite scroling support created for Vue3.
It supports both vertical and horizontal orientations
It provides smooth infinite scrolling with drag and mouse wheel navigation

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

### Important Notice
To achive a smooth scrolling result without shaking or weird movement, the number of data cells loaded at initialization is relevant
to the width of the scroller as well as the total new cell data added each time it receives new data.

```
Total Required Initial Data Length = ( Total visible cells ) + ( New cells added each time) * 3
```

This is calculated automatically and an alert screen appears when more data is required.
