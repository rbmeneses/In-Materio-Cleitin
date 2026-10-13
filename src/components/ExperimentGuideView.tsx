import React from 'react';
import {
  BookOpen,
  Cpu,
  Sparkles,
  HardDrive,
  Waves,
  Zap,
  BatteryCharging,
  Radio,
  Layers,
  Target,
  FileText,
} from 'lucide-react';

export const ExperimentGuideView: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="p-6 md:p-8 bg-gradient-to-br from-slate-900 via-[#0a0f1d] to-[#060a12] border border-slate-800 rounded-2xl space-y-4 shadow-2xl">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <BookOpen className="w-4 h-4" />
          <span>RELATÓRIO TÉCNICO & TRATADO CIENTÍFICO</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Projeto Cleitin: Arquitetura de Computação de Reservatório Quântico com Grafeno
        </h2>
        <p className="text-sm md:text-base text-slate-300 leading-relaxed">
          Documento técnico e formulação matemática da computação neuromórfica não-convencional (Physical Reservoir Computing) integrando <strong className="text-cyan-400">câmara a vácuo cubo 4x4</strong>, <strong className="text-pink-400">malhas atômicas de grafeno com férmions de Dirac</strong>, <strong className="text-emerald-400">quantização quaternária em hardware (256 micro-estados)</strong> e a <strong className="text-amber-400">Teoria do Pulso Primordial</strong>.
        </p>
      </div>

      {/* 1. Visão Geral do Sistema */}
      <section className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
          <Radio className="w-5 h-5" />
          <span>1. Visão Geral do Sistema (Physical Reservoir Computing)</span>
        </div>
        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
          O <strong>Projeto Cleitin</strong> é uma proposta teórica para um motor de inferência estocástica e quântica baseado em hardware neuromórfico não-convencional (<em>Physical Reservoir Computing</em>). O núcleo do sistema é um ambiente confinado a vácuo (um cubo de proporção 4x4) que utiliza a dinâmica de emissão de elétrons e interferência de fótons através de malhas atômicas de grafeno para processamento não-linear de informações.
        </p>
        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
          O objetivo primário é permitir que o sistema "aprenda" empiricamente, mimetizando a plasticidade neural humana por meio de estados físicos da matéria, em vez de cálculos matriciais pesados em software e placas gráficas convencionais.
        </p>
      </section>

      {/* 2. Topologia do Hardware */}
      <section className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
          <Layers className="w-5 h-5" />
          <span>2. Topologia do Hardware</span>
        </div>

        <div className="space-y-3.5 text-xs md:text-sm">
          {/* 2.1 O Disparador */}
          <div className="p-4 bg-[#070b14] rounded-lg border border-slate-800 space-y-2">
            <div className="font-bold text-cyan-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              <span>2.1. O Disparador (Emissor CRT de Ultra-Precisão)</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              <strong>Mecanismo:</strong> Semelhante a um canhão de elétrons de tubos catódicos (CRT), porém operando em escala de altíssima precisão, disparando elétrons individuais ou pulsos controlados de alta densidade no vácuo isolado.
            </p>
            <p className="text-slate-300 text-xs leading-relaxed">
              <strong>Modulação de Entrada:</strong> O sistema orquestrador atua variando a tensão elétrica do disparo (V_acc). Essa tensão age como o peso de entrada (<em>input weight</em>). Variações na energia cinética alteram o comprimento de onda de de Broglie da partícula (λ_dB = 1.226 / √V nm) e a consequente emissão fotônica.
            </p>
          </div>

          {/* 2.2 A Câmara de Processamento */}
          <div className="p-4 bg-[#070b14] rounded-lg border border-slate-800 space-y-2">
            <div className="font-bold text-pink-400 flex items-center gap-1.5">
              <Waves className="w-4 h-4" />
              <span>2.2. A Câmara de Processamento (O Reservatório Quântico)</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              <strong>Meio:</strong> Vácuo isolado (pressão ultra-baixa de 10⁻⁸ Torr).
            </p>
            <p className="text-slate-300 text-xs leading-relaxed">
              <strong>O Obstáculo (Rede Neural Física):</strong> Folhas de grafeno de espessura atômica distanciadas pela medida de um átomo entre si (~0.335 nm).
            </p>
            <p className="text-slate-300 text-xs leading-relaxed">
              <strong>Dinâmica Quântica:</strong> Diferente de colisões newtonianas clássicas, elétrons no grafeno agem como <em>férmions de Dirac</em> sem massa efetiva (v_F ≈ 10⁶ m/s). Ocorrem fenômenos de <strong>Tunelamento de Klein</strong> (travessia de barreiras de potencial sem reflexão para incidência normal) e geração de <strong>Plásmons-Polaritons</strong> (ondas híbridas de luz e matéria de alta compressão óptica). O fóton, em estado não observado (onda), sofre interferência construtiva e destrutiva maciça ao atravessar a estrutura simultaneamente.
            </p>
          </div>

          {/* 2.3 O Receptor */}
          <div className="p-4 bg-[#070b14] rounded-lg border border-slate-800 space-y-2">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <Target className="w-4 h-4" />
              <span>2.3. O Receptor (Camada de Leitura e Quantização em Hardware)</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              <strong>Estrutura:</strong> 4 sensores (S1, S2, S3, S4) localizados na extremidade oposta do cubo de vácuo.
            </p>
            <p className="text-slate-300 text-xs leading-relaxed">
              <strong>Quantização em Hardware:</strong> Para filtrar o ruído caótico inerente a processos estocásticos, os receptores são limitados a ler a interação em um estado quaternário fixo. O potencial energético é forçado a colapsar e se arredondar para um de quatro valores discretos: <strong>0.1, 0.25, 0.75 ou 1.0</strong>.
            </p>
            <p className="text-slate-300 text-xs leading-relaxed">
              <strong>Vetor de Saída:</strong> Cada pulso gera um colapso instantâneo da função de onda em um micro-estado legível, resultando em um vetor de 4 dimensões (Ex: <code>[0.25, 1.0, 0.75, 0.1]</code>). O sistema possui um espaço de amostragem limpo de <strong>4⁴ = 256 micro-estados combinatórios possíveis</strong> por ciclo.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Modelagem Matemática do Meio */}
      <section className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-pink-400 font-bold text-base">
          <Sparkles className="w-5 h-5" />
          <span>3. Modelagem Matemática do Meio (Equação Mestra de Lindblad)</span>
        </div>
        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
          A propagação do sinal dentro do reservatório de grafeno obedece às leis da mecânica quântica em sistemas abertos, regida pela Equação Mestra de Lindblad:
        </p>

        <div className="p-4 bg-[#050811] rounded-lg border border-slate-800 font-mono text-xs md:text-sm text-cyan-300 text-center py-4">
          dρ/dt = -i/ℏ [H, ρ] + ∑_k ( L_k ρ L_k† - 1/2 &#123;L_k† L_k, ρ&#125; )
        </div>

        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
          Onde:
        </p>
        <ul className="list-disc list-inside space-y-1 text-xs md:text-sm text-slate-400 pl-2 font-mono">
          <li><strong>ρ</strong> é a matriz de densidade do estado da onda propagando-se pelas placas de grafeno.</li>
          <li><strong>H</strong> é o Hamiltoniano ditado pelas propriedades de banda do grafeno (cone de Dirac).</li>
          <li><strong>L_k</strong> representam os operadores de salto de Lindblad, traduzindo as variáveis estocásticas do vácuo e da estrutura.</li>
        </ul>

        <p className="text-xs md:text-sm text-slate-300 leading-relaxed mt-2">
          Quando o sinal atinge os 4 receptores, o vetor quaternário de saída y(t) é a medição (traço) do observável:
        </p>
        <div className="p-3 bg-[#050811] rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 text-center">
          y(t) = ∑_i W_i Tr(Ô_i ρ(t)) → Quantizado em &#123;0.1, 0.25, 0.75, 1.0&#125;⁴
        </div>
      </section>

      {/* 4. O Orquestrador (Software e Loop de Aprendizado) */}
      <section className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
          <Target className="w-5 h-5" />
          <span>4. O Orquestrador (Software e Loop de Aprendizado Físico)</span>
        </div>
        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
          O "cérebro" de controle do Cleitin vive no software. O algoritmo de orquestração funciona como um mecanismo de <em>backpropagation físico</em>:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs md:text-sm">
          <div className="p-3.5 bg-[#070b14] rounded-lg border border-slate-800">
            <div className="font-bold text-cyan-300 mb-1">Leitura do Vetor 4D</div>
            <p className="text-slate-400 text-xs">
              O orquestrador recebe o vetor 4D restrito resultante do colapso do pulso nos 4 sensores.
            </p>
          </div>

          <div className="p-3.5 bg-[#070b14] rounded-lg border border-slate-800">
            <div className="font-bold text-pink-300 mb-1">Cálculo de Erro (Loss)</div>
            <p className="text-slate-400 text-xs">
              Avalia a distância matemática entre o vetor estocástico obtido e o vetor alvo esperado (a informação que o sistema está aprendendo a classificar).
            </p>
          </div>

          <div className="p-3.5 bg-[#070b14] rounded-lg border border-slate-800">
            <div className="font-bold text-amber-300 mb-1">Ajuste (Mecanismo de Atenção)</div>
            <p className="text-slate-400 text-xs">
              Utiliza redução de dimensionalidade para mapear o erro de volta à fonte, recalculando os parâmetros de força (tensão), frequência e ângulo de disparo.
            </p>
          </div>

          <div className="p-3.5 bg-[#070b14] rounded-lg border border-slate-800">
            <div className="font-bold text-emerald-300 mb-1">Disparo Iterativo</div>
            <p className="text-slate-400 text-xs">
              Uma nova tensão ajustada é enviada ao canhão de elétrons, forçando as ondas de probabilidade a colapsarem gradativamente mais próximas do padrão de saída desejado. O hardware converge organicamente com o tempo ("como uma criança aprendendo").
            </p>
          </div>
        </div>
      </section>

      {/* 5. Integração com o Silício LGA 775, SSD e Teoria do Pulso Primordial */}
      <section className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
          <Cpu className="w-5 h-5" />
          <span>5. Conexão com o Substrato LGA 775, Modulador SSD e Pulso Primordial</span>
        </div>
        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
          O Projeto Cleitin opera em simbiose com os módulos do simulador:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-xs md:text-sm text-slate-300 pl-2">
          <li><strong>Substrato LGA 775:</strong> Os 256 micro-estados quaternários do cubo de grafeno são injetados como sinais analógicos de polarização para a matriz paralela de transistores de silício via conversores ESP32 DAC.</li>
          <li><strong>SSD Modulador (Flash NVMe):</strong> A retenção de carga nas células flash (MLC/TLC) armazena os pesos sinápticos consolidados após o processo de aprendizagem do orquestrador.</li>
          <li><strong>Teoria do Pulso Primordial (Ricardo B Meneses):</strong> O formalismo de Wheeler-DeWitt (Ĥ|ψ⟩ = 0) e a tensão negativa de pulso (ρ_Π = -ρ²/ρ_P) fundamentam a atemporalidade quântica dos micro-estados e a aceleração fotônica em sub-nanossegundos.</li>
        </ul>
      </section>

      {/* 6. Conclusão do Arquivamento */}
      <section className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
          <FileText className="w-5 h-5" />
          <span>6. Conclusão do Arquivamento</span>
        </div>
        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
          O Projeto Cleitin delineia um paradigma onde o processamento pesado de uma rede neural é descarregado para a física fundamental do grafeno (velocidade da luz/efeitos quânticos) enquanto a quantização quaternária nativa resolve problemas clássicos de perda de sinal (<em>Signal-to-Noise Ratio - SNR</em>).
        </p>
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-400">
          Documento arquivado para futuros desenvolvimentos em hardware não-convencional e inteligência artificial analógica.
        </div>
      </section>
    </div>
  );
};
