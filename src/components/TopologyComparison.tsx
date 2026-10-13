import React from 'react';
import { TopologyMetrics, TopologyType, TransmissionMode } from '../types/simulator';
import { getTopologyDefinitions } from '../engine/topologies';
import { Network, CheckCircle, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface TopologyComparisonProps {
  numNeurons: number;
  transmissionMode: TransmissionMode;
  currentTopology: TopologyType;
  onSelectTopology: (top: TopologyType) => void;
}

export const TopologyComparison: React.FC<TopologyComparisonProps> = ({
  numNeurons,
  transmissionMode,
  currentTopology,
  onSelectTopology,
}) => {
  const topologies = getTopologyDefinitions(numNeurons, transmissionMode);
  const topologyList = Object.values(topologies);

  const activeDef = topologies[currentTopology];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Análise Comparativa de Topologias de Interconexão
          </h3>
          <p className="text-xs text-slate-400">
            Avaliação de desempenho em malha de silício para {numNeurons} núcleos neuromórficos
          </p>
        </div>

        {/* Transmission Mode Tag */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-300">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>Meio Físico: </span>
          <span className={transmissionMode === 'photonic' ? 'text-pink-400 font-bold' : 'text-slate-200'}>
            {transmissionMode === 'photonic' ? 'Óptico Fotônico' : 'Trilha Metálica'}
          </span>
        </div>
      </div>

      {/* Topologies Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {topologyList.map((top) => {
          const isSelected = top.type === currentTopology;
          return (
            <div
              key={top.type}
              onClick={() => onSelectTopology(top.type)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-cyan-950/30 border-cyan-500/80 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200">{top.name}</span>
                  {isSelected && <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                  {top.description}
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Saltos Médios:</span>
                  <span className="font-semibold text-slate-200">{top.averageHopCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bissecção:</span>
                  <span className="font-semibold text-emerald-400">{top.maxBisectionBandwidthGbps} Gbps</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Latência:</span>
                  <span className="font-semibold text-cyan-400">{top.latencyNs} ns</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Colisão:</span>
                  <span className="font-semibold text-amber-400">{top.collisionRatePercent}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Side-by-Side Comparison Matrix */}
      <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl overflow-x-auto">
        <h4 className="text-sm font-semibold text-slate-200 mb-4">
          Tabela Comparativa de Engenharia de Rede (NoC / In-Materio)
        </h4>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-mono">
              <th className="pb-3 font-semibold">TOPOLOGIA</th>
              <th className="pb-3 font-semibold">SALTOS MÉDIOS (HOPS)</th>
              <th className="pb-3 font-semibold">BISS. BANDWIDTH</th>
              <th className="pb-3 font-semibold">LATÊNCIA (ns)</th>
              <th className="pb-3 font-semibold">COLISÃO (%)</th>
              <th className="pb-3 font-semibold">ENERGIA/BIT</th>
              <th className="pb-3 font-semibold">ÁREA DE FIAÇÃO</th>
              <th className="pb-3 font-semibold">SCORE VAZÃO</th>
              <th className="pb-3 font-semibold">AÇÃO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
            {topologyList.map((top) => {
              const isSelected = top.type === currentTopology;
              return (
                <tr
                  key={top.type}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    isSelected ? 'bg-cyan-950/20' : ''
                  }`}
                >
                  <td className="py-3 pr-4 font-semibold text-slate-200">
                    <span className="flex items-center gap-1.5">
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
                      {top.name}
                    </span>
                  </td>
                  <td className="py-3 pr-4">{top.averageHopCount} hops</td>
                  <td className="py-3 pr-4 text-emerald-400">{top.maxBisectionBandwidthGbps} Gbps</td>
                  <td className="py-3 pr-4 text-cyan-400">{top.latencyNs} ns</td>
                  <td className="py-3 pr-4 text-amber-400">{top.collisionRatePercent}%</td>
                  <td className="py-3 pr-4">{top.energyPerBitPicoJoules} pJ/bit</td>
                  <td className="py-3 pr-4">{top.wiringComplexityPercent}% silício</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400"
                          style={{ width: `${top.throughputScore}%` }}
                        />
                      </div>
                      <span className="text-[11px]">{top.throughputScore}/100</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => onSelectTopology(top.type)}
                      disabled={isSelected}
                      className={`px-2.5 py-1 text-[11px] rounded transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 cursor-default'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {isSelected ? 'Ativa' : 'Selecionar'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
