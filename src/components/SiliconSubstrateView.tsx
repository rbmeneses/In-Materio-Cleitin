import React, { useRef, useEffect, useState } from 'react';
import { CoreState, SimulationParams } from '../types/simulator';
import { buildTopologyGraph } from '../engine/topologies';
import { Sparkles, HardDrive, Zap, Info } from 'lucide-react';

interface SiliconSubstrateViewProps {
  cores: CoreState[];
  params: SimulationParams;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  selectedCoreId: number | null;
  onSelectCore: (id: number | null) => void;
  quantumBounceActive: boolean;
}

export const SiliconSubstrateView: React.FC<SiliconSubstrateViewProps> = ({
  cores,
  params,
  canvasRef,
  selectedCoreId,
  onSelectCore,
  quantumBounceActive,
}) => {
  const [hoveredCore, setHoveredCore] = useState<CoreState | null>(null);

  // Render animated silicon substrate on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let packetOffset = 0;

    const render = () => {
      packetOffset = (packetOffset + 1.8) % 100;
      const width = canvas.width;
      const height = canvas.height;

      // Clear dark silicon wafer background
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, width, height);

      // Draw Silicon Substrate Die Grid Pattern (LGA 775 gold contact pins & traces)
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      const gridSize = 24;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }

      // Die boundary
      ctx.strokeStyle = quantumBounceActive ? 'rgba(236, 72, 153, 0.6)' : 'rgba(6, 182, 212, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(16, 16, width - 32, height - 32);

      // Build graph coordinates for cores
      const graph = buildTopologyGraph(cores.length, params.topology);

      // 1. Draw Interconnect Links (Electrical Copper Traces or Photonic Optical Waveguides)
      graph.links.forEach((link, idx) => {
        const fromNode = graph.nodes[link.from];
        const toNode = graph.nodes[link.to];
        if (!fromNode || !toNode) return;

        const isPhotonic = params.transmissionMode === 'photonic' || link.isPhotonic;

        // Line style
        if (isPhotonic) {
          // Glowing optical waveguide
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
        } else {
          // Standard copper trace
          ctx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 4]);
        }

        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated Traveling Packet (Laser pulse or electrical spike)
        const fromCore = cores[link.from];
        const hasActivity = fromCore && (fromCore.hasSpiked || fromCore.firingRateHz > 2);

        if (hasActivity || isPhotonic) {
          const t = ((packetOffset + idx * 15) % 100) / 100;
          const px = fromNode.x + (toNode.x - fromNode.x) * t;
          const py = fromNode.y + (toNode.y - fromNode.y) * t;

          ctx.beginPath();
          ctx.arc(px, py, isPhotonic ? 3.5 : 2.5, 0, Math.PI * 2);
          ctx.fillStyle = isPhotonic ? '#00f0ff' : '#ff0064';
          ctx.shadowColor = isPhotonic ? '#00f0ff' : '#ff0064';
          ctx.shadowBlur = isPhotonic ? 8 : 4;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // 2. Draw Cores / Neuromorphic Nodes
      graph.nodes.forEach((node) => {
        const core = cores[node.id];
        if (!core) return;

        const isSelected = selectedCoreId === core.id;
        const radius = isSelected ? 16 : 13;

        // Core base circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);

        // Core color based on membrane voltage and spiking
        if (core.hasSpiked) {
          ctx.fillStyle = '#ff0064'; // Action potential spike flash
          ctx.shadowColor = '#ff0064';
          ctx.shadowBlur = 12;
        } else {
          // Interpolate color from rest (-65mV = cyan) to near threshold (amber)
          const normV = Math.max(0, Math.min(1, (core.voltage - params.vRest) / (params.vTh - params.vRest)));
          if (normV > 0.7) {
            ctx.fillStyle = '#f59e0b';
          } else {
            ctx.fillStyle = '#1e293b';
          }
          ctx.shadowBlur = 0;
        }

        ctx.fill();

        // Border
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.strokeStyle = isSelected ? '#00f0ff' : '#334155';
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Core Number label
        ctx.fillStyle = core.hasSpiked ? '#ffffff' : '#cbd5e1';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`N${core.id + 1}`, node.x, node.y);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [cores, params, selectedCoreId, quantumBounceActive]);

  // Handle canvas click to select core
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const graph = buildTopologyGraph(cores.length, params.topology);
    const clicked = graph.nodes.find((node) => {
      const dx = node.x - clickX;
      const dy = node.y - clickY;
      return Math.sqrt(dx * dx + dy * dy) <= 18;
    });

    if (clicked) {
      onSelectCore(clicked.id === selectedCoreId ? null : clicked.id);
    } else {
      onSelectCore(null);
    }
  };

  const selectedCore = cores.find((c) => c.id === selectedCoreId);

  return (
    <div className="relative flex flex-col bg-[#0b0f19] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Substrate Header Ribbon */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-200">Substrato Físico Silício LGA 775</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">
            Topologia: <span className="text-cyan-400 uppercase font-mono font-medium">{params.topology}</span>
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">
            Meio: <span className={params.transmissionMode === 'photonic' ? 'text-pink-400 font-mono font-medium' : 'text-slate-300 font-mono'}>
              {params.transmissionMode === 'photonic' ? 'Guia Óptico Fotônico (WDM)' : 'Trilha Metálica Elétrica (Cobre)'}
            </span>
          </span>
        </div>

        {quantumBounceActive && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-pink-950/60 border border-pink-500/40 text-pink-300 animate-pulse font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>BOUNCE QUÂNTICO ATIVO</span>
          </div>
        )}
      </div>

      {/* Main Substrate Stage: Hardware blocks layout */}
      <div className="flex flex-col lg:flex-row items-stretch gap-0 bg-[#070b14]">
        {/* Left Peripheral: ESP32 DAC Input Controller */}
        <div className="lg:w-44 p-4 border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col justify-between bg-slate-950/40 text-xs">
          <div>
            <div className="flex items-center gap-2 mb-2 text-cyan-400 font-semibold">
              <Zap className="w-4 h-4" />
              <span>CTRL ENTRADA</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              ESP32 (Core 0) Gerador DAC / Barramento de Estímulo
            </p>
            <div className="space-y-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">I(t) Global:</span>
                <span className="text-cyan-300 font-semibold">{params.inputCurrent.toFixed(1)} mA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Taxa DAC:</span>
                <span className="text-slate-200">100 kS/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Resolução:</span>
                <span className="text-slate-200">8-bit / PWM</span>
              </div>
            </div>
          </div>

          {/* SSD Modulator integrated box */}
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
              <HardDrive className="w-3.5 h-3.5" />
              <span>SSD Modulador</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Modulação de Condutância por Flash NVMe
            </p>
            <div className="text-[11px] font-mono space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={params.ssdModulationEnabled ? 'text-emerald-400' : 'text-slate-500'}>
                  {params.ssdModulationEnabled ? 'Ativo' : 'Bypass'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Fila NVMe:</span>
                <span>{params.ssdQueueDepth} cmds</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Canvas Canvas for Silicon Die */}
        <div className="flex-1 relative flex items-center justify-center min-h-[380px] p-2 bg-[#050810]">
          <canvas
            ref={canvasRef}
            width={640}
            height={390}
            onClick={handleCanvasClick}
            className="w-full h-auto max-h-[420px] object-contain cursor-crosshair rounded-lg"
          />

          {/* Node count pill overlay */}
          <div className="absolute top-4 left-4 bg-slate-900/85 backdrop-blur-sm border border-slate-800 px-3 py-1.5 rounded-md text-[11px] text-slate-300 font-mono">
            {cores.length} Núcleos Mapeados · Clique no nó para inspecionar
          </div>
        </div>

        {/* Right Peripheral: Output Controller ADC / UDP */}
        <div className="lg:w-48 p-4 border-t lg:border-t-0 lg:border-l border-slate-800/80 flex flex-col justify-between bg-slate-950/40 text-xs">
          <div>
            <div className="flex items-center gap-2 mb-2 text-pink-400 font-semibold">
              <Zap className="w-4 h-4" />
              <span>CTRL SAÍDA</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              ESP32 (Core 1) Coleta ADC & Stream UDP
            </p>
            <div className="space-y-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Amostragem:</span>
                <span className="text-slate-200">100 kHz</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Spikes/Passo:</span>
                <span className="text-pink-300 font-semibold">
                  {cores.filter((c) => c.hasSpiked).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Interface:</span>
                <span className="text-slate-200">UDP Socket</span>
              </div>
            </div>
          </div>

          {/* Selected Core Inspector Card */}
          {selectedCore ? (
            <div className="mt-4 pt-3 border-t border-slate-800/80 bg-cyan-950/20 p-2 rounded-lg border border-cyan-500/30">
              <div className="flex items-center justify-between text-cyan-400 font-semibold mb-1">
                <span>Nó {selectedCore.id + 1}</span>
                <button
                  onClick={() => onSelectCore(null)}
                  className="text-slate-400 hover:text-slate-200 text-[10px] cursor-pointer"
                >
                  ✕ Fechar
                </button>
              </div>
              <div className="space-y-1 text-[11px] font-mono text-slate-300">
                <div className="flex justify-between">
                  <span>Potencial V:</span>
                  <span className={selectedCore.voltage >= params.vTh ? 'text-amber-400 font-bold' : 'text-cyan-300'}>
                    {selectedCore.voltage.toFixed(1)} mV
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Disparos:</span>
                  <span>{selectedCore.spikeCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frequência:</span>
                  <span>{selectedCore.firingRateHz.toFixed(1)} Hz</span>
                </div>
                <div className="flex justify-between">
                  <span>Latência:</span>
                  <span className="text-emerald-300">{selectedCore.latencyNs.toFixed(2)} ns</span>
                </div>
                <div className="flex justify-between">
                  <span>Temperatura:</span>
                  <span>{selectedCore.temperatureCelsius.toFixed(1)} °C</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-slate-900/40 rounded border border-dashed border-slate-800 text-center text-slate-500 text-[11px]">
              Selecione um nó no silício para ver detalhes eletrofisiológicos.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
