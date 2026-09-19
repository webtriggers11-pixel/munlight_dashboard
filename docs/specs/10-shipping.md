# 10 · Shipping

**Route:** `/shipping`

Manage shipping providers (e.g. Shiprocket), pickup-address sync, connection
tests, and webhook registration. The screen is organised into two tabs:
**Providers** and **Webhooks**.

## Header
- Title "Shipping" + description.
- Tabs: **Providers** (default) · **Webhooks**.

---

## Tab 1 — Providers

### Card header
- "Shipping providers" + **Add provider** button → opens the provider form
  dialog (create mode).

### Table

| Column   | Content                                                          |
|----------|------------------------------------------------------------------|
| Provider | Display name (bold) + provider key (muted, capitalised)          |
| Email    | API email                                                        |
| Token    | "Valid" (emerald) or "No token" badge; plus token expiry date when known |
| Status   | Active / Inactive pill **+** "Test" badge if in test mode        |
| Actions  | Test · Sync pickup · Edit · Delete                               |

- **Loading** — spinner. **Empty** — "No shipping providers configured. Add
  Shiprocket credentials to fulfil orders." **Error** — destructive message.

### Row actions
- **Test connection** (zap icon) — verifies credentials; shows a spinner on that
  row, toasts the returned message, refreshes.
- **Sync pickup address** (refresh icon) — pulls the pickup location; on success
  toasts `Synced pickup "{location}" ({pincode})` and refreshes. This is what
  populates the read-only address on [Store Settings](./08-store-settings.md).
- **Edit** — opens the form dialog in edit mode.
- **Delete** — AlertDialog "Delete shipping config?"; on success toasts and
  refreshes.

### Provider form dialog (create / edit)

| Field         | Type     | Required | Notes                                       |
|---------------|----------|:--------:|---------------------------------------------|
| Provider      | text     | ✅ (create) | e.g. "shiprocket"; not editable on edit   |
| Display name  | text     | ✅       |                                             |
| API email     | email    | ✅       |                                             |
| Password      | password | cond.    | required on create; edit placeholder "Leave blank to keep current" |
| Active        | switch   | —        | `is_active`                                 |
| Test mode     | switch   | —        | `is_test_mode`                              |

- On edit, leaving password blank keeps the existing one.
- Save shows a spinner; toasts, refreshes, closes on success.

---

## Tab 2 — Webhooks

Register the public webhook URL with the shipping provider so tracking updates
flow automatically.

### Fields
- **Public webhook URL** — text input, pre-filled from a build-time default
  (`VITE_PUBLIC_WEBHOOK_URL`) or a placeholder. A monospace preview line shows
  `POST {url}`.
- **Shipping config** — Select of existing providers (`display_name (provider)`).
  Loading shows a spinner in place of the Select.

### Register
- **Register with Shiprocket** button — disabled until a config is selected.
- Requires a selected config (else toasts "Select a shipping config first").
- Shows a spinner while registering; on success toasts "Webhook registered with
  Shiprocket". The webhook secret is saved to the chosen shipping config.
- Errors surface via toast.
