'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle, TrendingDown, Clock, ChevronRight,
} from 'lucide-react';
import { usePMData } from '@/hooks/usePMData';
import { SDG_LIST } from '@/lib/sdg';
import SDGIcon from '@/components/sdg/SDGIcon';
import { SkeletonCard } from '@/components/shared/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import PageContext from '@/components/shared/PageContext';
import { toDisplay } from '@/lib/score';

type AlertSeverity = 'critical' | 'warning' | 'info';

interface Alert {
  id:         string;
  companyId:  string;
  company:    string;
  sector:     string;
  severity:   AlertSeverity;
  type:       'low_score' | 'declining' | 'no_data' | 'below_avg';
  title:      string;
  detail:     string;
  sdgId?:     number;
}

function formatSector(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const SEVERITY_META: Record<AlertSeverity, { icon: typeof AlertTriangle; bg: string; border: string; color: string; label: string }> = {
  critical: {
    icon:   AlertTriangle,
    bg:     'rgba(208,2,27,0.06)',
    border: 'rgba(208,2,27,0.20)',
    color:  '#D0021B',
    label:  'Critical',
  },
  warning: {
    icon:   AlertTriangle,
    bg:     'rgba(232,160,32,0.06)',
    border: 'rgba(232,160,32,0.20)',
    color:  '#E8A020',
    label:  'Warning',
  },
  info: {
    icon:   Clock,
    bg:     'rgba(0,181,237,0.06)',
    border: 'rgba(0,181,237,0.20)',
    color:  '#00B5ED',
    label:  'Info',
  },
};

export default function AlertsPage() {
  const router = useRouter();
  const { portfolio, loading, error } = usePMData();

  const alerts = useMemo<Alert[]>(() => {
    const result: Alert[] = [];

    for (const { company, scorecard } of portfolio) {

      /* No data at all */
      if (!scorecard) {
        result.push({
          id:        `${company.id}_no_data`,
          companyId: company.id,
          company:   company.name,
          sector:    company.sector,
          severity:  'info',
          type:      'no_data',
          title:     'No impact report submitted',
          detail:    `${company.name} has not yet submitted an impact report. Scores cannot be calculated.`,
        });
        continue;
      }

      /* Overall score critical (Low) */
      if (scorecard.overallScore < 1.6) {
        result.push({
          id:        `${company.id}_low_overall`,
          companyId: company.id,
          company:   company.name,
          sector:    company.sector,
          severity:  'critical',
          type:      'low_score',
          title:     `Overall score critically low (${toDisplay(scorecard.overallScore)}/100)`,
          detail:    `${company.name}'s overall SDG score is ${toDisplay(scorecard.overallScore)}/100, classified as Low. Immediate portfolio review recommended.`,
        });
      } else if (scorecard.overallScore < 1.9) {
        /* Overall score warning */
        result.push({
          id:        `${company.id}_warn_overall`,
          companyId: company.id,
          company:   company.name,
          sector:    company.sector,
          severity:  'warning',
          type:      'low_score',
          title:     `Overall score below target (${toDisplay(scorecard.overallScore)}/100)`,
          detail:    `${company.name} is scoring ${toDisplay(scorecard.overallScore)}/100, below the Medium threshold. Monitor closely.`,
        });
      }

      /* Individual SDG alerts */
      for (const sdg of scorecard.sdgScores) {
        if (sdg.score < 1.3) {
          const sdgMeta = SDG_LIST.find(d => d.id === sdg.sdgId);
          result.push({
            id:        `${company.id}_sdg_${sdg.sdgId}_critical`,
            companyId: company.id,
            company:   company.name,
            sector:    company.sector,
            severity:  'critical',
            type:      'low_score',
            sdgId:     sdg.sdgId,
            title:     `SDG ${sdg.sdgId} critically low (${toDisplay(sdg.score)}/100)`,
            detail:    `${company.name} scored ${toDisplay(sdg.score)}/100 on ${sdgMeta?.shortName ?? `SDG ${sdg.sdgId}`}, significantly below sector average of ${toDisplay(sdg.sectorAvg)}.`,
          });
        } else if (sdg.score < 1.6) {
          const sdgMeta = SDG_LIST.find(d => d.id === sdg.sdgId);
          result.push({
            id:        `${company.id}_sdg_${sdg.sdgId}_warn`,
            companyId: company.id,
            company:   company.name,
            sector:    company.sector,
            severity:  'warning',
            type:      'low_score',
            sdgId:     sdg.sdgId,
            title:     `SDG ${sdg.sdgId} below sector average`,
            detail:    `${company.name} scored ${toDisplay(sdg.score)}/100 on ${sdgMeta?.shortName ?? `SDG ${sdg.sdgId}`} vs sector avg ${toDisplay(sdg.sectorAvg)}.`,
          });
        }

        /* Declining trend */
        if (sdg.trend === 'down') {
          const sdgMeta = SDG_LIST.find(d => d.id === sdg.sdgId);
          result.push({
            id:        `${company.id}_sdg_${sdg.sdgId}_trend`,
            companyId: company.id,
            company:   company.name,
            sector:    company.sector,
            severity:  'warning',
            type:      'declining',
            sdgId:     sdg.sdgId,
            title:     `Declining trend on SDG ${sdg.sdgId}`,
            detail:    `${company.name} shows a downward trend on ${sdgMeta?.shortName ?? `SDG ${sdg.sdgId}`}. Score is ${toDisplay(sdg.score)}/100 vs sector avg ${toDisplay(sdg.sectorAvg)}.`,
          });
        }
      }
    }

    /* Sort: critical first, then warning, then info */
    const order: AlertSeverity[] = ['critical', 'warning', 'info'];
    result.sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));

    return result;
  }, [portfolio]);

  const counts = useMemo(() => ({
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning:  alerts.filter(a => a.severity === 'warning').length,
    info:     alerts.filter(a => a.severity === 'info').length,
  }), [alerts]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <SkeletonCard className="h-20" />
        {[0, 1, 2, 3].map(i => <SkeletonCard key={i} className="h-20" />)}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="🔔"
        title="Unable to load alerts"
        description="Portfolio data could not be loaded."
      />
    );
  }

  if (alerts.length === 0) {
    return (
      <EmptyState
        icon="✅"
        title="No alerts"
        description="All companies in your portfolio are performing at or above threshold."
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-page-in">

      <PageContext>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Auto-generated from live portfolio scores
        </span>
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
        <span
          className="flex items-center gap-1.5 text-xs font-medium"
          style={{ color: 'var(--sanlam-green)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--sanlam-green)' }} />
          Live
        </span>
      </PageContext>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        {([
          { severity: 'critical' as AlertSeverity, count: counts.critical, label: 'Critical' },
          { severity: 'warning'  as AlertSeverity, count: counts.warning,  label: 'Warnings' },
          { severity: 'info'     as AlertSeverity, count: counts.info,     label: 'Info'     },
        ]).map(({ severity, count, label }, idx) => {
          const m = SEVERITY_META[severity];
          return (
            <div
              key={severity}
              className="card px-4 py-3 flex items-center gap-2 animate-card-in"
              style={{ background: m.bg, border: `1px solid ${m.border}`, animationDelay: `${idx * 50}ms` }}
            >
              <m.icon size={16} style={{ color: m.color }} />
              <span className="text-sm font-bold" style={{ color: m.color }}>{count}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {alerts.map((alert, idx) => {
          const m   = SEVERITY_META[alert.severity];
          const sdg = alert.sdgId ? SDG_LIST.find(d => d.id === alert.sdgId) : null;

          return (
            <button
              key={alert.id}
              onClick={() => router.push(`/company/${alert.companyId}`)}
              className="card card-interactive w-full text-left p-4 animate-card-in"
              style={{
                background:   m.bg,
                border:       `1px solid ${m.border}`,
                animationDelay: `${idx * 30}ms`,
              }}
            >
              <div className="flex items-start gap-3">
                {/* Severity icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${m.color}15` }}
                >
                  {alert.type === 'declining' ? (
                    <TrendingDown size={15} style={{ color: m.color }} />
                  ) : (
                    <m.icon size={15} style={{ color: m.color }} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                      style={{ background: `${m.color}15`, color: m.color }}
                    >
                      {m.label}
                    </span>
                    {sdg && (
                      <SDGIcon sdgId={sdg.id} size={20} />
                    )}
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {alert.title}
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{alert.detail}</p>
                  <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--sanlam-teal)' }}>
                    {alert.company} · {formatSector(alert.sector)}
                  </p>
                </div>

                <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        Click any alert to view the full company detail page
      </p>

    </div>
  );
}
