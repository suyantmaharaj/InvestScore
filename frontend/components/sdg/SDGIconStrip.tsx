import SDGIcon from './SDGIcon';

interface Props {
  sdgIds:   number[];
  size?:    number;
  gap?:     number;
  wrap?:    boolean;
  rounded?: boolean;
}

export default function SDGIconStrip({
  sdgIds,
  size = 28,
  gap = 3,
  wrap = false,
  rounded = false,
}: Props) {
  return (
    <div style={{
      display:    'flex',
      flexWrap:    wrap ? 'wrap' : 'nowrap',
      gap:        `${gap}px`,
      alignItems: 'center',
    }}>
      {sdgIds.map(id => (
        <SDGIcon key={id} sdgId={id} size={size} rounded={rounded} />
      ))}
    </div>
  );
}
