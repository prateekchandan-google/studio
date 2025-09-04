"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Logo } from "@/components/icons";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Start Game" },
  { href: "/register", label: "Register" },
  { href: "/scoreboard", label: "Scoreboard" },
  { href: "/admin", label: "Admin" },
];

export function Header() {
  const pathname = usePathname();

  const getLinkClass = (href: string) => {
    // Special handling for game routes
    if (href === "/" && (pathname.startsWith('/game') || pathname === '/')) {
        return "text-foreground";
    }
    return pathname === href ? "text-foreground" : "text-foreground/60";
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo className="h-6 w-auto" />
            <span className="hidden font-bold sm:inline-block font-headline">
              GTV Treasure Hunt
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  getLinkClass(link.href)
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:hidden">
          <Link href="/" className="flex items-center space-x-2">
            <Logo className="h-6 w-auto" />
            <span className="font-bold font-headline">GTV Treasure Hunt</span>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="pr-0">
              <nav className="flex flex-col gap-6 text-lg font-medium mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center px-4 transition-colors hover:text-foreground/80",
                       getLinkClass(link.href)
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
