import React from 'react';
import { SSDModulationMode, SimulationParams } from '../types/simulator';
import { ssdModulatorInstance } from '../engine/ssdModulator';
import { HardDrive, Sliders, Layers, RefreshCw } from 'lucide-react';

interface SSDModulatorPanelProps {
  params: SimulationParams;
  onChangeParams: (updates: Partial<SimulationParams>) => void;
  currentSpikes: number;
  currentShiftMv: number;
}

export const SSDModulatorPanel: React.FC<SSDModulatorPanelProps> = ({
  params,
  onChangeParams,
  currentSpikes,
  currentShiftMv,
}) => {
  const vtData = ssdModulatorInstance.getThresholdVoltageDistribution(currentShiftMv);

  // SVG dimensions for Flash Vt curve
  const svgWidth = 520;
  const svgHeight = 160;

  // Generate path points for the 4 flash cell states
  const makePath = (key: 'state0' | 'state1' | 'state2' | 'state3') => {
    return vtData
      .map((d, i) => {
        const x = (i / (vtData.length - 1)) * svgWidth;
        const val = d[key];
        const y = svgHeight - val * (svgHeight - 20) - 10;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const path0 = makePath('state0'); // Erase state (blue)
  const path1 = makePath('state1'); // Program 1 (cyan)
  const path2 = makePath('state2'); // Program 2 (amber)
  const path3 = makePath('state3'); // Program 3 (pink)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Modulador de Estado Sólido (SSD / Flash NVMe)
          </h3>
          <p className="text-xs text-slate-400">
            Utilização de células NAND de multi-níveis (MLC/TLC) como matriz de modulação de condutância sináptica
          </p>
        </div>

        {/* Master Toggle */}
        <button
          onClick={() => onChangeParams({ ssdModulationEnabled: !params.ssdModulationEnabled })}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            params.ssdModulationEnabled
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>{params.ssdModulationEnabled ? 'Modulador Ativo' : 'Modulador em Bypass'}</span>
        </button>
      </div>

      {/* Control Strip & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Mode Selector */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Modo de Modulação Sináptica</span>
          </label>
          <div className="space-y-2">
            {[
              { id: 'synaptic_weight', label: 'Matriz de Pesos (Condutância G)', desc: 'Desloca a resistência efetiva R da membrana em ±25%' },
              { id: 'frequency_phase', label: 'Modulação de Fase & Frequência', desc: 'Introduz dispersão estocástica de disparo' },
              { id: 'refractory_damping', label: 'Amortecimento Refratário', desc: 'Controle de sincronização via fila NVMe' },
            ].map((m) => (
              <div
                key={m.id}
                onClick={() => onChangeParams({ ssdMode: m.id as SSDModulationMode })}
                className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                  params.ssdMode === m.id
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className="font-medium text-slate-200">{m.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sliders: Queue Depth & Intensity */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Parâmetros do Controlador Flash</span>
          </label>

          {/* NVMe Queue Depth */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-400">Profundidade da Fila NVMe:</span>
              <span className="text-emerald-400 font-bold">{params.ssdQueueDepth} comandos</span>
            </div>
            <input
              type="range"
              min="1"
              max="64"
              step="1"
              value={params.ssdQueueDepth}
              onChange={(e) => onChangeParams({ ssdQueueDepth: Number(e.target.value) })}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>1 cmd (Single buffer)</span>
              <span>64 cmds (Deep NVMe)</span>
            </div>
          </div>

          {/* Modulation Intensity */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-400">Intensidade de Modulação:</span>
              <span className="text-cyan-400 font-bold">{params.ssdIntensity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={params.ssdIntensity}
              onChange={(e) => onChangeParams({ ssdIntensity: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>0% (Sem efeito)</span>
              <span>100% (Modulação total)</span>
            </div>
          </div>
        </div>

        {/* Real-time Flash Performance KPIs */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col justify-between">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Telemetria do Barramento SSD</span>
          </label>

          <div className="space-y-2.5 font-mono text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Deslocamento ΔVt:</span>
              <span className="text-cyan-400 font-bold">{currentShiftMv.toFixed(1)} mV</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Atividade IOPS:</span>
              <span className="text-emerald-400 font-bold">
                {(currentSpikes * 42 + params.ssdQueueDepth * 14)} kIOPS
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Latência Leitura Flash:</span>
              <span className="text-slate-200">{(28 + params.ssdQueueDepth * 0.4).toFixed(1)} µs</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Desgaste Wear-Leveling:</span>
              <span className="text-amber-400 font-bold">99.8% Vida Útil</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            Barramento PCIe 4.0 x4 direto acoplado ao silício LGA 775
          </div>
        </div>
      </div>

      {/* Real-time Flash Cell Threshold Voltage (Vt) Distribution Chart */}
      <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
          <div>
            <h4 className="text-sm font-semibold text-slate-200">
              Curvas de Distribuição de Tensão de Limiar Flash (Vt - MLC States)
            </h4>
            <p className="text-xs text-slate-400">
              Deslocamento das cargas quânticas nas armadilhas de óxido (Floating Gate / Charge Trap)
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-0.5 bg-blue-400"></span> Erase (00)
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-0.5 bg-cyan-400"></span> P1 (01)
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-0.5 bg-amber-400"></span> P2 (10)
            </span>
            <span className="flex items-center gap-1.5 text-pink-400">
              <span className="w-2.5 h-0.5 bg-pink-400"></span> P3 (11)
            </span>
          </div>
        </div>

        <div className="w-full bg-[#070b14] p-4 rounded-lg border border-slate-800/80">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-40">
            {/* Base axes */}
            <line x1="0" y1={svgHeight - 10} x2={svgWidth} y2={svgHeight - 10} stroke="#334155" strokeWidth="1" />
            <line x1="0" y1="40" x2={svgWidth} y2="40" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="0" y1="80" x2={svgWidth} y2="80" stroke="#1e293b" strokeDasharray="3 3" />

            {/* Threshold distributions */}
            <path d={path0} fill="none" stroke="#3b82f6" strokeWidth="2" />
            <path d={path1} fill="none" stroke="#06b6d4" strokeWidth="2" />
            <path d={path2} fill="none" stroke="#f59e0b" strokeWidth="2" />
            <path d={path3} fill="none" stroke="#ec4899" strokeWidth="2" />
          </svg>

          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>-200 mV (Estado Apagado)</span>
            <span>0 mV</span>
            <span>+100 mV</span>
            <span>+300 mV (P3 Saturação)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
