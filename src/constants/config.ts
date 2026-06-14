// Brand + app config shared across the admin panel.
export const config = {
  brand: {
    name: "Munlight Blue",
    shortName: "Munlight",
    tagline: "Admin",
  },
  // Token keys are owned by lib/api.ts; mirrored here for reference.
  storage: {
    tokenKey: "munlight_admin_token",
    userKey: "munlight_admin_user",
  },
  pagination: {
    defaultPageSize: 20,
  },
} as const
