import { useMemo } from 'react';
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { useSessionAnalysis } from './useSessionAnalysis';

const formatDuration = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

type BurstPoint = {
  id: string;
  durationSec: number;
  charCount: number;
  eventCount: number;
  label: string;
};

const BurstTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as BurstPoint;

  return (
    <div className="rounded-lg border border-slate-200 bg-white/90 p-3 text-xs text-slate-600 shadow-lg">
      <p className="font-semibold text-slate-900">{point.label}</p>
      <p>Duration: {point.durationSec.toFixed(1)}s</p>
      <p>Chars: {point.charCount.toLocaleString()}</p>
      <p>Events: {point.eventCount}</p>
    </div>
  );
};

const BurstVarianceCard = () => {
  const analysis = useSessionAnalysis();
  const { burstSummary, bursts } = analysis;

  const scatterData = useMemo<BurstPoint[]>(() => {
    if (!bursts.length) return [];
    return bursts.map((burst, index) => ({
      id: `${burst.start}-${burst.end}-${index}`,
      durationSec: burst.durationMs / 1000,
      charCount: burst.charCount,
      eventCount: burst.eventCount,
      label: `Burst ${index + 1}`,
    }));
  }, [bursts]);

  const varianceWidth = Math.max(Math.min(burstSummary.variance, 1), 0) * 100;

  return (
    <section
      id="analysis-burst-card"
      className="space-y-4 rounded-3xl border border-sky-100 bg-white p-6 shadow-sm"
      data-testid="burst-variance-card"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-sky-500">Burst variety</p>
          <h3 className="text-xl font-semibold text-slate-900">Rhythm map</h3>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Variance score</p>
          <p className="text-3xl font-semibold text-slate-900">{burstSummary.variance.toFixed(2)}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-slate-600">
          Each dot is a typing burst—longer durations on the right, richer char counts higher up. Organic drafting scatters diagonally, while tight clusters hint at scripted pacing.
        </p>
        <div className="rounded-2xl border border-dashed border-slate-200 bg-sky-50/70 p-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-900">Thresholds</p>
          <p>Strong: variance ≥0.40 means bursts differ in size and pacing.</p>
          <p>Risk: variance &lt;0.20 across 3+ bursts flags rote transcription.</p>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Variance against target (0.40+)</p>
        <div className="mt-2 h-2 rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-sky-500" style={{ width: `${varianceWidth}%` }} aria-label="Burst variance gauge" />
        </div>
      </div>

      {scatterData.length ? (
        <div>
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
            <span>Burst scatter (duration vs. chars)</span>
            <span className="text-slate-400">Dot size = events</span>
          </div>
          <div className="mt-3 h-64" data-testid="burst-scatter-plot" role="img" aria-label="Burst scatter plot showing duration vs characters">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 12, left: -10, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey="durationSec"
                  name="Duration"
                  unit="s"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5f5' }}
                />
                <YAxis
                  type="number"
                  dataKey="charCount"
                  name="Characters"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5f5' }}
                />
                <ZAxis type="number" dataKey="eventCount" range={[60, 160]} />
                <Tooltip cursor={{ strokeDasharray: '4 2', stroke: '#94a3b8' }} content={<BurstTooltip />} />
                <Scatter data={scatterData} fill="#0ea5e9" fillOpacity={0.85} stroke="#0284c7" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          We need a few typing bursts before we can chart variance—ask the student to write longer or capture another replay.
        </p>
      )}

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Total bursts</dt>
          <dd className="text-lg font-semibold text-slate-900">{burstSummary.totalBursts}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Avg events/burst</dt>
          <dd className="text-lg font-semibold text-slate-900">{burstSummary.averageEventsPerBurst.toFixed(1)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Avg chars/burst</dt>
          <dd className="text-lg font-semibold text-slate-900">{burstSummary.averageCharsPerBurst.toFixed(0)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Avg duration</dt>
          <dd className="text-lg font-semibold text-slate-900">{formatDuration(burstSummary.averageDurationMs)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Longest duration</dt>
          <dd className="text-lg font-semibold text-slate-900">{formatDuration(burstSummary.longestBurstDurationMs)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Largest burst</dt>
          <dd className="text-lg font-semibold text-slate-900">{burstSummary.longestBurstChars} chars</dd>
        </div>
      </dl>
    </section>
  );
};

export default BurstVarianceCard;
