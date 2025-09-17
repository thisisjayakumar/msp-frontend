// App configuration constants
export const APP_CONFIG = {
  name: "Microspring Products",
  description: "Precision, Performance, Perfection - Versatile Applications of Springs Across Various Industries",
  version: "1.0.0",
  tagline: "Unleash the Power of Microsprings",
};

// API configuration
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
  timeout: 10000,
};

// Navigation items
export const NAVIGATION_ITEMS = [
  { name: "Home", href: "/", current: true },
  { name: "About", href: "/about", current: false },
  { name: "Products", href: "/products", current: false },
  { name: "Contact", href: "/contact", current: false },
];

// Theme configuration
export const THEME_CONFIG = {
  colors: {
    primary: {
      50: "#eff6ff",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
      900: "#1e3a8a",
    },
  },
};

// Breakpoints (matching Tailwind defaults)
export const BREAKPOINTS = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};
