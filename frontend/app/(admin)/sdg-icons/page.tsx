'use client';
import SDGIcon from '@/components/sdg/SDGIcon';
import { SDG_LIST } from '@/lib/sdg';

export default function SDGIconsPreviewPage() {
  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: 'var(--text-primary)' }}>
        Official UN SDG Icons — All 17 Goals
      </h1>

      {[56, 40, 28, 20].map(size => (
        <div key={size} style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
            {size}px
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {SDG_LIST.map(sdg => (
              <div key={sdg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <SDGIcon sdgId={sdg.id} size={size} />
                {size === 56 && (
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '56px' }}>
                    {sdg.shortName}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
          48px rounded — skill map variant
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {SDG_LIST.map(sdg => (
            <SDGIcon key={sdg.id} sdgId={sdg.id} size={48} rounded />
          ))}
        </div>
      </div>
    </div>
  );
}
