# Munlight Blue — Admin Dashboard · Frontend Feature Specifications

Frontend-only functional specifications for the Munlight Blue admin dashboard.
These documents describe **what each screen does and how it behaves in the UI** —
layout, states, fields, validation, roles, and interactions.

> **Scope note.** These specs deliberately contain **no API/endpoint details**.
> The backend contract is changing and is owned separately. Where a screen needs
> data, the spec says *what* data (fields, shape) it renders or submits, never
> *how* it is fetched. Treat every "loads / saves / submits" line as a call to
> the relevant service layer, whatever that contract ends up being.

## Stack (frontend)

| Concern        | Choice                                              |
| -------------- | --------------------------------------------------- |
| Framework      | React 19 + TypeScript                               |
| Build tool     | Vite                                                |
| Routing        | React Router v7                                     |
| Styling        | Tailwind CSS v4                                      |
| UI primitives  | shadcn / Radix UI                                   |
| Icons          | lucide-react                                        |
| Tables         | @tanstack/react-table                               |
| Charts         | Recharts                                            |
| Toasts         | sonner                                              |
| Validation     | zod                                                 |
| Theme          | next-themes (light / dark)                          |

## Feature index

| # | Feature            | Route(s)                       | Spec                              |
|---|--------------------|--------------------------------|-----------------------------------|
| 0 | App shell & RBAC   | —                              | [00-overview.md](./00-overview.md) |
| 1 | Authentication     | `/login`                       | [01-authentication.md](./01-authentication.md) |
| 2 | Dashboard          | `/`                            | [02-dashboard.md](./02-dashboard.md) |
| 3 | Products           | `/products`, `/products/:slug` | [03-products.md](./03-products.md) |
| 4 | Categories         | `/categories`                  | [04-categories.md](./04-categories.md) |
| 5 | Orders             | `/orders`                      | [05-orders.md](./05-orders.md) |
| 6 | Customers & Admins | `/users`                       | [06-customers.md](./06-customers.md) |
| 7 | Bulk Upload        | `/bulk-upload`                 | [07-bulk-upload.md](./07-bulk-upload.md) |
| 8 | Store Settings     | `/store-settings`              | [08-store-settings.md](./08-store-settings.md) |
| 9 | Payment Gateways   | `/payments`                    | [09-payments.md](./09-payments.md) |
| 10| Shipping           | `/shipping`                    | [10-shipping.md](./10-shipping.md) |
| 11| Global Search      | (header, all pages)            | [11-global-search.md](./11-global-search.md) |

## Conventions used in these specs

- **Roles** — `admin` and `super_admin`. Anything marked **super-admin only**
  is hidden from regular admins in the UI (and also guarded at the route level).
- **States** — every data screen defines four render states: **loading**,
  **error**, **empty**, and **populated**.
- **Currency** — all money is Indian Rupees (₹), formatted `en-IN`.
- **Feedback** — success/failure of any mutation is surfaced through a toast.
- **Confirmation** — every destructive action (delete) is gated behind an
  AlertDialog confirmation.
