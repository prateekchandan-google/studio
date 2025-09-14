
'use client';

import { useState, useEffect } from 'react';
import { getCountFromServer, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Gift, Loader } from 'lucide-react';

export function EarlyBirdAlert() {
  const [teamCount, setTeamCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchTeamCount() {
      const teamsRef = collection(db, 'teams');
      try {
        const snapshot = await getCountFromServer(teamsRef);
        setTeamCount(snapshot.data().count);
      } catch (error) {
        console.error("Failed to fetch team count:", error);
        // Set to a high number to effectively disable the offer display on error
        setTeamCount(99); 
      }
    }
    fetchTeamCount();
  }, []);

  const renderAlertContent = () => {
    if (teamCount === null) {
      return (
        <>
          <Loader className="h-5 w-5 text-yellow-500 animate-spin" />
          <AlertTitle className="font-bold text-yellow-800 dark:text-yellow-300">Checking for Bonus...</AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-200">
            Checking for early bird registration spots.
          </AlertDescription>
        </>
      );
    }

    if (teamCount < 3) {
      const spotsLeft = 3 - teamCount;
      return (
        <>
          <Gift className="h-5 w-5 text-yellow-500" />
          <AlertTitle className="font-bold text-yellow-800 dark:text-yellow-300">Early Bird Bonus!</AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-200">
            <strong>{spotsLeft} spot{spotsLeft > 1 ? 's' : ''} left</strong> for <strong>10 bonus points!</strong> Register now to claim your reward.
          </AlertDescription>
        </>
      );
    }

    if (teamCount < 6) {
      const spotsLeft = 6 - teamCount;
      return (
        <>
          <Gift className="h-5 w-5 text-yellow-500" />
          <AlertTitle className="font-bold text-yellow-800 dark:text-yellow-300">Bonus Spots Filling Up!</AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-200">
            The 10-point bonus is gone! <strong>{spotsLeft} spot{spotsLeft > 1 ? 's' : ''} left</strong> for <strong>5 bonus points</strong>. Don't miss out!
          </AlertDescription>
        </>
      );
    }
    
    // You can return null or a different message if the offer is over
    return null;
  };

  const content = renderAlertContent();

  if (!content) {
    return null;
  }

  return (
    <Alert className="border-yellow-500/50 bg-yellow-500/10 text-yellow-900 dark:text-yellow-200 animate-pulse">
      {content}
    </Alert>
  );
}

    