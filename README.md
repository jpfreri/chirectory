# Chirectory

A member directory for the club — a self-contained website built with plain HTML, CSS, and
JavaScript (no build step, no frameworks, no Python/Java).

## Pages
- `index.html` — the directory: searchable, filterable accordion of members + club stats charts
- `club-chart.html` — the org chart (President → VP → Co-Council → Officers → Members)
- `member.html?i=N` — a single member's page (linked to from the directory and chart)

## Files
| File | What it is |
|------|------------|
| `data.js` | **The database.** All member data lives here. Edit this to update the directory. |
| `index.html`, `club-chart.html`, `member.html` | The three pages |
| `styles.css` | All styling (bright/dark themes, layout, the Scottish-castle backdrop) |
| `common.js` | Shared helpers + the top-right nav and theme toggle |
| `script.js` | Directory page logic (search, filter, accordion, stats charts) |
| `club-chart.js`, `member.js` | Logic for the chart and member pages |
| `castle.svg` | The Scottish-castle background image |

## Editing the data
Open `data.js`. It assigns one object:

```js
window.CHIRECTORY = {
  members: [ { "name": "...", "rushClass": "Fall '24", "room": "...", ... }, ... ],
  stats:   [ ... ]   // the affiliation / status / class breakdown tables
};
```

- **Add a member:** copy an existing `{ ... }` block in `members` and edit the fields.
- **Add a photo:** add a `"photo": "photos/name.jpg"` field to a member (any image URL or path).
  Their member page shows it automatically; until then a placeholder is shown.
- The member pages are referenced by index (`member.html?i=N`), so don't reorder members
  unless you're okay with old direct links pointing at a different person.

## Running it locally
Just **double-click `index.html`** — it works straight from disk (the data loads via a
`<script>` tag, no server needed).

If your browser ever blocks something, run a tiny local server from this folder instead:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Editing with Claude Code on another machine
1. Unzip this folder anywhere.
2. Open the folder in Claude Code (`claude` in the terminal, or the desktop/IDE app).
3. Ask away — e.g. "add a new member", "change the theme colors", "add photos".

## Publishing to GitHub Pages (free live website)
1. Create a new GitHub repo (e.g. `chirectory`).
2. Upload **the contents of this folder** to the repo root (so `index.html` is at the top level).
3. In the repo: **Settings → Pages → Build and deployment → Source: "Deploy from a branch"**,
   pick your branch (e.g. `main`) and folder `/ (root)`, then **Save**.
4. After a minute your site is live at `https://<your-username>.github.io/chirectory/`.

The included empty `.nojekyll` file tells GitHub Pages to serve the files as-is. All links are
relative, so it works at the repo root or any sub-path.
