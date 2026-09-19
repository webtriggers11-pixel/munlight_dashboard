import { PageHeader } from "@/components/page-header"
import { ShippingProvidersCard } from "@/components/shipping-providers-card"

// Super admin only (see App.tsx / app-sidebar.tsx). The developer-level settings: each
// aggregator's API address, and removing a provider. Adding a provider, credentials, the
// webhook token, pickup sync and the connection test are everyday tasks on the Shipping page.
export default function ShippingSetupPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Shipping Setup"
        description="Set each courier aggregator's API address and remove providers. Super admin only."
      />
      <ShippingProvidersCard mode="setup" />
    </div>
  )
}
