
import { Suspense } from 'react';
import StartGamePage from './start-page-client';
import { Loader } from 'lucide-react';

function StartPageFallback() {
    return (
        <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
            <Loader className="w-12 h-12 animate-spin text-primary" />
        </div>
    )
}

export default function Page() {
  return (
    <Suspense fallback={<StartPageFallback />}>
      <StartGamePage />
    </Suspense>
  );
}
