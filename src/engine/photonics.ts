/**
 * Photonic Pulse Engine & Cosmological Foundations
 * Based on the treatise "O Pulso Primordial: Para Além do Big Bang" by Ricardo B Meneses
 * Incorporating Planck-beat temporal stretching, Wheeler-DeWitt H|ψ⟩=0,
 * negative pulse density ρ_Π = -ρ²/ρ_P, WDM silicon photonics, and electro-optic waveguides.
 */

import { OpticalVsElectricalDataPoint, WdmChannel } from '../types/simulator';

export interface PhotonicPulseProfile {
  opticalWavelengthNm: number; // 1550 nm (telecom C-band)
  carrierFrequencyThz: number; // ~193.4 THz
  propagationVelocityKms: number; // ~76,923 km/s in Silicon (group index ng ≈ 3.9)
  groupIndex: number;
  effectiveIndex: number;
  electricalLatencyBaselineNs: number; // e.g. 12.5 ns
  photonicLatencyNs: number; // e.g. 0.28 ns (or 280 ps)
  latencySpeedupFactor: number; // e.g. ~44x
  quantumBounceScaleFactor: number; // S(a, I)
  planckBeatSec: number; // 5.39e-44 s
  negativeEnergyDensity: number; // rho_Pi
  effectiveEnergyDensity: number; // rho_eff = rho(1 - rho/rho_P)
  bekensteinEntropyBoundBits: number;
  wavePacketPhase: number;
  wdmChannels: WdmChannel[];
  comparisonCurve: OpticalVsElectricalDataPoint[];
}

/**
 * Standard ITU-T Dense Wavelength Division Multiplexing (DWDM) grid channels
 */
export function generateWdmChannels(baseWavelengthNm: number = 1550): WdmChannel[] {
  const c = 299792458; // m/s
  const channels: WdmChannel[] = [];
  const channelSpacings = [-15, -10, -5, 0, 5, 10, 15, 20]; // nm delta from base

  channelSpacings.forEach((delta, idx) => {
    const lambdaNm = baseWavelengthNm + delta;
    const freqThz = (c / (lambdaNm * 1e-9)) / 1e12;
    // Each optical carrier can carry up to 100 Gbps modulation via silicon microrings
    channels.push({
      id: idx + 1,
      wavelengthNm: lambdaNm,
      frequencyThz: Number(freqThz.toFixed(2)),
      bandwidthGbps: 100,
      opticalPowerDbm: 3.5, // 3.5 dBm laser diode power
      microringTuned: true,
      activePackets: Math.floor(Math.random() * 8) + 1,
    });
  });

  return channels;
}

/**
 * Calculates distance-dependent latency and power for Electrical Copper vs Silicon Photonics
 * Electrical RC delay: t_elec = 0.38 * R_unit * C_unit * L^2 + t_buf
 * Photonic time-of-flight: t_phot = L / v_g + t_tx_rx
 */
export function generateElectricalVsPhotonicCurve(): OpticalVsElectricalDataPoint[] {
  const points: OpticalVsElectricalDataPoint[] = [];
  const c = 299792; // km/s
  const ng = 3.9; // Silicon waveguide group index
  const vg = (c * 1e3) / ng; // m/s (~76.8 x 10^6 m/s)

  // Electro-optic TX modulator + RX photodetector conversion delay
  const tModulatorPs = 45; // 45 ps
  const tDetectorPs = 35; // 35 ps
  const tOptoElectronicPs = tModulatorPs + tDetectorPs;

  for (let distMm = 1; distMm <= 20; distMm += 1) {
    const distM = distMm * 1e-3;

    // Electrical trace: RC delay quadratic with distance, plus repeater buffer overhead
    // Standard on-chip / interposer copper wire: ~0.4 ns/mm² + 1.2 ns gate delay
    const rLineOhmPerMm = 45;
    const cLineFfPerMm = 180;
    const rcDelayNs = 0.38 * (rLineOhmPerMm * 1e3) * (cLineFfPerMm * 1e-15) * Math.pow(distMm, 2) * 1e9;
    const bufferDelaysNs = Math.floor(distMm / 3) * 0.45;
    const electricalLatencyNs = Math.max(1.8, 1.2 + rcDelayNs + bufferDelaysNs);

    // Photonic waveguide: linear time-of-flight at ~0.26c in silicon
    const flightTimePs = (distM / vg) * 1e12;
    const totalPhotonicPs = flightTimePs + tOptoElectronicPs;
    const photonicLatencyNs = totalPhotonicPs / 1000;

    // Energy consumption:
    // Electrical copper: ~2.2 pJ/bit at 1mm, scaling with wire capacitance up to 18 pJ/bit at 20mm
    const electricalPowerPjPerBit = 2.0 + distMm * 0.75;
    // Silicon photonics: static laser bias + microring resonator (~0.12 pJ/bit nearly flat with distance!)
    const photonicPowerPjPerBit = 0.10 + distMm * 0.012;

    const speedupRatio = electricalLatencyNs / Math.max(0.01, photonicLatencyNs);

    points.push({
      distanceMm: distMm,
      electricalLatencyNs: Number(electricalLatencyNs.toFixed(2)),
      photonicLatencyNs: Number(photonicLatencyNs.toFixed(3)),
      electricalPowerPjPerBit: Number(electricalPowerPjPerBit.toFixed(2)),
      photonicPowerPjPerBit: Number(photonicPowerPjPerBit.toFixed(3)),
      speedupRatio: Number(speedupRatio.toFixed(1)),
    });
  }

  return points;
}

export function computePhotonicMetrics(
  wavelengthNm: number = 1550,
  rhoCurrent: number = 0.65,
  rhoPlanck: number = 1.0,
  expansionFactorLog: number = 12,
  distanceMm: number = 5.0
): PhotonicPulseProfile {
  const c = 299792; // km/s
  const effectiveIndex = 3.45; // Phase refractive index
  const groupIndex = 3.90; // Group index in silicon at 1550nm
  const propagationVelocityKms = c / groupIndex;

  // Optical frequency: f = c / lambda
  const carrierFrequencyThz = (c * 1e3) / (wavelengthNm * 1e-9) / 1e12;

  // Electrical latency through copper traces on LGA 775 silicon package
  const electricalLatencyBaselineNs = distanceMm * 2.2 + 2.5;

  // Photonic pulse transit time
  const timeOfFlightPs = (distanceMm * 1e-3 / (propagationVelocityKms * 1e3)) * 1e12;
  const optoElectronicDelayPs = 80; // Silicon microring + photodiode delay
  const totalPhotonicDelayPs = timeOfFlightPs + optoElectronicDelayPs;
  const photonicLatencyNs = totalPhotonicDelayPs / 1000;

  const latencySpeedupFactor = electricalLatencyBaselineNs / Math.max(0.01, photonicLatencyNs);

  // "O Pulso Primordial" Cosmology formulas (Ricardo B Meneses):
  // ρ_Π = -ρ² / ρ_P (ansatz da tensão do pulso cósmico)
  const negativeEnergyDensity = -Math.pow(rhoCurrent, 2) / Math.max(0.001, rhoPlanck);
  // ρ_eff = ρ + ρ_Π = ρ(1 - ρ/ρ_P) -> zero when ρ = ρ_P (Quantum Bounce!)
  const effectiveEnergyDensity = Math.max(0, rhoCurrent * (1 - rhoCurrent / Math.max(0.001, rhoPlanck)));

  // Holographic Bekenstein bound S <= A / (4 * G_hbar)
  const bekensteinEntropyBoundBits = 1.44e15 * (1 + 0.1 * Math.sin(rhoCurrent * Math.PI));

  return {
    opticalWavelengthNm: wavelengthNm,
    carrierFrequencyThz: Number(carrierFrequencyThz.toFixed(2)),
    propagationVelocityKms: Math.round(propagationVelocityKms),
    groupIndex,
    effectiveIndex,
    electricalLatencyBaselineNs: Number(electricalLatencyBaselineNs.toFixed(2)),
    photonicLatencyNs: Number(photonicLatencyNs.toFixed(3)),
    latencySpeedupFactor: Number(latencySpeedupFactor.toFixed(1)),
    quantumBounceScaleFactor: Math.pow(10, expansionFactorLog),
    planckBeatSec: 5.39e-44,
    negativeEnergyDensity,
    effectiveEnergyDensity,
    bekensteinEntropyBoundBits,
    wavePacketPhase: (Date.now() / 400) % (2 * Math.PI),
    wdmChannels: generateWdmChannels(wavelengthNm),
    comparisonCurve: generateElectricalVsPhotonicCurve(),
  };
}

/**
 * Calculates theoretical quantum bounce trajectory: a(t) scale factor
 * comparing standard Lambda-CDM (collapsing to singularity) vs Pulso Primordial (bouncing smoothly)
 */
export function generateBounceTrajectoryData(): { time: number; aLambdaCdm: number; aPulsoBounce: number; rhoEff: number }[] {
  const points: { time: number; aLambdaCdm: number; aPulsoBounce: number; rhoEff: number }[] = [];

  for (let t = -10; t <= 10; t += 0.5) {
    const aLambdaCdm = Math.max(0.05, Math.abs(t) * 0.18 + 0.05);
    const amin = 1.77;
    const aPulsoBounce = Math.sqrt(amin * amin + 0.08 * t * t);

    const rho = 1.0 / Math.pow(aPulsoBounce, 3);
    const rhoEff = rho * Math.max(0, 1 - rho / 1.0);

    points.push({
      time: t,
      aLambdaCdm: Math.min(2.5, aLambdaCdm),
      aPulsoBounce,
      rhoEff,
    });
  }

  return points;
}
