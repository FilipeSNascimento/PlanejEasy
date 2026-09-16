import { useState, useEffect } from 'react';
import { 
  Calendar, 
  BookOpen, 
  CheckSquare, 
  Square, 
  Sparkles, 
  Inbox, 
  Copy, 
  Trash2, 
  Edit3, 
  X, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  FolderOpen, 
  CalendarDays,
  FileSpreadsheet,
  Search,
  Layers,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface Turma { id: number; nome: string; }

interface AulaPlanejada {
  id: number;
  professor_id: number;
  data_aula: string;
  semana_referencia: string;
  turma_id: number;
  disciplina_id: number;
  turmas?: { nome: string };
  disciplinas?: { nome: string };
  ordem_aula?: string;
  objeto_conhecimento?: string;
  estrategia_inicio?: string;
  estrategia_desenvolvimento: string;
  estrategia_fim?: string;
  localizacao_materiais?: string;
}

export default function AulasPlanejadas() {
  const [aulas, setAulas] = useState<AulaPlanejada[]>([]);
  const [turmasDisponiveis, setTurmasDisponiveis] = useState<Turma[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [filtroTexto, setFiltroTexto] = useState('');

// Controle de colapso: inicia vazio, ou seja, tudo fechado por padrão
  const [turmasAbertas, setTurmasAbertas] = useState<Record<string, boolean>>({});
  const [semanasAbertas, setSemanasAbertas] = useState<Record<string, boolean>>({});
  
  // Edição
  const [aulaEditando, setAulaEditando] = useState<AulaPlanejada | null>(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const dispararToast = (tipo: 'sucesso' | 'erro', texto: string) => {
    setToast({ tipo, texto });
    setTimeout(() => setToast(null), 3500);
  };

  const carregarAulas = async () => {
    try {
      const [resPlanos, resTurmas] = await Promise.all([
        fetch('http://localhost:3333/planos'),
        fetch('http://localhost:3333/turmas')
      ]);

      if (resPlanos.ok) setAulas(await resPlanos.json());
      if (resTurmas.ok) setTurmasDisponiveis(await resTurmas.json());
    } catch (erro) {
      console.error('Erro ao buscar dados:', erro);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    let ativo = true;

    async function buscarDadosIniciais() {
      try {
        const [resPlanos, resTurmas] = await Promise.all([
          fetch('http://localhost:3333/planos'),
          fetch('http://localhost:3333/turmas')
        ]);

        if (ativo) {
          if (resPlanos.ok) setAulas(await resPlanos.json());
          if (resTurmas.ok) setTurmasDisponiveis(await resTurmas.json());
        }
      } catch (erro) {
        console.error('Erro ao buscar aulas:', erro);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    buscarDadosIniciais();
    return () => { ativo = false; };
  }, []);

  const formatarDataComDia = (dataStr: string) => {
    if (!dataStr) return '-';
    const data = new Date(dataStr + 'T00:00:00');
    const diaSemana = data.toLocaleDateString('pt-BR', { weekday: 'long' });
    const dataFmt = data.toLocaleDateString('pt-BR');
    return `${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)}, ${dataFmt}`;
  };

  const toggleSelecionar = (id: number) => {
    setSelecionados(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selecionarTodos = () => {
    if (selecionados.length === aulasFiltradas.length) {
      setSelecionados([]);
    } else {
      setSelecionados(aulasFiltradas.map(a => a.id));
    }
  };

  // Alternadores de colapso
  const toggleTurma = (nomeTurma: string) => {
    setTurmasAbertas(prev => ({ ...prev, [nomeTurma]: !prev[nomeTurma] }));
  };

  const toggleSemana = (chaveSemana: string) => {
    setSemanasAbertas(prev => ({ ...prev, [chaveSemana]: !prev[chaveSemana] }));
  };

  const handleDuplicarAula = async (e: React.MouseEvent, aula: AulaPlanejada) => {
    e.stopPropagation();
    try {
      const copia = [{
        professor_id: aula.professor_id,
        data_aula: aula.data_aula,
        semana_referencia: aula.semana_referencia,
        turma_id: aula.turma_id,
        disciplina_id: aula.disciplina_id,
        ordem_aula: `${aula.ordem_aula || '1ª'} (Cópia)`,
        objeto_conhecimento: aula.objeto_conhecimento || '',
        estrategia_inicio: aula.estrategia_inicio || '',
        estrategia_desenvolvimento: aula.estrategia_desenvolvimento || '',
        estrategia_fim: aula.estrategia_fim || '',
        localizacao_materiais: aula.localizacao_materiais || ''
      }];

      const res = await fetch('http://localhost:3333/planos/lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(copia)
      });

      if (res.ok) {
        dispararToast('sucesso', 'Aula duplicada com sucesso!');
        carregarAulas();
      } else {
        dispararToast('erro', 'Não foi possível duplicar a aula.');
      }
    } catch {
      dispararToast('erro', 'Erro de conexão ao duplicar aula.');
    }
  };

  const handleExcluirAula = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Deseja realmente excluir este planejamento?')) return;

    try {
      const res = await fetch(`http://localhost:3333/planos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        dispararToast('sucesso', 'Plano removido com sucesso!');
        setAulas(prev => prev.filter(a => a.id !== id));
        setSelecionados(prev => prev.filter(item => item !== id));
      } else {
        dispararToast('erro', 'Falha ao remover o plano.');
      }
    } catch {
      dispararToast('erro', 'Erro de conexão ao excluir.');
    }
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aulaEditando) return;
    setSalvandoEdicao(true);

    try {
      const res = await fetch(`http://localhost:3333/planos/${aulaEditando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aulaEditando)
      });

      if (res.ok) {
        const aulaAtualizada = await res.json();
        dispararToast('sucesso', 'Aula atualizada com sucesso!');
        setAulas(prev => prev.map(a => a.id === aulaAtualizada.id ? aulaAtualizada : a));
        setAulaEditando(null);
      } else {
        dispararToast('erro', 'Erro ao atualizar a aula.');
      }
    } catch {
      dispararToast('erro', 'Erro de conexão ao atualizar.');
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const handleExportarExcel = () => {
    if (selecionados.length === 0) {
      return dispararToast('erro', 'Selecione pelo menos uma aula para exportar.');
    }
    const idsString = selecionados.join(',');
    window.location.href = `http://localhost:3333/planos/exportar-lote?ids=${idsString}`;
  };

  const aulasFiltradas = aulas.filter(aula => {
    const termo = filtroTexto.toLowerCase();
    const estrategia = aula.estrategia_desenvolvimento?.toLowerCase() || '';
    const semana = aula.semana_referencia?.toLowerCase() || '';
    const turma = aula.turmas?.nome?.toLowerCase() || '';
    const disciplina = aula.disciplinas?.nome?.toLowerCase() || '';
    return estrategia.includes(termo) || semana.includes(termo) || turma.includes(termo) || disciplina.includes(termo);
  });

  const turmasAgrupadas = aulasFiltradas.reduce((acc, aula) => {
    const nomeTurma = aula.turmas?.nome || `Turma #${aula.turma_id}`;
    const semana = aula.semana_referencia || 'Semana não informada';

    if (!acc[nomeTurma]) acc[nomeTurma] = {};
    if (!acc[nomeTurma][semana]) acc[nomeTurma][semana] = [];

    acc[nomeTurma][semana].push(aula);
    return acc;
  }, {} as Record<string, Record<string, AulaPlanejada[]>>);

  return (
    <div className="space-y-8 max-w-7xl mx-auto relative">
      {/* Toast Flutuante */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl bg-white border border-slate-200 shadow-2xl animate-in fade-in slide-in-from-top-4">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            toast.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {toast.tipo === 'sucesso' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">{toast.tipo === 'sucesso' ? 'Sucesso' : 'Erro'}</p>
            <p className="text-xs text-slate-500 font-medium">{toast.texto}</p>
          </div>
        </div>
      )}

      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-blue-900 to-blue-600">
              Aulas Planejadas
            </h1>
            <p className="text-sm text-slate-500">Histórico segmentado por turma e semana com seções minimizáveis.</p>
          </div>
        </div>

        <button
          onClick={handleExportarExcel}
          disabled={selecionados.length === 0}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:pointer-events-none transition-all"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Exportar Excel ({selecionados.length})
        </button>
      </div>

      {/* Busca e Seleção Geral */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            placeholder="Pesquisar por conteúdo, turma, disciplina..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
        </div>

        {aulasFiltradas.length > 0 && (
          <button
            onClick={selecionarTodos}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            {selecionados.length === aulasFiltradas.length ? (
              <>
                <CheckSquare className="w-4 h-4" /> Desmarcar Todos
              </>
            ) : (
              <>
                <Square className="w-4 h-4" /> Selecionar Todos ({aulasFiltradas.length})
              </>
            )}
          </button>
        )}
      </div>

      {/* Conteúdo com Agrupamento Colapsável */}
      {carregando ? (
        <div className="flex items-center justify-center py-20 text-slate-500 font-medium">
          <Sparkles className="w-5 h-5 animate-spin mr-2 text-blue-600" />
          Carregando histórico estruturado...
        </div>
      ) : Object.keys(turmasAgrupadas).length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">Nenhum planejamento encontrado</h3>
          <p className="text-sm text-slate-400 mt-1">Crie seu primeiro plano na aba "Criar Planejamento".</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(turmasAgrupadas).map(([nomeTurma, semanas]) => {
            const turmaAberta = !!turmasAbertas[nomeTurma];
            const totalAulasTurma = Object.values(semanas).reduce((sum, list) => sum + list.length, 0);

            return (
              <section key={nomeTurma} className="bg-white/60 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                {/* Header Clicável da Turma */}
                <div 
                  onClick={() => toggleTurma(nomeTurma)}
                  className="flex items-center justify-between cursor-pointer group select-none py-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {nomeTurma}
                        </h2>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                          {totalAulasTurma} {totalAulasTurma === 1 ? 'aula' : 'aulas'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Clique para expandir ou recolher as aulas desta turma</p>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600 transition-all">
                    {turmaAberta ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                </div>

                {/* Conteúdo da Turma (se aberta) */}
                {turmaAberta && (
                  <div className="space-y-6 pt-2 border-t border-slate-100">
                    {Object.entries(semanas).map(([semana, listaAulas]) => {
                      const chaveSemana = `${nomeTurma}_${semana}`;
                      const semanaAberta = !!semanasAbertas[chaveSemana];

                      return (
                        <div key={semana} className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                          {/* Header Clicável da Semana */}
                          <div 
                            onClick={() => toggleSemana(chaveSemana)}
                            className="flex items-center justify-between cursor-pointer group select-none"
                          >
                            <div className="flex items-center gap-2">
                              <CalendarDays className="w-4 h-4 text-indigo-600" />
                              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">
                                {semana}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 font-bold">
                                {listaAulas.length} {listaAulas.length === 1 ? 'aula' : 'aulas'}
                              </span>
                            </div>

                            <button 
                              type="button"
                              className="text-slate-400 group-hover:text-slate-600 p-1 rounded-md"
                            >
                              {semanaAberta ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          </div>

                          {/* Grid de Cards da Semana (se aberta) */}
                          {semanaAberta && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-1">
                              {listaAulas.map((aula) => {
                                const isSelected = selecionados.includes(aula.id);
                                return (
                                  <div
                                    key={aula.id}
                                    onClick={() => toggleSelecionar(aula.id)}
                                    className={`group bg-white rounded-2xl border p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between relative shadow-sm hover:shadow-lg ${
                                      isSelected
                                        ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-blue-500/10'
                                        : 'border-slate-200/80 hover:border-slate-300'
                                    }`}
                                  >
                                    <div>
                                      {/* Topo do Card */}
                                      <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex flex-wrap gap-2">
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                                            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                                            {aula.disciplinas?.nome || `Disc #${aula.disciplina_id}`}
                                          </span>
                                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                            {aula.ordem_aula || '1ª Aula'}
                                          </span>
                                        </div>

                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => {}}
                                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600 mt-0.5"
                                        />
                                      </div>

                                      {/* Data e Dia da Semana */}
                                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 mb-4">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                                          <Calendar className="w-4 h-4 text-blue-600" />
                                          <span>{formatarDataComDia(aula.data_aula)}</span>
                                        </div>
                                      </div>

                                      {/* Desenvolvimento */}
                                      <div className="space-y-1.5 mb-4">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Desenvolvimento</p>
                                        <p className="text-sm text-slate-700 line-clamp-4 leading-relaxed font-normal">
                                          {aula.estrategia_desenvolvimento}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Rodapé e Ações */}
                                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                      <span className={`text-[11px] font-semibold ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>
                                        {isSelected ? '✓ Marcada' : 'Clique para marcar'}
                                      </span>

                                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                        <button
                                          type="button"
                                          title="Duplicar esta aula"
                                          onClick={(e) => handleDuplicarAula(e, aula)}
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                        >
                                          <Copy className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          title="Editar conteúdo"
                                          onClick={() => setAulaEditando({ ...aula })}
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                        >
                                          <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          title="Excluir do banco"
                                          onClick={(e) => handleExcluirAula(e, aula.id)}
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Modal de Edição */}
      {aulaEditando && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Editar Planejamento</h3>
                <p className="text-xs text-slate-500">Modifique a turma, ordem e conteúdo didático.</p>
              </div>
              <button 
                onClick={() => setAulaEditando(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarEdicao} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Turma
                  </label>
                  <select
                    value={aulaEditando.turma_id}
                    onChange={(e) => setAulaEditando({ ...aulaEditando, turma_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 focus:bg-white"
                  >
                    {turmasDisponiveis.map(t => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Data da Aula
                  </label>
                  <input
                    type="date"
                    value={aulaEditando.data_aula}
                    onChange={(e) => setAulaEditando({ ...aulaEditando, data_aula: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Ordem
                  </label>
                  <select
                    value={aulaEditando.ordem_aula || '1ª'}
                    onChange={(e) => setAulaEditando({ ...aulaEditando, ordem_aula: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="1ª">1ª Aula</option>
                    <option value="2ª">2ª Aula</option>
                    <option value="3ª">3ª Aula</option>
                    <option value="4ª">4ª Aula</option>
                    <option value="5ª">5ª Aula</option>
                    <option value="6ª">6ª Aula</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                  Início (Acolhimento)
                </label>
                <textarea
                  rows={2}
                  value={aulaEditando.estrategia_inicio || ''}
                  onChange={(e) => setAulaEditando({ ...aulaEditando, estrategia_inicio: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
                  Desenvolvimento (Prática)
                </label>
                <textarea
                  rows={4}
                  value={aulaEditando.estrategia_desenvolvimento}
                  onChange={(e) => setAulaEditando({ ...aulaEditando, estrategia_desenvolvimento: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
                  Fim (Fechamento)
                </label>
                <textarea
                  rows={2}
                  value={aulaEditando.estrategia_fim || ''}
                  onChange={(e) => setAulaEditando({ ...aulaEditando, estrategia_fim: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Recursos / Materiais
                </label>
                <input
                  type="text"
                  value={aulaEditando.localizacao_materiais || ''}
                  onChange={(e) => setAulaEditando({ ...aulaEditando, localizacao_materiais: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAulaEditando(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoEdicao}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md disabled:opacity-50 transition-all"
                >
                  <Save className="w-4 h-4" />
                  {salvandoEdicao ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}