
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Loader } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GameSettings } from "@/lib/types";

const baseNavLinks = [
  { href: "/", label: "Start Game" },
  { href: "/scoreboard", label: "Scoreboard" },
];

export function Header() {
  const pathname = usePathname();
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(true);


  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'game');
    const unsubscribe = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        setGameSettings(doc.data() as GameSettings);
      } else {
        setGameSettings({ isStarted: false, isRegistrationOpen: false });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // This effect runs on the client and checks local storage.
    setIsSessionLoading(true);
    if (typeof window !== 'undefined') {
        const activeTeamId = localStorage.getItem('pathfinder-active-teamId');
        setHasActiveSession(!!activeTeamId);
    }
    setIsSessionLoading(false);
  }, [pathname]); // Rerun when path changes to catch login/logout


  const getLinkClass = (href: string) => {
    // Special handling for game routes
    if (href === "/" && (pathname.startsWith('/game') || pathname === '/')) {
      return "text-foreground";
    }
    return pathname === href ? "text-foreground" : "text-foreground/60";
  };
  
  let navLinks = [...baseNavLinks];
  if (gameSettings?.isRegistrationOpen && !hasActiveSession) {
    navLinks.splice(1, 0, { href: "/register", label: "Register" });
  }

  const renderNavLinks = (isMobile = false) => {
    if (isSessionLoading) {
      return isMobile ? null : <div className="w-24 h-6 rounded-md" />;
    }
    return navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "transition-colors hover:text-foreground/80",
            isMobile ? "flex items-center px-4" : "",
            getLinkClass(link.href)
          )}
        >
          {link.label}
        </Link>
    ));
  }


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Google_TV_Icon.svg/1024px-Google_TV_Icon.svg.png"
              width={24}
              height={24}
              alt="Google TV Logo"
              className="h-6 w-auto"
            />
            <span className="hidden font-bold sm:inline-block font-headline">
              GTV Treasure Hunt
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
             {renderNavLinks()}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2 md:hidden">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="pr-0">
              <nav className="flex flex-col gap-6 text-lg font-medium mt-8">
                {renderNavLinks(true)}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
        <div className="hidden md:flex flex-1 items-center justify-end">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
