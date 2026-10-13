/**
 * Types and interfaces for the In-Materio Parallel Architecture Simulator
 * Project Cleitin - Silicon LGA 775 & Photonic Pulse Substrate
 */

export type TopologyType = 'star' | 'mesh2d' | 'ring' | 'hypercube' | 'photonic_crossbar';

export type TransmissionMode = 'electrical' | 'photonic';

export type SSDModulationMode = 'synaptic_weight' | 'frequency_phase' | 'refractory_damping';

export interface CoreState {
  id: number;
  voltage: number; // in mV (-80 to +20)
  previousVoltage: number;
  hasSpiked: boolean;
  spikeCount: number;
  firingRateHz: number; // Hz
  firingProbability: number; // 0.0 to 1.0
  latencyNs: number; // current core latency in ns (or ps)
  throughputMOps: number; // Millions of operations per sec
  individualTau: number; // specific to core variations
  individualResistance: number;
  individualThreshold: number;
  queueDepth: number; // packets pending
  temperatureCelsius: number; // thermal profile
}

export interface SimulationParams {
  numNeurons: number; // 1 to 32
  inputCurrent: number; // Stimulus current 0.0 - 5.0 mA
  tauM: number; // 1.0 to 50.0 ms
  vRest: number; // -80.0 to -40.0 mV
  vTh: number; // -60.0 to 0.0 mV
  resistance: number; // 1.0 to 20.0 kOhm
  sigmaNoise: number; // 0.1 to 10.0 (thermal entropy)
  topology: TopologyType;
  transmissionMode: TransmissionMode;
  
  // SSD Modulator params
  ssdModulationEnabled: boolean;
  ssdQueueDepth: number; // 1 to 64
  ssdIntensity: number; // 0 to 100%
  ssdMode: SSDModulationMode;
  
  // Photonic Pulse Theory params (Ricardo B Meneses treatise)
  photonicWavelengthNm: number; // 1550nm standard telecom
  expansionFactorS: number; // 10^1 to 10^60 scale factor
  negativeDensityRhoPi: number; // -rho^2 / rho_P bounce factor
  quantumBounceEnabled: boolean;
}

export interface TopologyMetrics {
  type: TopologyType;
  name: string;
  description: string;
  averageHopCount: number;
  maxBisectionBandwidthGbps: number;
  latencyNs: number;
  collisionRatePercent: number;
  energyPerBitPicoJoules: number;
  wiringComplexityPercent: number;
  throughputScore: number;
}

export interface PowerMetrics {
  dynamicPowerMw: number;
  staticLeakageMw: number;
  ssdModulatorPowerMw: number;
  interconnectPowerMw: number;
  totalPowerMw: number;
  energyDelayProductJs: number;
  cumulativeJoules: number;
  efficiencyGflopsPerWatt: number;
}

export interface CompressionMetrics {
  rawTelemetryBytes: number;
  compressedTelemetryBytes: number;
  compressionRatio: number;
  compressionAlgorithm: string;
  encodingTimeMicroseconds: number;
  bandwidthSavedPercent: number;
}

export interface TelemetryLogEntry {
  id: string;
  timestampMs: number;
  level: 'INFO' | 'SPIKE' | 'BOUNCE' | 'MODULATOR' | 'PHOTONIC' | 'WARNING';
  coreId?: number;
  message: string;
  metrics?: {
    voltage?: number;
    latency?: number;
    power?: number;
  };
}

export interface WdmChannel {
  id: number;
  wavelengthNm: number;
  frequencyThz: number;
  bandwidthGbps: number;
  opticalPowerDbm: number;
  microringTuned: boolean;
  activePackets: number;
}

export interface OpticalVsElectricalDataPoint {
  distanceMm: number;
  electricalLatencyNs: number;
  photonicLatencyNs: number;
  electricalPowerPjPerBit: number;
  photonicPowerPjPerBit: number;
  speedupRatio: number;
}

export interface CoreBottleneckStatus {
  coreId: number;
  severity: 'nominal' | 'warning' | 'critical';
  latencyNs: number;
  throughputMOps: number;
  queueDepth: number;
  contentionPercent: number;
  primaryCause: 'none' | 'queue_overflow' | 'electrical_rc_delay' | 'routing_contention' | 'thermal_throttling';
  recommendation: string;
}

export interface HistoricalPowerPoint {
  timeMs: number;
  totalPowerMw: number;
  coresDynamicMw: number;
  coresLeakageMw: number;
  ssdModulatorMw: number;
  interconnectMw: number;
  esp32ControllerMw: number;
  efficiencyGflopsW: number;
}

export type QuaternaryValue = 0.1 | 0.25 | 0.75 | 1.0;

export interface GrapheneReservoirParams {
  emitterVoltageVolts: number; // 10V to 250V
  beamAngleDegrees: number; // -45 to +45 degrees
  grapheneLayersCount: number; // 1 to 5 atomic sheets
  vacuumPressureTorr: number; // 1e-8 Torr
  targetVector: [QuaternaryValue, QuaternaryValue, QuaternaryValue, QuaternaryValue];
  learningRate: number; // 0.05
}

export interface GrapheneReservoirState {
  currentPulseId: number;
  emitterVoltageVolts: number;
  beamAngleDegrees: number;
  deBroglieWavelengthNm: number;
  electronKineticEnergyEv: number;
  kleinTunnelingProbability: number;
  plasmonPolaritonExcitations: number;
  continuousEnergies: [number, number, number, number];
  quaternaryOutputVector: [QuaternaryValue, QuaternaryValue, QuaternaryValue, QuaternaryValue];
  microStateIndex: number; // 0 to 255 (4^4 states)
  currentLoss: number;
  convergenceEpoch: number;
  isConverged: boolean;
  lindbladTraceNorm: number;
  historyLoss: { pulse: number; loss: number }[];
}

export interface SimulationStepResult {
  step: number;
  simTimeMs: number;
  cores: CoreState[];
  totalSpikesInStep: number;
  aggregateThroughputGflops: number;
  averageLatencyNs: number;
  maxLatencyNs: number;
  power: PowerMetrics;
  compression: CompressionMetrics;
  quantumBounceActive: boolean;
  ssdModulationShift: number;
  bottlenecks: CoreBottleneckStatus[];
  wdmChannels: WdmChannel[];
  grapheneReservoir?: GrapheneReservoirState;
}
