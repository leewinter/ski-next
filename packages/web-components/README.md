# @ski-next/web-components

Custom element wrappers for selected `@ski-next/ui` React components.

The package registers these elements by default when imported:

- `<ski-button>`
- `<ski-cal>`

## Static HTML

Build the package first:

```bash
npm run build -w @ski-next/web-components
```

Then include the generated stylesheet and IIFE bundle. This version can be
opened directly from disk with `file://`.

```html
<link rel="stylesheet" href="./dist/style.css" />
<script src="./dist/ski-next-web-components.iife.js"></script>

<ski-button label="Book transfer" type="primary" theme-mode="skiidy"></ski-button>
```

For complex props, either pass JSON attributes or assign the `props` property:

```html
<ski-cal
  start-time="2026-02-14T06:00:00+01:00"
  end-time="2026-02-14T12:00:00+01:00"
  title="Transfer board"
></ski-cal>

<script>
  const calendar = document.querySelector('ski-cal');

  calendar.props = {
    resources: [{ id: 'bus-1', name: '1' }],
    journeys: [
      {
        id: 'journey-1',
        resourceId: 'bus-1',
        title: 'GVA > Morzine',
        startDateTime: '2026-02-14T07:00:00+01:00',
        endDateTime: '2026-02-14T09:00:00+01:00',
        kind: 'private',
      },
    ],
    themeMode: 'skiidy',
  };

  calendar.addEventListener('ski-journey-change', (event) => {
    console.log(event.detail);
  });
</script>
```

`start-minutes` and `end-minutes` are still accepted as numeric fallbacks, but
date-time values are preferred so overnight journeys and the edit drawer have
the full date context.

If the page is served over `http://` or `https://`, the ES module bundle can be
used instead:

```html
<script type="module" src="./dist/ski-next-web-components.js"></script>
```

## Custom Prefix

The default import registers `ski-*` tags. To use another prefix, import the
module and call `defineSkiNextElements`:

```js
import { defineSkiNextElements } from '@ski-next/web-components';

defineSkiNextElements({ prefix: 'transfer' });
```
