"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // This is a mock authentication check.
    // In a real app, you'd verify a JWT or session cookie.
    const isAuthenticated = localStorage.getItem('pathfinder-admin-auth') === 'true';
    if (!isAuthenticated) {
      router.replace('/admin/login');
    } else {
      setIsVerified(true);
    }
  }, [router]);

  if (!isVerified) {
    // You can show a loader here. For now, it's just a blank screen to avoid flash of content.
    return null;
  }

  return <>{children}</>;
}
