
'use client';

import { useNavigation } from '@/hooks/use-navigation';
import { Loader } from 'lucide-react';

function NavigationLoader() {
    const { isNavigating } = useNavigation();

    if (!isNavigating) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <Loader className="w-12 h-12 animate-spin text-primary" />
        </div>
    );
}


export function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
           <NavigationLoader />
           {children}
        </>
    )
}
