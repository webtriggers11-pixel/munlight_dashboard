# 09 · Payment Gateways

**Route:** `/payments`

Manage payment-provider credentials (e.g. Razorpay).

## Header
- Title "Payment Gateways" + description.
- **Add gateway** button → opens the gateway form dialog (create mode).

## Configured gateways table

| Column        | Content                                            |
|---------------|----------------------------------------------------|
| Gateway       | Provider key (e.g. "razorpay"), capitalised        |
| Display name  | Human-readable label                               |
| Key ID        | Public key id (monospace)                          |
| Status        | Active / Inactive pill **+** "Test" badge if in test mode |
| Actions       | Edit (dialog), Delete (confirm)                    |

- **Loading** — spinner.
- **Empty** — "No gateways configured. Add Razorpay credentials to accept
  payments."
- **Error** — destructive message.

## Delete
- AlertDialog "Delete gateway?" naming the display name; warns it cannot be
  undone. On success toasts "Gateway deleted" and refreshes.

## Gateway form dialog (create / edit)

### Fields

| Field         | Type     | Required | Notes                                       |
|---------------|----------|:--------:|---------------------------------------------|
| Gateway       | text     | ✅ (create) | provider key, e.g. "razorpay"; not editable on edit |
| Display name  | text     | ✅       | e.g. "Razorpay Live"                        |
| Key ID        | text     | ✅       | public key id                               |
| Key secret    | password | cond.    | required on create; on edit placeholder is "Leave blank to keep current" |
| Active        | switch   | —        | `is_active`                                 |
| Test mode     | switch   | —        | `is_test_mode`                              |

### Behavior
- **Create** vs **Edit** determined by whether an existing gateway is passed.
- On edit, leaving the secret blank keeps the existing secret unchanged.
- Save shows a spinner; toasts, refreshes, and closes on success. Errors surface
  via toast.

## Security note (frontend)
- The key secret is a write-only field in the UI — it is never displayed back;
  editing shows a "leave blank to keep current" affordance rather than the value.
