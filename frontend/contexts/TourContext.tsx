'use client';

import {
  createContext, useContext, useState, useCallback,
  useEffect, useRef, ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { TOUR_STEPS, TourStep, TOTAL_TOUR_STEPS } from '@/lib/tour';

interface TourContextValue {
  active:      boolean;
  stepIndex:   number;
  currentStep: TourStep | null;
  startTour:   () => void;
  nextStep:    () => void;
  prevStep:    () => void;
  endTour:     () => void;
  totalSteps:  number;
}

const TourContext = createContext<TourContextValue>({
  active:      false,
  stepIndex:   0,
  currentStep: null,
  startTour:   () => {},
  nextStep:    () => {},
  prevStep:    () => {},
  endTour:     () => {},
  totalSteps:  TOTAL_TOUR_STEPS,
});

export function TourProvider({ children }: { children: ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [active,    setActive]    = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const navTimeout = useRef<ReturnType<typeof setTimeout>>();

  const currentStep = active ? TOUR_STEPS[stepIndex] : null;

  const goToStep = useCallback((index: number) => {
    if (index >= TOUR_STEPS.length) { setActive(false); return; }
    if (index < 0) return;

    const step = TOUR_STEPS[index];
    setStepIndex(index);

    if (pathname !== step.route) {
      clearTimeout(navTimeout.current);
      router.push(step.route);
    }
  }, [pathname, router]);

  const startTour = useCallback(async () => {
    // Auto sign-in as demo user so the tour works across all three portals.
    // The demo user needs role: 'demo' and companyId: 'wakanda-capital' in Firestore.
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      await signInWithEmailAndPassword(auth, 'demo@investscore.co.za', 'Demo@2026!');
    } catch {
      // Demo user not configured — tour runs with the current signed-in user
    }
    setActive(true);
    setStepIndex(0);
    goToStep(0);
  }, [goToStep]);

  const nextStep = useCallback(() => goToStep(stepIndex + 1), [stepIndex, goToStep]);
  const prevStep = useCallback(() => goToStep(stepIndex - 1), [stepIndex, goToStep]);

  const endTour = useCallback(() => {
    setActive(false);
    setStepIndex(0);
    router.push('/login');
  }, [router]);

  // Keyboard navigation
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
      active, stepIndex, currentStep,
      startTour, nextStep, prevStep, endTour,
      totalSteps: TOTAL_TOUR_STEPS,
    }}>
      {children}
    </TourContext.Provider>
  );
}

export const useTour = () => useContext(TourContext);
