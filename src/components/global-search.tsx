import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, PackageIcon, SearchIcon, TagIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { listCategories } from "@/services/categories"
import { listProducts } from "@/services/products"
import type { Category } from "@/types/category"
import type { Product } from "@/types/product"
import { Input } from "@/components/ui/input"

const DEBOUNCE_MS = 250
const MAX_RESULTS = 8

function matches(text: string | null | undefined, q: string): boolean {
  return !!text && text.toLowerCase().includes(q)
}

export function GlobalSearch() {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Categories/subcategories are a small, rarely-changing set — fetch once and filter client-side.
  useEffect(() => {
    listCategories(true).then(setAllCategories).catch(() => {})
  }, [])

  // Products can grow large — search server-side (name, SKU, slug, description, tags).
  useEffect(() => {
    const q = query.trim()
    if (q.length === 0) {
      setProducts([])
      setLoadingProducts(false)
      return
    }
    setLoadingProducts(true)
    const id = window.setTimeout(() => {
      listProducts(1, MAX_RESULTS, true, q)
        .then((res) => setProducts(res.items))
        .catch(() => setProducts([]))
        .finally(() => setLoadingProducts(false))
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [query])

  // Close on outside click / Escape
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  const q = query.trim().toLowerCase()
  const matchedCategories =
    q.length === 0
      ? []
      : allCategories
          .filter((c) => c.parent_id === null && (matches(c.name, q) || matches(c.slug, q)))
          .slice(0, MAX_RESULTS)
  const matchedSubcategories =
    q.length === 0
      ? []
      : allCategories
          .filter((c) => c.parent_id !== null && (matches(c.name, q) || matches(c.slug, q)))
          .slice(0, MAX_RESULTS)

  const hasResults =
    matchedCategories.length > 0 || matchedSubcategories.length > 0 || products.length > 0
  const showPanel = open && q.length > 0

  function goToCategory(category: Category) {
    setOpen(false)
    setQuery("")
    navigate("/categories", { state: { focusCategoryId: category.id } })
  }

  function goToProduct(product: Product) {
    setOpen(false)
    setQuery("")
    navigate(`/products/${product.slug}`)
  }

  function parentName(parentId: number | null): string | null {
    return allCategories.find((c) => c.id === parentId)?.name ?? null
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search products, categories…"
        className="h-9 bg-muted pl-8"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
      />

      {showPanel && (
        <div className="absolute top-full left-0 z-50 mt-1.5 w-[22rem] max-w-[80vw] rounded-lg border bg-popover shadow-lg">
          {loadingProducts && !hasResults ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Searching…
            </div>
          ) : !hasResults ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No results for “{query.trim()}”
            </p>
          ) : (
            <div className="max-h-[24rem] overflow-y-auto py-1.5">
              {matchedCategories.length > 0 && (
                <ResultGroup label="Categories">
                  {matchedCategories.map((c) => (
                    <ResultRow
                      key={`cat-${c.id}`}
                      icon={<TagIcon className="size-4" />}
                      title={c.name}
                      subtitle={c.slug}
                      onClick={() => goToCategory(c)}
                    />
                  ))}
                </ResultGroup>
              )}

              {matchedSubcategories.length > 0 && (
                <ResultGroup label="Subcategories">
                  {matchedSubcategories.map((c) => (
                    <ResultRow
                      key={`subcat-${c.id}`}
                      icon={<TagIcon className="size-4" />}
                      title={c.name}
                      subtitle={
                        parentName(c.parent_id)
                          ? `${parentName(c.parent_id)} / ${c.slug}`
                          : c.slug
                      }
                      onClick={() => goToCategory(c)}
                    />
                  ))}
                </ResultGroup>
              )}

              {products.length > 0 && (
                <ResultGroup label="Products">
                  {products.map((p) => (
                    <ResultRow
                      key={`prod-${p.id}`}
                      icon={<PackageIcon className="size-4" />}
                      title={p.name}
                      subtitle={[p.sku, p.slug].filter(Boolean).join(" · ")}
                      badge={!p.is_active ? "Inactive" : undefined}
                      onClick={() => goToProduct(p)}
                    />
                  ))}
                </ResultGroup>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ResultGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-1.5 py-1">
      <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  )
}

function ResultRow({
  icon,
  title,
  subtitle,
  badge,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  badge?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm",
        "hover:bg-accent hover:text-accent-foreground transition-colors"
      )}
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{title}</span>
        {subtitle && (
          <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
        )}
      </span>
      {badge && (
        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {badge}
        </span>
      )}
    </button>
  )
}
