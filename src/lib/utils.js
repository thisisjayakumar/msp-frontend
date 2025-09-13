import { clsx } from "clsx";

/**
 * Utility function to merge CSS classes
 * @param {...string} inputs - Class names to merge
 * @returns {string} Merged class names
 */
export function cn(...inputs) {
  return clsx(inputs);
}

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Format date
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale (default: en-US)
 * @returns {string} Formatted date string
 */
export function formatDate(date, locale = "en-US") {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
