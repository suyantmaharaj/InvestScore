'use client';

import {
  createContext, useContext, useState, useCallback,
  useEffect, useRef, ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  TOUR_STEPS, TourStep, TOTAL_TOUR_STEPS,
  SME_TOUR_END, ADMIN_TOUR_END,
  TOUR_CREDENTIALS,
} from '@/lib/tour';

interface StartTourOpts {
  startStep?: number;
  endStep?:   number;
  email?:     string;
  password?:  string;
}

interface TourContextValue {
  active:         boolean;
  currentStep:    TourStep | null;
  tourStepNumber: number;
  tourTotalSteps: number;
  startTour:      (opts?: StartTourOpts) => void;
  nextStep:       () => void;
  prevStep:       () => void;
  endTour:        () => void;
}

const TourContext = createContext<TourContextValue>({
  active:         false,
  currentStep:    null,
  tourStepNumber: 1,
  tourTotalSteps: TOTAL_TOUR_STEPS,
  startTour:      () => {},
  nextStep:       () => {},
  prevStep:       () => {},
  endTour:        () => {},
});

export function TourProvider({ children }: { children: ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [active,    setActive]    = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const tourStartRef  = useRef(0);
  const tourEndRef    = useRef(ADMIN_TOUR_END);
  // Tracks which portal we last signed in for; prevents redundant re-auth within a portal
  const lastPortalRef = useRef<string>('sme');

  const currentStep     = active ? TOUR_STEPS[stepIndex] : null;
  const tourStepNumber  = stepIndex - tourStartRef.current + 1;
  const tourTotalSteps  = tourEndRef.current - tourStartRef.current + 1;

  // Declarative navigation effect.
  // When the tour spans multiple portals and we cross a portal boundary,
  // re-sign-in with that portal's credentials BEFORE navigating so the
  // new page loads with the correct auth token.
  useEffect(() => {
    if (!active) return;
    const step   = TOUR_STEPS[stepIndex];
    const portal = step.portal ?? 'sme';
    const isMultiPortal = tourEndRef.current > SME_TOUR_END;

    const navigate = () => {
      if (pathname !== step.route) router.push(step.route);
    };

    if (isMultiPortal && portal !== lastPortalRef.current && pathname !== step.route) {
      lastPortalRef.current = portal;
      const cred = TOUR_CREDENTIALS[portal as keyof typeof TOUR_CREDENTIALS];
      if (cred) {
        // Sign in first, navigate after — page gets the right role token on first load
        import('firebase/auth').then(({ signInWithEmailAndPassword }) =>
          import('@/lib/firebase').then(({ auth }) =>
            signInWithEmailAndPassword(auth, cred.email, cred.password)
              .catch(() => {})
              .then(navigate)
          )
        );
        return;
      }
    }

    navigate();
  }, [active, stepIndex, pathname, router]);

  const startTour = useCallback(async (opts?: StartTourOpts) => {
    const start    = opts?.startStep ?? 0;
    const end      = opts?.endStep   ?? ADMIN_TOUR_END;
    const email    = opts?.email     ?? 'sme1@investscore.co.za';
    const password = opts?.password  ?? 'SME@2026!';

    tourStartRef.current  = start;
    tourEndRef.current    = end;
    // Seed portal tracker to the starting step so we don't re-auth on the very first step
    lastPortalRef.current = TOUR_STEPS[start].portal ?? 'sme';

    // IMPORTANT: set active=true BEFORE the async sign-in so that by the time
    // onAuthStateChanged fires and the login page's useEffect runs, tourActive
    // is already true and the auth redirect is bypassed.
    setActive(true);
    setStepIndex(start);

    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      // User not configured or already signed in — tour continues with current session
    }
  }, []);

  const nextStep = useCallback(() => {
    setStepIndex(prev => {
      const next = prev + 1;
      if (next > tourEndRef.current) {
        setActive(false);
        return tourStartRef.current;
      }
      return next;
    });
  }, []);

  const prevStep = useCallback(() => {
    setStepIndex(prev => Math.max(tourStartRef.current, prev - 1));
  }, []);

  const endTour = useCallback(() => {
    setActive(false);
    setStepIndex(tourStartRef.current);
  }, []);

  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') nextStep();
      if (e.key === 'ArrowLeft')  prevStep();
      if (e.key === 'Escape')     endTour();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, nextStep, prevStep, endTour]);

  return (
    <TourContext.Provider value={{
      active, currentStep,
      tourStepNumber, tourTotalSteps,
      startTour, nextStep, prevStep, endTour,
    }}>
      {children}
    </TourContext.Provider>
  );
}

export const useTour = () => useContext(TourContext);
