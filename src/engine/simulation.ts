/**
 * Core Neuromorphic In-Materio Parallel Simulation Engine
 * Project Cleitin - Silicon LGA 775 & Photonic Pulse Substrate
 */

import {
  CoreBottleneckStatus,
  CoreState,
  HistoricalPowerPoint,
  PowerMetrics,
  SimulationParams,
  SimulationStepResult,
  TelemetryLogEntry,
  WdmChannel,
} from '../types/simulator';
import { computePhotonicMetrics, generateWdmChannels } from './photonics';
import { ssdModulatorInstance } from './ssdModulator';
import { getTopologyDefinitions } from './topologies';
import { telemetryCompressor } from './compression';

export class NeuromorphicSimulationEngine {
  private params: SimulationParams;
  private cores: CoreState[] = [];
  private currentStep: number = 0;
  private simTimeMs: number = 0;
  private logs: TelemetryLogEntry[] = [];
  private cumulativeEnergyJoules: number = 0;
  private wdmChannels: WdmChannel[] = [];

  constructor(initialParams: SimulationParams) {
    this.params = initialParams;
    this.initCores();
    this.wdmChannels = generateWdmChannels(this.params.photonicWavelengthNm);
  }

  public updateParams(newParams: Partial<SimulationParams>): void {
    const prevNeurons = this.params.numNeurons;
    const prevLambda = this.params.photonicWavelengthNm;
    this.params = { ...this.params, ...newParams };

    if (newParams.numNeurons !== undefined && newParams.numNeurons !== prevNeurons) {
      this.initCores();
    }
    if (newParams.photonicWavelengthNm !== undefined && newParams.photonicWavelengthNm !== prevLambda) {
      this.wdmChannels = generateWdmChannels(this.params.photonicWavelengthNm);
    }
  }

  public getParams(): SimulationParams {
    return { ...this.params };
  }

  public getLogs(): TelemetryLogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public initCores(): void {
    const n = this.params.numNeurons;
    this.cores = [];

    // Pseudo-random deterministic variations per core to mimic physical LGA 775 silicon variations
    for (let i = 0; i < n; i++) {
      const seed = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
      const normVar1 = (seed - Math.floor(seed) - 0.5) * 0.1; // ±5%
      const normVar2 = Math.cos(i * 9.876) * 0.05;

      const individualTau = Math.max(1, this.params.tauM * (1 + normVar1));
      const individualResistance = Math.max(0.5, this.params.resistance * (1 + normVar2));
      const individualThreshold = this.params.vTh * (1 + normVar1 * 0.4);

      this.cores.push({
        id: i,
        voltage: this.params.vRest,
        previousVoltage: this.params.vRest,
        hasSpiked: false,
        spikeCount: 0,
        firingRateHz: 0,
        firingProbability: 0,
        latencyNs: 4.2,
        throughputMOps: 2.5,
        individualTau,
        individualResistance,
        individualThreshold,
        queueDepth: 0,
        temperatureCelsius: 38 + (i % 4) * 1.5,
      });
    }

    this.addLog(
      'INFO',
      `Matriz LGA 775 inicializada com ${n} núcleos in-materio em paralelo na topologia ${this.params.topology.toUpperCase()}.`
    );
  }

  public resetSimulation(): void {
    this.currentStep = 0;
    this.simTimeMs = 0;
    this.cumulativeEnergyJoules = 0;
    this.initCores();
    this.logs = [];
    this.wdmChannels = generateWdmChannels(this.params.photonicWavelengthNm);
    this.addLog('INFO', 'Simulador resetado com sucesso.');
  }

  public step(dtMs: number = 1.0): SimulationStepResult {
    this.currentStep++;
    this.simTimeMs += dtMs;

    const {
      inputCurrent,
      vRest,
      sigmaNoise,
      topology,
      transmissionMode,
      ssdModulationEnabled,
      ssdIntensity,
      ssdQueueDepth,
      ssdMode,
      photonicWavelengthNm,
      quantumBounceEnabled,
    } = this.params;

    const topologyDefs = getTopologyDefinitions(this.cores.length, transmissionMode);
    const currentTopology = topologyDefs[topology];

    // Compute Photonic metrics
    const photonicProfile = computePhotonicMetrics(
      photonicWavelengthNm,
      0.7,
      1.0,
      12,
      4.0
    );

    // Update SSD Modulator state
    const currentTotalSpikes = this.cores.filter((c) => c.hasSpiked).length;
    const avgSubstrateTemp =
      this.cores.reduce((acc, c) => acc + c.temperatureCelsius, 0) / Math.max(1, this.cores.length);

    const ssdState = ssdModulatorInstance.update(
      ssdModulationEnabled,
      ssdIntensity,
      ssdQueueDepth,
      ssdMode,
      currentTotalSpikes,
      avgSubstrateTemp
    );

    let stepSpikes = 0;

    // Evaluate LIF dynamics across all parallel cores
    for (let i = 0; i < this.cores.length; i++) {
      const core = this.cores[i];
      core.previousVoltage = core.voltage;

      // Handle post-spike reset
      if (core.hasSpiked) {
        core.voltage = vRest;
        core.hasSpiked = false;
      }

      // Resistance modulated by SSD
      const effectiveR = core.individualResistance * ssdState.conductanceModulationDelta;

      // Effective dv from stimulus current and leak
      const dv = (-(core.voltage - vRest) + effectiveR * inputCurrent) * (dtMs / core.individualTau);
      let vNew = core.voltage + dv;

      // Noise jitter
      const thermalJitter = (Math.random() - 0.5) * (sigmaNoise * 0.4);
      vNew += thermalJitter;

      // Stochastic sigmoid spike probability
      const exponent = Math.max(-50, Math.min(50, -(vNew - core.individualThreshold) / Math.max(0.1, sigmaNoise)));
      const pSpike = 1.0 / (1.0 + Math.exp(exponent));
      core.firingProbability = pSpike;

      // Spike decision
      const randomDraw = Math.random();
      if (randomDraw < pSpike) {
        core.hasSpiked = true;
        core.spikeCount++;
        core.voltage = 20.0;
        stepSpikes++;

        // Increment queue for downstream nodes
        core.queueDepth = Math.min(32, core.queueDepth + 2);

        if (this.currentStep % 25 === 0 && Math.random() < 0.2) {
          this.addLog(
            'SPIKE',
            `Disparo de Potencial de Ação no Nó ${i + 1}: V = +20.0 mV, Prob = ${(pSpike * 100).toFixed(1)}%`,
            i,
            { voltage: 20.0, latency: core.latencyNs }
          );
        }
      } else {
        core.voltage = Math.min(19.0, Math.max(-85.0, vNew));
        // Queue drain
        core.queueDepth = Math.max(0, core.queueDepth - 1);
      }

      // Update firing rate
      core.firingRateHz = (core.spikeCount / Math.max(1, this.simTimeMs)) * 1000;

      // Latency calculation: based on topology hops, electrical RC lines or photonic waveguides
      const baseTopologyLatency = currentTopology.latencyNs;
      const coreJitter = (Math.sin(this.currentStep * 0.1 + i) * 0.5 + 0.5) * 0.3;
      const queuePenalty = core.queueDepth * (transmissionMode === 'photonic' ? 0.01 : 0.45);
      const rawLatency = baseTopologyLatency * (1 + coreJitter) + queuePenalty;

      // In photonic mode, sub-nanosecond optical transit
      core.latencyNs = transmissionMode === 'photonic'
        ? Math.max(0.08, rawLatency * 0.04)
        : rawLatency + (ssdState.activeCommands * 0.05);

      // Core Throughput in MOps (25 FLOPs per LIF update at 100kHz sampling)
      const baseThroughput = (25 * 100000) / 1e6; // 2.5 MOps
      const photonicBoost = transmissionMode === 'photonic' ? 4.2 : 1.0;
      core.throughputMOps = Number((baseThroughput * photonicBoost * (1 + (core.firingRateHz / 150))).toFixed(2));

      // Thermal profile
      core.temperatureCelsius = 38 + (core.firingRateHz * 0.08) + (sigmaNoise * 0.5);
    }

    // Identify bottlenecks dynamically across all cores
    const bottlenecks = this.detectBottlenecks(currentTopology.collisionRatePercent);

    // Update WDM channel packet distribution
    this.wdmChannels.forEach((ch, idx) => {
      ch.activePackets = Math.max(0, Math.floor((stepSpikes * 2 + (idx % 3)) * (transmissionMode === 'photonic' ? 1.5 : 0.2)));
    });

    // Informational complexity & Quantum Bounce triggering
    const informationalComplexity = this.cores.reduce((sum, c) => sum + c.spikeCount * 2.5, 0);
    const quantumBounceActive =
      quantumBounceEnabled &&
      (informationalComplexity > 120 || (this.currentStep % 100 === 0 && Math.random() < 0.05));

    if (quantumBounceActive && this.currentStep % 50 === 0) {
      this.addLog(
        'BOUNCE',
        `PULSO PRIMORDIAL: Bounce Quântico acionado! ρ_eff = ${photonicProfile.effectiveEnergyDensity.toFixed(4)}, H = 0 verificado.`
      );
    }

    if (transmissionMode === 'photonic' && this.currentStep % 40 === 0 && Math.random() < 0.25) {
      this.addLog(
        'PHOTONIC',
        `Guia óptico ativo (λ=${photonicWavelengthNm}nm): Pacote transmitido em ${photonicProfile.photonicLatencyNs.toFixed(3)} ns (Speedup: ${photonicProfile.latencySpeedupFactor.toFixed(1)}x).`
      );
    }

    // Power Calculation
    const power = this.computePower(currentTopology.energyPerBitPicoJoules, stepSpikes, ssdState.enabled);
    this.cumulativeEnergyJoules += (power.totalPowerMw / 1000) * (dtMs / 1000);
    power.cumulativeJoules = Number(this.cumulativeEnergyJoules.toFixed(4));

    // Compression Evaluation
    const compression = telemetryCompressor.evaluateFrame(this.cores);

    // Aggregate metrics
    const avgLatency =
      this.cores.reduce((acc, c) => acc + c.latencyNs, 0) / Math.max(1, this.cores.length);
    const maxLatency = Math.max(...this.cores.map((c) => c.latencyNs));
    const aggregateThroughput =
      (this.cores.reduce((acc, c) => acc + c.throughputMOps, 0) / 1000); // GFLOPS

    return {
      step: this.currentStep,
      simTimeMs: this.simTimeMs,
      cores: [...this.cores],
      totalSpikesInStep: stepSpikes,
      aggregateThroughputGflops: Number(aggregateThroughput.toFixed(3)),
      averageLatencyNs: Number(avgLatency.toFixed(3)),
      maxLatencyNs: Number(maxLatency.toFixed(3)),
      power,
      compression,
      quantumBounceActive,
      ssdModulationShift: ssdState.flashCellThresholdVoltageMv,
      bottlenecks,
      wdmChannels: this.wdmChannels,
    };
  }

  private detectBottlenecks(collisionRatePercent: number): CoreBottleneckStatus[] {
    const isPhotonic = this.params.transmissionMode === 'photonic';
    const statuses: CoreBottleneckStatus[] = [];

    this.cores.forEach((core) => {
      let severity: 'nominal' | 'warning' | 'critical' = 'nominal';
      let primaryCause: CoreBottleneckStatus['primaryCause'] = 'none';
      let recommendation = 'Desempenho nominal e tráfego balanceado.';

      if (core.queueDepth > 14) {
        severity = 'critical';
        primaryCause = 'queue_overflow';
        recommendation = isPhotonic
          ? 'Fila elevada por alta frequência de disparos; aumente canais WDM ou largura de banda do barramento.'
          : 'Sobrecarga de fila na linha metálica. Habilite a transmissão por Pulso Fotônico para drenagem sub-nanossegundo!';
      } else if (!isPhotonic && core.latencyNs > 10.0) {
        severity = 'warning';
        primaryCause = 'electrical_rc_delay';
        recommendation = 'Atraso capacitivo em linha de cobre (RC). Transição para Guia de Onda Fotônico reduzirá a latência em até 44x.';
      } else if (collisionRatePercent > 25) {
        severity = 'warning';
        primaryCause = 'routing_contention';
        recommendation = 'Contenção elevada na topologia atual. Recomenda-se Topologia Hipercubo ou Crossbar Fotônico para eliminar saltos intermediários.';
      } else if (core.temperatureCelsius > 48) {
        severity = 'warning';
        primaryCause = 'thermal_throttling';
        recommendation = 'Aquecimento por ruído térmico elevado. Reduza σ_ruído ou diminua a corrente de estímulo I(t).';
      }

      statuses.push({
        coreId: core.id,
        severity,
        latencyNs: Number(core.latencyNs.toFixed(2)),
        throughputMOps: Number(core.throughputMOps.toFixed(2)),
        queueDepth: core.queueDepth,
        contentionPercent: collisionRatePercent,
        primaryCause,
        recommendation,
      });
    });

    return statuses;
  }

  private computePower(energyPerBitPj: number, stepSpikes: number, ssdEnabled: boolean): PowerMetrics {
    const n = this.cores.length;
    const isPhotonic = this.params.transmissionMode === 'photonic';

    // Dynamic power (capacitive switching of silicon gates during LIF state updates)
    const dynamicPowerMw = n * 4.2 + stepSpikes * 8.5;

    // Static leakage power (temperature and thermal noise dependent)
    const staticLeakageMw = n * 1.5 * (1 + this.params.sigmaNoise * 0.15);

    // SSD Modulator power (NVMe controller + charge pump voltage shift)
    const ssdModulatorPowerMw = ssdEnabled ? 18.0 + (this.params.ssdIntensity * 0.22) : 0;

    // Interconnect network power
    const bitsTransmitted = stepSpikes * 64; // 64-bit spike packet
    const interconnectEnergyPj = bitsTransmitted * energyPerBitPj;
    const interconnectPowerMw = (interconnectEnergyPj * 1e-12) / 1e-3 * 1000; // in mW

    const totalPowerMw = dynamicPowerMw + staticLeakageMw + ssdModulatorPowerMw + interconnectPowerMw;

    // Energy-delay product (EDP) = Energy (J) * Delay (s)
    const avgDelaySec = (isPhotonic ? 0.28e-9 : 12.0e-9);
    const energyDelayProductJs = (totalPowerMw * 1e-3) * avgDelaySec;

    // Efficiency: GFLOPS per Watt
    const totalGflops = (n * 25 * 100000) / 1e9 * (isPhotonic ? 4.2 : 1.0);
    const efficiencyGflopsPerWatt = Number((totalGflops / Math.max(0.001, totalPowerMw / 1000)).toFixed(2));

    return {
      dynamicPowerMw: Number(dynamicPowerMw.toFixed(2)),
      staticLeakageMw: Number(staticLeakageMw.toFixed(2)),
      ssdModulatorPowerMw: Number(ssdModulatorPowerMw.toFixed(2)),
      interconnectPowerMw: Number(interconnectPowerMw.toFixed(2)),
      totalPowerMw: Number(totalPowerMw.toFixed(2)),
      energyDelayProductJs,
      cumulativeJoules: this.cumulativeEnergyJoules,
      efficiencyGflopsPerWatt,
    };
  }

  private addLog(
    level: TelemetryLogEntry['level'],
    message: string,
    coreId?: number,
    metrics?: TelemetryLogEntry['metrics']
  ): void {
    const entry: TelemetryLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestampMs: Number(this.simTimeMs.toFixed(1)),
      level,
      coreId,
      message,
      metrics,
    };

    this.logs.unshift(entry);
    if (this.logs.length > 150) {
      this.logs.pop();
    }
  }
}
