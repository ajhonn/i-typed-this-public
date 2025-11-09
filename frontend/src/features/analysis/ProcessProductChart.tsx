import { useMemo } from 'react';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import type { TooltipProps } from 'recharts';
import { useSessionAnalysis } from './useSessionAnalysis';

type ChartDatum = {
  seconds: number;
  produced: number;
  product: number;
};

const formatSeconds = (value: number) => {
  if (value < 60) {
    return `${value.toFixed(value < 10 ? 1 : 0)}s`;
  }
  const minutes = Math.floor(value / 60);
  const seconds = Math.round(value % 60);
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
};

const ProcessTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  const produced = payload.find((item) => item.dataKey === 'produced');
  const product = payload.find((item) => item.dataKey === 'product');
  const seconds = payload[0]?.payload?.seconds ?? 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-md">
      <p className="font-semibold">{formatSeconds(seconds)}</p>
      <p className="text-emerald-600">Process: {produced?.value?.toLocaleString() ?? 0} chars</p>
      <p className="text-slate-600">Product: {product?.value?.toLocaleString() ?? 0} chars</p>
    </div>
  );
};

const ProcessProductChart = () => {
  const analysis = useSessionAnalysis();
  const { chartData, producedTotal, productTotal } = useMemo(() => {
    const timeline = analysis.processProductTimeline ?? [];
    const data: ChartDatum[] = timeline.map((point) => ({
      seconds: Math.max(point.elapsedMs, 0) / 1000,
      produced: point.producedChars,
      product: point.documentChars,
    }));
    const last = timeline.length ? timeline[timeline.length - 1] : undefined;
    return {
      chartData: data,
      producedTotal: last?.producedChars ?? 0,
      productTotal: last?.documentChars ?? 0,
    };
  }, [analysis.processProductTimeline]);

  const hasData = chartData.length > 1 || producedTotal > 0 || productTotal > 0;
  const ratio = analysis.signals.productProcessRatio ?? 0;

  return (
    <section id="analysis-process-card" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" data-testid="process-product-chart">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Process vs. product</p>
          <h3 className="text-xl font-semibold text-slate-900">Did they type more than what survived?</h3>
          <p className="mt-2 text-sm text-slate-600">
            Green shows cumulative characters typed (process). Navy shows the evolving document length (product). Healthy drafting keeps the green line above
            the navy line—copy/paste sessions tend to jump straight to the finish.
          </p>
        </div>
        {hasData ? (
          <div className="text-right text-sm text-slate-600">
            <p className="text-2xl font-semibold text-slate-900">{ratio.toFixed(2)}</p>
            <p className="text-xs uppercase tracking-wide">process / product ratio</p>
            <p className="text-xs text-slate-500">{producedTotal.toLocaleString()} typed · {productTotal.toLocaleString()} final chars</p>
          </div>
        ) : null}
      </div>
      <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        <p className="font-semibold text-slate-900">Thresholds</p>
        <p>Healthy drafting: ratio ≥1.05 shows extra typing beyond what shipped.</p>
        <p>Strong evidence: ratio ≥1.25 usually means iterative edits.</p>
        <p>Risk: ratio ≤1.05 with 10+ text inputs looks like direct transcription.</p>
      </div>

      {hasData ? (
        <div className="mt-6 h-72 w-full" role="img" aria-label="Process vs product timeline">
          <ResponsiveContainer width="100%" height="100%" minWidth={280} minHeight={240}>
            <LineChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="seconds"
                tickLine={false}
                axisLine={false}
                tickFormatter={formatSeconds}
                tick={{ fontSize: 12, fill: '#475569' }}
                type="number"
                domain={['auto', 'auto']}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                allowDecimals={false}
                domain={[0, 'dataMax']}
              />
              <Tooltip content={<ProcessTooltip />} cursor={{ stroke: 'rgba(148,163,184,0.4)', strokeWidth: 1 }} />
              <Line
                type="monotone"
                dataKey="produced"
                stroke="#0d9488"
                strokeWidth={2}
                dot={false}
                name="Process"
              />
              <Line
                type="monotone"
                dataKey="product"
                stroke="#1e293b"
                strokeWidth={2}
                dot={false}
                name="Product"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          We need at least one recorded typing burst to compare process vs product. Once the session runs, this chart will plot cumulative typing against the
          evolving document length.
        </p>
      )}
    </section>
  );
};

export default ProcessProductChart;
