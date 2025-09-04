"use client";

import Link from "next/link";
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
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1024 272.3"
                className="h-6 w-auto"
                fill="currentColor"
              >
                <path d="M421.4 136.2c0-34.4-28.7-62.2-66.2-62.2s-66.2 27.8-66.2 62.2c0 34.2 28.7 62.2 66.2 62.2s66.2-28 66.2-62.2zm-21.4 0c0 23.9-20.1 43.1-44.8 43.1s-44.8-19.2-44.8-43.1c0-23.9 20.1-43.1 44.8-43.1s44.8 19.2 44.8 43.1z" />
                <path d="M557.5 136.2c0-34.4-28.7-62.2-66.2-62.2s-66.2 27.8-66.2 62.2c0 34.2 28.7 62.2 66.2 62.2s66.2-28 66.2-62.2zm-21.4 0c0 23.9-20.1 43.1-44.8 43.1s-44.8-19.2-44.8-43.1c0-23.9 20.1-43.1 44.8-43.1s44.8 19.2 44.8 43.1z" />
                <path d="M685.2 75v116.5c0 30.8-21.6 48.9-46 48.9-23.2 0-38-15.5-44.3-29l20.4-8.5c2.7 6.4 11.3 15.8 23.9 15.8 14.5 0 24.3-9.9 24.3-26v-6.7h-1c-5.8 5.6-15.6 11.1-26.6 11.1-24.1 0-45.2-20.1-45.2-45.3s21.1-45.3 45.2-45.3c11.1 0 20.9 5.5 26.6 11h1v-9.1h21.4zM641 136.3c0 23.9 18.9 43.2 42.1 43.2 23.2 0 42-19.3 42-43.2s-18.8-43.2-42-43.2-42.1 19.3-42.1 43.2z" />
                <path d="M729.5 87.8h22.3v107.4h-22.3z" />
                <path d="M848.4 153.2L825 130.6c8.5-7.6 19.7-19.2 19.7-34 0-16-12-25.7-27.1-25.7-17.3 0-29.2 11.1-34.4 18l17.8 10.7c3.4-4.8 7.8-8.7 13.2-8.7 6.5 0 10.1 3.5 10.1 8.8 0 7.8-9.4 12.3-17.5 19.6l-13.4 12.2c-13 11.8-31 25.1-31 46.5 0 17.5 12.6 27.9 29.3 27.9 19 0 31.6-12.7 35.8-18.6l-18.4-10.7c-4.4 5.3-10.8 11.5-17.9 11.5-6.9 0-11.3-4.1-11.3-9.4 0-6.9 5.8-11.2 11.7-16.5l11.7-10.8 23.5-21.5c11-10.1 17-16.6 17-25.4z" />
                <path d="M241.1 149.3c-15.8 0-28.7-13.4-28.7-29.3V75.8h-16.5v45.1c0 24.4 19.8 45.4 45.1 45.4 25.4 0 45.1-21.1 45.1-45.4V75.8h-16.5v44.3c.1 15.9-12.8 29.2-28.6 29.2z" />
                <path d="M1002.6 125.1v-12.9h-44.5v12.9h17.3v58.2h-17.3v12.9h44.5v-12.9h-17.3v-58.2zM0 136.2C0 61 61 0 136.1 0c75.2 0 136.2 61 136.2 136.2s-61 136.1-136.2 136.1C61 272.3 0 211.2 0 136.2zm242.3 0c0-58.6-47.5-106.2-106.2-106.2S30 77.6 30 136.2c0 58.6 47.5 106.2 106.2 106.2s106.1-47.6 106.1-106.2z" />
              </svg>
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
