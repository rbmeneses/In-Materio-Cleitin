/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { HistoricalPowerPoint, SimulationParams, SimulationStepResult, TopologyType } from './types/simulator';
import { NeuromorphicSimulationEngine } from './engine/simulation';
import { Header } from './components/Header';
import { SiliconSubstrateView } from './components/SiliconSubstrateView';
import { MetricsLatencyThroughput } from './components/MetricsLatencyThroughput';
import { TopologyComparison } from './components/TopologyComparison';
import { SSDModulatorPanel } from './components/SSDModulatorPanel';
import { PhotonicPulsePanel } from './components/PhotonicPulsePanel';
import { PowerDashboard } from './components/PowerDashboard';
import { CompressionPanel } from './components/CompressionPanel';
import { TelemetryLogger } from './components/TelemetryLogger';
import { RecordingModule } from './components/RecordingModule';
import { ControlPanel } from './components/ControlPanel';
import { LLMPipelineView } from './components/LLMPipelineView';
import { ExperimentGuideView } from './components/ExperimentGuideView';
import { GrapheneReservoirView } from './components/GrapheneReservoirView';

const DEFAULT_PARAMS: SimulationParams = {
  numNeurons: 16,
  inputCurrent: 1.5,
  tauM: 20.0,
  vRest: -65.0,
  vTh: -50.0,
  resistance: 10.0,
  sigmaNoise: 2.0,
  topology: 'star',
  transmissionMode: 'photonic',

  // SSD Modulator
  ssdModulationEnabled: true,
  ssdQueueDepth: 16,
  ssdIntensity: 45,
  ssdMode: 'synaptic_weight',

  // Photonic Pulse Theory (Ricardo B Meneses)
  photonicWavelengthNm: 1550,
  expansionFactorS: 12,
  negativeDensityRhoPi: -0.42,
  quantumBounceEnabled: true,
};

export default function App() {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedCoreId, setSelectedCoreId] = useState<number | null>(null);

  // Engine instance stored in ref to maintain continuity
  const engineRef = useRef<NeuromorphicSimulationEngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Current simulation state
  const [currentStepResult, setCurrentStepResult] = useState<SimulationStepResult | null>(null);
  const [historyVoltages, setHistoryVoltages] = useState<{ time: number; values: number[] }[]>([]);
  const [historyLatency, setHistoryLatency] = useState<{ time: number; avgLatency: number; maxLatency: number }[]>([]);
  const [historyThroughput, setHistoryThroughput] = useState<{ time: number; throughputGflops: number }[]>([]);
  const [historyPower, setHistoryPower] = useState<HistoricalPowerPoint[]>([]);

  // Initialize engine
  useEffect(() => {
    const engine = new NeuromorphicSimulationEngine(DEFAULT_PARAMS);
    engineRef.current = engine;
    const initialResult = engine.step(1.0);
    setCurrentStepResult(initialResult);
  }, []);

  // Update engine params when state changes
  const handleUpdateParams = (updates: Partial<SimulationParams>) => {
    setParams((prev) => {
      const next = { ...prev, ...updates };
      if (engineRef.current) {
        engineRef.current.updateParams(next);
      }
      return next;
    });
  };

  // Preset switchers
  const handleApplyPreset = (presetName: string) => {
    if (!engineRef.current) return;
    let newP: Partial<SimulationParams> = {};

    switch (presetName) {
      case 'default':
        newP = {
          numNeurons: 16,
          inputCurrent: 1.5,
          tauM: 20.0,
          sigmaNoise: 2.0,
          topology: 'star',
          transmissionMode: 'electrical',
          ssdModulationEnabled: true,
          ssdIntensity: 30,
        };
        break;
      case 'photonic_max':
        newP = {
          numNeurons: 32,
          inputCurrent: 2.2,
          tauM: 16.0,
          sigmaNoise: 1.8,
          topology: 'photonic_crossbar',
          transmissionMode: 'photonic',
          quantumBounceEnabled: true,
          photonicWavelengthNm: 1550,
          ssdModulationEnabled: true,
          ssdIntensity: 60,
        };
        break;
      case 'ssd_burst':
        newP = {
          numNeurons: 16,
          inputCurrent: 1.8,
          ssdModulationEnabled: true,
          ssdQueueDepth: 64,
          ssdIntensity: 85,
          ssdMode: 'refractory_damping',
          topology: 'mesh2d',
        };
        break;
      case 'high_entropy':
        newP = {
          numNeurons: 24,
          inputCurrent: 2.8,
          sigmaNoise: 6.5,
          topology: 'hypercube',
          transmissionMode: 'photonic',
          quantumBounceEnabled: true,
        };
        break;
    }

    handleUpdateParams(newP);
  };

  // Reset simulation
  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.resetSimulation();
      const res = engineRef.current.step(1.0);
      setCurrentStepResult(res);
      setHistoryVoltages([]);
      setHistoryLatency([]);
      setHistoryThroughput([]);
      setHistoryPower([]);
    }
  };

  // Continuous simulation loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      if (engineRef.current) {
        const res = engineRef.current.step(1.0);
        setCurrentStepResult(res);

        // Append to rolling histories (keep last 40 data points)
        setHistoryLatency((prev) => [
          ...prev.slice(-39),
          { time: res.simTimeMs, avgLatency: res.averageLatencyNs, maxLatency: res.maxLatencyNs },
        ]);

        setHistoryThroughput((prev) => [
          ...prev.slice(-39),
          { time: res.simTimeMs, throughputGflops: res.aggregateThroughputGflops },
        ]);

        setHistoryVoltages((prev) => [
          ...prev.slice(-39),
          { time: res.simTimeMs, values: res.cores.map((c) => c.voltage) },
        ]);

        setHistoryPower((prev) => [
          ...prev.slice(-39),
          {
            timeMs: res.simTimeMs,
            totalPowerMw: res.power.totalPowerMw,
            coresDynamicMw: res.power.dynamicPowerMw,
            coresLeakageMw: res.power.staticLeakageMw,
            ssdModulatorMw: res.power.ssdModulatorPowerMw,
            interconnectMw: res.power.interconnectPowerMw,
            esp32ControllerMw: 12.0,
            efficiencyGflopsW: res.power.efficiencyGflopsPerWatt,
          },
        ]);
      }
    }, 60); // ~16 FPS state update tick

    return () => clearInterval(interval);
  }, [isRunning]);

  if (!currentStepResult) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-slate-400 font-mono text-sm">
        Carregando matriz in-materio...
      </div>
    );
  }

  const logs = engineRef.current ? engineRef.current.getLogs() : [];

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header conforming strictly to the Top Bar Contract */}
      <Header
        isRunning={isRunning}
        onToggleRun={() => setIsRunning(!isRunning)}
        onReset={handleReset}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Workspace Frame */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
        {/* Top Video Recording & Snapshot Utility Bar */}
        <RecordingModule canvasRef={canvasRef} />

        {/* Tab 1: Visão Geral (Overview) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Silicon Substrate View */}
            <SiliconSubstrateView
              cores={currentStepResult.cores}
              params={params}
              canvasRef={canvasRef}
              selectedCoreId={selectedCoreId}
              onSelectCore={setSelectedCoreId}
              quantumBounceActive={currentStepResult.quantumBounceActive}
            />

            {/* Real-time Latency & Throughput Metrics & Oscilloscope with Bottlenecks */}
            <MetricsLatencyThroughput
              cores={currentStepResult.cores}
              params={params}
              historyVoltages={historyVoltages}
              historyLatency={historyLatency}
              historyThroughput={historyThroughput}
              bottlenecks={currentStepResult.bottlenecks}
              selectedCoreId={selectedCoreId}
              onSelectCore={setSelectedCoreId}
            />

            {/* Split Row: Control Panel + Energy Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <ControlPanel
                  params={params}
                  onChangeParams={handleUpdateParams}
                  onApplyPreset={handleApplyPreset}
                />
              </div>

              <div className="lg:col-span-2 space-y-6">
                <PowerDashboard
                  power={currentStepResult.power}
                  params={params}
                  cores={currentStepResult.cores}
                  historyPower={historyPower}
                />
                <CompressionPanel
                  compression={currentStepResult.compression}
                  cores={currentStepResult.cores}
                />
              </div>
            </div>

            {/* Graphene Reservoir Quick Link Banner */}
            <div className="p-4 bg-gradient-to-r from-sky-950/40 via-purple-950/30 to-slate-900 border border-sky-500/30 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-950 border border-sky-400/40 flex items-center justify-center text-sky-400">
                  <span className="font-mono font-bold text-xs">C₄</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">
                    Projeto Cleitin: Computação de Reservatório Quântico com Grafeno
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Câmara a vácuo cubo 4x4, férmions de Dirac, tunelamento de Klein e 256 micro-estados quaternários
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('graphene')}
                className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                Abrir Reservatório Quântico
              </button>
            </div>

            {/* Telemetry Logger & Export (CSV / JSON) */}
            <TelemetryLogger
              logs={logs}
              cores={currentStepResult.cores}
              params={params}
              simTimeMs={currentStepResult.simTimeMs}
              onClearLogs={() => engineRef.current?.clearLogs()}
            />
          </div>
        )}

        {/* Tab: Computação de Reservatório Quântico com Grafeno */}
        {activeTab === 'graphene' && (
          <div className="space-y-6">
            <GrapheneReservoirView />
          </div>
        )}

        {/* Tab: Pipeline LLM ↔ Silício In-Materio */}
        {activeTab === 'llm_pipeline' && (
          <div className="space-y-6">
            <LLMPipelineView
              cores={currentStepResult.cores}
              params={params}
              totalSpikes={currentStepResult.totalSpikesInStep}
              currentShiftMv={currentStepResult.ssdModulationShift}
            />

            {/* Substrate Die View accompanying the LLM Pipeline */}
            <SiliconSubstrateView
              cores={currentStepResult.cores}
              params={params}
              canvasRef={canvasRef}
              selectedCoreId={selectedCoreId}
              onSelectCore={setSelectedCoreId}
              quantumBounceActive={currentStepResult.quantumBounceActive}
            />
          </div>
        )}

        {/* Tab: Topologias de Rede (Network Topologies Comparison) */}
        {activeTab === 'topologies' && (
          <div className="space-y-6">
            <TopologyComparison
              numNeurons={params.numNeurons}
              transmissionMode={params.transmissionMode}
              currentTopology={params.topology}
              onSelectTopology={(top: TopologyType) => handleUpdateParams({ topology: top })}
            />

            {/* Live Substrate Die View with the chosen topology */}
            <SiliconSubstrateView
              cores={currentStepResult.cores}
              params={params}
              canvasRef={canvasRef}
              selectedCoreId={selectedCoreId}
              onSelectCore={setSelectedCoreId}
              quantumBounceActive={currentStepResult.quantumBounceActive}
            />

            {/* Latency & Throughput under this topology */}
            <MetricsLatencyThroughput
              cores={currentStepResult.cores}
              params={params}
              historyVoltages={historyVoltages}
              historyLatency={historyLatency}
              historyThroughput={historyThroughput}
              bottlenecks={currentStepResult.bottlenecks}
              selectedCoreId={selectedCoreId}
              onSelectCore={setSelectedCoreId}
            />
          </div>
        )}

        {/* Tab: SSD & Fotônica (Modulador Flash NVMe & Teoria do Pulso Primordial) */}
        {activeTab === 'modulator_photonics' && (
          <div className="space-y-6">
            {/* Photonic Pulse Theory Component */}
            <PhotonicPulsePanel
              params={params}
              onChangeParams={handleUpdateParams}
              quantumBounceActive={currentStepResult.quantumBounceActive}
            />

            {/* SSD Modulator Panel */}
            <SSDModulatorPanel
              params={params}
              onChangeParams={handleUpdateParams}
              currentSpikes={currentStepResult.totalSpikesInStep}
              currentShiftMv={currentStepResult.ssdModulationShift}
            />

            {/* Substrate view */}
            <SiliconSubstrateView
              cores={currentStepResult.cores}
              params={params}
              canvasRef={canvasRef}
              selectedCoreId={selectedCoreId}
              onSelectCore={setSelectedCoreId}
              quantumBounceActive={currentStepResult.quantumBounceActive}
            />
          </div>
        )}

        {/* Tab: O Experimento (Comprehensive Scientific Guide) */}
        {activeTab === 'experiment_guide' && (
          <div className="space-y-6">
            <ExperimentGuideView />
          </div>
        )}
      </main>

      {/* Clean quiet footer */}
      <footer className="mt-auto border-t border-slate-900 bg-[#04070e] px-6 py-4 text-center text-xs text-slate-500 font-mono">
        Projeto Cleitin · Arquitetura Paralela In-Materio LGA 775 · Teoria do Pulso Primordial (Ricardo B Meneses)
      </footer>
    </div>
  );
}
