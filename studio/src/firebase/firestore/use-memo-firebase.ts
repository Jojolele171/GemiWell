'use client';

import { useMemo, useRef } from 'react';

/**
 * A hook to stabilize Firestore references and queries.
 * It uses a ref to keep track of the value and only updates it if the dependencies change.
 * This is crucial to prevent infinite loops in Firestore hooks like useCollection and useDoc.
 */
export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  const ref = useRef<T>(null as any);
  const prevDeps = useRef<any[]>([]);

  const changed = !deps.every((dep, i) => dep === prevDeps.current[i]);

  if (changed) {
    ref.current = factory();
    prevDeps.current = deps;
  }

  return ref.current;
}
