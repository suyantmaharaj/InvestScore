import { ReactNode } from 'react';

interface Props {
  icon:        string;
  title:       string;
  description: string;
  action?:     ReactNode;
}

export default function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div
      className="rounded-xl border p-12 text-center"
      style={{ background: 'var(--surface, #fff)', borderColor: 'var(--border, #DDE3EC)' }}
    >
      <div className="text-5xl mb-4">{icon}</div>
      <p className="font-semibold text-base mb-2" style={{ color: 'var(--text-primary, #015376)' }}>
        {title}
      </p>
      <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: 'var(--text-muted, #4A5568)' }}>
        {description}
      </p>
      {action}
    </div>
  );
}
