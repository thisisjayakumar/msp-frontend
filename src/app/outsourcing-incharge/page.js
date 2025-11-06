"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OutsourcingInchargeLogin() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified login page
    router.push('/login');
  }, [router]);

  return null;
}


