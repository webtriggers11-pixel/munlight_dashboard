# 04 · Categories

**Route:** `/categories`

Organise products into a two-level hierarchy of browsable collections
(top-level categories → subcategories).

## Header
- Title "Categories" + description.
- **Add Category** button → opens the category form dialog (create mode).

## Search
- Search input: "Search categories by name or slug…".
- Filtering is **client-side** over the loaded hierarchy:
  - A top-level category matches on its own name/slug **or** if any of its
    subcategories match.
  - When a parent matches on its own name, all its children are shown; when it
    matches only via children, **only the matching children** are shown.
- Empty result copy: "No categories match "…"".

## Table (hierarchical)

Rows render the hierarchy inline — each top-level category is followed by its
indented subcategory rows (visually muted, prefixed with "↳").

| Column   | Content                                                       |
|----------|---------------------------------------------------------------|
| Image    | Category image thumbnail (labelled fallback)                  |
| Name     | Name; parents show "{n} subcategories" count when they have children |
| Slug     | Category slug                                                 |
| Sort     | Sort order (number, right-aligned)                            |
| Status   | Active / Inactive pill                                        |
| Created  | Audit cell                                                    |
| Updated  | Audit cell                                                    |
| Actions  | Edit (dialog), Delete (confirm)                               |

- Both parent and subcategory rows support Edit and Delete.
- No pagination — the full hierarchy is loaded and filtered client-side.
- **Empty** — "No categories found." when there are none at all.

## Deep link / focus
- The screen accepts a `focusCategoryId` via navigation state (used by global
  search). When present and the category exists, it **auto-opens the edit
  dialog** for that category, then clears the state so a refresh/back doesn't
  reopen it.

## Delete
- AlertDialog "Delete category?" — warns the removal is **permanent and cannot
  be undone**. On success toasts "Category deleted" and refreshes.

## Category form dialog (create / edit)

### Fields

| Field         | Type     | Required | Notes                                            |
|---------------|----------|:--------:|--------------------------------------------------|
| Category type | radio    | ✅       | **Top-level** or **Subcategory**                 |
| Parent        | select   | cond.    | shown/required only when type = Subcategory      |
| Name          | text     | ✅       | placeholder varies by type                       |
| Slug          | text     | —        | auto-suggested from name; editable               |
| Description   | textarea | —        | shown on the category page                       |
| Image         | uploader | —        |                                                  |
| Sort order    | number   | —        | controls display order                           |
| Active        | switch   | —        | `is_active`                                      |

### Behavior
- Choosing **Subcategory** reveals the Parent selector (choose a top-level
  category).
- Name is required; on save shows a spinner, toasts, refreshes, and closes.
- Errors surface via toast; dialog stays open with values intact.
