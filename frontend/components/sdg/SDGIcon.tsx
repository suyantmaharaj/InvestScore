import { SDG_LIST } from '@/lib/sdg';

interface Props {
  sdgId:       number;
  size?:       number;
  showNumber?: boolean;
  rounded?:    boolean;
  className?:  string;
  style?:      React.CSSProperties;
}

export default function SDGIcon({
  sdgId,
  size = 40,
  rounded = false,
  className = '',
  style,
}: Props) {
  const sdg = SDG_LIST.find(s => s.id === sdgId);
  if (!sdg) return null;

  return (
    <img
      src={`/sdg-icons/sdg-${sdgId}.svg`}
      alt={`SDG ${sdgId}: ${sdg.name}`}
      width={size}
      height={size}
      className={className}
      style={{
        borderRadius: rounded ? `${size * 0.2}px` : `${size * 0.06}px`,
        flexShrink:   0,
        display:      'block',
        ...style,
      }}
    />
  );
}
