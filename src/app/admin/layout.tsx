
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Puzzle, CheckSquare, LogOut, GalleryHorizontal, ArrowLeft, PanelLeft, ChevronsLeft, ChevronsRight } from 'lucide-react';
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
  const [isCollapsed, setIsCollapsed] = useState(false);


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
  
  if (pathname.startsWith('/admin/gallery')) {
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
      <aside className={cn(
        "flex-shrink-0 border-r bg-card p-4 flex flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
        )}>
        <div className={cn("mb-8 flex items-center", isCollapsed ? 'justify-center' : 'justify-between')}>
           <div className={cn("transition-opacity duration-200", isCollapsed ? "opacity-0 w-0" : "opacity-100")}>
            <h2 className="text-2xl font.headline font-bold">Admin Panel</h2>
            <p className="text-sm text-muted-foreground">Treasure Hunt Control</p>
          </div>
            <Button 
                variant="ghost" 
                size="icon"
                className="flex-shrink-0"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                {isCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
                <span className="sr-only">Toggle Sidebar</span>
            </Button>
        </div>
        <nav className="flex flex-col gap-2 flex-grow">
         <TooltipProvider delayDuration={0}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Tooltip key={link.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={link.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                      isActive && 'bg-primary/10 text-primary font-semibold',
                      isCollapsed && 'justify-center'
                    )}
                  >
                    <link.icon className="h-5 w-5" />
                    <span className={cn("truncate", isCollapsed && "hidden")}>{link.label}</span>
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                     <TooltipContent side="right" align="center">
                        {link.label}
                     </TooltipContent>
                )}
              </Tooltip>
            );
          })}
          </TooltipProvider>
        </nav>
        <div className="mt-auto space-y-2">
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Button variant="outline" asChild className="w-full">
                             <Link href="/" className={cn('flex', isCollapsed && 'justify-center')}>
                                <ArrowLeft className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                                <span className={cn(isCollapsed && "hidden")}>Back to Site</span>
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    {isCollapsed && (
                        <TooltipContent side="right" align="center">
                            Back to Main Site
                        </TooltipContent>
                    )}
                </Tooltip>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" className={cn('w-full flex', isCollapsed && 'justify-center')} onClick={handleExitAdmin}>
                            <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                            <span className={cn(isCollapsed && "hidden")}>Exit Admin</span>
                        </Button>
                    </TooltipTrigger>
                    {isCollapsed && (
                        <TooltipContent side="right" align="center">
                            Exit Admin
                        </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
