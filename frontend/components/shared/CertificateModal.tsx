'use client';

import { useEffect, useState } from 'react';
import { X, Download, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';

interface CertificateModalProps {
  url: string;
  fileName?: string;
  fileType?: string;
  onClose: () => void;
}

export default function CertificateModal({ url, fileName, fileType, onClose }: CertificateModalProps) {
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // Reliably detect type using MIME first, then decoded URL filename
  const resolvedType = fileType?.toLowerCase() ?? '';
  const decodedUrl   = decodeURIComponent(url).toLowerCase();
  const isPDF =
    resolvedType.includes('pdf') ||
    (!resolvedType && decodedUrl.includes('.pdf'));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative flex flex-col rounded-2xl overflow-hidden shadow-2xl w-full max-w-3xl animate-card-in"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', height: '90vh' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold flex-shrink-0" style={{ color: 'var(--text)' }}>
              B-BBEE Certificate
            </span>
            {fileName && (
              <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                — {fileName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg hover:opacity-80"
              style={{ color: 'var(--sanlam-teal)', background: 'rgba(0,181,237,0.08)', border: '1px solid rgba(0,181,237,0.2)' }}
            >
              <ExternalLink size={11} /> Open
            </a>
            <a
              href={url}
              download={fileName}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg hover:opacity-80"
              style={{ color: 'var(--sanlam-teal)', background: 'rgba(0,181,237,0.08)', border: '1px solid rgba(0,181,237,0.2)' }}
            >
              <Download size={11} /> Download
            </a>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-lg hover:opacity-80"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="relative flex-1 overflow-auto bg-neutral-100 dark:bg-neutral-900" style={{ minHeight: 0 }}>

          {/* Loading spinner */}
          {loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: 'var(--card)' }}>
              <Loader2 size={28} className="animate-spin" style={{ color: 'var(--sanlam-teal)' }} />
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10" style={{ background: 'var(--card)' }}>
              <AlertCircle size={32} style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Unable to preview this file</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl"
                style={{ background: 'rgba(0,181,237,0.1)', color: 'var(--sanlam-teal)', border: '1px solid rgba(0,181,237,0.3)' }}
              >
                <ExternalLink size={13} /> Open in new tab
              </a>
            </div>
          )}

          {isPDF ? (
            <object
              data={url}
              type="application/pdf"
              style={{ width: '100%', height: '100%', display: 'block' }}
              onLoad={() => setLoading(false)}
              onError={() => { setLoading(false); setError(true); }}
            >
              {/* Fallback if object tag not supported */}
              <div
                className="flex flex-col items-center justify-center gap-3 h-full"
                style={{ color: 'var(--text-muted)' }}
                ref={() => { setLoading(false); setError(true); }}
              >
              </div>
            </object>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt="B-BBEE Certificate"
              style={{
                display:    loading || error ? 'none' : 'block',
                maxWidth:   '100%',
                margin:     '0 auto',
                padding:    '24px',
                objectFit:  'contain',
              }}
              onLoad={() => setLoading(false)}
              onError={() => { setLoading(false); setError(true); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
