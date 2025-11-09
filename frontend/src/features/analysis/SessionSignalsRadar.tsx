import { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useSessionAnalysis } from './useSessionAnalysis';
import { useSession } from '@features/session/SessionProvider';

const SIGNAL_LABELS: Record<string, string> = {
  pauseScore: 'Pause cadence',
  revisionScore: 'Revision rate',
  burstVariance: 'Burst variety',
  pasteRisk: 'Paste cleanliness',
  productProcess: 'Process depth',
};

type SessionSignalsRadarProps = {
  showCopy?: boolean;
  showCard?: boolean;
  height?: number;
  dataTestId?: string;
};

const VERDICT_COLOR: Record<string, { stroke: string; fill: string }> = {
  'likely-authentic': { stroke: '#059669', fill: 'rgba(16, 185, 129, 0.25)' },
  'needs-review': { stroke: '#d97706', fill: 'rgba(251, 191, 36, 0.3)' },
  'high-risk': { stroke: '#e11d48', fill: 'rgba(244, 114, 182, 0.3)' },
};

const SessionSignalsRadar = ({
  showCopy = true,
  showCard = true,
  height = 256,
  dataTestId = 'signals-radar',
}: SessionSignalsRadarProps) => {
  const analysis = useSessionAnalysis();
  const { session } = useSession();
  const hasTypingEvent = session.events.some((event) => event.type === 'text-input');

  const radarData = useMemo(() => {
    const hasSessionActivity = hasTypingEvent || analysis.segments.some((segment) => segment.type === 'typing');
    const baseMetrics = analysis.metrics
      .filter((metric) => SIGNAL_LABELS[metric.key])
      .map((metric) => ({
        key: metric.key,
        subject: SIGNAL_LABELS[metric.key] ?? metric.label,
        rawScore: metric.score ?? 0,
      }));

    const fallbackMetrics = Object.entries(SIGNAL_LABELS).map(([key, subject]) => ({
      key,
      subject,
      rawScore: hasSessionActivity ? 0 : 1,
    }));

    const sourceMetrics = baseMetrics.length ? baseMetrics : fallbackMetrics;

    return sourceMetrics.map(({ key, subject, rawScore }) => {
      const normalized = hasSessionActivity ? rawScore ?? 0 : 1;
      const paddedValue = 0.1 + normalized * 0.9;
      return {
        subject: subject ?? SIGNAL_LABELS[key] ?? 'Metric',
        value: paddedValue,
        rawScore: normalized,
      };
    });
  }, [analysis.metrics, analysis.segments, hasTypingEvent]);

  if (!radarData.length) {
    return null;
  }

  const content = (
    <>
      {showCopy ? (
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Signals summary</p>
            <h3 className="text-xl font-semibold text-slate-900">Authorship radar</h3>
            <p className="mt-2 text-sm text-slate-600">
              Each axis reflects a metric from docs/frontend-analysis-methodology.md — hover to inspect values and spot weak spots at a glance.
            </p>
          </div>
        </div>
      ) : null}
      <div className="mt-6 w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} outerRadius="80%">
            <PolarGrid stroke="#94a3b8" strokeOpacity={0.4} />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#475569' }} />
            <PolarRadiusAxis tick={false} axisLine={false} angle={90} domain={[0, 1]} />
            <Tooltip
              formatter={(value: number, _name, payload) => {
                const raw = (payload?.payload as { rawScore?: number } | undefined)?.rawScore ?? (value as number);
                return [`${Math.round(raw * 100)}%`, payload?.payload?.subject];
              }}
              contentStyle={{ borderRadius: 12, border: '1px solid #cbd5f5' }}
            />
            <Radar
              dataKey="value"
              stroke={VERDICT_COLOR[analysis.verdict]?.stroke ?? '#0ea5e9'}
              fill={VERDICT_COLOR[analysis.verdict]?.fill ?? 'rgba(14,165,233,0.3)'}
            />
         </RadarChart>
       </ResponsiveContainer>
     </div>
    </>
  );

  if (!showCard) {
    return (
      <div data-testid={dataTestId}>
        {content}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" data-testid={dataTestId}>
      {content}
    </div>
  );
};

export default SessionSignalsRadar;
