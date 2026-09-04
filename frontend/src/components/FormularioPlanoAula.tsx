import { useState, type FormEvent } from 'react';

interface Disciplina { id: number; nome: string; }
interface Turma { id: number; nome: string; }
interface ObjetoBncc { id: number; codigo: string; descricao: string; disciplina_id: number; }

interface FormularioProps {
  disciplinas: Disciplina[];
  turmas: Turma[];
  bncc: ObjetoBncc[];
}

export default function FormularioPlanoAula({ disciplinas, turmas, bncc }: FormularioProps) {
  // Estados Básicos
  const [quinzena, setQuinzena] = useState('');
  const [turmaId, setTurmaId] = useState('');
  const [disciplinaId, setDisciplinaId] = useState('');
  const [objetosSelecionados, setObjetosSelecionados] = useState<string[]>([]);
  const [inputObjeto, setInputObjeto] = useState('');

  // Estados da Inteligência Artificial
  const [resumo, setResumo] = useState('');
  const [isGerando, setIsGerando] = useState(false);
  
  // Estados do Plano Final (Para revisão do professor)
  const [estrategiaInicio, setEstrategiaInicio] = useState('');
  const [estrategiaDesenvolvimento, setEstrategiaDesenvolvimento] = useState('');
  const [estrategiaFim, setEstrategiaFim] = useState('');
  const [materiais, setMateriais] = useState('');

  const adicionarObjeto = () => {
    if (inputObjeto.trim() !== '' && !objetosSelecionados.includes(inputObjeto)) {
      setObjetosSelecionados([...objetosSelecionados, inputObjeto]);
      setInputObjeto('');
    }
  };

  const removerObjeto = (objeto: string) => {
    setObjetosSelecionados(objetosSelecionados.filter(obj => obj !== objeto));
  };

  const opcoesBnccFiltradas = bncc.filter((objeto) => objeto.disciplina_id === Number(disciplinaId));

  // ==========================================
  // FUNÇÃO MÁGICA: GERAR COM IA
  // ==========================================
  const handleGerarIA = async () => {
    if (!turmaId || !disciplinaId || !resumo) {
      alert("⚠️ Por favor, selecione a Turma, a Disciplina e escreva um rascunho antes de usar a IA.");
      return;
    }

    setIsGerando(true);

    try {
      // Pega os nomes exatos para mandar pro prompt da IA
      const nomeDisciplina = disciplinas.find(d => d.id === Number(disciplinaId))?.nome || '';
      const nomeTurma = turmas.find(t => t.id === Number(turmaId))?.nome || '';

      const resposta = await fetch('http://localhost:3333/ia/gerar-plano', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resumo: resumo, 
          disciplina: nomeDisciplina, 
          turma: nomeTurma 
        })
      });

      if (resposta.ok) {
        const dadosIA = await resposta.json();
        // Preenche os campos automaticamente com o que a IA devolveu
        setEstrategiaInicio(dadosIA.estrategia_inicio || '');
        setEstrategiaDesenvolvimento(dadosIA.estrategia_desenvolvimento || '');
        setEstrategiaFim(dadosIA.estrategia_fim || '');
        setMateriais(dadosIA.localizacao_materiais || '');
      } else {
        alert("Erro ao processar a geração com IA.");
      }
    } catch (erro) {
      console.error("Erro na API da IA:", erro);
      alert("Falha de conexão com o servidor da IA.");
    } finally {
      setIsGerando(false);
    }
  };

  // ==========================================
  // SALVAR NO BANCO DE DADOS
  // ==========================================
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    let objetosFinais = [...objetosSelecionados];
    if (inputObjeto.trim() !== '' && !objetosFinais.includes(inputObjeto)) {
      objetosFinais.push(inputObjeto.trim());
    }

    const pacoteDeDados = {
      professor_id: 1, // Fixado por enquanto até termos tela de Login
      quinzena,
      turma_id: Number(turmaId),
      disciplina_id: Number(disciplinaId),
      objeto_conhecimento: objetosFinais.join(', '),
      estrategia_inicio: estrategiaInicio,
      estrategia_desenvolvimento: estrategiaDesenvolvimento,
      estrategia_fim: estrategiaFim,
      localizacao_materiais: materiais
    };

    try {
      // Enviando para a rota principal de planos (que tem todos os campos)
      const resposta = await fetch('http://localhost:3333/planos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pacoteDeDados)
      });

      if (resposta.ok) {
        alert("🎉 Plano de Aula salvo com sucesso no banco de dados!");
        // Limpa tudo após salvar
        setQuinzena(''); setTurmaId(''); setDisciplinaId('');
        setObjetosSelecionados([]); setInputObjeto(''); setResumo('');
        setEstrategiaInicio(''); setEstrategiaDesenvolvimento(''); setEstrategiaFim(''); setMateriais('');
      } else {
        const erroServidor = await resposta.json();
        alert("Erro ao salvar: " + erroServidor.erro);
      }
    } catch (erro) {
      console.error("Erro na requisição:", erro);
      alert("Erro de conexão com o servidor.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8 border-t-4 border-blue-600">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">✨ Assistente de Planejamento</h3>
      
      <form onSubmit={handleSubmit}>
        {/* PARTE 1: DADOS BÁSICOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quinzena</label>
            <input type="text" value={quinzena} onChange={(e) => setQuinzena(e.target.value)} placeholder="Ex: 09/02 - 20/02" className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Turma</label>
            <select value={turmaId} onChange={(e) => setTurmaId(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="">Selecione...</option>
              {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina</label>
            <select value={disciplinaId} onChange={(e) => { setDisciplinaId(e.target.value); setObjetosSelecionados([]); }} className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="">Selecione...</option>
              {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>

          <div className="md:col-span-3">
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
        </div>

        {/* PARTE 2: RASCUNHO E IA */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
          <label className="block text-sm font-bold text-blue-900 mb-2">Seu Rascunho / Ideia da Aula</label>
          <textarea rows={3} value={resumo} onChange={(e) => setResumo(e.target.value)} placeholder="Ex: Vou levar moedas de plástico e panfletos de mercado. Quero que simulem compras em grupos..." className="w-full border border-blue-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-3"></textarea>
          
          <button type="button" onClick={handleGerarIA} disabled={isGerando} className="w-full bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 disabled:bg-blue-400">
            {isGerando ? '🧠 Inteligência Artificial Trabalhando...' : '✨ Estruturar Plano com IA'}
          </button>
        </div>

        {/* PARTE 3: REVISÃO DO PLANO GERADO */}
        {(estrategiaInicio || estrategiaDesenvolvimento) && (
          <div className="grid grid-cols-1 gap-4 mb-6 fade-in">
            <h4 className="font-bold text-gray-800 border-b pb-2">Revisão do Plano</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estratégia: INÍCIO</label>
              <textarea rows={2} value={estrategiaInicio} onChange={(e) => setEstrategiaInicio(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estratégia: DESENVOLVIMENTO</label>
              <textarea rows={4} value={estrategiaDesenvolvimento} onChange={(e) => setEstrategiaDesenvolvimento(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estratégia: FIM DA AULA</label>
              <textarea rows={2} value={estrategiaFim} onChange={(e) => setEstrategiaFim(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Materiais Necessários</label>
              <input type="text" value={materiais} onChange={(e) => setMateriais(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500" />
            </div>
          </div>
        )}

        {/* BOTÃO FINAL DE SALVAR */}
        <button type="submit" className="w-full bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 font-bold text-lg mt-2 shadow-lg transition-colors">
          💾 Salvar Plano Definitivo
        </button>
      </form>
    </div>
  );
}