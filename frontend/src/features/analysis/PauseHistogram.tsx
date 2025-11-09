import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import type { TooltipProps } from 'recharts';
import { useSessionAnalysis } from './useSessionAnalysis';

const formatRange = (min: number, max?: number) => {
  const format = (value: number) => (value < 1000 ? `${value} ms` : `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)} s`);
  if (max == null || !Number.isFinite(max)) {
    return `> ${format(min)}`;
  }
  return `${format(min)} - ${format(max)}`;
};

type ChartDatum = {
  bucket: string;
  count: number;
  key: string;
  range: string;
};

const PauseTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  const datum = payload[0];
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-md">
      <p className="font-semibold">{datum.payload.bucket}</p>
      <p className="text-slate-500">{datum.payload.range}</p>
      <p className="mt-1 text-slate-600">{datum.value?.toLocaleString()} pauses</p>
    </div>
  );
};

const PauseHistogram = () => {
  const analysis = useSessionAnalysis();
  const histogram = analysis.pauseHistogram;

  const { totalPauses, maxCount, chartData } = useMemo(() => {
    const data: ChartDatum[] = histogram.map((bin) => ({
      key: bin.key,
      bucket: bin.label,
      count: bin.count,
      range: formatRange(bin.rangeMs.min, bin.rangeMs.max),
    }));
    return histogram.reduce(
      (acc, bin) => {
        acc.totalPauses += bin.count;
        if (bin.count > acc.maxCount) {
          acc.maxCount = bin.count;
        }
        acc.chartData = data;
        return acc;
      },
      {
        totalPauses: 0,
        maxCount: 0,
        chartData: data,
      }
    );
  }, [histogram]);

  return (
    <section id="analysis-pause-card" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" data-testid="pause-histogram">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Pause analysis</p>
          <h3 className="text-xl font-semibold text-slate-900">Distribution of observed pauses</h3>
          <p className="mt-2 text-sm text-slate-600">
            Buckets mirror the thresholds from docs/frontend-analysis-methodology.md and the histogram call-out in docs/frontend-visualizations.md.
            Longer pre-burst pauses often signal authentic drafting.
          </p>
        </div>
        {totalPauses ? (
          <div className="text-right text-sm text-slate-600">
            <p className="text-2xl font-semibold text-slate-900">{totalPauses}</p>
            <p className="text-xs uppercase tracking-wide">pauses &gt;= 200 ms</p>
          </div>
        ) : null}
      </div>
      {totalPauses ? (
        <>
          <div className="mt-6 h-72 w-full" role="img" aria-label="Histogram of pause durations">
            <ResponsiveContainer width="100%" height="100%" minWidth={280} minHeight={240}>
              <BarChart data={chartData}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="bucket" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  domain={[0, Math.max(maxCount || 1, 1)]}
                />
                <Tooltip cursor={{ fill: 'rgba(148,163,184,0.15)' }} content={<PauseTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={24}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill="#10b981"
                      aria-label={`${entry.bucket} bucket with ${entry.count} pauses`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          We haven&apos;t recorded pauses beyond the 200 ms micro-threshold yet. Once a session runs, this histogram will highlight whether learners dwell
          before bursts or type continuously.
        </p>
      )}
      {totalPauses ? (
        <p className="mt-4 text-xs text-slate-500">
          Macro pauses (&gt;= 2 s) indicate planning time, while sustained sub-second pauses point to transcription-like flow. Hover the bars to compare exact
          counts.
        </p>
      ) : null}
    </section>
  );
};

export default PauseHistogram;
