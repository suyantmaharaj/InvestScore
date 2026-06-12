'use client';

import { useRef, useEffect } from 'react';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Play as soon as the browser allows
    video.play().catch(() => {
      // Autoplay blocked — call onComplete immediately so the app doesn't hang
      onComplete();
    });

    const handleEnded = () => onComplete();
    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [onComplete]);

  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         9999,
        background:     '#010a18',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        overflow:       'hidden',
      }}
    >
      <video
        ref={videoRef}
        src="/splash.mp4"
        muted
        playsInline
        preload="auto"
        style={{
          width:    '100%',
          height:   '100%',
          objectFit: 'cover',
          display:  'block',
        }}
      />
    </div>
  );
}
