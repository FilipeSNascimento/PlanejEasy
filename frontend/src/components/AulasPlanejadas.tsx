import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
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
  ChevronRight,
  Filter,
  RotateCcw
} from 'lucide-react';

interface Turma { id: number; nome: string; }
interface Disciplina { id: number; nome: string; }

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
  const [disciplinasDisponiveis, setDisciplinasDisponiveis] = useState<Disciplina[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [selecionados, setSelecionados] = useState<number[]>([]);

  // Filtros
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroDisciplina, setFiltroDisciplina] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  // Accordions
  const [turmasAbertas, setTurmasAbertas] = useState<Record<string, boolean>>({});
  const [semanasAbertas, setSemanasAbertas] = useState<Record<string, boolean>>({});

  // Edição
  const [aulaEditando, setAulaEditando] = useState<AulaPlanejada | null>(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  // Clonagem Transversal
  const [aulaParaClonar, setAulaParaClonar] = useState<AulaPlanejada | null>(null);
  const [turmaDestinoClone, setTurmaDestinoClone] = useState<number | null>(null);
  const [dataDestinoClone, setDataDestinoClone] = useState<string>('');
  const [salvandoClone, setSalvandoClone] = useState(false);

  // Notificações Toast
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const dispararToast = (tipo: 'sucesso' | 'erro', texto: string) => {
    setToast({ tipo, texto });
    setTimeout(() => setToast(null), 3500);
  };

  const carregarAulas = async () => {
    try {
      const [resPlanos, resTurmas, resDisciplinas] = await Promise.all([
        apiFetch('/planos'),
        apiFetch('/turmas'),
        apiFetch('/disciplinas')
      ]);

      if (resPlanos.ok) setAulas(await resPlanos.json());
      if (resTurmas.ok) setTurmasDisponiveis(await resTurmas.json());
      if (resDisciplinas.ok) setDisciplinasDisponiveis(await resDisciplinas.json());
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
        const [resPlanos, resTurmas, resDisciplinas] = await Promise.all([
          apiFetch('/planos'),
          apiFetch('/turmas'),
          apiFetch('/disciplinas')
        ]);

        if (ativo) {
          if (resPlanos.ok) setAulas(await resPlanos.json());
          if (resTurmas.ok) setTurmasDisponiveis(await resTurmas.json());
          if (resDisciplinas.ok) setDisciplinasDisponiveis(await resDisciplinas.json());
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

  const toggleTurma = (nomeTurma: string) => {
    setTurmasAbertas(prev => ({ ...prev, [nomeTurma]: !prev[nomeTurma] }));
  };

  const toggleSemana = (chaveSemana: string) => {
    setSemanasAbertas(prev => ({ ...prev, [chaveSemana]: !prev[chaveSemana] }));
  };

  const abrirModalClone = (e: React.MouseEvent, aula: AulaPlanejada) => {
    e.stopPropagation();
    setAulaParaClonar(aula);
    setTurmaDestinoClone(aula.turma_id);
    setDataDestinoClone(aula.data_aula || '');
  };

  const handleConfirmarClonagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aulaParaClonar || !turmaDestinoClone) return;

    setSalvandoClone(true);
    try {
      const payload = [{
        professor_id: aulaParaClonar.professor_id,
        data_aula: dataDestinoClone || aulaParaClonar.data_aula,
        semana_referencia: aulaParaClonar.semana_referencia,
        turma_id: turmaDestinoClone,
        disciplina_id: aulaParaClonar.disciplina_id,
        ordem_aula: aulaParaClonar.ordem_aula || '1ª Aula',
        objeto_conhecimento: aulaParaClonar.objeto_conhecimento || '',
        estrategia_inicio: aulaParaClonar.estrategia_inicio || '',
        estrategia_desenvolvimento: aulaParaClonar.estrategia_desenvolvimento || '',
        estrategia_fim: aulaParaClonar.estrategia_fim || '',
        localizacao_materiais: aulaParaClonar.localizacao_materiais || ''
      }];

      const res = await apiFetch('/planos/lote', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        dispararToast('sucesso', 'Plano clonado com sucesso para a nova turma!');
        setAulaParaClonar(null);
        await carregarAulas();
      } else {
        dispararToast('erro', 'Falha ao duplicar plano.');
      }
    } catch {
      dispararToast('erro', 'Erro de conexão ao duplicar plano.');
    } finally {
      setSalvandoClone(false);
    }
  };

  const handleExcluirAula = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Deseja realmente excluir este planejamento?')) return;

    try {
      const res = await apiFetch(`/planos/${id}`, { method: 'DELETE' });
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
      const res = await apiFetch(`/planos/${aulaEditando.id}`, {
        method: 'PUT',
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

  const handleExportarExcel = async () => {
    if (selecionados.length === 0) {
      return dispararToast('erro', 'Selecione pelo menos uma aula para exportar.');
    }

    try {
      const idsString = selecionados.join(',');
      const res = await apiFetch(`/planos/exportar-lote?ids=${idsString}`);

      if (!res.ok) throw new Error('Falha na geração do arquivo');

      // Cria download via blob para preservar a autorização JWT
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Planejamento_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      dispararToast('erro', 'Erro ao baixar o arquivo Excel.');
    }
  };

  const limparFiltros = () => {
    setFiltroTexto('');
    setFiltroDisciplina('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
  };

  const temFiltroAtivo = filtroTexto || filtroDisciplina || filtroDataInicio || filtroDataFim;

  const aulasFiltradas = aulas.filter(aula => {
    const termo = filtroTexto.toLowerCase();
    const estrategia = aula.estrategia_desenvolvimento?.toLowerCase() || '';
    const semana = aula.semana_referencia?.toLowerCase() || '';
    const turma = aula.turmas?.nome?.toLowerCase() || '';
    const disciplina = aula.disciplinas?.nome?.toLowerCase() || '';

    const matchTexto = !filtroTexto || (
      estrategia.includes(termo) ||
      semana.includes(termo) ||
      turma.includes(termo) ||
      disciplina.includes(termo)
    );

    const matchDisciplina = !filtroDisciplina || String(aula.disciplina_id) === filtroDisciplina;

    const dataPlano = aula.data_aula ? new Date(aula.data_aula + 'T00:00:00').getTime() : null;
    const dataMin = filtroDataInicio ? new Date(filtroDataInicio + 'T00:00:00').getTime() : null;
    const dataMax = filtroDataFim ? new Date(filtroDataFim + 'T00:00:00').getTime() : null;

    const matchDataInicio = !dataMin || (dataPlano !== null && dataPlano >= dataMin);
    const matchDataFim = !dataMax || (dataPlano !== null && dataPlano <= dataMax);

    return matchTexto && matchDisciplina && matchDataInicio && matchDataFim;
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
            <p className="text-sm text-slate-500">Histórico de planos, clonagem inter-turmas e exportação estruturada.</p>
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

      {/* Filtros Avançados */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Busca textual */}
          <div className="relative md:col-span-2">
            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Pesquisar por conteúdo, turma, código..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          </div>

          {/* Filtro por Componente Curricular */}
          <div>
            <select
              value={filtroDisciplina}
              onChange={(e) => setFiltroDisciplina(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">Todas as Disciplinas</option>
              {disciplinasDisponiveis.map(d => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </select>
          </div>

          {/* Intervalo de datas */}
          <div className="flex gap-2">
            <input
              type="date"
              value={filtroDataInicio}
              title="Data inicial"
              onChange={(e) => setFiltroDataInicio(e.target.value)}
              className="w-1/2 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:bg-white focus:border-blue-500"
            />
            <input
              type="date"
              value={filtroDataFim}
              title="Data final"
              onChange={(e) => setFiltroDataFim(e.target.value)}
              className="w-1/2 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:bg-white focus:border-blue-500"
            />
          </div>
        </div>

        {/* Linha de status dos filtros e seleção total */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Exibindo <strong>{aulasFiltradas.length}</strong> de <strong>{aulas.length}</strong> planos</span>
            {temFiltroAtivo && (
              <button
                onClick={limparFiltros}
                className="ml-2 inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 font-bold"
              >
                <RotateCcw className="w-3 h-3" /> Limpar filtros
              </button>
            )}
          </div>

          {aulasFiltradas.length > 0 && (
            <button
              onClick={selecionarTodos}
              className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors"
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
          <p className="text-sm text-slate-400 mt-1">Ajuste os filtros ou crie planos na aba "Criar Planejamento".</p>
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

                          {/* Grid de Cards da Semana */}
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
                                          title="Clonar para outra turma"
                                          onClick={(e) => abrirModalClone(e, aula)}
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

      {/* Modal de Clonagem Transversal entre Turmas */}
      {aulaParaClonar && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Copy className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Clonar Plano de Aula</h3>
              </div>
              <button 
                onClick={() => setAulaParaClonar(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarClonagem} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Duplique o plano de <strong>{aulaParaClonar.disciplinas?.nome}</strong> para outra turma ou data sem reescrever o conteúdo.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Turma de Destino
                </label>
                <select
                  value={turmaDestinoClone || ''}
                  onChange={(e) => setTurmaDestinoClone(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 focus:bg-white"
                  required
                >
                  {turmasDisponiveis.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.nome} {t.id === aulaParaClonar.turma_id ? '(Turma Atual)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Data da Aula
                </label>
                <input
                  type="date"
                  value={dataDestinoClone}
                  onChange={(e) => setDataDestinoClone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAulaParaClonar(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoClone}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md disabled:opacity-50 transition-all"
                >
                  <Copy className="w-4 h-4" />
                  {salvandoClone ? 'Clonando...' : 'Confirmar Cópia'}
                </button>
              </div>
            </form>
          </div>
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