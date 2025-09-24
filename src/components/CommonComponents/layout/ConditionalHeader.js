'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

/**
 * ConditionalHeader component that shows/hides header based on route
 * @returns {JSX.Element|null} Header component or null
 */
export default function ConditionalHeader() {
  const pathname = usePathname();
  
  // Hide header on specific pages
  const hideHeaderPaths = ['/', '/login', '/supervisor', '/manager', '/admin', '/store_manager', '/operator'];
  
  if (hideHeaderPaths.includes(pathname)) {
    return null;
  }
  
  return <Header />;
}
