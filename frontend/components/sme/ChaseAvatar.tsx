export default function ChaseAvatar({
  size = 32,
  className = '',
}: {
  size?:      number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Chase the cheetah"
    >
      {/* Head */}
      <circle cx="20" cy="20" r="19" fill="#E8A020" />

      {/* Ears */}
      <path d="M6 10 L10 18 L14 10 Z" fill="#E8A020" />
      <path d="M8 11 L10 16 L12 11 Z" fill="#C4780A" />
      <path d="M34 10 L30 18 L26 10 Z" fill="#E8A020" />
      <path d="M32 11 L30 16 L28 11 Z" fill="#C4780A" />

      {/* Forehead shading */}
      <ellipse cx="20" cy="17" rx="12" ry="10" fill="#D4900F" opacity="0.3" />

      {/* Tear marks */}
      <path d="M13 22 Q11 25 12 28" stroke="#2C2C2A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M27 22 Q29 25 28 28" stroke="#2C2C2A" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Forehead spots */}
      <circle cx="16" cy="14" r="1.5" fill="#2C2C2A" opacity="0.6" />
      <circle cx="24" cy="14" r="1.5" fill="#2C2C2A" opacity="0.6" />
      <circle cx="20" cy="12" r="1"   fill="#2C2C2A" opacity="0.4" />

      {/* Eyes */}
      <ellipse cx="15" cy="20" rx="3"   ry="3.5" fill="white" />
      <ellipse cx="25" cy="20" rx="3"   ry="3.5" fill="white" />
      <circle  cx="15.5" cy="20.5" r="2" fill="#015376" />
      <circle  cx="25.5" cy="20.5" r="2" fill="#015376" />
      <circle  cx="15.5" cy="20.5" r="1" fill="#0a0a0a" />
      <circle  cx="25.5" cy="20.5" r="1" fill="#0a0a0a" />
      <circle  cx="16"   cy="19.5" r="0.5" fill="white" opacity="0.9" />
      <circle  cx="26"   cy="19.5" r="0.5" fill="white" opacity="0.9" />

      {/* Nose */}
      <ellipse cx="20" cy="26" rx="2.5" ry="1.8" fill="#C4780A" />
      <circle  cx="20" cy="25.5" r="1.2" fill="#8B4513" />

      {/* Mouth */}
      <path d="M18 27.5 Q20 29.5 22 27.5" stroke="#8B4513" strokeWidth="1" fill="none" strokeLinecap="round" />

      {/* Muzzle */}
      <ellipse cx="20" cy="28" rx="5" ry="3" fill="#F5C842" opacity="0.4" />
    </svg>
  );
}
