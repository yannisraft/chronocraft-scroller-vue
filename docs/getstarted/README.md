# Getting Started

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