import { useEffect, useRef, useState, useCallback } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";

interface AetherStatsData {
  active_sessions: number;
  history_sessions: number;
  total_events: number;
  active_traffic: {
    input_octets: number;
    output_octets: number;
    input_packets: number;
    output_packets: number;
  };
}

interface TrafficPoint {
  ts: string;
  bytes_in: number;
  bytes_out: number;
  bps_in: number;
  bps_out: number;
  bps_total: number;
}

interface TrafficSeriesData {
  range: string;
  bucket_seconds: number;
  data: TrafficPoint[];
  count: number;
}

export interface AetherStatsProps {
  baseUrl: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(2))} ${sizes[idx]}`;
}

function formatBps(bps: number): string {
  if (bps === 0) return "0";
  const k = 1000;
  const sizes = ["", "K", "M", "G"];
  const i = Math.floor(Math.log(bps) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${parseFloat((bps / Math.pow(k, idx)).toFixed(1))} ${sizes[idx]}`;
}

function TrafficChart({ data }: { data: TrafficPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<uPlot | null>(null);

  const isDark = useCallback(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.getAttribute("data-theme") === "dark";
  }, []);

  useEffect(() => {
    if (!containerRef.current || data.length < 2) return;

    const timestamps = data.map(d => Math.floor(new Date(d.ts).getTime() / 1000));
    const bytesIn = data.map(d => d.bytes_in);
    const bytesOut = data.map(d => d.bytes_out);
    const plotData: uPlot.AlignedData = [timestamps, bytesIn, bytesOut];

    const dark = isDark();
    const axisColor = dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)";
    const inColor = dark ? "#60a5fa" : "#93c5fd";
    const outColor = dark ? "#fb923c" : "#fdba74";

    const opts: uPlot.Options = {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      padding: [8, 0, 0, 0],
      legend: { show: false },
      cursor: {
        y: false,
        points: { show: false },
        drag: { x: true, y: false, setScale: false },
      },
      select: {
        show: true,
        left: 0,
        top: 0,
        width: 0,
        height: 0,
      },
      scales: {
        x: { time: true },
        y: { auto: true },
      },
      axes: [
        {
          show: false,
          stroke: "transparent",
          grid: { show: true, stroke: axisColor, width: 1 },
          ticks: { show: false },
          values: () => [],
          size: 0,
          gap: 0,
          space: 30,
        },
        {
          show: true,
          stroke: "transparent",
          grid: { show: true, stroke: axisColor, width: 1 },
          ticks: { show: true },
          values: () => [],
          size: 0,
          gap: 0,
          space: 10,
        },
      ],
      series: [
        {},
        {
          label: "In",
          stroke: inColor,
          fill: dark ? "rgba(96,165,250,0.08)" : "rgba(147,197,253,0.15)",
          width: 1.5,
        },
        {
          label: "Out",
          stroke: outColor,
          fill: dark ? "rgba(251,146,60,0.08)" : "rgba(253,186,116,0.15)",
          width: 1.5,
        },
      ],
      hooks: {
        setCursor: [
          (u: uPlot) => {
            const tooltip = containerRef.current?.querySelector<HTMLDivElement>(".aether-tooltip");
            if (!tooltip) return;

            // If there's an active selection, don't update tooltip from cursor
            if (u.select.width > 0) return;

            const tsLabel = containerRef.current?.querySelector<HTMLDivElement>(".aether-ts");

            const idx = u.cursor.idx;
            if (idx == null) {
              tooltip.style.display = "none";
              if (tsLabel) tsLabel.style.display = "none";
              return;
            }

            // Update timestamp label
            if (tsLabel) {
              const ts = u.data[0][idx];
              const date = new Date(ts * 1000);
              tsLabel.style.display = "block";
              tsLabel.textContent = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
            }

            const inVal = u.data[1][idx] ?? 0;
            const outVal = u.data[2][idx] ?? 0;

            tooltip.style.display = "block";
            tooltip.innerHTML = `
              <span style="color:${inColor}">In: ${formatBytes(inVal)}</span>
              <span style="color:${outColor}">Out: ${formatBytes(outVal)}</span>
            `;

            const left = u.cursor.left ?? 0;
            const tooltipW = tooltip.offsetWidth;
            const containerW = containerRef.current?.clientWidth ?? 0;
            const clampedLeft = Math.min(Math.max(left - tooltipW / 2, 0), containerW - tooltipW);
            tooltip.style.left = `${clampedLeft}px`;
          },
        ],
        setSelect: [
          (u: uPlot) => {
            const tooltip = containerRef.current?.querySelector<HTMLDivElement>(".aether-tooltip");
            const tsLabel = containerRef.current?.querySelector<HTMLDivElement>(".aether-ts");
            if (!tooltip) return;

            const sel = u.select;
            if (sel.width <= 0) {
              tooltip.style.display = "none";
              if (tsLabel) tsLabel.style.display = "none";
              return;
            }

            // Find index range from pixel selection
            const minX = u.posToVal(sel.left, "x");
            const maxX = u.posToVal(sel.left + sel.width, "x");

            // Show time range in timestamp label
            if (tsLabel) {
              const fmt = (t: number) => new Date(t * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
              tsLabel.style.display = "block";
              tsLabel.textContent = `${fmt(minX)} — ${fmt(maxX)}`;
            }

            let totalIn = 0;
            let totalOut = 0;
            for (let i = 0; i < u.data[0].length; i++) {
              const t = u.data[0][i];
              if (t >= minX && t <= maxX) {
                totalIn += u.data[1][i] ?? 0;
                totalOut += u.data[2][i] ?? 0;
              }
            }

            tooltip.style.display = "block";
            tooltip.innerHTML = `
              <span style="color:${inColor}">In: ${formatBytes(totalIn)}</span>
              <span style="color:${outColor}">Out: ${formatBytes(totalOut)}</span>
              <span style="color:${dark ? "#9ca3af" : "#6b7280"}">Total: ${formatBytes(totalIn + totalOut)}</span>
            `;

            const center = sel.left + sel.width / 2;
            const tooltipW = tooltip.offsetWidth;
            const containerW = containerRef.current?.clientWidth ?? 0;
            const clampedLeft = Math.min(Math.max(center - tooltipW / 2, 0), containerW - tooltipW);
            tooltip.style.left = `${clampedLeft}px`;
          },
        ],
      },
    };

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new uPlot(opts, plotData, containerRef.current);

    // Style the selection overlay
    const selectEl = containerRef.current.querySelector<HTMLDivElement>(".u-select");
    if (selectEl) {
      selectEl.style.background = dark
        ? "rgba(96,165,250,0.12)"
        : "rgba(147,197,253,0.2)";
    }

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (chartRef.current) {
          chartRef.current.setSize({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data, isDark]);

  if (data.length < 2) return null;

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <div
        className="aether-ts absolute top-1 left-1 pointer-events-none z-10 rounded px-1 py-0.5 text-[9px] font-mono text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-900/80"
        style={{ display: "none" }}
      />
      <div
        className="aether-tooltip absolute top-1 pointer-events-none z-10 flex gap-2 rounded px-1.5 py-0.5 text-[10px] font-mono bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 shadow-sm"
        style={{ display: "none" }}
      />
    </div>
  );
}

function AetherStatsLoading() {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/60 px-3 py-2 mb-4 animate-pulse not-prose">
      <div className="h-3 w-28 rounded bg-gray-200 dark:bg-gray-700 mb-1" />
      <div className="flex items-center gap-2 h-24">
        <div className="flex flex-col gap-1.5 w-44 shrink-0">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-2.5 rounded bg-gray-200 dark:bg-gray-700 w-full" />
          ))}
        </div>
        <div className="flex-1 h-full rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}

function AetherStatsRedeploying({ baseUrl }: { baseUrl: string }) {
  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/40 px-3 py-2 mb-4 not-prose">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium uppercase tracking-wider">
          Aether is redeploying
        </span>
      </div>
      <div className="flex items-center gap-2 py-2">
        <svg className="animate-spin h-4 w-4 text-amber-500 dark:text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-xs text-amber-600 dark:text-amber-300">
          The server is restarting. Stats will appear once it's back online.
        </span>
      </div>
      <a
        href={baseUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] text-amber-400 dark:text-amber-500 hover:text-amber-600 dark:hover:text-amber-300 transition-colors no-underline"
      >
        aether.saphal.me
      </a>
    </div>
  );
}

export function AetherStats({ baseUrl }: AetherStatsProps) {
  const [stats, setStats] = useState<AetherStatsData | null>(null);
  const [series, setSeries] = useState<TrafficSeriesData | null>(null);
  const [error, setError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchData() {
    try {
      const [statsRes, seriesRes] = await Promise.all([
        fetch(`${baseUrl}/api/stats`),
        fetch(`${baseUrl}/api/stats/traffic-series?range=1h&bucket_seconds=10`),
      ]);

      if (!statsRes.ok || !seriesRes.ok) {
        setError(true);
        return;
      }

      const statsData: AetherStatsData = await statsRes.json();
      const seriesData: TrafficSeriesData = await seriesRes.json();

      setStats(statsData);
      setSeries(seriesData);
      setError(false);
    } catch {
      setError(true);
    }
  }

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [baseUrl]);

  if (error) return <AetherStatsRedeploying baseUrl={baseUrl} />;
  if (!stats || !series) return <AetherStatsLoading />;

  const currentIn = series.data.length > 0
    ? series.data[series.data.length - 1].bps_in
    : 0;
  const currentOut = series.data.length > 0
    ? series.data[series.data.length - 1].bps_out
    : 0;

  const statRows: { label: string; value: string }[] = [
    { label: "Active Sessions", value: String(stats.active_sessions) },
    { label: "Total Sessions", value: stats.history_sessions.toLocaleString() },
    { label: "Session Events", value: stats.total_events.toLocaleString() },
    { label: "Down since uptime", value: `${formatBps(stats.active_traffic.input_octets)}b` },
    { label: "Up since uptime", value: `${formatBps(stats.active_traffic.output_octets)}b` },
  ];

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/60 px-3 py-2 mb-4 not-prose">
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[10px] text-gray-700 dark:text-gray-300 underline font-medium uppercase tracking-wider">
          Aether's current status
        </span>
      </div>

      {/* Single horizontal layout: stats left, chart right */}
      <div className="flex items-stretch gap-2">
        {/* Left: stat rows */}
        <div className="flex flex-col justify-between shrink-0 py-3 gap-0.5 flex-1">
          {statRows.map(({ label, value }) => (
            <div key={label} className="flex items-baseline gap-2.5">
              <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium text-right">
                {label}:
              </span>
              <span className="text-xs text-gray-900 dark:text-gray-100 font-bold tabular-nums font-mono">
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Right: chart */}
        <div className="flex-3 min-w-0 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden h-32">
          <TrafficChart data={series.data} />
        </div>
      </div>

      {/* Footer legend */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex flex-row items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <a
            href={baseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-blue-400 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors hover:underline"
          >
            aether.saphal.me | Go to dashboard
          </a>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-0.5 rounded-full bg-blue-300 dark:bg-blue-400" />
            <span className="text-[9px] text-gray-400 dark:text-gray-500">In</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-0.5 rounded-full bg-orange-300 dark:bg-orange-400" />
            <span className="text-[9px] text-gray-400 dark:text-gray-500">Out</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AetherStats;
