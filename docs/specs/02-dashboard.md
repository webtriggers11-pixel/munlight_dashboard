# 02 · Dashboard Overview

**Route:** `/` · **Screen:** Dashboard

The landing screen after login — key metrics and recent activity at a glance.

## Layout (top → bottom)

1. **Page header** — "Dashboard Overview" + description.
2. **Stat cards** (4, responsive grid).
3. **Revenue chart** (interactive, range-selectable).
4. **Recent orders** table.

## 1. Stat cards

Four summary cards, each with a label, a large value, an icon, and a footer line:

| Card              | Value            | Footer                                            |
|-------------------|------------------|---------------------------------------------------|
| Total Revenue     | ₹ amount         | "Paid & COD-collected orders"                     |
| Total Orders      | count            | "{pending} pending"                               |
| Total Customers   | count            | "Registered accounts"                             |
| Active Products   | count            | "{low_stock} low on stock" **or** "All well stocked" |

- The **Active Products** footer turns to a **danger** style when low-stock
  count > 0 (and drops the trend icon).
- Values are formatted `en-IN`; revenue rounded to whole rupees.

## 2. Revenue chart

- Recharts area chart of revenue over time.
- **Range selector**:
  - Desktop: a toggle group — **Last 3 months (90d)**, **Last 30 days (30d)**,
    **Last 7 days (7d)**.
  - Mobile: the same options in a Select.
- Default range: **90 days**.
- Changing the range re-loads the series for that window.
- Series carries, per day: date, revenue, order count.

## 3. Recent orders

A compact table of the latest orders:

| Column   | Content                        |
|----------|--------------------------------|
| Order    | Order number (bold)            |
| Date     | Created date                   |
| Status   | Order status badge             |
| Payment  | Payment status badge           |
| Total    | ₹ amount, right-aligned        |

- **Empty** — "No recent orders." when the list is empty.
- Rows are display-only here (full management lives on
  [05-orders.md](./05-orders.md)).

## States

| State    | UI                                                     |
|----------|--------------------------------------------------------|
| Loading  | Centered spinner for the whole screen                  |
| Error    | Destructive message ("Failed to load dashboard.")      |
| Loaded   | Cards + chart + recent orders                          |
