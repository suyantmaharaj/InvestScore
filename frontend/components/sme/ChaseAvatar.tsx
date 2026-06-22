import Image from 'next/image';

export default function ChaseAvatar({
  size = 32,
  className = '',
}: {
  size?:      number;
  className?: string;
}) {
  return (
    <div
      className={`rounded-full overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: size, height: size, padding: 0, backgroundColor: '#2d3748' }}
    >
      <Image
        src="/chase-avatar.png"
        alt="Chase the cheetah"
        width={size}
        height={size}
        className="rounded-full object-contain w-full h-full"
      />
    </div>
  );
}
