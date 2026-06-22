import type { LucideIcon } from "lucide-react";

export function NavGroup({
  title,
  items,
  path
}: {
  title: string;
  items: [string, string, LucideIcon][];
  path: string;
}) {
  return (
    <nav aria-label={title} className="space-y-4">
      <div className="px-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{title}</div>
      <div className="space-y-2">
        {items.map(([href, label, Icon]) => {
          const active = path === href;
          const activeStyle = active ? { backgroundColor: "#7B8B75", color: "#ffffff", boxShadow: "none" } : undefined;
          return (
            <a
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              style={activeStyle}
              className={`flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-sage ${active ? "" : "text-textMuted hover:bg-surfaceMuted hover:text-text"}`}
            >
              <Icon size={18} />
              {label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
