/**
 * Interconnection Network Topologies Engine
 * Compares Star, 2D Mesh, Ring, Hypercube/Torus, and Photonic Crossbar
 * Provides real-time comparative routing metrics, hop counts, and bisection bandwidths.
 */

import { TopologyMetrics, TopologyType, TransmissionMode } from '../types/simulator';

export interface TopologyLink {
  from: number;
  to: number;
  weight: number;
  isPhotonic?: boolean;
}

export function getTopologyDefinitions(numNeurons: number, transmissionMode: TransmissionMode): Record<TopologyType, TopologyMetrics> {
  const isPhotonic = transmissionMode === 'photonic';
  const speedupMultiplier = isPhotonic ? 0.08 : 1.0; // photonic speeds up latency significantly
  const energyFactor = isPhotonic ? 0.12 : 1.0;

  // Star Topology
  const starAvgHops = 2.0; // Core A -> Hub -> Core B
  const starBisectionGbps = isPhotonic ? 240 : 25;
  const starLatencyNs = (12.0 + numNeurons * 0.4) * speedupMultiplier;
  const starCollisionRate = Math.min(65, 8.0 + numNeurons * 1.8);
  const starEnergyPj = (2.8 * energyFactor);

  // 2D Mesh Topology (approx sqrt(N) x sqrt(N))
  const cols = Math.ceil(Math.sqrt(numNeurons));
  const rows = Math.ceil(numNeurons / cols);
  const meshAvgHops = Math.max(1, ((cols + rows) / 3));
  const meshBisectionGbps = isPhotonic ? 480 : 80;
  const meshLatencyNs = (6.0 + meshAvgHops * 2.5) * speedupMultiplier;
  const meshCollisionRate = Math.min(30, 4.0 + (numNeurons / 32) * 12);
  const meshEnergyPj = (2.1 * energyFactor);

  // Ring Topology
  const ringAvgHops = Math.max(1, numNeurons / 4);
  const ringBisectionGbps = isPhotonic ? 160 : 32;
  const ringLatencyNs = (4.0 + ringAvgHops * 3.8) * speedupMultiplier;
  const ringCollisionRate = Math.min(45, 12.0 + (numNeurons / 16) * 15);
  const ringEnergyPj = (3.2 * energyFactor);

  // Hypercube / Torus Topology (k = log2(N))
  const hyperHops = Math.max(1, Math.log2(Math.max(2, numNeurons)) / 1.5);
  const hyperBisectionGbps = isPhotonic ? 850 : 220;
  const hyperLatencyNs = (4.5 + hyperHops * 1.8) * speedupMultiplier;
  const hyperCollisionRate = Math.min(18, 3.0 + (numNeurons / 32) * 8);
  const hyperEnergyPj = (1.7 * energyFactor);

  // Photonic Optical Crossbar
  const crossbarAvgHops = 1.0; // Direct non-blocking optical path
  const crossbarBisectionGbps = 1600; // Multi-Tbps WDM optical crossbar
  const crossbarLatencyNs = 0.28; // 280 picoseconds
  const crossbarCollisionRate = 1.2; // Wavelength multiplexing avoids collisions
  const crossbarEnergyPj = 0.09; // Picojoules per bit

  return {
    star: {
      type: 'star',
      name: 'Hub & Spoke (Central Star)',
      description: 'Controlador central ESP32 como arbitro mestre. Simples, porém sensível a gargalos de fila central.',
      averageHopCount: Number(starAvgHops.toFixed(2)),
      maxBisectionBandwidthGbps: starBisectionGbps,
      latencyNs: Number(starLatencyNs.toFixed(2)),
      collisionRatePercent: Number(starCollisionRate.toFixed(1)),
      energyPerBitPicoJoules: Number(starEnergyPj.toFixed(2)),
      wiringComplexityPercent: 20,
      throughputScore: 58,
    },
    mesh2d: {
      type: 'mesh2d',
      name: 'Grade 2D (Systolic Mesh)',
      description: 'Roteamento bidimensional em matriz ortogonal. Excelente escalabilidade e distribuição de tráfego.',
      averageHopCount: Number(meshAvgHops.toFixed(2)),
      maxBisectionBandwidthGbps: meshBisectionGbps,
      latencyNs: Number(meshLatencyNs.toFixed(2)),
      collisionRatePercent: Number(meshCollisionRate.toFixed(1)),
      energyPerBitPicoJoules: Number(meshEnergyPj.toFixed(2)),
      wiringComplexityPercent: 45,
      throughputScore: 78,
    },
    ring: {
      type: 'ring',
      name: 'Anel Fechado (Token Ring)',
      description: 'Encaminhamento circular em cascata sequencial. Fiação mínima, mas latência cresce linearmente com nós.',
      averageHopCount: Number(ringAvgHops.toFixed(2)),
      maxBisectionBandwidthGbps: ringBisectionGbps,
      latencyNs: Number(ringLatencyNs.toFixed(2)),
      collisionRatePercent: Number(ringCollisionRate.toFixed(1)),
      energyPerBitPicoJoules: Number(ringEnergyPj.toFixed(2)),
      wiringComplexityPercent: 15,
      throughputScore: 48,
    },
    hypercube: {
      type: 'hypercube',
      name: 'Hipercubo / Torus N-D',
      description: 'Topologia n-dimensional com alta largura de banda de bissecção e baixa distância de saltos logarítmica.',
      averageHopCount: Number(hyperHops.toFixed(2)),
      maxBisectionBandwidthGbps: hyperBisectionGbps,
      latencyNs: Number(hyperLatencyNs.toFixed(2)),
      collisionRatePercent: Number(hyperCollisionRate.toFixed(1)),
      energyPerBitPicoJoules: Number(hyperEnergyPj.toFixed(2)),
      wiringComplexityPercent: 80,
      throughputScore: 91,
    },
    photonic_crossbar: {
      type: 'photonic_crossbar',
      name: 'Crossbar Fotônico Óptico',
      description: 'Matriz óptica com anéis ressonadores e multiplexação WDM. Salto único direto e velocidade da luz no silício.',
      averageHopCount: crossbarAvgHops,
      maxBisectionBandwidthGbps: crossbarBisectionGbps,
      latencyNs: crossbarLatencyNs,
      collisionRatePercent: crossbarCollisionRate,
      energyPerBitPicoJoules: crossbarEnergyPj,
      wiringComplexityPercent: 95,
      throughputScore: 99,
    },
  };
}

/**
 * Builds coordinate points and interconnect links for visual rendering on the silicon die
 */
export function buildTopologyGraph(numNeurons: number, topology: TopologyType): { nodes: { id: number; x: number; y: number }[]; links: TopologyLink[] } {
  const nodes: { id: number; x: number; y: number }[] = [];
  const links: TopologyLink[] = [];

  const width = 640;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;

  switch (topology) {
    case 'star': {
      // Node 0 in center (or pseudo hub), others around circle
      for (let i = 0; i < numNeurons; i++) {
        const angle = (i / numNeurons) * 2 * Math.PI;
        const radius = 140;
        nodes.push({
          id: i,
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        });
      }
      // Hub connects to all
      for (let i = 0; i < numNeurons; i++) {
        for (let j = i + 1; j < numNeurons; j++) {
          if (i === 0 || j === 0 || (i % 4 === 0 && j === (i + 1) % numNeurons)) {
            links.push({ from: i, to: j, weight: 1 });
          }
        }
      }
      break;
    }

    case 'mesh2d': {
      const cols = Math.ceil(Math.sqrt(numNeurons));
      const rows = Math.ceil(numNeurons / cols);
      const spacingX = Math.min(90, (width - 120) / Math.max(1, cols - 1));
      const spacingY = Math.min(80, (height - 120) / Math.max(1, rows - 1));
      const startX = centerX - ((cols - 1) * spacingX) / 2;
      const startY = centerY - ((rows - 1) * spacingY) / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const id = r * cols + c;
          if (id < numNeurons) {
            nodes.push({
              id,
              x: startX + c * spacingX,
              y: startY + r * spacingY,
            });
          }
        }
      }

      // Add grid links (horizontal and vertical neighbors)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const current = r * cols + c;
          if (current < numNeurons) {
            if (c + 1 < cols && current + 1 < numNeurons) {
              links.push({ from: current, to: current + 1, weight: 1 });
            }
            if (r + 1 < rows && current + cols < numNeurons) {
              links.push({ from: current, to: current + cols, weight: 1 });
            }
          }
        }
      }
      break;
    }

    case 'ring': {
      for (let i = 0; i < numNeurons; i++) {
        const angle = (i / numNeurons) * 2 * Math.PI - Math.PI / 2;
        const radius = 145;
        nodes.push({
          id: i,
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        });
        links.push({
          from: i,
          to: (i + 1) % numNeurons,
          weight: 1,
        });
      }
      break;
    }

    case 'hypercube': {
      // 3D/4D projected cube vertices
      const stepAngle = (2 * Math.PI) / Math.min(16, numNeurons);
      const innerRadius = 80;
      const outerRadius = 150;

      for (let i = 0; i < numNeurons; i++) {
        const isOuter = i % 2 === 0;
        const rad = isOuter ? outerRadius : innerRadius;
        const angle = i * stepAngle;
        nodes.push({
          id: i,
          x: centerX + Math.cos(angle) * rad,
          y: centerY + Math.sin(angle) * rad,
        });
      }

      for (let i = 0; i < numNeurons; i++) {
        const next = (i + 1) % numNeurons;
        const opposite = (i + Math.floor(numNeurons / 2)) % numNeurons;
        links.push({ from: i, to: next, weight: 1 });
        if (i % 2 === 0) {
          links.push({ from: i, to: opposite, weight: 2 });
        }
      }
      break;
    }

    case 'photonic_crossbar': {
      // Star with all-to-all optical waveguide grid
      const cols = Math.ceil(Math.sqrt(numNeurons));
      const rows = Math.ceil(numNeurons / cols);
      const spacingX = Math.min(85, (width - 140) / Math.max(1, cols - 1));
      const spacingY = Math.min(75, (height - 120) / Math.max(1, rows - 1));
      const startX = centerX - ((cols - 1) * spacingX) / 2;
      const startY = centerY - ((rows - 1) * spacingY) / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const id = r * cols + c;
          if (id < numNeurons) {
            nodes.push({
              id,
              x: startX + c * spacingX,
              y: startY + r * spacingY,
            });
          }
        }
      }

      // Optical crossbar waveguides (dense optical matrix)
      for (let i = 0; i < Math.min(12, numNeurons); i++) {
        for (let j = i + 1; j < Math.min(12, numNeurons); j++) {
          if (i !== j) {
            links.push({ from: i, to: j, weight: 1, isPhotonic: true });
          }
        }
      }
      break;
    }
  }

  return { nodes, links };
}
