import Link from "next/link";
import { NAVIGATION_ITEMS, APP_CONFIG } from "@/constants";
import Button from "@/components/ui/Button";

/**
 * Header component with navigation
 * @returns {JSX.Element} Header component
 */
export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              {APP_CONFIG.name}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {NAVIGATION_ITEMS.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                  item.current
                    ? "text-blue-600"
                    : "text-gray-500"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
