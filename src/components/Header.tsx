import React from 'react';
import { Play, Pause, RotateCcw, Cpu } from 'lucide-react';

interface HeaderProps {
  isRunning: boolean;
  onToggleRun: () => void;
  onReset: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isRunning,
  onToggleRun,
  onReset,
  activeTab,
  onSelectTab,
}) => {
  const navItems = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'graphene', label: 'Reservatório Grafeno' },
    { id: 'llm_pipeline', label: 'Pipeline LLM' },
    { id: 'modulator_photonics', label: 'SSD & Fotônica' },
    { id: 'experiment_guide', label: 'O Experimento' },
  ];

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-8 px-6 py-3.5 bg-[#080d1a]/90 backdrop-blur-md border-b border-slate-800/80">
      {/* Zone 1: Wordmark / Brand title */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Cpu className="w-4 h-4" />
        </div>
        <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
          In-Materio Cleitin
        </span>
      </div>

      {/* Zone 2: 4-5 single-line clean navigation links */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer pb-0.5 ${
                isActive
                  ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 Primary Action CTA */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onReset}
          title="Reiniciar Simulação"
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleRun}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            isRunning
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 shadow-lg shadow-cyan-500/20'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>Pausar</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Iniciar Simulação</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
