# 06 · Customers & Admins

**Route:** `/users` · **Nav label:** "Customers"

View all user accounts (customers and staff) and manage admin accounts.

## Header
- Title "Customers" + description.
- **Create admin** button — **super-admin only** (hidden for regular admins) →
  opens the create-admin dialog.

## Search
- Debounced input: "Search by name, email, or phone…". Resets to page 1 on
  change.

## Table

| Column   | Content                                       | Visible to        |
|----------|-----------------------------------------------|-------------------|
| Name     | Full name (bold)                              | all admins        |
| Email    | Email                                         | all admins        |
| Role     | Title-cased role (Customer / Admin / Super Admin) | all admins    |
| Status   | Active / Inactive pill                        | all admins        |
| Joined   | Created date                                  | all admins        |
| Actions  | **Activate / Deactivate** button              | **super-admin only** |

- **Pagination** — page size 20.
- **Empty** — "No users found." / "No customers match "…"".

## Activate / Deactivate (super-admin only)
- The Actions column and its toggle button only render for super-admins.
- Clicking toggles the user's active state; the button shows a spinner while
  in flight and is disabled for that row.
- On success toasts "User activated" / "User deactivated" and refreshes.

## Create admin dialog (super-admin only)

### Fields

| Field      | Type     | Required |
|------------|----------|:--------:|
| Full name  | text     | ✅       |
| Email      | email    | ✅       |
| Password   | password | ✅       |

### Behavior
- All three fields required.
- On submit, creates a new **admin** account; shows a spinner, toasts on
  success, refreshes the list, and closes.
- Errors surface via toast; dialog stays open.

## Notes
- This screen lists **all** users, including customers; only admin/super-admin
  accounts are actionable (created here, toggled here).
- Regular admins get a **read-only** view (no create, no toggle).
