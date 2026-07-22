# Deep Currents — hearth feed

A warm, candlelit, mobile-first home for the essays of
[Deep Currents](https://deepcurrentswrites.blogspot.com/), by Scribbler.

Fully static: no build step, no dependencies. Open `index.html` via any
static server.

## Updating content

New Blogger posts appear automatically (live feed refresh) with a default
flame doodle. To bake them in with full styling:

    python scripts/refresh_posts.py

Then give the new post its own doodle in `js/doodles.js` and its moods in
`data/curation.json` (re-run the refresh script after editing curation),
and push.

## Tests

    python -m unittest discover tests -v   # content pipeline
    node --test tests/                     # JS logic + doodle registry
                                            # (if your Node/OS doesn't resolve
                                            # the directory form, run:
                                            # node --test tests/*.test.mjs)

## Dev pages

`doodle-gallery.html` — renders every doodle for visual regression.
