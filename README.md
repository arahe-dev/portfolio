# portfolio

Abdur Raheem Imami's portfolio: a 3D pixel-art living room (with a koi-pond patio out the back door), rendered in the browser with three.js.

| Path | What it is |
| --- | --- |
| `index.html` | The site: the room. Built from `src/room/`, don't edit by hand. |
| `v1/` | The previous portfolio ("Pocket Dev"), kept as it was. The phone in the room links to it. |
| `room/` | A redirect to `/` for old links. |
| `src/room/` | Source for the room. |

## Working on the room

```sh
src/room/build.sh        # writes index.html (and src/room/.build/ for testing)
```

`src/room/shell.html` is the page shell (styles, canvases, buttons). The scene is plain ES modules concatenated in order from `src/room/js/`:

- `01-core` content (links, projects, albums), utilities, fonts
- `01b-covers` album covers; `02-textures` procedural textures
- `03-room` the room shell, door, furniture; `04-props` the table and its objects
- `04a-stone` stone and carpentry geometry tools; `04b-patio` the patio; `04c-life` koi, maple, shrubs
- `05-pages` magazine pages, phone, Game Boy; `06-render` renderer, time of day, camera, trip to the patio
- `07-hold` picking things up; `08-ui` sound, words, info overlay, input

### Screenshots and behaviour checks

`src/room/tools/` drives `.build/test.html` (the page plus a `window.__room` hook) with Playwright:

```sh
cd src/room/tools
node act.js out- 1280 800 13 '[{"wait":1500,"shot":"room"},{"pick":"door","wait":9000,"shot":"patio"}]'
node crop.js lantern.png 21 1280 800 900 60 380 420
```

Put `three.module.js` (0.165.0) and the Google Fonts files in `src/room/tools/cache/` to run offline; otherwise they load from the network.
