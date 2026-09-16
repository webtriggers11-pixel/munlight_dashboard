# 11 · Global Search

**Location:** Header (available on every authenticated screen).

A quick command-style search over products and categories, reachable from
anywhere via the header.

## Behavior

- A single search input in the header. Typing opens a results dropdown.
- **Two result groups:**
  - **Products** — searched server-side (matches name, SKU, slug, description,
    tags). Debounced (~250 ms), capped at **8** results.
  - **Categories / subcategories** — a small, rarely-changing set fetched once
    and filtered **client-side** by name.
- **Empty query** — clears product results and closes/idles the panel.
- **Loading** — a spinner shows while product results are in flight.

## Result items
- **Product** result (package icon) — navigates to that product's detail page
  (`/products/:slug`).
- **Category** result (tag icon) — navigates to `/categories` and passes a
  `focusCategoryId` so the Categories screen **auto-opens the edit dialog** for
  that category (see [04-categories.md](./04-categories.md)).

## Dismissal
- Closes on **outside click** and on **Escape**.

## Notes
- Result counts are intentionally small (max 8 products) for a fast, focused
  jump-to experience — this is navigation, not a full report.
