import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
  breadcrumb,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex items-center gap-1.5 mb-2" aria-label="Breadcrumb">
          {breadcrumb.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-text-muted text-xs">›</span>}
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-xs text-text-muted hover:text-text-secondary transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-xs text-text-secondary font-medium">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-wrap items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="w-10 h-10 shrink-0 bg-primary-50 rounded-xl flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-text-primary font-display truncate">{title}</h1>
            {subtitle && (
              <p className="text-sm text-text-secondary mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
