/**
 * SSD Modulator Engine for In-Materio Parallel Architecture
 * Models Solid-State Flash Memory (NVMe/SLC/MLC) as an active conductance modulator,
 * synaptic weight matrix regulator, and packet throttle buffer.
 */

import { SSDModulationMode } from '../types/simulator';

export interface SSDModulatorState {
  enabled: boolean;
  mode: SSDModulationMode;
  queueDepth: number; // 1 to 64
  activeCommands: number;
  modulationIntensity: number; // 0 to 100%
  flashCellThresholdVoltageMv: number; // Vt shift in mV
  readLatencyUs: number; // 25us to 120us
  writeLatencyUs: number; // 150us to 450us
  bufferOccupancyPercent: number;
  iopsActivity: number; // kIOPS
  enduranceCyclesUsed: number;
  conductanceModulationDelta: number; // multiplier applied to membrane resistance R
  refractoryModulationMs: number; // added/subtracted refractory time
}

export class SSDModulator {
  private totalWrites: number = 0;
  private bufferHistory: number[] = [];

  public update(
    enabled: boolean,
    intensity: number,
    queueDepth: number,
    mode: SSDModulationMode,
    currentSpikes: number,
    substrateTemp: number
  ): SSDModulatorState {
    if (!enabled) {
      return {
        enabled: false,
        mode,
        queueDepth,
        activeCommands: 0,
        modulationIntensity: 0,
        flashCellThresholdVoltageMv: 0,
        readLatencyUs: 0,
        writeLatencyUs: 0,
        bufferOccupancyPercent: 0,
        iopsActivity: 0,
        enduranceCyclesUsed: this.totalWrites,
        conductanceModulationDelta: 1.0,
        refractoryModulationMs: 0,
      };
    }

    this.totalWrites += Math.floor(currentSpikes * 1.5) + 1;

    // Active command buffer depends on incoming spike packets vs queue depth
    const loadFactor = Math.min(1.0, currentSpikes / (queueDepth * 1.5 + 4));
    const activeCommands = Math.min(queueDepth, Math.ceil(loadFactor * queueDepth));
    const bufferOccupancyPercent = Math.min(100, Math.round(loadFactor * 100));

    // Flash multi-level threshold voltage Vt shift (-120mV to +120mV)
    const normalizedIntensity = intensity / 100;
    const tempEffect = (substrateTemp - 40) * 0.4;
    const flashCellThresholdVoltageMv = (Math.sin(Date.now() / 600) * 80 + tempEffect) * normalizedIntensity;

    // IOPS activity (kIOPS)
    const iopsActivity = Math.round((currentSpikes * 42 + activeCommands * 12) * (normalizedIntensity + 0.2));

    // Read and write latencies in microseconds
    const readLatencyUs = 25 + activeCommands * 1.2 + (flashCellThresholdVoltageMv > 40 ? 15 : 0);
    const writeLatencyUs = 180 + activeCommands * 3.8;

    // Compute effect on neural dynamics based on chosen mode
    let conductanceModulationDelta = 1.0;
    let refractoryModulationMs = 0;

    switch (mode) {
      case 'synaptic_weight':
        // Shifts membrane effective resistance R by ±25%
        conductanceModulationDelta = 1.0 + (flashCellThresholdVoltageMv / 250) * normalizedIntensity;
        break;
      case 'frequency_phase':
        // Intermittent phase perturbation
        conductanceModulationDelta = 1.0 + (Math.sin(Date.now() / 300) * 0.3) * normalizedIntensity;
        refractoryModulationMs = (flashCellThresholdVoltageMv / 50) * normalizedIntensity;
        break;
      case 'refractory_damping':
        // Adds damping delay to prevent runaway epileptic synchronization
        refractoryModulationMs = Math.max(0, (activeCommands / queueDepth) * 3.5 * normalizedIntensity);
        break;
    }

    return {
      enabled: true,
      mode,
      queueDepth,
      activeCommands,
      modulationIntensity: intensity,
      flashCellThresholdVoltageMv,
      readLatencyUs,
      writeLatencyUs,
      bufferOccupancyPercent,
      iopsActivity,
      enduranceCyclesUsed: this.totalWrites,
      conductanceModulationDelta: Math.max(0.6, Math.min(1.6, conductanceModulationDelta)),
      refractoryModulationMs,
    };
  }

  /**
   * Generates distribution data for the 4-level MLC threshold voltage (Vt) distribution curve
   */
  public getThresholdVoltageDistribution(vtShiftMv: number): { voltageMv: number; state0: number; state1: number; state2: number; state3: number }[] {
    const points = [];
    for (let v = -200; v <= 300; v += 10) {
      // Gaussian distribution for 4 programmed MLC states (Erase, P1, P2, P3)
      const g = (mean: number, sigma: number) => Math.exp(-Math.pow(v - (mean + vtShiftMv), 2) / (2 * sigma * sigma));
      points.push({
        voltageMv: v,
        state0: g(-100, 22),
        state1: g(0, 24),
        state2: g(100, 25),
        state3: g(200, 26),
      });
    }
    return points;
  }
}

export const ssdModulatorInstance = new SSDModulator();
