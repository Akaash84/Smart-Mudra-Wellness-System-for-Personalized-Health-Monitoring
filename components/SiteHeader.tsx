import Link from "next/link";
import { ThemeSwitcher } from "./ThemeSwitcher";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/detection", label: "Detection" },
  { href: "/recommendations", label: "Recommendations" },
  { href: "/library", label: "Library" },
  { href: "/assistant", label: "Assistant" },
  { href: "/profile", label: "Profile" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <span className="brand-mark">M</span>
        <span>
          <strong>MudraHealth</strong>
          <small>AI wellness monitoring</small>
        </span>
      </Link>
      <nav className="nav-links">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        <ThemeSwitcher />
        <Link href="/auth" className="header-cta">
          Login / Signup
        </Link>
      </div>
    </header>
  );
}
