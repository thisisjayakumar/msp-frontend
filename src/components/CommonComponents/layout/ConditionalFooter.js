'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

/**
 * ConditionalFooter component that shows/hides footer based on route
 * @returns {JSX.Element|null} Footer component or null
 */
export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Hide footer on specific pages (same as header)
  const hideFooterPaths = ['/', '/login', '/supervisor', '/manager', '/admin', '/store_manager', '/operator'];
  
  if (hideFooterPaths.includes(pathname)) {
    return null;
  }
  
  return <Footer />;
}