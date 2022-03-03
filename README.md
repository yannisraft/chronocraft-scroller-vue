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


#### Example of Component
```html
<Scroller orientation="horizontal" :cellwidth="200" :numcols="4" :numrows="4" :contentpadding="30" :wheelscrollspeed="20" :newcellslength="newcellslength" :data="scrollerdata" :cellsquared="true" @on-scroll="OnScroll" @on-update-data-next="onUpdateDataNext" @on-update-data-previous="onUpdateDataPrevious"/>
```

#### Example using Cell Slot
```html
<Scroller orientation="horizontal" :cellwidth="200" :numcols="4" :numrows="4" :contentpadding="30" :wheelscrollspeed="20" :newcellslength="newcellslength" :data="scrollerdata" :cellsquared="true" @on-scroll="OnScroll" @on-update-data-next="onUpdateDataNext" @on-update-data-previous="onUpdateDataPrevious">
    <template v-slot:cell="slotProps">
        <span>{{ slotProps.data.id }}</span>
    </template>
</Scroller>
```


### Component properties

|  Name  | Type  | Description  |
|---|---|---|
|  orientation  |  String  |  Defines the orientation of the scroller. The possible values are **horizontal** or **vertical**  |
|  cellwidth    |  Number  |  Defines the base of the cellwidth on the vertical scroller |
|  cellheight    |  Number  |  Defines the base of the cellheight on the horizontal scroller  |
|  numcols  |  Number  |  The total number of columns on the vertical scroller  |
|  numcols  |  Number  |  The total number of columns on the horizontal scroller  |
|  contentpadding  |  Number  |  The size of padding between the scroller cells  |
|  wheelscrollspeed  |  Number  |  Defines the mouse wheel scroll speed  |
|  newcellslength  |  Number  |  The total number of new cells that will be loaded when scrolling forward or backwards  |
|  data  |  Array  |  The actual data passed into the scroller. These data are reactive by using ref() |
|  cellsquared  |  Boolean  |  Sets the cell to be squared. (width will have the same size as the height)  |
|  hasscrollbar  |  Boolean  |  Defines if the scroller should have a scroll bar  |
|  @on-scroll  |  Event Function   | Event fired when the user has scrolled    |
|  @on-update-data-next  |  Event Function  |  Event fired when the user has reached at the end of the scroller and new data might be required to load |
|  @on-update-data-previous  |  Event Function  | Event fired when the user has reached at the start of the scroller and new data might be required to load  |
|  @on-data-updated  |  Event Function  |  Event triggered when scroller data has changed and returns the new data
|  ScrollTo  |  Call Function  |  Function called to scroll the scroller to specific position in pixels
|  ScrollBy  |  Call Function  |  Function called to scroll the scroller by a specific amount in pixels
|  GetCellsPosition  |  Call Function  |  Function called to get a specific cell's position in pixels

### Component slots

|  Name  | hasprops  | Description  |
|---|---|---|
|  cell  | yes  | Overrides the cell rendering and passes the cells data as props
|  overlay  | no  | In this slot custom elements can be added as an overlay above the scroller content


### Important Notice
To achive a smooth scrolling result without shaking or weird movement, the number of data cells loaded at initialization is relevant
to the width of the scroller as well as the total new cell data added each time it receives new data.

```
Total Required Initial Data Length = ( Total visible cells ) + ( New cells added each time) * 3
```

This is calculated automatically and an alert screen appears when more data is required.
