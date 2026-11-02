/**
 * @module features/health/useHealth
 * @category Feature: Health
 */
import { useEffect, useState } from 'react';

import { readHealthState, subscribeHealth, type HealthState } from './healthState';

/** The saved health state; updates whenever a check saves a new one. `null` while loading. */
export function useHealth(): HealthState | null {
  const [state, setState] = useState<HealthState | null>(null);
  useEffect(() => {
    let mounted = true;
    void readHealthState().then((saved) => {
      if (mounted) setState(saved);
    });
    const unsubscribe = subscribeHealth(setState);
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);
  return state;
}
