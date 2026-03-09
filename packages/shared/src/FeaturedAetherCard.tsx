import { useEffect, useRef, useState, useCallback } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import AetherLogo from "./assets/aether_logo.svg?url";

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

export interface FeaturedAetherCardProps {
  baseUrl: string;
  githubUrl?: string;
  dashboardUrl?: string;
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

  const dataRef = useRef(data);
  dataRef.current = data;

  // Build uPlot options (stable reference via useCallback to avoid re-creating on every render)
  const buildOpts = useCallback((width: number, height: number) => {
    const dark = isDark();
    const axisColor = dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)";
    const inColor = dark ? "#60a5fa" : "#93c5fd";
    const outColor = dark ? "#fb923c" : "#fdba74";

    const opts: uPlot.Options = {
      width,
      height,
      padding: [8, 0, 0, 0],
      legend: { show: false },
      cursor: {
        y: false,
        points: { show: false },
        drag: { x: true, y: false, setScale: false },
      },
      select: { show: true, left: 0, top: 0, width: 0, height: 0 },
      scales: { x: { time: true }, y: { auto: true } },
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
            if (u.select.width > 0) return;

            const tsLabel = containerRef.current?.querySelector<HTMLDivElement>(".aether-ts");
            const idx = u.cursor.idx;
            if (idx == null) {
              tooltip.style.display = "none";
              if (tsLabel) tsLabel.style.display = "none";
              return;
            }

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

            const minX = u.posToVal(sel.left, "x");
            const maxX = u.posToVal(sel.left + sel.width, "x");

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
    return { opts, dark };
  }, [isDark]);

  // Helper to build plot data from current data ref
  const buildPlotData = useCallback((): uPlot.AlignedData => {
    const d = dataRef.current;
    return [
      d.map(p => Math.floor(new Date(p.ts).getTime() / 1000)),
      d.map(p => p.bytes_in),
      d.map(p => p.bytes_out),
    ];
  }, []);

  // Create chart via ResizeObserver so we never init with 0 dimensions
  useEffect(() => {
    if (!containerRef.current || data.length < 2) return;

    const container = containerRef.current;

    function createOrResize(width: number, height: number) {
      // Skip zero dimensions — layout hasn't settled yet
      if (width < 1 || height < 1) return;

      if (chartRef.current) {
        chartRef.current.setSize({ width, height });
        return;
      }

      // First time: create the chart
      const { opts, dark } = buildOpts(width, height);
      chartRef.current = new uPlot(opts, buildPlotData(), container);

      const selectEl = container.querySelector<HTMLDivElement>(".u-select");
      if (selectEl) {
        selectEl.style.background = dark
          ? "rgba(96,165,250,0.12)"
          : "rgba(147,197,253,0.2)";
      }
    }

    // Try immediate init if dimensions are already valid
    createOrResize(container.clientWidth, container.clientHeight);

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        createOrResize(entry.contentRect.width, entry.contentRect.height);
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data, buildOpts, buildPlotData]);

  // Update chart data without recreating when data changes and chart already exists
  useEffect(() => {
    if (chartRef.current && data.length >= 2) {
      chartRef.current.setData(buildPlotData());
    }
  }, [data, buildPlotData]);

  if (data.length < 2) return null;

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <div
        className="aether-ts absolute top-1 left-1 pointer-events-none z-10 rounded px-1 py-0.5 text-[9px] font-mono text-gray-500 bg-white/80"
        style={{ display: "none" }}
      />
      <div
        className="aether-tooltip absolute top-1 pointer-events-none z-10 flex gap-2 rounded px-1.5 py-0.5 text-[10px] font-mono bg-white/90 border border-gray-200 shadow-sm"
        style={{ display: "none" }}
      />
    </div>
  );
}

interface MetricRow {
  label: string;
  value: string;
  variant: "teal" | "blue" | "default";
}

function computeMetrics(stats: AetherStatsData): MetricRow[] {
  return [
    {
      label: "Active Sessions",
      value: String(stats.active_sessions),
      variant: "teal",
    },
    {
      label: "Total Sessions",
      value: stats.history_sessions.toLocaleString(),
      variant: "default",
    },
    {
      label: "Session Events",
      value: stats.total_events.toLocaleString(),
      variant: "blue",
    },
    {
      label: "Down since uptime",
      value: `${formatBps(stats.active_traffic.input_octets)}b`,
      variant: "default",
    },
    {
      label: "Up since uptime",
      value: `${formatBps(stats.active_traffic.output_octets)}b`,
      variant: "default",
    },
  ];
}

const VALUE_VARIANT_CLASSES: Record<MetricRow["variant"], string> = {
  teal: "text-teal-600",
  blue: "text-blue-600",
  default: "text-gray-900",
};

function formatDate(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
}

const PLACEHOLDER_METRICS: MetricRow[] = [
  { label: "Active Sessions", value: "—", variant: "teal" },
  { label: "Total Sessions", value: "—", variant: "default" },
  { label: "Session Events", value: "—", variant: "blue" },
  { label: "Down since uptime", value: "—", variant: "default" },
  { label: "Up since uptime", value: "—", variant: "default" },
];

const TECH_STACK = ["Python", "Containerlab", "RADIUS", "Distributed systems", "nftables", "Go", "Hetzner Cloud"];

export function FeaturedAetherCard({
  baseUrl,
  githubUrl = "https://github.com/saphalpdyl/Aether",
  dashboardUrl,
}: FeaturedAetherCardProps) {
  const [stats, setStats] = useState<AetherStatsData | null>(null);
  const [series, setSeries] = useState<TrafficSeriesData | null>(null);
  const [error, setError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resolvedDashboardUrl = dashboardUrl ?? baseUrl;

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

  const metrics = stats ? computeMetrics(stats) : PLACEHOLDER_METRICS;
  const isLive = !error && stats !== null;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-3 transition-all hover:border-gray-300 bg-white text-sm leading-relaxed text-gray-900 font-serif">
      {/* Main inner grid */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_272px]">
        {/* Left: project info */}
        <div className="p-5 pb-5 md:border-r border-b md:border-b-0 border-gray-200 flex flex-col">
          {/* Top row: logo + badge */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex flex-col gap-0.5">
              <a
                href={resolvedDashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline hover:opacity-80 transition-opacity leading-tight"
              >
                <img src={AetherLogo} alt="Aether" className="h-[18px] w-auto" />
              </a>
              <span className="text-[11.5px] text-gray-400 mb-3">
                saphalpdyl/Aether
              </span>
            </div>

            {/* Live badge */}
            <div
              className={`inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-wider rounded px-2 py-0.5 whitespace-nowrap shrink-0 mt-0.5 ${
                isLive
                  ? "text-teal-600 bg-teal-50 border border-teal-200"
                  : "text-gray-500 bg-gray-100 border border-gray-200"
              }`}
            >
              {isLive && (
                <span className="w-[5px] h-[5px] rounded-full bg-teal-600 animate-pulse" />
              )}
              {isLive ? "Live" : "Offline"}
            </div>
          </div>

          {/* Description */}
          <div className="text-md text-gray-600 leading-relaxed mb-4 flex-1">
            A full-stack ISP simulation built from scratch — custom BNG routers, raw socket DHCP interception with Option 82, RADIUS auth, and per-subscriber traffic shaping via nftables. Python control plane, Redis Streams event sourcing, Containerlab topology on Hetzner. <br />Real NOC tooling, real networking stack.
          </div>

          {/* Tech stack pills */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {TECH_STACK.map((tech) => (
              <span
                key={tech}
                className="text-xs px-2 rounded-xl bg-gray-100 text-gray-700 border border-gray-200"
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 items-center flex-wrap">
            <a
              href={resolvedDashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-white no-underline inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-blue-700 rounded-[5px] bg-blue-700 hover:bg-blue-800 hover:border-blue-800 transition-colors"
            >
              Go to Aether
            </a>
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-blue-700 no-underline inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-gray-200 rounded-[5px] bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
              GitHub
            </a>
          </div>
        </div>

        {/* Right: live status panel */}
        <div className="p-5 pb-4 flex flex-col bg-gray-50/80">
          {error ? (
            /* Redeploying state */
            <div className="flex flex-col flex-1">
              <div className="flex items-center gap-1.5 mb-3 pb-2.5 border-b border-amber-200">
                <span className="text-[10px] font-mono font-medium tracking-widest uppercase text-amber-600">
                  Aether is redeploying
                </span>
              </div>
              <div className="flex items-center gap-2 py-4 flex-1">
                <svg className="animate-spin h-4 w-4 text-amber-500 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-xs text-amber-600">
                  The server is restarting. Stats will appear once it's back online.
                </span>
              </div>
              <div className="pt-2.5 border-t border-amber-200 mt-auto">
                <a
                  href={baseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-amber-500 no-underline hover:text-amber-700 hover:underline"
                >
                  aether.saphal.me
                </a>
              </div>
            </div>
          ) : !stats || !series ? (
            /* Loading skeleton */
            <div className="flex flex-col flex-1 animate-pulse">
              <div className="h-3 w-32 rounded bg-gray-200 mb-4" />
              <div className="flex flex-col gap-2 mb-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-2.5 rounded bg-gray-200 w-full" />
                ))}
              </div>
              <div className="flex-1 rounded bg-gray-200 min-h-[96px]" />
            </div>
          ) : (
            /* Live status */
            <>
              {/* Status header */}
              <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-gray-200">
                <span className="text-[10px] font-mono font-medium tracking-widest uppercase text-gray-500 underline underline-offset-[3px] decoration-gray-200">
                  Aether's Current Status
                </span>
              </div>

              {/* Metric rows */}
              <div className="flex flex-col mb-3">
                {metrics.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[1fr_auto] items-center gap-2 pb-1 text-[11px] font-mono"
                  >
                    <span className="text-gray-500">{row.label}</span>
                    <span className={`font-mono text-xs font-semibold text-right ${VALUE_VARIANT_CLASSES[row.variant]}`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Traffic chart */}
              <div className="rounded border border-gray-200 bg-white overflow-hidden h-24 mb-2">
                {series.data.length >= 2 ? (
                  <TrafficChart data={series.data} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[10px] text-gray-400 font-mono">No traffic data yet</span>
                  </div>
                )}
              </div>

              {/* Chart legend */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2.5 h-0.5 rounded-full bg-blue-300" />
                  <span className="text-[9px] text-gray-400">In</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2.5 h-0.5 rounded-full bg-orange-300" />
                  <span className="text-[9px] text-gray-400">Out</span>
                </div>
              </div>

              {/* Footer links */}
              <div className="flex items-center justify-between pt-2.5 border-t border-gray-200 mt-auto">
                <div className="flex items-center">
                  <a
                    href={baseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-700 no-underline hover:underline flex items-center gap-1"
                  >
                    aether.saphal.me
                  </a>
                  <span className="text-gray-400 text-[11px] mx-1.5">|</span>
                  <a
                    href={resolvedDashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-700 no-underline hover:underline flex items-center gap-1"
                  >
                    Go to dashboard
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default FeaturedAetherCard;
