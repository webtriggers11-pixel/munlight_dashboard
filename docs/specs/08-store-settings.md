# 08 · Store Settings

**Route:** `/store-settings` (legacy `/settings` redirects here)

Configure order & payment rules and view the synced pickup/warehouse address.

## Header
- Title "Store Settings" + description.

## Card 1 — Order & Payment (editable)

A single form (max-width, saved together via **Save settings**).

### Cash on Delivery (COD)
- **COD toggle** (switch) — "Customers can pay on delivery."
- When enabled, reveals **COD handling charge (₹)** — number input (min 0),
  helper: "Added to order total for COD orders. Set 0 for no charge."

### Free shipping
- **Enable free shipping above a threshold** checkbox.
  - Checking it seeds a default threshold (999) and reveals the input;
    unchecking it clears the threshold (null).
- When enabled, **Free shipping above (₹)** — number input (min 0), helper
  explaining orders at/above the amount ship free (the courier rate is still
  fetched but the customer is charged ₹0).

### Minimum order amount
- **Minimum order amount (₹)** — number input (min 0), helper: "Set to 0 to
  allow any order size."

### Save
- **Save settings** button — persists COD enabled, COD charge, free-shipping
  threshold, and min order amount together.
- Shows a spinner while saving; toasts "Store settings saved" on success, or an
  error toast on failure.

## Card 2 — Pickup / warehouse address (read-only)

- Synced from the shipping provider (Shiprocket); **not editable here**.
- Instruction: to update, go to **Shipping → Sync pickup**.
- When a pickup address exists, shows: Location name, Contact, Phone, Address,
  City / State, Pincode, Country (only the fields that are present).
- When none is synced yet, shows guidance pointing to the Shipping page's sync
  action.

## States
- **Loading** — centered spinner until settings load.
- **Load failure** — toast "Failed to load store settings".

## Settings shape (frontend)
Editable: `cod_enabled`, `cod_charge`, `free_shipping_threshold` (nullable),
`min_order_amount`. Read-only pickup: `shiprocket_pickup_location`,
`pickup_name`, `pickup_phone`, `pickup_address`, `pickup_city`, `pickup_state`,
`pickup_pincode`, `pickup_country`.
