import { Link } from "@tanstack/react-router";

const ITEMS = [
  { to: "/", label: "Bokningsöversikt" },
  { to: "/boka", label: "Boka tid" },
  { to: "/kund", label: "Kundsida" },
  { to: "/personal", label: "Personal" },
  { to: "/ankomst", label: "Ankomst" },
] as const;

// En enda meny, used on every page, so it always sits in the same spot.
export function TopNav() {
  return (
    <nav aria-label="Huvudmeny" className="border-b border-primary-foreground/20">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-6 py-2 font-display text-sm uppercase tracking-wider">
        {ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: true }}
            className="rounded-sm px-3 py-2.5 opacity-80 transition hover:bg-primary-foreground/10 hover:opacity-100"
            activeProps={{ className: "bg-primary-foreground/15 opacity-100" }}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
