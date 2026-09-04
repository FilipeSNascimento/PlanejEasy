import { useState } from 'react';

// Interfaces Iniciais
interface Disciplina { id: number; nome: string; }
interface Turma { id: number; nome: string; }
interface ObjetoBncc { id: number; codigo: string; descricao: string; disciplina_id: number; }
interface FormularioProps { disciplinas: Disciplina[]; turmas: Turma[]; bncc: ObjetoBncc[]; }

// NOVO: Tipagem forte para a Aula que vai para a prévia (Resolve o erro do "any")
interface AulaPlanejada {
  professor_id: number;
  quinzena: string;
  turma_id: number;
  disciplina_id: number;
  dia_semana: string;
  ordem_aula: string;
  objeto_conhecimento: string;
  estrategia_inicio: string;
  estrategia_desenvolvimento: string;
  estrategia_fim: string;
  localizacao_materiais: string;
}

export default function FormularioPlanoAula({ disciplinas, turmas, bncc }: FormularioProps) {
  // Estados Fixos (Não limpam a cada aula)
  const [quinzena, setQuinzena] = useState('');
  const [turmaId, setTurmaId] = useState('');
  const [disciplinaId, setDisciplinaId] = useState('');
  const [diaSemana, setDiaSemana] = useState('Segunda-feira');
  
  // Estados Variáveis (Limpam após adicionar a aula)
  const [objetosSelecionados, setObjetosSelecionados] = useState<string[]>([]);
  const [inputObjeto, setInputObjeto] = useState('');
  const [resumo, setResumo] = useState('');
  const [estrategiaInicio, setEstrategiaInicio] = useState('');
  const [estrategiaDesenvolvimento, setEstrategiaDesenvolvimento] = useState('');
  const [estrategiaFim, setEstrategiaFim] = useState('');
  const [materiais, setMateriais] = useState('');
  const [isGerando, setIsGerando] = useState(false);

  // O Lote de Aulas (Agora com a tipagem correta)
  const [aulasPlanejadas, setAulasPlanejadas] = useState<AulaPlanejada[]>([]);

  // Funções da BNCC (Resolve o erro de "not used")
  const opcoesBnccFiltradas = bncc.filter((objeto) => objeto.disciplina_id === Number(disciplinaId));

  const adicionarObjeto = () => {
    if (inputObjeto.trim() !== '' && !objetosSelecionados.includes(inputObjeto)) {
      setObjetosSelecionados([...objetosSelecionados, inputObjeto]);
      setInputObjeto('');
    }
  };

  const removerObjeto = (objeto: string) => {
    setObjetosSelecionados(objetosSelecionados.filter(obj => obj !== objeto));
  };

  // Função da IA
  const handleGerarIA = async () => {
    if (!turmaId || !disciplinaId || !resumo) return alert("Selecione os dados básicos e faça o rascunho.");
    setIsGerando(true);
    try {
      const nomeDisciplina = disciplinas.find(d => d.id === Number(disciplinaId))?.nome || '';
      const nomeTurma = turmas.find(t => t.id === Number(turmaId))?.nome || '';
      const resposta = await fetch('http://localhost:3333/ia/gerar-plano', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumo, disciplina: nomeDisciplina, turma: nomeTurma })
      });
      if (resposta.ok) {
        const dadosIA = await resposta.json();
        setEstrategiaInicio(dadosIA.estrategia_inicio || '');
        setEstrategiaDesenvolvimento(dadosIA.estrategia_desenvolvimento || '');
        setEstrategiaFim(dadosIA.estrategia_fim || '');
        setMateriais(dadosIA.localizacao_materiais || '');
      }
    } catch (erro) { console.error(erro); } finally { setIsGerando(false); }
  };

  // Adiciona a aula na lista e limpa o form
  const handleAdicionarAulaLista = () => {
    if (!estrategiaDesenvolvimento) return alert("Gere o plano com a IA antes de adicionar à lista!");
    
    const novaAula: AulaPlanejada = {
      professor_id: 1, 
      quinzena,
      turma_id: Number(turmaId),
      disciplina_id: Number(disciplinaId),
      dia_semana: diaSemana,
      ordem_aula: `${aulasPlanejadas.length + 1}ª`, 
      objeto_conhecimento: objetosSelecionados.join(', '),
      estrategia_inicio: estrategiaInicio,
      estrategia_desenvolvimento: estrategiaDesenvolvimento,
      estrategia_fim: estrategiaFim,
      localizacao_materiais: materiais
    };

    setAulasPlanejadas([...aulasPlanejadas, novaAula]);
    
    // Limpa os dados variáveis
    setResumo(''); setObjetosSelecionados([]); setInputObjeto('');
    setEstrategiaInicio(''); setEstrategiaDesenvolvimento(''); setEstrategiaFim(''); setMateriais('');
  };

  // Envia o lote inteiro para o banco
  const handleSalvarTodas = async () => {
    try {
      const resposta = await fetch('http://localhost:3333/planos/lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aulasPlanejadas)
      });

      if (resposta.ok) {
        alert("🎉 Todas as aulas foram salvas com sucesso!");
        setAulasPlanejadas([]); 
      } else {
        alert("Erro ao salvar o lote de aulas.");
      }
    } catch (erro) {
      console.error("Erro:", erro);
      alert("Erro de conexão.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8 border-t-4 border-blue-600">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">✨ Assistente de Planejamento Contínuo</h3>
      
      {/* 1. DADOS FIXOS DO DIA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quinzena</label>
          <input type="text" value={quinzena} onChange={(e) => setQuinzena(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dia da Semana</label>
          <select value={diaSemana} onChange={(e) => setDiaSemana(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500">
            {['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'].map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Turma</label>
          <select value={turmaId} onChange={(e) => setTurmaId(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500">
             <option value="">Selecione...</option>
             {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina</label>
          <select value={disciplinaId} onChange={(e) => { setDisciplinaId(e.target.value); setObjetosSelecionados([]); }} className="w-full border border-gray-300 rounded px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500">
             <option value="">Selecione...</option>
             {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
        </div>
      </div>

      {/* 2. CAMPO DA BNCC (Devolvido ao layout) */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-1">Objetos de Conhecimento (BNCC)</label>
        <div className="flex gap-2 mb-2">
          <input list="lista-bncc" type="text" value={inputObjeto} onChange={(e) => setInputObjeto(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarObjeto(); } }} placeholder={!disciplinaId ? "Selecione a disciplina primeiro..." : "Selecione na lista ou digite..."} disabled={!disciplinaId} className="flex-1 border border-gray-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
          <button type="button" onClick={adicionarObjeto} disabled={!disciplinaId} className="bg-blue-100 text-blue-800 px-4 py-2 rounded hover:bg-blue-200 font-medium">Add</button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {objetosSelecionados.map((obj, index) => (
            <span key={index} className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-sm">{obj} <button type="button" onClick={() => removerObjeto(obj)} className="text-blue-200 hover:text-white font-bold">&times;</button></span>
          ))}
        </div>
        <datalist id="lista-bncc">{opcoesBnccFiltradas.map((opcao) => <option key={opcao.id} value={`${opcao.descricao} (${opcao.codigo})`} />)}</datalist>
      </div>

      {/* 3. RASCUNHO E IA */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
        <label className="block text-sm font-bold text-blue-900 mb-2">Rascunho da Próxima Aula ({aulasPlanejadas.length + 1}ª do dia)</label>
        <textarea rows={3} value={resumo} onChange={(e) => setResumo(e.target.value)} placeholder="Digite sua ideia principal para a IA estruturar..." className="w-full border border-blue-200 rounded px-3 py-2 resize-none mb-3 outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        <button type="button" onClick={handleGerarIA} disabled={isGerando} className="w-full bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 disabled:bg-blue-400 transition-colors">
          {isGerando ? '🧠 Inteligência Artificial Trabalhando...' : '✨ Estruturar Plano com IA'}
        </button>
      </div>

      {/* 4. REVISÃO RÁPIDA (visível após gerar) */}
      {estrategiaDesenvolvimento && (
        <div className="mb-6 p-4 border border-green-200 bg-green-50 rounded-lg fade-in">
           <h4 className="font-bold text-green-900 mb-3">Revisão Rápida</h4>
           <p className="text-sm text-gray-700 line-clamp-3 mb-4"><strong>Desenvolvimento:</strong> {estrategiaDesenvolvimento}</p>
           <button type="button" onClick={handleAdicionarAulaLista} className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 shadow-md transition-colors">
             ➕ Adicionar à Tabela do Dia
           </button>
        </div>
      )}

      {/* 5. PRÉVIA DO EXCEL (Lote) */}
      {aulasPlanejadas.length > 0 && (
        <div className="mt-8 border-t-2 pt-6 fade-in">
          <h4 className="text-xl font-bold text-gray-800 mb-4">📊 Prévia do Planejamento</h4>
          <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#002060] text-white">
                <tr>
                  <th className="px-4 py-3 border-r border-gray-400 text-center">Aula</th>
                  <th className="px-4 py-3 border-r border-gray-400">Estratégia (Resumo)</th>
                  <th className="px-4 py-3 text-center">Materiais</th>
                </tr>
              </thead>
              <tbody>
                {aulasPlanejadas.map((aula, index) => (
                  <tr key={index} className="bg-white border-b border-gray-200">
                    <td className="px-4 py-3 border-r text-center font-bold text-lg">{aula.ordem_aula}</td>
                    <td className="px-4 py-3 border-r">
                      <span className="text-xs text-gray-500 font-bold block mt-1">(INÍCIO)</span>
                      <p className="mb-2 line-clamp-1">{aula.estrategia_inicio}</p>
                      
                      <span className="text-xs text-gray-500 font-bold block">(DESENVOLVIMENTO)</span>
                      <p className="line-clamp-2">{aula.estrategia_desenvolvimento}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{aula.localizacao_materiais || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button type="button" onClick={handleSalvarTodas} className="w-full mt-6 bg-gray-800 text-white px-6 py-4 rounded-lg hover:bg-black font-bold text-lg shadow-lg transition-colors">
            💾 Salvar as {aulasPlanejadas.length} Aulas Definitivamente no Banco
          </button>
        </div>
      )}
    </div>
  );
}