
'use client';
import { usePathname } from 'next/navigation';
import { Background } from './background';
import { Header } from './header';

export function AdminLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isAdminRoute = pathname.startsWith('/admin');

    if (isAdminRoute) {
        return <>{children}</>;
    }

    return (
        <>
            <Background />
            <Header />
            <main className="flex-1">{children}</main>
        </>
    )
}
