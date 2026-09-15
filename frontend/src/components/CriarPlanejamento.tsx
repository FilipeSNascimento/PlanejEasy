import { useState } from 'react';
import { 
  Calendar, 
  Sparkles, 
  BookOpen, 
  Save, 
  Plus, 
  X, 
  GraduationCap, 
  CheckCircle2 
} from 'lucide-react';

interface Disciplina { id: number; nome: string; }
interface Turma { id: number; nome: string; }
interface ObjetoBncc { id: number; codigo: string; descricao: string; disciplina_id: number; }

interface FormularioProps {
  disciplinas: Disciplina[];
  turmas: Turma[];
  bncc: ObjetoBncc[];
}

interface AulaPlanejada {
  id?: number;
  professor_id: number;
  data_aula: string;
  semana_referencia: string;
  turma_id: number;
  disciplina_id: number;
  ordem_aula: string;
  objeto_conhecimento: string;
  estrategia_inicio: string;
  estrategia_desenvolvimento: string;
  estrategia_fim: string;
  localizacao_materiais: string;
}

export default function CriarPlanejamento({ disciplinas, turmas, bncc }: FormularioProps) {
  // Parâmetros de Seleção
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [turmaId, setTurmaId] = useState('');
  const [disciplinaId, setDisciplinaId] = useState('');
  
  // BNCC e Rascunho
  const [objetosSelecionados, setObjetosSelecionados] = useState<string[]>([]);
  const [inputObjeto, setInputObjeto] = useState('');
  const [resumo, setResumo] = useState('');
  
  // Estrutura Retornada da IA
  const [estrategiaInicio, setEstrategiaInicio] = useState('');
  const [estrategiaDesenvolvimento, setEstrategiaDesenvolvimento] = useState('');
  const [estrategiaFim, setEstrategiaFim] = useState('');
  const [materiais, setMateriais] = useState('');
  
  // Estados de Controle
  const [isGerando, setIsGerando] = useState(false);
  const [salvandoLote, setSalvandoLote] = useState(false);
  const [aulasPlanejadas, setAulasPlanejadas] = useState<AulaPlanejada[]>([]);

  // Filtro de BNCC dinâmico por Disciplina
  const opcoesBnccFiltradas = bncc.filter(
    (objeto) => objeto.disciplina_id === Number(disciplinaId)
  );

  const adicionarObjeto = () => {
    if (inputObjeto.trim() !== '' && !objetosSelecionados.includes(inputObjeto)) {
      setObjetosSelecionados([...objetosSelecionados, inputObjeto]);
      setInputObjeto('');
    }
  };

  const removerObjeto = (objeto: string) => {
    setObjetosSelecionados(objetosSelecionados.filter(obj => obj !== objeto));
  };

  const calcularSemana = (dataStr: string) => {
    if (!dataStr) return '';
    const data = new Date(dataStr + 'T00:00:00');
    const diaDaSemana = data.getDay();
    const diffSegunda = data.getDate() - diaDaSemana + (diaDaSemana === 0 ? -6 : 1);
    const segunda = new Date(data.setDate(diffSegunda));
    const sexta = new Date(segunda);
    sexta.setDate(segunda.getDate() + 4);

    const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `Semana de ${fmt(segunda)} a ${fmt(sexta)}`;
  };

  const handleGerarIA = async () => {
    if (!turmaId || !disciplinaId || !resumo.trim()) {
      return alert("Selecione a Turma, a Disciplina e preencha o rascunho da aula.");
    }
    setIsGerando(true);
    try {
      const nomeDisciplina = disciplinas.find(d => d.id === Number(disciplinaId))?.nome || '';
      const nomeTurma = turmas.find(t => t.id === Number(turmaId))?.nome || '';
      
      const resposta = await fetch('http://localhost:3333/ia/gerar-plano', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumo, disciplina: nomeDisciplina, turma: nomeTurma })
      });

      if (resposta.ok) {
        const dadosIA = await resposta.json();
        setEstrategiaInicio(dadosIA.estrategia_inicio || '');
        setEstrategiaDesenvolvimento(dadosIA.estrategia_desenvolvimento || '');
        setEstrategiaFim(dadosIA.estrategia_fim || '');
        setMateriais(dadosIA.localizacao_materiais || '');
      } else {
        alert("Erro ao consultar a IA. Verifique as credenciais do backend.");
      }
    } catch (erro) {
      console.error(erro);
      alert("Erro de conexão ao gerar plano com IA.");
    } finally {
      setIsGerando(false);
    }
  };

  const handleAdicionarFila = () => {
    if (!dataSelecionada) return alert("Por favor, selecione a data da aula!");
    if (!turmaId || !disciplinaId) return alert("Defina a Turma e a Disciplina!");
    if (!estrategiaDesenvolvimento.trim()) return alert("O desenvolvimento da aula não pode ficar vazio.");

    const novaAula: AulaPlanejada = {
      professor_id: 1, 
      data_aula: dataSelecionada,
      semana_referencia: calcularSemana(dataSelecionada),
      turma_id: Number(turmaId), 
      disciplina_id: Number(disciplinaId),
      ordem_aula: `${aulasPlanejadas.length + 1}ª`, 
      objeto_conhecimento: objetosSelecionados.join(', '),
      estrategia_inicio: estrategiaInicio, 
      estrategia_desenvolvimento: estrategiaDesenvolvimento, 
      estrategia_fim: estrategiaFim, 
      localizacao_materiais: materiais
    };

    setAulasPlanejadas([...aulasPlanejadas, novaAula]);
    setResumo('');
    setObjetosSelecionados([]);
    setInputObjeto('');
    setEstrategiaInicio('');
    setEstrategiaDesenvolvimento('');
    setEstrategiaFim('');
    setMateriais('');
  };

  const handleSalvarTodas = async () => {
    if (aulasPlanejadas.length === 0) return alert("A fila de envio está vazia.");
    setSalvandoLote(true);
    try {
      const resposta = await fetch('http://localhost:3333/planos/lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aulasPlanejadas)
      });
      if (resposta.ok) {
        alert("🎉 Todas as aulas foram salvas com sucesso no banco!");
        setAulasPlanejadas([]);
      } else {
        const errData = await resposta.json();
        alert("Falha ao salvar: " + errData.erro);
      }
    } catch (erro) {
      console.error(erro);
      alert("Erro ao conectar com o banco.");
    } finally {
      setSalvandoLote(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-blue-900 to-blue-600">
            Criar Planejamento
          </h1>
          <p className="text-sm text-slate-500">Configure data, diretrizes curriculares e estruture sua metodologia.</p>
        </div>
      </div>

      {/* Grid de Seleção (Data, Turma, Disciplina) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Data */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:border-blue-400/50 hover:shadow-md transition-all">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Data da Aula
          </label>
          <input 
            type="date"
            value={dataSelecionada}
            onChange={(e) => setDataSelecionada(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
          />
          {dataSelecionada && (
            <span className="text-xs font-bold text-blue-600 mt-2 block">
              📌 {calcularSemana(dataSelecionada)}
            </span>
          )}
        </div>

        {/* Turma */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:border-blue-400/50 hover:shadow-md transition-all">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            Turma
          </label>
          <select 
            value={turmaId}
            onChange={(e) => setTurmaId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="">Selecione uma turma...</option>
            {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </div>

        {/* Disciplina */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:border-blue-400/50 hover:shadow-md transition-all">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            Disciplina
          </label>
          <select 
            value={disciplinaId}
            onChange={(e) => {
              setDisciplinaId(e.target.value);
              setObjetosSelecionados([]);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="">Selecione uma disciplina...</option>
            {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
        </div>
      </div>

      {/* BNCC Multi-Tag Selector */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Habilidades / Objetos de Conhecimento (BNCC)
        </label>
        <div className="flex gap-2 mb-3">
          <input 
            list="lista-bncc"
            value={inputObjeto}
            onChange={(e) => setInputObjeto(e.target.value)}
            disabled={!disciplinaId}
            placeholder={disciplinaId ? "Selecione ou digite um código/habilidade..." : "Selecione uma disciplina acima primeiro..."}
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
          />
          <button 
            type="button"
            onClick={adicionarObjeto}
            disabled={!disciplinaId}
            className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-100 disabled:opacity-50 transition-all inline-flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        <datalist id="lista-bncc">
          {opcoesBnccFiltradas.map(o => (
            <option key={o.id} value={`${o.descricao} (${o.codigo})`} />
          ))}
        </datalist>

        <div className="flex flex-wrap gap-2">
          {objetosSelecionados.map((obj, i) => (
            <span key={i} className="bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-2 shadow-sm">
              {obj}
              <button type="button" onClick={() => removerObjeto(obj)} className="text-blue-500 hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Entrada do Rascunho Livre + Disparo da IA */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <label className="block text-sm font-bold text-slate-800 mb-2">
          Rascunho ou Ideia da Aula
        </label>
        <textarea 
          rows={3}
          value={resumo}
          onChange={(e) => setResumo(e.target.value)}
          placeholder="Ex: Vou trabalhar frações utilizando círculos fracionários em grupos de quatro alunos..."
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 resize-none"
        />
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleGerarIA}
            disabled={isGerando || !resumo.trim()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all"
          >
            <Sparkles className={`w-4 h-4 ${isGerando ? 'animate-spin' : ''}`} />
            {isGerando ? 'Estruturando Metodologia...' : 'Estruturar com IA'}
          </button>
        </div>
      </div>

      {/* Cards de Etapas Didáticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Início */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                Início
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Acolhimento</span>
            </div>
            <textarea 
              rows={6}
              value={estrategiaInicio}
              onChange={(e) => setEstrategiaInicio(e.target.value)}
              placeholder="Estratégias de introdução preenchidas pela IA..."
              className="w-full text-sm text-slate-700 bg-transparent resize-none outline-none leading-relaxed placeholder:text-slate-300"
            />
          </div>
        </div>

        {/* Desenvolvimento */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                Desenvolvimento
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Prática Ativa</span>
            </div>
            <textarea 
              rows={6}
              value={estrategiaDesenvolvimento}
              onChange={(e) => setEstrategiaDesenvolvimento(e.target.value)}
              placeholder="Roteiro principal da atividade preenchido pela IA..."
              className="w-full text-sm text-slate-700 bg-transparent resize-none outline-none leading-relaxed placeholder:text-slate-300"
            />
          </div>
        </div>

        {/* Fim */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                Fim
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Consolidação</span>
            </div>
            <textarea 
              rows={6}
              value={estrategiaFim}
              onChange={(e) => setEstrategiaFim(e.target.value)}
              placeholder="Fechamento pedagógico preenchido pela IA..."
              className="w-full text-sm text-slate-700 bg-transparent resize-none outline-none leading-relaxed placeholder:text-slate-300"
            />
          </div>
        </div>
      </div>

      {/* Campo de Recursos / Materiais */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
          Recursos Didáticos / Localização de Materiais
        </label>
        <input 
          type="text"
          value={materiais}
          onChange={(e) => setMateriais(e.target.value)}
          placeholder="Ex: Sala de Informática, Folhas Sulfite, Projetor..."
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      {/* Botão de Adicionar à Fila */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleAdicionarFila}
          className="w-full max-w-sm flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-md hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          Adicionar Aula à Fila
        </button>
      </div>

      {/* Tabela de Lote */}
      {aulasPlanejadas.length > 0 && (
        <div className="mt-12 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Aulas Prontas para Envio ({aulasPlanejadas.length})
            </h3>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl mb-6">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Data / Semana</th>
                  <th className="px-4 py-3">Estratégia Central</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {aulasPlanejadas.map((aula, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                      {new Date(aula.data_aula + 'T00:00:00').toLocaleDateString('pt-BR')}<br />
                      <span className="text-[11px] font-normal text-slate-500">{aula.semana_referencia}</span>
                    </td>
                    <td className="px-4 py-3 line-clamp-2">{aula.estrategia_desenvolvimento}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={handleSalvarTodas}
            disabled={salvandoLote}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 disabled:opacity-50 transition-all"
          >
            <Save className="w-4 h-4" />
            {salvandoLote ? 'Salvando no Banco...' : 'Salvar Lote Definitivamente'}
          </button>
        </div>
      )}

    </div>
  );
}