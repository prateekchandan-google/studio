
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Puzzle, CheckSquare, LogOut, GalleryHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

const navLinks = [
  { href: '/admin', label: 'Home', icon: Home },
  { href: '/admin/submission', label: 'Submissions', icon: CheckSquare },
  { href: '/admin/teams', label: 'Team Management', icon: Users },
  { href: '/admin/puzzles', label: 'Puzzle Management', icon: Puzzle },
  { href: '/admin/gallery', label: 'Gallery', icon: GalleryHorizontal },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuthenticated = localStorage.getItem('pathfinder-admin-auth') === 'true';
      if (!isAuthenticated && pathname !== '/admin/login') {
        window.location.replace('/admin/login');
      } else {
        setIsVerified(true);
      }
    }
  }, [pathname]);

  const handleExitAdmin = () => {
    localStorage.removeItem('pathfinder-admin-auth');
    window.location.replace('/admin/login');
  };

  if (!isVerified && pathname !== '/admin/login') {
    return (
        <div className="flex items-center justify-center min-h-screen">
            {/* You can add a loader here */}
        </div>
    );
  }
  
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 flex-shrink-0 border-r bg-card p-4 flex flex-col">
        <div className="mb-8">
          <h2 className="text-2xl font.headline font-bold">Admin Panel</h2>
          <p className="text-sm text-muted-foreground">Treasure Hunt Control</p>
        </div>
        <nav className="flex flex-col gap-2 flex-grow">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                  isActive && 'bg-primary/10 text-primary font-semibold'
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
            <Button variant="outline" className="w-full" onClick={handleExitAdmin}>
                <LogOut className="mr-2 h-4 w-4" />
                Exit Admin Mode
            </Button>
        </div>
      </aside>
      <main className="flex-1 p-8 bg-background">{children}</main>
    </div>
  );
}
