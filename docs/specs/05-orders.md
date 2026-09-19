# 05 · Orders

**Route:** `/orders`

Track and fulfil customer orders — filter, search, advance status, and drill
into a full order detail view.

## Header
- Title "Orders" + description.
- **Status filter** (Select) in the actions slot: "All statuses" plus every
  order status. Changing it resets to page 1.

## Search
- Debounced input: "Search by order number, customer name, phone, or email…".
- Changing the query resets to page 1.

## Table

| Column   | Content                                          |
|----------|--------------------------------------------------|
| Order    | Order number (bold)                              |
| Customer | Shipping name                                    |
| Date     | Created date                                     |
| Payment  | Payment status badge                             |
| Total    | ₹ amount, right-aligned                          |
| Status   | Inline status Select (see transitions below)     |
| —        | View button → opens order detail dialog          |

- **Pagination** — page size 20.
- **Empty** — "No orders found." / "No orders match "…"".

## Order status model

Order statuses:
`pending · placed · confirmed · processing · shipped · out_for_delivery ·
delivered · cancelled · refund_initiated · refunded`

### Inline status transitions

The per-row Select only offers **allowed forward transitions** from the current
status. The current status appears as a disabled "(current)" label at the top.

| From              | Allowed next            |
|-------------------|-------------------------|
| pending           | cancelled               |
| placed            | cancelled               |
| confirmed         | processing, cancelled   |
| processing        | shipped, cancelled      |
| shipped           | out_for_delivery        |
| out_for_delivery  | delivered               |
| delivered         | refund_initiated        |
| cancelled         | refund_initiated        |
| refund_initiated  | refunded                |
| refunded          | — (terminal)            |

**Rules:**
- `placed → confirmed` is intentionally **not** offered in the inline Select —
  confirmation happens via the dedicated confirm action in the detail dialog.
- If payment is **not resolved** (payment status is `pending`, `failed`, or
  `cancelled`), all forward moves are blocked **except cancel**.
- Terminal statuses (no allowed next) disable the Select.
- While a status change is in flight, that row's Select is disabled and a toast
  confirms the new status on success.

## Order detail dialog

Opened from the row's View action. Shows the full order with management actions.

### Contents
- Header: order number, order status badge, payment status badge.
- **Items** — line items with image, name, unit price, quantity, line total;
  plus subtotal, shipping, COD charge, discount, and grand total.
- **Shipping address** — name, phone, email, address lines, city/state/pincode.
- **Payments** — list of payment transactions (gateway, amount, status, mode,
  gateway ids, failure reason, timestamps).
- **Shipment** — tracking details (courier, AWB, tracking URL, status,
  estimated delivery) and a tracking-events timeline when a shipment exists.
- **Admin notes** — internal notes attached to the order.

### Actions (conditional)
- **Confirm order** — for a placed order with resolved payment.
- **Create shipment** — when eligible and no shipment exists yet.
- **Sync tracking** — when a shipment exists, refresh its tracking events.
- Each action shows a busy state and toasts result; the parent list refreshes
  on change (`onUpdated`).
