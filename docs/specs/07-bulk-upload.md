# 07 · Bulk Upload

**Route:** `/bulk-upload` · **Access:** **Super-admin only**

Import products in bulk from a CSV or Excel sheet, with a dry-run validation
pass before committing.

## Header
- Title "Bulk Upload" + description explaining SKU-based matching: existing SKUs
  are **updated**, new SKUs are **created**.
- **Download template** button — generates and downloads a CSV template
  client-side (headers + one example row), named `product-import-template.csv`.

## Template columns
`Category Path`, `Product Name`, `SKU`, `Description`, `Price`, `MRP`, `Stock`,
`Collection`, `Material`, `Color`, `Weight (kg)`, `Length (cm)`, `Breadth (cm)`,
`Height (cm)`, `HSN Code`, `Tags`, `Handmade (Yes/No)`, `Featured (Yes/No)`,
`New Arrival (Yes/No)`, `Bestseller (Yes/No)`, `Product URL`.

- **Product URL** is optional — a public image link (or several, comma-separated)
  to attach product images. Google Drive share links work when set to "Anyone
  with the link". Images are fetched only on the **real import**, not the dry run.

## Upload area
- A drag-and-drop / click-to-browse dropzone.
- Accepted types: `.csv`, `.xlsx`, `.xlsm`.
- **Max size: 5 MB** — a larger file is rejected with a toast ("File too large…").
- Once selected, the dropzone shows the file name and size, and allows picking a
  different file.

## Actions
- **Validate (dry run)** — validates the sheet without saving anything.
- **Import products** — performs the real import (and fetches images).
- **Clear** — resets the selected file and any result (shown only when a file is
  chosen).
- All three are disabled while any run is in progress; the active button shows a
  spinner.

## Result summary (after a run)

Shown once a run completes. Header distinguishes **dry run** ("nothing was
saved") from a real **import complete**.

### Stat tiles
Five counts: **Total rows**, **Created**, **Updated**, **Revived**, **Skipped**.

### Failed rows (if any)
- Destructive callout: "{n} row(s) skipped due to errors".
- Table: Row #, SKU, Name, Error.

### Image-warning rows (if any)
- Amber callout: "{n} row(s) imported with image warnings".
- Table: Row #, Name, Warning (one row per warning).

### All rows
- Full table: Row #, SKU, Name, Status badge.
- Status badge variants: `created` (default), `updated` (secondary),
  `revived` (outline), `skipped` (destructive).

## Toasts
- Dry run: "Validated {total} row(s) — {skipped} would be skipped".
- Import: "Imported: {created} created, {updated} updated, {revived} revived".
- Errors surface via toast.

## Row result shape (frontend)
Each row result carries: row number, SKU (nullable), name, status
(`created | updated | revived | skipped`), an optional error string, and an
optional list of warnings.
