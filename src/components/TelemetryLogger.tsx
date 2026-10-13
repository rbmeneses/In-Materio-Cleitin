import React, { useState } from 'react';
import { CoreState, SimulationParams, TelemetryLogEntry } from '../types/simulator';
import { Terminal, Download, FileText, Search, Trash2, CheckCircle2 } from 'lucide-react';

interface TelemetryLoggerProps {
  logs: TelemetryLogEntry[];
  cores: CoreState[];
  params: SimulationParams;
  simTimeMs: number;
  onClearLogs: () => void;
}

export const TelemetryLogger: React.FC<TelemetryLoggerProps> = ({
  logs,
  cores,
  params,
  simTimeMs,
  onClearLogs,
}) => {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesLevel = filterLevel === 'ALL' || log.level === filterLevel;
    const matchesSearch =
      searchTerm === '' ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.coreId !== undefined && `nó ${log.coreId + 1}`.includes(searchTerm.toLowerCase()));
    return matchesLevel && matchesSearch;
  });

  // Export to CSV
  const handleExportCSV = () => {
    try {
      const headers = [
        'Timestamp_ms',
        'Topologia',
        'Modo_Transmissao',
        'SSD_Modulador_Ativo',
        ...cores.map((c) => `No_${c.id + 1}_V_mV`),
        ...cores.map((c) => `No_${c.id + 1}_Disparou`),
        ...cores.map((c) => `No_${c.id + 1}_Latencia_ns`),
        ...cores.map((c) => `No_${c.id + 1}_Throughput_MOps`),
      ];

      const row = [
        simTimeMs.toFixed(2),
        params.topology,
        params.transmissionMode,
        params.ssdModulationEnabled ? 'Sim' : 'Nao',
        ...cores.map((c) => c.voltage.toFixed(2)),
        ...cores.map((c) => (c.hasSpiked ? 1 : 0)),
        ...cores.map((c) => c.latencyNs.toFixed(3)),
        ...cores.map((c) => c.throughputMOps.toFixed(2)),
      ];

      // Build CSV with sample history or current frame
      let csvContent = headers.join(',') + '\n' + row.join(',') + '\n';

      // Also append logs as structured data comments at the bottom
      csvContent += '\n# REGISTRO DE EVENTOS E TELEMETRIA\n# ID,Timestamp,Level,Message\n';
      logs.forEach((l) => {
        csvContent += `"${l.id}",${l.timestampMs},"${l.level}","${l.message.replace(/"/g, '""')}"\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `telemetria_in_materio_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess('CSV exportado com sucesso!');
      setTimeout(() => setDownloadSuccess(null), 3500);
    } catch (err) {
      console.error('Falha ao exportar CSV', err);
    }
  };

  // Export to JSON
  const handleExportJSON = () => {
    try {
      const exportData = {
        metadata: {
          app: 'Simulador Arquitetura Paralela In-Materio Cleitin',
          versao_teorica: 'O Pulso Primordial (Ricardo B Meneses)',
          data_exportacao: new Date().toISOString(),
          tempo_simulado_ms: simTimeMs,
        },
        parametros_configurados: params,
        estado_atual_nucleos: cores.map((c) => ({
          id: c.id,
          nome: `Nó ${c.id + 1}`,
          potencial_mV: Number(c.voltage.toFixed(2)),
          disparou: c.hasSpiked,
          total_disparos: c.spikeCount,
          frequencia_hz: Number(c.firingRateHz.toFixed(1)),
          probabilidade_disparo: Number(c.firingProbability.toFixed(3)),
          latencia_ns: Number(c.latencyNs.toFixed(3)),
          throughput_mops: Number(c.throughputMOps.toFixed(2)),
          tau_individual: Number(c.individualTau.toFixed(2)),
          resistencia_individual: Number(c.individualResistance.toFixed(2)),
          temperatura_celsius: Number(c.temperatureCelsius.toFixed(1)),
        })),
        historico_logs: logs,
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `telemetria_in_materio_${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess('JSON exportado com sucesso!');
      setTimeout(() => setDownloadSuccess(null), 3500);
    } catch (err) {
      console.error('Falha ao exportar JSON', err);
    }
  };

  const levelColor = (level: TelemetryLogEntry['level']) => {
    switch (level) {
      case 'SPIKE':
        return 'text-rose-400 bg-rose-950/40 border-rose-800/60';
      case 'BOUNCE':
        return 'text-purple-300 bg-purple-950/40 border-purple-800/60';
      case 'MODULATOR':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60';
      case 'PHOTONIC':
        return 'text-cyan-300 bg-cyan-950/40 border-cyan-800/60';
      case 'WARNING':
        return 'text-amber-400 bg-amber-950/40 border-amber-800/60';
      default:
        return 'text-slate-300 bg-slate-800/40 border-slate-700/60';
    }
  };

  return (
    <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Sistema de Logs & Exportação de Telemetria</span>
          </h4>
          <p className="text-xs text-slate-400">
            Registro contínuo de eventos eletrofisiológicos, pulsos quânticos e modulação
          </p>
        </div>

        {/* Action Buttons: Export CSV & JSON */}
        <div className="flex items-center gap-2.5">
          {downloadSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{downloadSuccess}</span>
            </span>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-lg transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-300" />
            <span>Exportar JSON</span>
          </button>

          <button
            onClick={onClearLogs}
            title="Limpar Histórico de Logs"
            className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Filtrar por mensagem ou nó..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#070b14] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-950/60 rounded-lg border border-slate-800 text-[11px] font-mono overflow-x-auto w-full sm:w-auto">
          {['ALL', 'SPIKE', 'BOUNCE', 'MODULATOR', 'PHOTONIC', 'INFO'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                filterLevel === lvl
                  ? 'bg-slate-800 text-cyan-400 font-semibold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="w-full h-56 bg-[#050811] rounded-lg border border-slate-800/90 p-3 overflow-y-auto font-mono text-xs space-y-1.5">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 text-xs">
            Nenhum evento registrado com os filtros atuais.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2.5 hover:bg-slate-900/40 p-1 rounded transition-colors"
            >
              <span className="text-slate-500 text-[10px] shrink-0 pt-0.5">
                [{log.timestampMs.toFixed(1)}ms]
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase shrink-0 ${levelColor(
                  log.level
                )}`}
              >
                {log.level}
              </span>
              <span className="text-slate-300 text-[11px] leading-relaxed break-all">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
