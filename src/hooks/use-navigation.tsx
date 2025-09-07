
'use client';

import { usePathname } from 'next/navigation';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface NavigationContextType {
  isNavigating: boolean;
  handleLinkClick: (href: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // When the pathname changes, the navigation is complete.
    setIsNavigating(false);
  }, [pathname]);

  const handleLinkClick = useCallback((href: string) => {
    // Don't show loader if the href is the same as the current path
    if (href !== pathname) {
      setIsNavigating(true);
    }
  }, [pathname]);

  return (
    <NavigationContext.Provider value={{ isNavigating, handleLinkClick }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
