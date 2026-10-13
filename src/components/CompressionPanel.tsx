import React from 'react';
import { CompressionMetrics, CoreState } from '../types/simulator';
import { Archive, ArrowDownToLine, Zap, CheckCircle2, Database } from 'lucide-react';

interface CompressionPanelProps {
  compression: CompressionMetrics;
  cores: CoreState[];
}

export const CompressionPanel: React.FC<CompressionPanelProps> = ({
  compression,
  cores,
}) => {
  const spikingCount = cores.filter((c) => c.hasSpiked).length;
  const sparsityPercent = ((cores.length - spikingCount) / Math.max(1, cores.length)) * 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Archive className="w-5 h-5 text-cyan-400" />
            <span>Otimização & Compressão de Telemetria em Tempo Real</span>
          </h3>
          <p className="text-xs text-slate-400">
            Algoritmos híbridos de RLE esparso e quantização Delta-ZigZag para transmissão contínua de alta frequência
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-950/40 border border-cyan-500/40 rounded-lg text-xs font-mono text-cyan-300">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>Taxa: {compression.compressionRatio}x de Redução de Payload</span>
        </div>
      </div>

      {/* 4 Compression KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        {/* Razão de Compressão */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="text-slate-400 text-xs mb-1 font-sans">RAZÃO DE COMPRESSÃO</div>
          <div className="flex items-baseline gap-1 text-2xl font-bold text-cyan-400 tabular-nums">
            <span>{compression.compressionRatio}</span>
            <span className="text-xs text-slate-400">: 1</span>
          </div>
          <div className="text-[11px] text-slate-400 font-sans mt-1">
            Economia: {compression.bandwidthSavedPercent}% do barramento
          </div>
        </div>

        {/* Bytes Brutos vs Comprimidos */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="text-slate-400 text-xs mb-1 font-sans">TAMANHO POR QUADRO</div>
          <div className="flex items-baseline gap-1.5 text-xl font-bold text-emerald-400 tabular-nums">
            <span>{compression.compressedTelemetryBytes}</span>
            <span className="text-xs text-slate-400 font-normal">/ {compression.rawTelemetryBytes} B</span>
          </div>
          <div className="text-[11px] text-slate-400 font-sans mt-1">
            Payload otimizado por pacote UDP
          </div>
        </div>

        {/* Latência do Codificador */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="text-slate-400 text-xs mb-1 font-sans">LATÊNCIA DO ENCODER</div>
          <div className="flex items-baseline gap-1 text-2xl font-bold text-amber-400 tabular-nums">
            <span>{compression.encodingTimeMicroseconds}</span>
            <span className="text-xs text-slate-400">µs</span>
          </div>
          <div className="text-[11px] text-slate-400 font-sans mt-1">
            Sobrecarga computacional desprezível
          </div>
        </div>

        {/* Esparsidade Espaço-Temporal */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="text-slate-400 text-xs mb-1 font-sans">ESPARSIDADE DE DISPAROS</div>
          <div className="flex items-baseline gap-1 text-2xl font-bold text-pink-400 tabular-nums">
            <span>{sparsityPercent.toFixed(1)}</span>
            <span className="text-xs text-slate-400">%</span>
          </div>
          <div className="text-[11px] text-slate-400 font-sans mt-1">
            {cores.length - spikingCount} de {cores.length} núcleos em repouso
          </div>
        </div>
      </div>

      {/* Compression Pipeline Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        {/* Spike RLE Stage */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2.5">
          <div className="flex items-center gap-2 font-semibold text-cyan-400">
            <Zap className="w-4 h-4" />
            <span>1. Run-Length Encoding (RLE) em Trens de Disparos</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Como a dinâmica cerebral in-materio opera por codificação de taxa e eventos esparsos (event-driven), mais de 80% do vetor de estados é composto por zeros contíguos. O algoritmo RLE agrupa repetições de inatividade em uma única palavra compactada, eliminando redundância temporal sem perdas (lossless).
          </p>
          <div className="p-2.5 bg-[#070b14] rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
            <div className="text-slate-500">// Exemplo de Compactação de Vetor de Disparos:</div>
            <div className="text-slate-400 mt-1">Raw: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0] (40 bytes)</div>
            <div className="text-emerald-400 font-bold">RLE: "5;0;1;1;4;0" (6 bytes)</div>
          </div>
        </div>

        {/* Delta Zigzag Stage */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2.5">
          <div className="flex items-center gap-2 font-semibold text-emerald-400">
            <Database className="w-4 h-4" />
            <span>2. Diferencial Delta & Quantização Zig-Zag de Potenciais</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Os potenciais de membrana V(t) variam de forma suave entre passos de integração (dt=1ms). Em vez de transmitir floats IEEE-754 de 64 bits para cada nó, o sistema transmite apenas a diferença ΔV = V(t) - V(t-1), compactada com codificação de comprimento variável.
          </p>
          <div className="p-2.5 bg-[#070b14] rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
            <div className="text-slate-500">// Diferença Discreta de Membrana:</div>
            <div className="text-slate-400 mt-1">Raw Float64: -65.2340 mV (8 bytes)</div>
            <div className="text-cyan-400 font-bold">Delta ZigZag: +0.4 mV -&gt; 0x04 (1 byte)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
