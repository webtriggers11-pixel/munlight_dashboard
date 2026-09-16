# 01 · Authentication

**Route:** `/login` (public) · **Screen:** Login

The single entry point for staff into the admin panel.

## Purpose

Authenticate an `admin` or `super_admin` and establish a session, then route
them to their intended destination.

## Layout

Centered card on a full-height branded background:
- Gem brand mark + "Admin Portal" heading.
- **Email** field — icon-prefixed, `type=email`, required, autocomplete `email`,
  placeholder `admin@munlightblues.in`.
- **Password** field — icon-prefixed, required, autocomplete `current-password`,
  with a **show/hide** toggle (eye icon) that flips the input between masked and
  plain text.
- **Sign in** button — full width, shows a spinner while submitting.
- Helper line: "Staff access only."
- Footer: "Powered by Munlight Blue".

## Behavior

- **Submit** — validates that both fields are present (native `required`), then
  attempts login.
- **While submitting** — the button is disabled and shows a spinner.
- **On success** — the session (user + token) is stored and the user is
  redirected to the path they originally tried to reach, or `/` by default.
- **On failure** — an inline, `role="alert"` error message appears above the
  button (e.g. "Login failed" or the server-provided reason). Fields are not
  cleared.

## Session model (frontend)

- On successful login the authenticated user and token are persisted so the
  session survives a page refresh.
- The stored user drives **RBAC** everywhere (role checks for super-admin
  features).
- **Logout** (from the header) clears the stored session and returns to
  `/login`.
- Visiting any protected route without a valid session redirects to `/login`,
  preserving the attempted path for post-login redirect.

## States

| State       | UI                                                        |
|-------------|-----------------------------------------------------------|
| Idle        | Empty form, Sign in enabled once fields have focus/value  |
| Submitting  | Button disabled + spinner                                 |
| Error       | Inline destructive alert, form stays filled               |
| Success     | Redirect to intended route                                |

## Out of scope (frontend)

- No password reset / forgot-password flow on this screen.
- No self-registration — accounts are created by super-admins (see
  [06-customers.md](./06-customers.md)).
