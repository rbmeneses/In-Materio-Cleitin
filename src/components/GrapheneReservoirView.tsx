import React, { useState, useEffect, useRef } from 'react';
import { GrapheneReservoirParams, GrapheneReservoirState, QuaternaryValue } from '../types/simulator';
import { grapheneReservoirInstance } from '../engine/grapheneReservoir';
import {
  Sparkles,
  Zap,
  Target,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Layers,
  Radio,
  Sliders,
  TrendingDown,
} from 'lucide-react';

export const GrapheneReservoirView: React.FC = () => {
  const [params, setParams] = useState<GrapheneReservoirParams>(grapheneReservoirInstance.getParams());
  const [state, setState] = useState<GrapheneReservoirState>(grapheneReservoirInstance.executePulse(false));
  const [isAutoRunning, setIsAutoRunning] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Execution loop
  useEffect(() => {
    if (!isAutoRunning) return;

    const interval = setInterval(() => {
      const nextState = grapheneReservoirInstance.executePulse(true);
      setState(nextState);
    }, 120);

    return () => clearInterval(interval);
  }, [isAutoRunning]);

  const handleManualPulse = () => {
    const nextState = grapheneReservoirInstance.executePulse(true);
    setState(nextState);
  };

  const handleReset = () => {
    grapheneReservoirInstance.resetLearning();
    const nextState = grapheneReservoirInstance.executePulse(false);
    setState(nextState);
  };

  const handleUpdateParam = (updates: Partial<GrapheneReservoirParams>) => {
    const next = { ...params, ...updates };
    setParams(next);
    grapheneReservoirInstance.updateParams(updates);
  };

  // Canvas visual rendering of the 4x4 Vacuum Cube, Electron Gun, Graphene Layers, and Sensors
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.05;
      const w = canvas.width;
      const h = canvas.height;

      // Dark vacuum chamber background (#040711)
      ctx.fillStyle = '#040711';
      ctx.fillRect(0, 0, w, h);

      // Vacuum chamber boundary (4x4 cube perspective wireframe)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(30, 25, w - 60, h - 50);

      // Vacuum chamber grid lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      for (let x = 60; x < w - 60; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 25);
        ctx.lineTo(x, h - 25);
        ctx.stroke();
      }

      // 1. Electron Gun (Disparador CRT) on Left
      const gunX = 50;
      const gunY = h / 2;
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(15, gunY - 24, 45, 48, 6);
      ctx.fill();
      ctx.stroke();

      // Gun cathode nozzle
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(55, gunY - 8, 12, 16);

      // Beam angle
      const angleRad = (state.beamAngleDegrees * Math.PI) / 180;
      const targetX = w - 70;
      const beamEndY = gunY + Math.tan(angleRad) * (targetX - gunX);

      // Electron beam & de Broglie matter waves (pulsing cyan)
      const grad = ctx.createLinearGradient(gunX, gunY, targetX, beamEndY);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.9)');
      grad.addColorStop(0.5, 'rgba(236, 72, 153, 0.8)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0.85)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(gunX + 12, gunY);

      // Wave oscillations along beam
      for (let x = gunX + 12; x <= targetX; x += 4) {
        const progress = (x - gunX) / (targetX - gunX);
        const yBase = gunY + Math.tan(angleRad) * (x - gunX);
        const waveAmp = 5 * Math.sin((x / (state.deBroglieWavelengthNm * 200) - t * 4));
        ctx.lineTo(x, yBase + waveAmp);
      }
      ctx.stroke();

      // 2. Center: Atomic Graphene Sheets
      const centerX = w / 2;
      const layers = params.grapheneLayersCount;
      const layerSpacing = 16;
      const startLayerX = centerX - ((layers - 1) * layerSpacing) / 2;

      for (let i = 0; i < layers; i++) {
        const lx = startLayerX + i * layerSpacing;

        // Graphene vertical sheet line
        ctx.strokeStyle = 'rgba(244, 114, 182, 0.7)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(lx, 40);
        ctx.lineTo(lx, h - 40);
        ctx.stroke();

        // Hexagonal lattice nodes along sheet
        ctx.fillStyle = '#f472b6';
        for (let y = 50; y < h - 40; y += 22) {
          ctx.beginPath();
          ctx.arc(lx, y + (i % 2 === 0 ? 0 : 6), 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Plasmon-polariton excitation halo
        const haloY = gunY + Math.tan(angleRad) * (lx - gunX);
        ctx.fillStyle = 'rgba(244, 114, 182, 0.25)';
        ctx.beginPath();
        ctx.arc(lx, haloY, 18 + 6 * Math.sin(t * 3 + i), 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Right: 4 Receptores / Quaternary Sensors
      const sensorX = w - 55;
      const sensorHeight = 36;
      const sensorSpacing = (h - 80) / 4;

      for (let s = 0; s < 4; s++) {
        const sy = 45 + s * sensorSpacing;
        const qVal = state.quaternaryOutputVector[s];

        // Sensor enclosure
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = qVal >= 0.75 ? '#10b981' : qVal >= 0.25 ? '#38bdf8' : '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(sensorX, sy, 35, sensorHeight, 5);
        ctx.fill();
        ctx.stroke();

        // Sensor text
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px "JetBrains Mono"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${qVal}`, sensorX + 17, sy + sensorHeight / 2);

        // Sensor label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px "JetBrains Mono"';
        ctx.fillText(`S${s + 1}`, sensorX - 12, sy + sensorHeight / 2);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [params.grapheneLayersCount, state]);

  // Target presets
  const TARGET_PRESETS: { label: string; vec: [QuaternaryValue, QuaternaryValue, QuaternaryValue, QuaternaryValue] }[] = [
    { label: 'Padrão A [0.25, 1.0, 0.75, 0.1]', vec: [0.25, 1.0, 0.75, 0.1] },
    { label: 'Padrão B [1.0, 0.75, 0.25, 0.1]', vec: [1.0, 0.75, 0.25, 0.1] },
    { label: 'Padrão C [0.75, 0.1, 1.0, 0.25]', vec: [0.75, 0.1, 1.0, 0.25] },
    { label: 'Padrão D [1.0, 1.0, 0.1, 0.1]', vec: [1.0, 1.0, 0.1, 0.1] },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            <span>Computação de Reservatório Quântico com Grafeno</span>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              Câmara a Vácuo Cubo 4x4
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Inferência estocástica via férmions de Dirac, tunelamento de Klein e quantização quaternária nativa em hardware
          </p>
        </div>

        {/* Master Control Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleReset}
            title="Resetar parâmetros e histórico de aprendizagem"
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleManualPulse}
            disabled={isAutoRunning}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              !isAutoRunning
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
            }`}
          >
            Disparo Único
          </button>

          <button
            onClick={() => setIsAutoRunning(!isAutoRunning)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              isAutoRunning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20'
            }`}
          >
            {isAutoRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pausar Auto-Aprender</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Iniciar Auto-Aprender</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4 Main Reservoir KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        {/* Micro-Estado Quaternário Atual */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="text-slate-400 text-xs mb-1 font-sans">MICRO-ESTADO QUATERNÁRIO</div>
          <div className="flex items-baseline gap-1.5 text-xl font-bold text-cyan-400">
            <span>[{state.quaternaryOutputVector.join(', ')}]</span>
          </div>
          <div className="text-[11px] text-slate-400 font-sans mt-1">
            Estado #{state.microStateIndex} de 256 possíveis
          </div>
        </div>

        {/* Perda / Loss do Orquestrador */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="text-slate-400 text-xs mb-1 font-sans">LOSS DO ORQUESTRADOR</div>
          <div className="flex items-baseline gap-1.5 text-2xl font-bold text-amber-400">
            <span>{state.currentLoss.toFixed(4)}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-sans mt-1 flex items-center gap-1">
            {state.isConverged ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Convergido ({state.convergenceEpoch}x)
              </span>
            ) : (
              <span>Ajustando tensão física...</span>
            )}
          </div>
        </div>

        {/* Comprimento de Broglie */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="text-slate-400 text-xs mb-1 font-sans">ONDA DE DE BROGLIE (λ_dB)</div>
          <div className="flex items-baseline gap-1 text-2xl font-bold text-pink-400">
            <span>{state.deBroglieWavelengthNm}</span>
            <span className="text-xs text-slate-400">nm</span>
          </div>
          <div className="text-[11px] text-slate-400 font-sans mt-1">
            Escala atômica do grafeno (0.142 nm)
          </div>
        </div>

        {/* Tunelamento de Klein */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="text-slate-400 text-xs mb-1 font-sans">TUNELAMENTO DE KLEIN</div>
          <div className="flex items-baseline gap-1 text-2xl font-bold text-emerald-400">
            <span>{(state.kleinTunnelingProbability * 100).toFixed(1)}</span>
            <span className="text-xs text-slate-400">%</span>
          </div>
          <div className="text-[11px] text-slate-400 font-sans mt-1">
            Transmissão de férmions de Dirac
          </div>
        </div>
      </div>

      {/* Main 2.5D Canvas View of the Reservoir */}
      <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-slate-200">
              Câmara de Vácuo Cubo 4x4: Feixe de Elétrons ↔ Malhas de Grafeno ↔ 4 Sensores
            </h4>
            <p className="text-xs text-slate-400">
              Dinâmica de interferência quântica não-linear e quantização quaternária em hardware
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
            <span>V_acc: <strong className="text-cyan-400">{state.emitterVoltageVolts}V</strong></span>
            <span>Ângulo: <strong className="text-pink-400">{state.beamAngleDegrees}°</strong></span>
            <span>Plásmons: <strong className="text-emerald-400">{state.plasmonPolaritonExcitations}</strong></span>
          </div>
        </div>

        <div className="w-full bg-[#03060f] p-2 rounded-xl border border-slate-800">
          <canvas
            ref={canvasRef}
            width={720}
            height={260}
            className="w-full h-auto max-h-[290px] object-contain rounded-lg"
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono px-2">
          <span>Canhão CRT (Emissor de Precisão)</span>
          <span>Folhas Atômicas de Grafeno (Separadas por ~0.335 nm)</span>
          <span>4 Sensores Quaternários (0.1, 0.25, 0.75, 1.0)</span>
        </div>
      </div>

      {/* Orchestrator & Physical Backpropagation Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Target Vector & Physical Parameters */}
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>Orquestrador de Software & Vetor Alvo</span>
            </h4>
            <span className="text-[11px] font-mono text-emerald-400">Backpropagation Físico</span>
          </div>

          {/* Target Presets */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Vetor Alvo Desejado:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TARGET_PRESETS.map((p, idx) => {
                const isSelected =
                  params.targetVector[0] === p.vec[0] &&
                  params.targetVector[1] === p.vec[1] &&
                  params.targetVector[2] === p.vec[2] &&
                  params.targetVector[3] === p.vec[3];

                return (
                  <button
                    key={idx}
                    onClick={() => handleUpdateParam({ targetVector: p.vec })}
                    className={`p-2 rounded text-left text-xs font-mono transition-colors border cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                        : 'bg-[#070b14] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Physical Controls */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80 font-mono text-xs">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Tensão de Disparo do Canhão (V_acc):</span>
                <span className="text-cyan-400 font-bold">{params.emitterVoltageVolts} V</span>
              </div>
              <input
                type="range"
                min="10"
                max="250"
                step="1"
                value={params.emitterVoltageVolts}
                onChange={(e) => handleUpdateParam({ emitterVoltageVolts: Number(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Camadas de Grafeno (Sheets):</span>
                <span className="text-pink-400 font-bold">{params.grapheneLayersCount} camadas</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={params.grapheneLayersCount}
                onChange={(e) => handleUpdateParam({ grapheneLayersCount: Number(e.target.value) })}
                className="w-full accent-pink-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Taxa de Aprendizado Físico (Learning Rate):</span>
                <span className="text-emerald-400 font-bold">{params.learningRate}</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.30"
                step="0.01"
                value={params.learningRate}
                onChange={(e) => handleUpdateParam({ learningRate: Number(e.target.value) })}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right: Loss Convergence History & Theory */}
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-amber-400" />
              <span>Curva de Convergência Empírica (Loss)</span>
            </h4>
            <span className="text-[11px] font-mono text-slate-400">Pulso #{state.currentPulseId}</span>
          </div>

          {/* Loss Curve SVG */}
          <div className="w-full bg-[#070b14] p-3 rounded-lg border border-slate-800/80">
            <svg viewBox="0 0 400 120" className="w-full h-32">
              <line x1="0" y1="30" x2="400" y2="30" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1="60" x2="400" y2="60" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1="90" x2="400" y2="90" stroke="#1e293b" strokeDasharray="3 3" />

              {state.historyLoss.length > 1 && (
                <path
                  d={state.historyLoss
                    .map((item, i) => {
                      const x = (i / (state.historyLoss.length - 1)) * 400;
                      const y = 110 - Math.min(100, (item.loss / 1.5) * 100);
                      return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(10, y)}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              )}
            </svg>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>Pulsos Iniciais</span>
              <span>Convergência Orgânica Atual</span>
            </div>
          </div>

          {/* Mathematical formulation block */}
          <div className="p-3 bg-[#050811] rounded-lg border border-slate-800 space-y-1 font-mono text-[11px] text-slate-300">
            <div className="text-slate-400 font-semibold">Equação Mestra de Lindblad & Quantização:</div>
            <div className="text-cyan-300">dρ/dt = -i/ℏ[H, ρ] + ∑ (L_k ρ L_k† - 1/2&#123;L_k†L_k, ρ&#125;)</div>
            <div className="text-slate-400">y(t) = ∑ W_i Tr(Ô_i ρ(t)) → Q&#123;0.1, 0.25, 0.75, 1.0&#125;⁴</div>
            <div className="text-emerald-400">Espaço de Amostragem Limpo: 4⁴ = 256 Micro-Estados</div>
          </div>
        </div>
      </div>
    </div>
  );
};
