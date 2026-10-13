import React, { useState } from 'react';
import { SimulationParams, TransmissionMode } from '../types/simulator';
import { computePhotonicMetrics, generateBounceTrajectoryData } from '../engine/photonics';
import { Sparkles, Zap, Radio, Activity, Waves, Gauge, Cpu } from 'lucide-react';

interface PhotonicPulsePanelProps {
  params: SimulationParams;
  onChangeParams: (updates: Partial<SimulationParams>) => void;
  quantumBounceActive: boolean;
}

export const PhotonicPulsePanel: React.FC<PhotonicPulsePanelProps> = ({
  params,
  onChangeParams,
  quantumBounceActive,
}) => {
  const [selectedDistanceMm, setSelectedDistanceMm] = useState<number>(8);

  const photonicMetrics = computePhotonicMetrics(
    params.photonicWavelengthNm,
    0.65,
    1.0,
    12,
    selectedDistanceMm
  );

  const bounceTrajectory = generateBounceTrajectoryData();
  const comparisonData = photonicMetrics.comparisonCurve;

  // SVG dimensions for charts
  const svgW = 520;
  const svgH = 150;

  // Render path for Lambda-CDM
  const lambdaPath = bounceTrajectory
    .map((pt, i) => {
      const x = (i / (bounceTrajectory.length - 1)) * svgW;
      const y = svgH - (pt.aLambdaCdm / 2.6) * svgH;
      return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(5, y)}`;
    })
    .join(' ');

  // Render path for Pulso Primordial Bounce
  const bouncePath = bounceTrajectory
    .map((pt, i) => {
      const x = (i / (bounceTrajectory.length - 1)) * svgW;
      const y = svgH - (pt.aPulsoBounce / 2.6) * svgH;
      return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(5, y)}`;
    })
    .join(' ');

  // Render distance vs latency paths
  const maxCompLatency = Math.max(1, ...comparisonData.map((d) => d.electricalLatencyNs));
  const elecPath = comparisonData
    .map((d, i) => {
      const x = (i / (comparisonData.length - 1)) * svgW;
      const y = svgH - (d.electricalLatencyNs / (maxCompLatency * 1.15)) * svgH;
      return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(5, y)}`;
    })
    .join(' ');

  const photPath = comparisonData
    .map((d, i) => {
      const x = (i / (comparisonData.length - 1)) * svgW;
      const y = svgH - (d.photonicLatencyNs / (maxCompLatency * 1.15)) * svgH;
      return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(5, y)}`;
    })
    .join(' ');

  return (
    <div className="space-y-6">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Teoria do Pulso Fotônico & Interconexão Óptica no Silício</span>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/80 font-normal">
              Tratado: Ricardo B Meneses
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Modelagem da redução drástica de latência e aumento de largura de banda frente à sinalização elétrica em cobre
          </p>
        </div>

        {/* Transmission Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => onChangeParams({ transmissionMode: 'electrical' })}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              params.transmissionMode === 'electrical'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Trilha Elétrica (Cobre)
          </button>
          <button
            onClick={() => onChangeParams({ transmissionMode: 'photonic' })}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              params.transmissionMode === 'photonic'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pulso Fotônico (WDM)
          </button>
        </div>
      </div>

      {/* 4 Optical & Transmission Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        {/* Speedup Factor */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="text-slate-400 text-xs mb-1 font-sans">REDUÇÃO DE LATÊNCIA</div>
          <div className="flex items-baseline gap-1 text-2xl font-bold text-cyan-400 tabular-nums">
            <span>{photonicMetrics.latencySpeedupFactor.toFixed(1)}x</span>
          </div>
          <div className="text-[11px] text-slate-400 font-sans mt-1">
            {photonicMetrics.photonicLatencyNs.toFixed(3)} ns vs {photonicMetrics.electricalLatencyBaselineNs.toFixed(1)} ns
          </div>
        </div>

        {/* Aggregate Optical Bandwidth */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="text-slate-400 text-xs mb-1 font-sans">LARGURA DE BANDA WDM</div>
          <div className="flex items-baseline gap-1 text-2xl font-bold text-emerald-400 tabular-nums">
            <span>800</span>
            <span className="text-xs text-slate-400">Gbps</span>
          </div>
          <div className="text-[11px] text-slate-400 font-sans mt-1">
            8 canais λ multiplexados
          </div>
        </div>

        {/* Velocidade de Propagação */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="text-slate-400 text-xs mb-1 font-sans">VELOCIDADE DE GRUPO (vg)</div>
          <div className="flex items-baseline gap-1 text-2xl font-bold text-pink-400 tabular-nums">
            <span>{photonicMetrics.propagationVelocityKms.toLocaleString()}</span>
            <span className="text-xs text-slate-400">km/s</span>
          </div>
          <div className="text-[11px] text-slate-400 font-sans mt-1">
            Índice ng = {photonicMetrics.groupIndex} (Silício)
          </div>
        </div>

        {/* Dissipação de Energia por Bit */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="text-slate-400 text-xs mb-1 font-sans">ENERGIA POR BIT (pJ)</div>
          <div className="flex items-baseline gap-1 text-2xl font-bold text-amber-400 tabular-nums">
            <span>0.10</span>
            <span className="text-xs text-slate-400">pJ/bit</span>
          </div>
          <div className="text-[11px] text-slate-400 font-sans mt-1">
            vs 6.5 pJ/bit elétrico (98% menor)
          </div>
        </div>
      </div>

      {/* Latency vs Distance: Electrical RC Delay vs Photonic Transit */}
      <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-200">
              Curva de Latência vs Distância: Atraso Capacitivo RC (Cobre) vs Guia Fotônico
            </h4>
            <p className="text-xs text-slate-400">
              Em fios elétricos o atraso escala quadraticamente (L²), enquanto na fotônica a velocidade da luz é linear e livre de carga RC
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-0.5 bg-rose-400"></span> Trilha Elétrica RC (ns)
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-0.5 bg-cyan-400"></span> Guia Óptico Fotônico (ns)
            </span>
          </div>
        </div>

        <div className="w-full bg-[#070b14] p-4 rounded-lg border border-slate-800/80">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-40">
            <line x1="0" y1={svgH * 0.25} x2={svgW} y2={svgH * 0.25} stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="0" y1={svgH * 0.5} x2={svgW} y2={svgH * 0.5} stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="0" y1={svgH * 0.75} x2={svgW} y2={svgH * 0.75} stroke="#1e293b" strokeDasharray="3 3" />

            {/* Electrical path (quadratic curve) */}
            <path d={elecPath} fill="none" stroke="#f43f5e" strokeWidth="2.5" />
            {/* Photonic path (sub-nanosecond nearly flat line) */}
            <path d={photPath} fill="none" stroke="#06b6d4" strokeWidth="2.5" />
          </svg>

          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>1 mm (Adjacente)</span>
            <span>10 mm (Substrato Médio)</span>
            <span>20 mm (Inter-Módulo Remoto)</span>
          </div>
        </div>
      </div>

      {/* 8-Channel Wavelength-Division Multiplexing (WDM) Carrier Matrix */}
      <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Waves className="w-4 h-4 text-cyan-400" />
              <span>Matriz Multiplexadora WDM (8 Portadoras Ópticas em Paralelo)</span>
            </h4>
            <p className="text-xs text-slate-400">
              Grade ITU C-Band acoplada a microrressonadores em anel no silício
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400">
            Base λ: {params.photonicWavelengthNm} nm
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {photonicMetrics.wdmChannels.map((ch) => (
            <div
              key={ch.id}
              className="p-2.5 bg-[#070b14] border border-slate-800 rounded-lg font-mono text-xs space-y-1"
            >
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Ch #{ch.id}</span>
                <span className="text-cyan-400 font-semibold">{ch.wavelengthNm}nm</span>
              </div>
              <div className="text-[10px] text-slate-500">
                {ch.frequencyThz} THz
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-cyan-400"
                  style={{ width: `${Math.min(100, ch.activePackets * 14)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 pt-0.5">
                <span>100 Gbps</span>
                <span className="text-emerald-400">{ch.activePackets} pkts</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cosmological Bounce Trajectory: O Pulso Primordial (Ricardo B Meneses) */}
      <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-slate-200">
              Dinâmica Cosmológica a(t): Bounce Quântico vs Colapso Clássico
            </h4>
            <p className="text-xs text-slate-400">
              Fator de escala com tensão de pulso negativa ρ_Π = -ρ²/ρ_P eliminando singularidades em t=0
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-0.5 bg-rose-400"></span> ΛCDM (Singularidade Infinita a=0)
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-0.5 bg-cyan-400"></span> Pulso Primordial (amin = 1.77)
            </span>
          </div>
        </div>

        <div className="w-full bg-[#070b14] p-4 rounded-lg border border-slate-800/80">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-40">
            <line x1="0" y1={svgH - 20} x2={svgW} y2={svgH - 20} stroke="#334155" strokeWidth="1" />
            <line x1={svgW / 2} y1="0" x2={svgW / 2} y2={svgH} stroke="#1e293b" strokeDasharray="4 4" />
            <path d={lambdaPath} fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 4" />
            <path d={bouncePath} fill="none" stroke="#06b6d4" strokeWidth="2.5" />
            <text x={svgW / 2 + 8} y="25" fill="#06b6d4" fontSize="10" fontFamily="JetBrains Mono">
              t=0 (Bounce amin)
            </text>
          </svg>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>t = -10 (Ramo de Contração)</span>
            <span>t = 0 (Ponto de Transição Quântica)</span>
            <span>t = +10 (Expansão Acelerada)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
