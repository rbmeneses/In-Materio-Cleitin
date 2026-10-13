import React from 'react';
import { SimulationParams, TopologyType, TransmissionMode } from '../types/simulator';
import { Sliders, Sparkles, Zap, Flame, Cpu, Radio } from 'lucide-react';

interface ControlPanelProps {
  params: SimulationParams;
  onChangeParams: (updates: Partial<SimulationParams>) => void;
  onApplyPreset: (presetName: string) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  onChangeParams,
  onApplyPreset,
}) => {
  return (
    <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Configuração Fisiológica & Substrato Silício</span>
        </h4>
        <span className="text-[11px] font-mono text-cyan-400">LGA 775 In-Materio</span>
      </div>

      {/* Quick Presets Strip */}
      <div>
        <div className="text-xs text-slate-400 mb-2">Cenários Predefinidos:</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onApplyPreset('default')}
            className="px-2.5 py-1.5 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-left font-mono cursor-pointer"
          >
            1. Padrão Cleitin (16 nós)
          </button>
          <button
            onClick={() => onApplyPreset('photonic_max')}
            className="px-2.5 py-1.5 text-xs rounded bg-cyan-950/40 border border-cyan-800/60 hover:bg-cyan-900/40 text-cyan-300 transition-colors text-left font-mono cursor-pointer"
          >
            2. Fotônico 32 Cores
          </button>
          <button
            onClick={() => onApplyPreset('ssd_burst')}
            className="px-2.5 py-1.5 text-xs rounded bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/40 text-emerald-300 transition-colors text-left font-mono cursor-pointer"
          >
            3. SSD NVMe Burst
          </button>
          <button
            onClick={() => onApplyPreset('high_entropy')}
            className="px-2.5 py-1.5 text-xs rounded bg-pink-950/40 border border-pink-800/60 hover:bg-pink-900/40 text-pink-300 transition-colors text-left font-mono cursor-pointer"
          >
            4. Alta Entropia Térmica
          </button>
        </div>
      </div>

      <hr className="border-slate-800/80" />

      {/* Main Parameters */}
      <div className="space-y-4">
        {/* Number of neurons */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1.5">
            <span className="text-slate-400">Qtd. de Núcleos em Paralelo:</span>
            <span className="text-cyan-400 font-bold">{params.numNeurons} nós</span>
          </div>
          <input
            type="range"
            min="1"
            max="32"
            step="1"
            value={params.numNeurons}
            onChange={(e) => onChangeParams({ numNeurons: Number(e.target.value) })}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
            <span>1</span>
            <span>16 (Padrão)</span>
            <span>32 (Máx)</span>
          </div>
        </div>

        {/* Global Input Current I(t) */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1.5">
            <span className="text-slate-400">Corrente de Estímulo Global I(t):</span>
            <span className="text-emerald-400 font-bold">{params.inputCurrent.toFixed(1)} mA</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="5.0"
            step="0.1"
            value={params.inputCurrent}
            onChange={(e) => onChangeParams({ inputCurrent: Number(e.target.value) })}
            className="w-full accent-emerald-400 cursor-pointer"
          />
        </div>

        {/* Membrane Time Constant tau_m */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1.5">
            <span className="text-slate-400">Constante de Tempo Base (τm):</span>
            <span className="text-slate-200 font-bold">{params.tauM.toFixed(1)} ms</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="50.0"
            step="1.0"
            value={params.tauM}
            onChange={(e) => onChangeParams({ tauM: Number(e.target.value) })}
            className="w-full accent-slate-400 cursor-pointer"
          />
        </div>

        {/* Resting Potential V_rest */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1.5">
            <span className="text-slate-400">Potencial de Repouso (Vrest):</span>
            <span className="text-slate-200 font-bold">{params.vRest.toFixed(1)} mV</span>
          </div>
          <input
            type="range"
            min="-80.0"
            max="-40.0"
            step="1.0"
            value={params.vRest}
            onChange={(e) => onChangeParams({ vRest: Number(e.target.value) })}
            className="w-full accent-slate-400 cursor-pointer"
          />
        </div>

        {/* Firing Threshold V_th */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1.5">
            <span className="text-slate-400">Limiar de Disparo (Vth):</span>
            <span className="text-amber-400 font-bold">{params.vTh.toFixed(1)} mV</span>
          </div>
          <input
            type="range"
            min="-60.0"
            max="0.0"
            step="1.0"
            value={params.vTh}
            onChange={(e) => onChangeParams({ vTh: Number(e.target.value) })}
            className="w-full accent-amber-400 cursor-pointer"
          />
        </div>

        {/* Base Resistance R */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1.5">
            <span className="text-slate-400">Resistência de Membrana (R):</span>
            <span className="text-slate-200 font-bold">{params.resistance.toFixed(1)} kΩ</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="20.0"
            step="1.0"
            value={params.resistance}
            onChange={(e) => onChangeParams({ resistance: Number(e.target.value) })}
            className="w-full accent-slate-400 cursor-pointer"
          />
        </div>

        {/* Thermal Noise sigma */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1.5">
            <span className="text-slate-400">Ruído Térmico Central (σ_ruido):</span>
            <span className="text-pink-400 font-bold">{params.sigmaNoise.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="10.0"
            step="0.1"
            value={params.sigmaNoise}
            onChange={(e) => onChangeParams({ sigmaNoise: Number(e.target.value) })}
            className="w-full accent-pink-400 cursor-pointer"
          />
        </div>
      </div>

      <hr className="border-slate-800/80" />

      {/* Photonic Theory Switches */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>Física do Pulso Primordial & WDM</span>
        </div>

        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Bounce Quântico (H|ψ⟩=0):</span>
          <button
            onClick={() => onChangeParams({ quantumBounceEnabled: !params.quantumBounceEnabled })}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
              params.quantumBounceEnabled
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {params.quantumBounceEnabled ? 'Ativado' : 'Desativado'}
          </button>
        </div>

        <div>
          <div className="flex justify-between text-xs font-mono mb-1.5">
            <span className="text-slate-400">Comprimento de Onda Óptico:</span>
            <span className="text-cyan-400 font-bold">{params.photonicWavelengthNm} nm</span>
          </div>
          <input
            type="range"
            min="1270"
            max="1610"
            step="20"
            value={params.photonicWavelengthNm}
            onChange={(e) => onChangeParams({ photonicWavelengthNm: Number(e.target.value) })}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
