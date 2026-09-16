# 03 · Products

**Routes:** `/products` (list), `/products/:slug` (detail)

Manage the jewellery catalogue — browse, search, create, edit, view, delete.

---

## 3A. Products list — `/products`

### Header
- Title "Products" + description.
- **Add Product** button → opens the create form dialog.

### Search
- Debounced search input: "Search by name, SKU, or slug…".
- Changing the query resets to page 1.

### Table

| Column   | Content                                                        |
|----------|----------------------------------------------------------------|
| Image    | First product image thumbnail (fallback if none)               |
| Name     | Product name, links to `/products/:slug`                       |
| SKU      | SKU or "—"                                                      |
| Price    | ₹ price, right-aligned                                          |
| Stock    | Number; **red** when stock < 5                                  |
| Status   | Active / Inactive pill                                          |
| Created  | Audit cell (time + user)                                        |
| Updated  | Audit cell (time + user)                                        |
| Actions  | View (→ detail), Edit (dialog), Delete (confirm)               |

- **Pagination** — page size 20.
- **Empty** — "No products found." or "No products match "…"" when searching.

### Delete
- Opens an AlertDialog: "Delete product?" naming the product; notes it can be
  restored from the database if needed.
- Confirm shows a spinner; on success toasts "Product deleted" and refreshes.

---

## 3B. Product detail — `/products/:slug`

Read-only view of a single product with edit/delete affordances.

### Layout
- **Back to products** link.
- Header: product name + active pill; subtitle `SKU · Category`.
- **Edit** and **Delete** buttons.
- Grid:
  - **Media card** — large selected image + thumbnail strip (click to switch
    the main image); "No images." when empty.
  - **Pricing & Inventory** — Selling price, MRP, Stock (red when < 5), SKU.
  - **Organization & Details** — Category, Weight (kg), HSN code, Material,
    Color, Rating (`avg (count)`), Tags (badges or "—").
  - **Status & Flags** — badges for Handmade, Featured, New arrival, Bestseller,
    each showing on/off state (check/x).
  - **Description** — shown only if present, preserves line breaks.
  - **Slug** line (monospace).
  - **Activity** — Created and Last updated audit cells.

### States
- **Loading** — centered spinner.
- **Error / not found** — back link + "Product not found." (or error text).

### Delete (from detail)
- AlertDialog "Delete product?"; on success toasts and navigates back to
  `/products`.

---

## 3C. Product form dialog (create / edit)

Shared dialog used by the list, the detail page, and deep links. "Create" when
no product is passed; "Edit" when editing an existing one.

### Fields

| Field            | Type        | Required | Notes                                   |
|------------------|-------------|:--------:|-----------------------------------------|
| Name             | text        | ✅       | e.g. "Rani Pink Pendant Set"            |
| Slug             | text        | —        | auto-suggested from name; editable      |
| Description      | textarea    | —        |                                         |
| Images           | uploader    | —        | one or more product images              |
| Collection/Category | select   | —        | choose a category                       |
| Subcategory      | select      | —        | dependent on category                   |
| Price (₹)        | number      | ✅       | selling price                           |
| MRP (₹)          | number      | ✅       | list price                              |
| Stock            | number      | —        | defaults to 0                           |
| SKU              | text        | —        | e.g. "MB-FS-001"                        |
| HSN code         | text        | —        |                                         |
| Collection       | text        | —        | e.g. "Festive Collection"               |
| Material         | text        | —        |                                         |
| Color            | text        | —        |                                         |
| Tags             | tag input   | —        | type + Enter/comma to add               |
| Weight (kg)      | number      | —        |                                         |
| Length (cm)      | number      | —        |                                         |
| Breadth (cm)     | number      | —        |                                         |
| Height (cm)      | number      | —        |                                         |
| Flags            | switches    | —        | Handmade, Featured, New, Bestseller     |
| Active           | switch      | —        | edit only (`is_active`)                 |

### Behavior
- Required fields (Name, Price, MRP) are marked with a red asterisk and block
  submit when empty; validation via zod.
- Save shows a spinner; on success toasts and calls the caller's refresh
  (`onSaved`) then closes.
- On error, a toast surfaces the message; the dialog stays open with values
  intact.
