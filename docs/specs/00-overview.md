# 00 · App Shell, Navigation & Access Control

The frame every authenticated screen renders inside, plus the role model that
decides who sees what.

## 1. Route map

| Route               | Screen              | Guard              |
|---------------------|---------------------|--------------------|
| `/login`            | Login               | Public             |
| `/`                 | Dashboard           | Authenticated      |
| `/products`         | Products list       | Authenticated      |
| `/products/:slug`   | Product detail      | Authenticated      |
| `/bulk-upload`      | Bulk upload         | **Super-admin**    |
| `/categories`       | Categories          | Authenticated      |
| `/orders`           | Orders              | Authenticated      |
| `/users`            | Customers & admins  | Authenticated      |
| `/store-settings`   | Store settings      | Authenticated      |
| `/payments`         | Payment gateways    | Authenticated      |
| `/shipping`         | Shipping            | Authenticated      |
| `/settings`         | → redirects to `/store-settings` | Authenticated |
| `*`                 | → redirects to `/`  | —                  |

## 2. Access control (RBAC)

Two admin roles: **`admin`** and **`super_admin`** (a third role, `customer`,
never signs into this panel).

- **Route guard (authenticated).** Any route outside `/login` requires a stored
  session (user + token). A missing session redirects to `/login`, remembering
  the attempted path so the user lands back there after signing in.
- **Route guard (super-admin).** Super-admin-only routes redirect a regular
  admin to `/` if reached directly (e.g. a bookmarked URL).
- **UI gating.** Super-admin-only affordances are also **hidden**, not just
  disabled, for regular admins:
  - **Bulk Upload** nav item and page.
  - **Create admin** button on the Customers page.
  - **Activate / Deactivate** actions on the Customers page.

> RBAC in the UI is a convenience mirror of backend enforcement — never the sole
> gate. The UI hides/redirects; the server is the source of truth.

## 3. Layout — the dashboard shell

Every authenticated screen renders inside a persistent shell:

### Sidebar (left, collapsible to icons)
- **Brand block** — gem icon, "Munlight Blue", "Premium Jewellery" subtitle.
- **Nav items** (in order): Dashboard, Products, Bulk Upload *(super-admin)*,
  Categories, Orders, Customers, Store Settings, Payments, Shipping.
  - Each item has an icon + label; the active item is highlighted.
  - Active match is exact for `/`, prefix-based for all others.
  - Collapsing to icon mode hides labels and shows tooltips.
- **Footer** — "Developed by WebTriggers / Managed by Maittreya Digital"
  attribution (hidden when collapsed).

### Header (top, sticky)
- Sidebar collapse trigger.
- **Global search** (see [11-global-search.md](./11-global-search.md)).
- **Theme toggle** — light / dark.
- **Notifications bell** — with an unread indicator dot (visual only).
- **Logout** button — clears session and returns to `/login`.
- **User avatar** — initials derived from the user's full name.

## 4. Shared UI patterns

These recur across screens and should behave identically everywhere.

- **PageHeader** — title + description + optional right-aligned actions slot.
- **Data-screen states** — every list/detail screen renders one of:
  1. **Loading** — centered spinner.
  2. **Error** — destructive-colored message text.
  3. **Empty** — muted message; when a search/filter is active, the empty copy
     names the query (e.g. *No products match "…"*).
  4. **Populated** — table/cards + pagination where applicable.
- **Pagination bar** — page number, total pages, total count, page controls.
  Default page size is **20**.
- **Search input** — debounced (~300 ms) text field; changing it resets to
  page 1.
- **Destructive confirm** — deletes open an AlertDialog naming the target;
  confirm button shows a spinner and disables while the action runs.
- **Toasts** — success and error feedback for every mutation.
- **Audit cell** — shows a timestamp and the acting user (created / updated by).
- **Status pills** — active/inactive pill; order & payment status badges with
  status-specific colors.
- **Remote image** — thumbnail with a labelled fallback when no image exists.

## 5. Theming

Light and dark themes via a header toggle; the choice persists. All screens must
render correctly in both themes (tokens, not hard-coded colors).
