import React from 'react';
import { CoreState, HistoricalPowerPoint, PowerMetrics, SimulationParams } from '../types/simulator';
import { BatteryCharging, Zap, Flame, HardDrive, Cpu, ShieldCheck, TrendingUp, BarChart3 } from 'lucide-react';

interface PowerDashboardProps {
  power: PowerMetrics;
  params: SimulationParams;
  cores: CoreState[];
  historyPower?: HistoricalPowerPoint[];
}

export const PowerDashboard: React.FC<PowerDashboardProps> = ({
  power,
  params,
  cores,
  historyPower = [],
}) => {
  const isPhotonic = params.transmissionMode === 'photonic';
  const numNeurons = cores.length;

  // Compute percentages for the visual power bar
  const total = Math.max(1, power.totalPowerMw);
  const dynPct = Math.min(100, (power.dynamicPowerMw / total) * 100);
  const leakPct = Math.min(100, (power.staticLeakageMw / total) * 100);
  const ssdPct = Math.min(100, (power.ssdModulatorPowerMw / total) * 100);
  const interPct = Math.min(100, (power.interconnectPowerMw / total) * 100);

  // SVG dimensions for Historical Power Trends Chart
  const svgW = 540;
  const svgH = 140;

  const points = historyPower.slice(-40);
  const maxPowerRecorded = Math.max(50, ...points.map((p) => p.totalPowerMw));

  const totalPowerPath =
    points.length > 1
      ? points
          .map((pt, i) => {
            const x = (i / (points.length - 1)) * svgW;
            const y = svgH - (pt.totalPowerMw / (maxPowerRecorded * 1.2)) * svgH;
            return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(8, Math.min(svgH - 4, y))}`;
          })
          .join(' ')
      : '';

  const dynPowerPath =
    points.length > 1
      ? points
          .map((pt, i) => {
            const x = (i / (points.length - 1)) * svgW;
            const y = svgH - (pt.coresDynamicMw / (maxPowerRecorded * 1.2)) * svgH;
            return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(8, Math.min(svgH - 4, y))}`;
          })
          .join(' ')
      : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <BatteryCharging className="w-5 h-5 text-emerald-400" />
            <span>Dashboard de Monitoramento de Energia & Eficiência Térmica</span>
          </h3>
          <p className="text-xs text-slate-400">
            Leituras em tempo real, tendências históricas e dissipação por núcleo no silício LGA 775
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-xs font-mono text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Economia de ~99% vs. Arquiteturas Digitais Clássicas</span>
        </div>
      </div>

      {/* 4 Main Real-Time Power Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        {/* Potência Total Instantânea */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-sans">
            <span>POTÊNCIA TOTAL</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1 text-2xl font-bold text-amber-400 tabular-nums">
            <span>{power.totalPowerMw < 1000 ? power.totalPowerMw.toFixed(1) : (power.totalPowerMw / 1000).toFixed(2)}</span>
            <span className="text-xs text-slate-400">{power.totalPowerMw < 1000 ? 'mW' : 'W'}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-sans mt-1">
            {numNeurons} núcleos ativos
          </div>
        </div>

        {/* Energia Acumulada */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-sans">
            <span>ENERGIA ACUMULADA</span>
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1 text-2xl font-bold text-emerald-400 tabular-nums">
            <span>{power.cumulativeJoules.toFixed(3)}</span>
            <span className="text-xs text-slate-400">Joules</span>
          </div>
          <div className="text-[11px] text-slate-400 font-sans mt-1">
            Consumo total da simulação
          </div>
        </div>

        {/* Eficiência Computacional */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-sans">
            <span>EFICIÊNCIA ENERGÉTICA</span>
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1 text-2xl font-bold text-cyan-400 tabular-nums">
            <span>{power.efficiencyGflopsPerWatt.toFixed(1)}</span>
            <span className="text-xs text-slate-400">GFLOPS/W</span>
          </div>
          <div className="text-[11px] text-slate-400 font-sans mt-1">
            Vazão por Watt consumido
          </div>
        </div>

        {/* Energy-Delay Product */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-sans">
            <span>ENERGY-DELAY (EDP)</span>
            <Flame className="w-3.5 h-3.5 text-pink-400" />
          </div>
          <div className="flex items-baseline gap-1 text-2xl font-bold text-pink-400 tabular-nums">
            <span>{(power.energyDelayProductJs * 1e12).toFixed(1)}</span>
            <span className="text-xs text-slate-400">pJ·s</span>
          </div>
          <div className="text-[11px] text-slate-400 font-sans mt-1">
            {isPhotonic ? 'Minimizado por Fotônica' : 'Limitado por Linhas RC'}
          </div>
        </div>
      </div>

      {/* Historical Power Trends Chart */}
      <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Tendência Histórica de Consumo de Potência (mW)</span>
            </h4>
            <p className="text-xs text-slate-400">
              Variação dinâmica ao longo do tempo de simulação
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-0.5 bg-amber-400"></span> Potência Total
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-0.5 bg-cyan-400"></span> Dinâmica dos Núcleos
            </span>
          </div>
        </div>

        <div className="w-full bg-[#070b14] p-3 rounded-lg border border-slate-800/80">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-36">
            <line x1="0" y1={svgH * 0.25} x2={svgW} y2={svgH * 0.25} stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="0" y1={svgH * 0.5} x2={svgW} y2={svgH * 0.5} stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="0" y1={svgH * 0.75} x2={svgW} y2={svgH * 0.75} stroke="#1e293b" strokeDasharray="3 3" />

            {/* Total power path */}
            {totalPowerPath && (
              <path
                d={totalPowerPath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            )}

            {/* Dynamic power path */}
            {dynPowerPath && (
              <path
                d={dynPowerPath}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1.8"
                strokeDasharray="4 2"
              />
            )}
          </svg>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>-40 amostras</span>
            <span>Agora ({power.totalPowerMw.toFixed(1)} mW)</span>
          </div>
        </div>
      </div>

      {/* Visual Power Partition Bar & Module Breakdown */}
      <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-200">
            Decomposição de Dissipação Térmica por Módulo
          </span>
          <span className="font-mono text-slate-400 text-[11px]">
            {power.totalPowerMw.toFixed(1)} mW total
          </span>
        </div>

        {/* Multi-segment progress bar */}
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-cyan-500 transition-all duration-300"
            style={{ width: `${dynPct}%` }}
            title={`Dinâmica: ${power.dynamicPowerMw} mW`}
          />
          <div
            className="h-full bg-amber-500 transition-all duration-300"
            style={{ width: `${leakPct}%` }}
            title={`Estática/Fuga: ${power.staticLeakageMw} mW`}
          />
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${ssdPct}%` }}
            title={`SSD Modulador: ${power.ssdModulatorPowerMw} mW`}
          />
          <div
            className="h-full bg-pink-500 transition-all duration-300"
            style={{ width: `${interPct}%` }}
            title={`Interconexão: ${power.interconnectPowerMw} mW`}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 shrink-0"></span>
            <div>
              <div className="text-slate-400 text-[11px]">Dinâmica (Portas)</div>
              <div className="font-bold text-slate-200">{power.dynamicPowerMw} mW ({dynPct.toFixed(0)}%)</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shrink-0"></span>
            <div>
              <div className="text-slate-400 text-[11px]">Fuga Estática (Silício)</div>
              <div className="font-bold text-slate-200">{power.staticLeakageMw} mW ({leakPct.toFixed(0)}%)</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shrink-0"></span>
            <div>
              <div className="text-slate-400 text-[11px]">SSD NVMe Modulador</div>
              <div className="font-bold text-slate-200">{power.ssdModulatorPowerMw} mW ({ssdPct.toFixed(0)}%)</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-pink-500 shrink-0"></span>
            <div>
              <div className="text-slate-400 text-[11px]">
                {isPhotonic ? 'Guias Ópticos' : 'Trilhas Cobre'}
              </div>
              <div className="font-bold text-slate-200">{power.interconnectPowerMw} mW ({interPct.toFixed(0)}%)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Core Thermal & Power Dissipation Heat Grid */}
      <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Mapa de Dissipação Térmica e Potência Individual por Núcleo</span>
            </h4>
            <p className="text-xs text-slate-400">
              Distribuição de calor na matriz de silício LGA 775 (mW por nó)
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Escala: Normal (&lt;42°C) → Quente (&gt;48°C)
          </div>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-16 gap-2">
          {cores.map((core) => {
            const corePowerMw = 4.2 + (core.firingRateHz / 30) * 1.8 + params.sigmaNoise * 0.15;
            const isHot = core.temperatureCelsius > 46;

            return (
              <div
                key={core.id}
                className={`p-2 rounded-lg border text-center transition-all ${
                  isHot
                    ? 'bg-rose-950/40 border-rose-600/70'
                    : 'bg-[#070b14] border-slate-800'
                }`}
              >
                <div className="text-[10px] font-mono text-slate-400">N{core.id + 1}</div>
                <div className={`text-xs font-bold font-mono ${isHot ? 'text-rose-400' : 'text-cyan-300'}`}>
                  {corePowerMw.toFixed(1)}
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                  {core.temperatureCelsius.toFixed(0)}°C
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
