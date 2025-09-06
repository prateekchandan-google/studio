
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Puzzle, CheckSquare, LogOut, GalleryHorizontal, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

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
  
  if (pathname === '/admin/login') {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            {isVerified ? children : null}
        </div>
    );
  }
  
  if (pathname === '/admin/gallery') {
    // The gallery has its own specific layout
    return <>{children}</>;
  }

  if (!isVerified) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Verifying access...</p>
        </div>
    );
  }


  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 flex-shrink-0 border-r bg-card p-4 flex flex-col">
        <div className="mb-8">
            <Button variant="outline" asChild className="mb-4">
                 <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Main Site
                </Link>
            </Button>
          <h2 className="text-2xl font.headline font-bold">Admin Panel</h2>
          <p className="text-sm text-muted-foreground">Treasure Hunt Control</p>
        </div>
        <nav className="flex flex-col gap-2 flex-grow">
         <TooltipProvider>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Tooltip key={link.href} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    href={link.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                      isActive && 'bg-primary/10 text-primary font-semibold'
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    <span className="truncate">{link.label}</span>
                  </Link>
                </TooltipTrigger>
                 <TooltipContent side="right" align="center">
                    {link.label}
                 </TooltipContent>
              </Tooltip>
            );
          })}
          </TooltipProvider>
        </nav>
        <div className="mt-auto">
            <Button variant="outline" className="w-full" onClick={handleExitAdmin}>
                <LogOut className="mr-2 h-4 w-4" />
                Exit Admin Mode
            </Button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
