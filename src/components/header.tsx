"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const navLinks = [
  { href: "/", label: "Start Game" },
  { href: "/register", label: "Register" },
  { href: "/scoreboard", label: "Scoreboard" },
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
        <div className="hidden md:flex flex-1 items-center justify-end">
            <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
