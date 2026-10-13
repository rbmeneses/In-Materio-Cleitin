import React, { useState, useEffect, useRef } from 'react';
import { CoreState, SimulationParams } from '../types/simulator';
import {
  processPromptToEmbeddings,
  generateEnrichedLLMResponse,
  SAMPLE_PROMPTS,
  TokenEmbedding,
  PipelineStageState,
} from '../engine/llmPipeline';
import {
  MessageSquare,
  Cpu,
  Waves,
  ArrowRight,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  HardDrive,
  Activity,
  CheckCircle2,
  Radio,
} from 'lucide-react';

interface LLMPipelineViewProps {
  cores: CoreState[];
  params: SimulationParams;
  totalSpikes: number;
  currentShiftMv: number;
}

export const LLMPipelineView: React.FC<LLMPipelineViewProps> = ({
  cores,
  params,
  totalSpikes,
  currentShiftMv,
}) => {
  const [promptText, setPromptText] = useState<string>(SAMPLE_PROMPTS[0].prompt);
  const [pipelineState, setPipelineState] = useState<PipelineStageState>({
    currentStage: 'idle',
    progressPercent: 0,
    stageMessage: 'Pronto para iniciar processamento.',
    tokens: [],
    activeWaveFronts: [],
    outputSpikesVector: [],
    temperatureDelta: 0,
    entropyShift: 0,
    llmResponseText: '',
    inMaterioSignature: '',
  });

  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationTimerRef = useRef<number | null>(null);

  // Trigger full 5-stage pipeline execution
  const runPipeline = () => {
    if (pipelineState.currentStage !== 'idle' && pipelineState.currentStage !== 'completed') return;

    // Step 1: Tokenization
    const tokens = processPromptToEmbeddings(promptText, cores.length);
    setPipelineState({
      currentStage: 'tokenizing',
      progressPercent: 15,
      stageMessage: '1. Entrada LLM: Tokenizando prompt e gerando vetor de embeddings numéricos...',
      tokens,
      activeWaveFronts: [],
      outputSpikesVector: [],
      temperatureDelta: 0,
      entropyShift: 0,
      llmResponseText: '',
      inMaterioSignature: '',
    });

    // Step 2: Controller Input Request
    setTimeout(() => {
      setPipelineState((prev) => ({
        ...prev,
        currentStage: 'controller_input',
        progressPercent: 35,
        stageMessage: '2. Requisição da Controladora: ESP32 (Core 0) convertendo tokens em estímulos analógicos DAC...',
      }));

      // Step 3: Wave Propagation in LGA 775 Processors
      setTimeout(() => {
        const waves = tokens.map((t, idx) => ({
          coreId: t.assignedCoreId,
          amplitude: Math.max(0.3, t.normalizedValue),
          phase: (idx * 0.4) % (2 * Math.PI),
        }));

        setPipelineState((prev) => ({
          ...prev,
          currentStage: 'wave_propagation',
          progressPercent: 65,
          stageMessage: `3. Propagação de Onda no Silício: Ondas de potencial e pulsos ${params.transmissionMode === 'photonic' ? 'fotônicos' : 'elétricos'} percorrendo a matriz...`,
          activeWaveFronts: waves,
        }));

        // Step 4: Controller Output
        setTimeout(() => {
          const spikesVector = cores.map((c) => c.spikeCount);
          setPipelineState((prev) => ({
            ...prev,
            currentStage: 'controller_output',
            progressPercent: 85,
            stageMessage: '4. Saída para Controladora: ESP32 (Core 1 ADC) coletando potenciais integrados e disparos a 100 kHz...',
            outputSpikesVector: spikesVector,
          }));

          // Step 5: LLM Data Reception & Enriched Response Generation
          setTimeout(() => {
            const avgV = cores.reduce((acc, c) => acc + c.voltage, 0) / Math.max(1, cores.length);
            const enriched = generateEnrichedLLMResponse(
              promptText,
              totalSpikes + 12,
              avgV,
              params.transmissionMode === 'photonic',
              currentShiftMv
            );

            setPipelineState((prev) => ({
              ...prev,
              currentStage: 'completed',
              progressPercent: 100,
              stageMessage: '5. Recebimento pela LLM: Resposta gerada com entropia analógica e modulação in-materio concluída!',
              llmResponseText: enriched.text,
              entropyShift: enriched.entropyShift,
              inMaterioSignature: enriched.inMaterioSignature,
            }));
          }, 900);
        }, 1100);
      }, 1000);
    }, 800);
  };

  // Render wave propagation animation on canvas
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.05;
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, w, h);

      // Grid pattern
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.3)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Draw multi-channel wave propagation across processors
      const numLines = Math.min(8, cores.length);
      const isPhotonic = params.transmissionMode === 'photonic';

      for (let i = 0; i < numLines; i++) {
        const yBase = 25 + i * 22;
        ctx.beginPath();

        ctx.strokeStyle = isPhotonic
          ? `hsla(${(i * 35 + 180) % 360}, 100%, 65%, 0.7)`
          : `hsla(${(i * 45) % 360}, 90%, 60%, 0.6)`;
        ctx.lineWidth = 2;

        for (let x = 0; x < w; x += 3) {
          const waveFreq = 0.04 + i * 0.005;
          const waveSpeed = isPhotonic ? t * 2.5 : t * 0.9;
          const waveAmp = pipelineState.currentStage === 'wave_propagation' ? 10.0 : 4.0;
          const y = yBase + Math.sin(x * waveFreq - waveSpeed + i) * waveAmp;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Node circle labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px "JetBrains Mono"';
        ctx.fillText(`N${i + 1}`, 6, yBase - 3);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [cores.length, params.transmissionMode, pipelineState.currentStage]);

  const stagesList = [
    { id: 'tokenizing', label: '1. Entrada LLM → Controladora', desc: 'Tokens & Embeddings' },
    { id: 'controller_input', label: '2. Requisição ESP32 → Processadores', desc: 'Conversão DAC / Tensão' },
    { id: 'wave_propagation', label: '3. Propagação de Onda no Silício', desc: 'Matriz LGA 775 & Fotônica' },
    { id: 'controller_output', label: '4. Resposta → Controladora Saída', desc: 'Amostragem ADC 100kHz' },
    { id: 'completed', label: '5. Recebimento dos Dados pela LLM', desc: 'Decodificação & Resposta' },
  ];

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            <span>Pipeline Bidirecional: LLM ↔ Controladora ↔ Silício In-Materio</span>
          </h3>
          <p className="text-xs text-slate-400">
            Fluxo completo de injeção digital, propagação física de ondas no LGA 775 e retorno de telemetria para a LLM
          </p>
        </div>

        {/* Master Run Button */}
        <button
          onClick={runPipeline}
          disabled={pipelineState.currentStage !== 'idle' && pipelineState.currentStage !== 'completed'}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-lg ${
            pipelineState.currentStage === 'idle' || pipelineState.currentStage === 'completed'
              ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-cyan-500/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Processar no Substrato In-Materio</span>
        </button>
      </div>

      {/* Progress & Current Stage Ribbon */}
      <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-200">{pipelineState.stageMessage}</span>
          <span className="font-mono text-cyan-400 font-bold">{pipelineState.progressPercent}%</span>
        </div>

        {/* Multi-step progress bar */}
        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 transition-all duration-300"
            style={{ width: `${pipelineState.progressPercent}%` }}
          />
        </div>

        {/* 5-Step Pipeline Breadcrumb */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
          {stagesList.map((st, idx) => {
            const isDone =
              pipelineState.progressPercent >= (idx + 1) * 20 ||
              (idx === 4 && pipelineState.currentStage === 'completed');
            const isCurrent =
              pipelineState.currentStage === st.id ||
              (pipelineState.currentStage === 'llm_decoding' && idx === 4);

            return (
              <div
                key={st.id}
                className={`p-2 rounded-lg border text-xs transition-all ${
                  isCurrent
                    ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200'
                    : isDone
                    ? 'bg-slate-900 border-emerald-500/50 text-slate-300'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                  {isDone ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-3 h-3 rounded-full border border-current text-[9px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                  )}
                  <span className="truncate">{st.label}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">{st.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Stage Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Prompt Input & Token Vectorization */}
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>Etapa 1: Entrada de Dados LLM & Tokenização</span>
            </h4>
            <span className="text-[11px] font-mono text-slate-400">Tokens Embeddings</span>
          </div>

          {/* Prompt presets */}
          <div>
            <div className="text-xs text-slate-400 mb-1.5">Exemplos Científicos:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {SAMPLE_PROMPTS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPromptText(p.prompt)}
                  className={`p-2 rounded text-left text-xs transition-colors cursor-pointer border ${
                    promptText === p.prompt
                      ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200 font-medium'
                      : 'bg-[#070b14] border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <div className="font-semibold text-slate-200 truncate">{p.title}</div>
                  <div className="text-[10px] text-slate-500 truncate">{p.expectedThemes.join(' · ')}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Textarea */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Prompt do Usuário:</label>
            <textarea
              rows={3}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full bg-[#070b14] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Tokens & DAC Voltage Mapping Preview */}
          {pipelineState.tokens.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Vetor de Tokens Mapeados para Tensão DAC:</span>
                <span className="text-cyan-400 font-bold">{pipelineState.tokens.length} tokens</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-[#070b14] rounded-lg border border-slate-800">
                {pipelineState.tokens.map((tok, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono flex items-center gap-1.5"
                  >
                    <span className="text-slate-300 font-semibold">{tok.token}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-emerald-400 font-bold">{tok.voltageMv}mV</span>
                    <span className="text-slate-500 text-[9px]">(Nó {tok.assignedCoreId + 1})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Step 2 & 3 - Hardware Wave Propagation & Controller */}
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Waves className="w-4 h-4 text-emerald-400" />
              <span>Etapas 2, 3 e 4: Propagação de Onda nos Processadores</span>
            </h4>
            <span className="text-[11px] font-mono text-emerald-400">
              {params.transmissionMode === 'photonic' ? 'Guias Fotônicos (WDM)' : 'Linhas Metálicas RC'}
            </span>
          </div>

          {/* Wave animation canvas */}
          <div className="bg-[#050811] p-3 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono mb-2">
              <span>Oscilação Multicanal no Silício LGA 775:</span>
              <span className="text-cyan-400">f_adc = 100 kHz</span>
            </div>
            <canvas ref={waveCanvasRef} width={480} height={190} className="w-full h-44 rounded" />
          </div>

          {/* Controller and Hardware Flow Strip */}
          <div className="grid grid-cols-3 gap-2.5 text-xs font-mono">
            {/* Input Controller */}
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-cyan-400 font-semibold text-[11px] mb-1">CTRL ENTRADA</div>
              <div className="text-[10px] text-slate-400">ESP32 Core 0</div>
              <div className="text-[10px] text-slate-300 mt-1 font-bold">100 kS/s PWM</div>
            </div>

            {/* In-Materio Substrate */}
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-pink-400 font-semibold text-[11px] mb-1">LGA 775 MATRIZ</div>
              <div className="text-[10px] text-slate-400">Substrato Físico</div>
              <div className="text-[10px] text-slate-300 mt-1 font-bold">
                {params.numNeurons} nós / LIF
              </div>
            </div>

            {/* Output Controller */}
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-emerald-400 font-semibold text-[11px] mb-1">CTRL SAÍDA</div>
              <div className="text-[10px] text-slate-400">ESP32 Core 1</div>
              <div className="text-[10px] text-slate-300 mt-1 font-bold">Stream UDP</div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 5: LLM Enriched Output & Response Card */}
      {pipelineState.llmResponseText && (
        <div className="p-5 bg-slate-900/80 border border-cyan-500/50 rounded-xl space-y-4 shadow-xl shadow-cyan-500/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <div>
                <h4 className="text-sm font-bold text-white">
                  Etapa 5: Resposta da LLM Modulada pelo Substrato Físico In-Materio
                </h4>
                <p className="text-xs text-slate-400">
                  Dados de disparos analógicos decodificados em distribuições de probabilidade
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <div className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
                Assinatura: <span className="text-cyan-400">{pipelineState.inMaterioSignature}</span>
              </div>
              <div className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
                ΔS Entropia: <span className="text-emerald-400">+{pipelineState.entropyShift}</span>
              </div>
            </div>
          </div>

          {/* Response Text */}
          <div className="p-4 bg-[#070b14] rounded-lg border border-slate-800 text-slate-200 text-xs leading-relaxed font-sans">
            {pipelineState.llmResponseText}
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
            <span>Latência total do ciclo analógico: ~1,24 ms (incluindo UDP socket)</span>
            <span className="text-emerald-400 font-semibold">Consumo estimado: 0,18 mJ</span>
          </div>
        </div>
      )}
    </div>
  );
};
