import React, { useState } from 'react';
import { CoreBottleneckStatus, CoreState, SimulationParams } from '../types/simulator';
import { Activity, Gauge, Clock, Zap, AlertTriangle, CheckCircle, ArrowUpDown, Filter, ChevronRight } from 'lucide-react';

interface MetricsLatencyThroughputProps {
  cores: CoreState[];
  params: SimulationParams;
  historyVoltages: { time: number; values: number[] }[];
  historyLatency: { time: number; avgLatency: number; maxLatency: number }[];
  historyThroughput: { time: number; throughputGflops: number }[];
  bottlenecks?: CoreBottleneckStatus[];
  onSelectCore?: (id: number | null) => void;
  selectedCoreId?: number | null;
}

export const MetricsLatencyThroughput: React.FC<MetricsLatencyThroughputProps> = ({
  cores,
  params,
  historyVoltages,
  historyLatency,
  historyThroughput,
  bottlenecks = [],
  onSelectCore,
  selectedCoreId,
}) => {
  const [sortBy, setSortBy] = useState<'id' | 'latency' | 'throughput' | 'queue'>('latency');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'bottlenecks_only'>('all');

  // Compute statistical metrics
  const latencies = cores.map((c) => c.latencyNs).sort((a, b) => a - b);
  const minLatency = latencies.length > 0 ? latencies[0] : 0;
  const p50Latency = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.5)] : 0;
  const p99Latency = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0;

  const totalSpikes = cores.reduce((sum, c) => sum + c.spikeCount, 0);
  const totalThroughputGflops = (cores.reduce((sum, c) => sum + c.throughputMOps, 0) / 1000);
  const avgFiringRate = cores.reduce((sum, c) => sum + c.firingRateHz, 0) / Math.max(1, cores.length);

  // SVG dimensions for charts
  const chartWidth = 520;
  const chartHeight = 150;

  // Build SVG path for latency time-series
  const latencyPoints = historyLatency.slice(-40);
  const maxLatRecorded = Math.max(1, ...latencyPoints.map((p) => p.maxLatency));
  const latencyPath =
    latencyPoints.length > 1
      ? latencyPoints
          .map((pt, i) => {
            const x = (i / (latencyPoints.length - 1)) * chartWidth;
            const y = chartHeight - (pt.avgLatency / (maxLatRecorded * 1.2)) * chartHeight;
            return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(10, Math.min(chartHeight - 5, y))}`;
          })
          .join(' ')
      : '';

  // Build SVG path for throughput time-series
  const tpPoints = historyThroughput.slice(-40);
  const maxTpRecorded = Math.max(0.5, ...tpPoints.map((p) => p.throughputGflops));
  const tpPath =
    tpPoints.length > 1
      ? tpPoints
          .map((pt, i) => {
            const x = (i / (tpPoints.length - 1)) * chartWidth;
            const y = chartHeight - (pt.throughputGflops / (maxTpRecorded * 1.25)) * chartHeight;
            return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(10, Math.min(chartHeight - 5, y))}`;
          })
          .join(' ')
      : '';

  // Sort and filter cores for per-core table
  const combinedList = cores.map((core) => {
    const b = bottlenecks.find((item) => item.coreId === core.id);
    return {
      core,
      bottleneck: b || {
        coreId: core.id,
        severity: 'nominal' as const,
        latencyNs: core.latencyNs,
        throughputMOps: core.throughputMOps,
        queueDepth: core.queueDepth,
        contentionPercent: 0,
        primaryCause: 'none' as const,
        recommendation: 'Operando normalmente.',
      },
    };
  });

  const filteredList = combinedList.filter((item) => {
    if (filterSeverity === 'bottlenecks_only') {
      return item.bottleneck.severity !== 'nominal';
    }
    return true;
  });

  filteredList.sort((a, b) => {
    if (sortBy === 'latency') return b.core.latencyNs - a.core.latencyNs;
    if (sortBy === 'throughput') return b.core.throughputMOps - a.core.throughputMOps;
    if (sortBy === 'queue') return b.core.queueDepth - a.core.queueDepth;
    return a.core.id - b.core.id;
  });

  const criticalCount = bottlenecks.filter((b) => b.severity === 'critical').length;
  const warningCount = bottlenecks.filter((b) => b.severity === 'warning').length;

  return (
    <div className="space-y-6">
      {/* 4-KPI Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Latência p50 */}
        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">LATÊNCIA MÉDIA (p50)</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
              {p50Latency < 1 ? (p50Latency * 1000).toFixed(0) : p50Latency.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-slate-400">
              {p50Latency < 1 ? 'ps' : 'ns'}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Min: {minLatency.toFixed(2)} · p99: {p99Latency.toFixed(2)} ns
          </div>
        </div>

        {/* Throughput Global */}
        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">THROUGHPUT GLOBAL</span>
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {totalThroughputGflops.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-slate-400">GFLOPS eq.</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            ~25 FLOPs/amostra @ 100 kHz ADC
          </div>
        </div>

        {/* Taxa Média de Disparo */}
        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">TAXA DE DISPARO MÉDIA</span>
            <Activity className="w-3.5 h-3.5 text-pink-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-pink-400 tabular-nums">
              {avgFiringRate.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-400">Hz / nó</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Total disparos matriz: {totalSpikes}
          </div>
        </div>

        {/* Status de Gargalos */}
        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">DETECÇÃO DE GARGALOS</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                criticalCount > 0
                  ? 'text-rose-400'
                  : warningCount > 0
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {criticalCount + warningCount}
            </span>
            <span className="text-xs font-mono text-slate-400">núcleos afetados</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {criticalCount > 0 ? `${criticalCount} críticos` : 'Sem saturação grave'}
          </div>
        </div>
      </div>

      {/* Main Real-Time Stream Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Stream Chart */}
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Latência de Interconexão em Tempo Real</h4>
              <p className="text-xs text-slate-400">Atraso de trânsito entre núcleos (ns)</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-medium">
              p99: {p99Latency.toFixed(2)} ns
            </span>
          </div>

          <div className="w-full bg-[#070b14] p-3 rounded-lg border border-slate-800/80">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-36">
              <line x1="0" y1="35" x2={chartWidth} y2="35" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1="75" x2={chartWidth} y2="75" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1="115" x2={chartWidth} y2="115" stroke="#1e293b" strokeDasharray="3 3" />

              {latencyPath && (
                <path
                  d={latencyPath}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              )}
            </svg>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>-40 passos</span>
              <span>Agora</span>
            </div>
          </div>
        </div>

        {/* Throughput Stream Chart */}
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Vazão (Throughput) da Matriz em Tempo Real</h4>
              <p className="text-xs text-slate-400">Capacidade computacional equivalente em GFLOPS</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-medium">
              Atual: {totalThroughputGflops.toFixed(2)} GFLOPS
            </span>
          </div>

          <div className="w-full bg-[#070b14] p-3 rounded-lg border border-slate-800/80">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-36">
              <line x1="0" y1="35" x2={chartWidth} y2="35" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1="75" x2={chartWidth} y2="75" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1="115" x2={chartWidth} y2="115" stroke="#1e293b" strokeDasharray="3 3" />

              {tpPath && (
                <path
                  d={tpPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              )}
            </svg>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>-40 passos</span>
              <span>Agora</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Per-Core Performance Matrix & Bottleneck Detector */}
      <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-200">
              Diagnóstico Dinâmico de Núcleos & Identificação de Gargalos
            </h4>
            <p className="text-xs text-slate-400">
              Métricas individualizadas de atraso, vazão, buffer de fila e causa raiz de congestionamento
            </p>
          </div>

          {/* Filter & Sort Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setFilterSeverity('all')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  filterSeverity === 'all'
                    ? 'bg-slate-800 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos ({cores.length})
              </button>
              <button
                onClick={() => setFilterSeverity('bottlenecks_only')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  filterSeverity === 'bottlenecks_only'
                    ? 'bg-amber-950/60 border border-amber-500/50 text-amber-300 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Gargalos ({criticalCount + warningCount})
              </button>
            </div>

            {/* Sort by dropdown */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 font-mono">
              <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="latency" className="bg-slate-900">Maior Latência</option>
                <option value="throughput" className="bg-slate-900">Maior Throughput</option>
                <option value="queue" className="bg-slate-900">Fila Pendente</option>
                <option value="id" className="bg-slate-900">Ordem do Nó</option>
              </select>
            </div>
          </div>
        </div>

        {/* Core Matrix Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto pr-1">
          {filteredList.map(({ core, bottleneck }) => {
            const isSelected = selectedCoreId === core.id;
            const isCritical = bottleneck.severity === 'critical';
            const isWarning = bottleneck.severity === 'warning';

            return (
              <div
                key={core.id}
                onClick={() => onSelectCore && onSelectCore(isSelected ? null : core.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-500/20'
                    : isCritical
                    ? 'bg-rose-950/20 border-rose-600/70 hover:border-rose-500'
                    : isWarning
                    ? 'bg-amber-950/20 border-amber-600/60 hover:border-amber-500'
                    : 'bg-[#070b14] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-slate-200">
                      Nó {core.id + 1}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase font-mono ${
                        isCritical
                          ? 'bg-rose-950 text-rose-400 border-rose-800'
                          : isWarning
                          ? 'bg-amber-950 text-amber-400 border-amber-800'
                          : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      }`}
                    >
                      {bottleneck.severity}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Latência:</span>
                      <span
                        className={
                          core.latencyNs > 10
                            ? 'text-rose-400 font-bold'
                            : core.latencyNs < 1
                            ? 'text-cyan-400 font-bold'
                            : 'text-slate-200'
                        }
                      >
                        {core.latencyNs < 1
                          ? `${(core.latencyNs * 1000).toFixed(0)} ps`
                          : `${core.latencyNs.toFixed(2)} ns`}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Vazão:</span>
                      <span className="text-emerald-400 font-semibold">{core.throughputMOps.toFixed(2)} MOps</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Fila Pendente:</span>
                      <span className={core.queueDepth > 10 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                        {core.queueDepth} pacotes
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Potencial:</span>
                      <span className="text-slate-300">{core.voltage.toFixed(1)} mV</span>
                    </div>
                  </div>
                </div>

                {/* Bottleneck Cause & Remediation */}
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 leading-tight">
                  <div className="text-slate-300 font-medium mb-0.5 flex items-center gap-1">
                    {isCritical || isWarning ? (
                      <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                    ) : (
                      <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                    )}
                    <span>
                      {bottleneck.primaryCause === 'queue_overflow'
                        ? 'Sobrecarga de Fila'
                        : bottleneck.primaryCause === 'electrical_rc_delay'
                        ? 'Atraso Linha RC'
                        : bottleneck.primaryCause === 'routing_contention'
                        ? 'Contenção no Roteamento'
                        : bottleneck.primaryCause === 'thermal_throttling'
                        ? 'Aquecimento Térmico'
                        : 'Fluxo Estável'}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-slate-400 text-[10px]">
                    {bottleneck.recommendation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
