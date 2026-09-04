import { useState, useEffect } from 'react';

interface Disciplina { id: number; nome: string; }
interface Turma { id: number; nome: string; }
interface ObjetoBncc { id: number; codigo: string; descricao: string; disciplina_id: number; }
interface FormularioProps { disciplinas: Disciplina[]; turmas: Turma[]; bncc: ObjetoBncc[]; }

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

export default function FormularioPlanoAula({ disciplinas, turmas, bncc }: FormularioProps) {
  const [abaAtiva, setAbaAtiva] = useState<'planejar' | 'salvas'>('planejar');

  // Estados de Planejamento
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [turmaId, setTurmaId] = useState('');
  const [disciplinaId, setDisciplinaId] = useState('');
  
  const [objetosSelecionados, setObjetosSelecionados] = useState<string[]>([]);
  const [inputObjeto, setInputObjeto] = useState('');
  const [resumo, setResumo] = useState('');
  
  // Textos editáveis da IA
  const [estrategiaInicio, setEstrategiaInicio] = useState('');
  const [estrategiaDesenvolvimento, setEstrategiaDesenvolvimento] = useState('');
  const [estrategiaFim, setEstrategiaFim] = useState('');
  const [materiais, setMateriais] = useState('');
  
  const [isGerando, setIsGerando] = useState(false);
  const [aulasPlanejadas, setAulasPlanejadas] = useState<AulaPlanejada[]>([]);

  // Estados de Aulas Salvas
  const [aulasSalvasNoBanco, setAulasSalvasNoBanco] = useState<AulaPlanejada[]>([]);
  const [selecionadosParaExportar, setSelecionadosParaExportar] = useState<number[]>([]);

  const opcoesBnccFiltradas = bncc.filter((objeto) => objeto.disciplina_id === Number(disciplinaId));

  const adicionarObjeto = () => {
    if (inputObjeto.trim() !== '' && !objetosSelecionados.includes(inputObjeto)) {
      setObjetosSelecionados([...objetosSelecionados, inputObjeto]);
      setInputObjeto('');
    }
  };
  const removerObjeto = (objeto: string) => setObjetosSelecionados(objetosSelecionados.filter(obj => obj !== objeto));

  // Cálculo automático da semana com base na data escolhida
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
    if (!turmaId || !disciplinaId || !resumo) return alert("Selecione Turma, Disciplina e escreva o rascunho.");
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

  const handleAdicionarAulaLista = () => {
    if (!dataSelecionada) return alert("Por favor, escolha a data da aula no calendário!");

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
    setResumo(''); setObjetosSelecionados([]); setInputObjeto('');
    setEstrategiaInicio(''); setEstrategiaDesenvolvimento(''); setEstrategiaFim(''); setMateriais('');
  };

  const handleSalvarTodas = async () => {
    try {
      const resposta = await fetch('http://localhost:3333/planos/lote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aulasPlanejadas)
      });
      if (resposta.ok) {
        alert("🎉 Aulas salvas com sucesso no banco de dados!");
        setAulasPlanejadas([]); 
        carregarAulasDoBanco();
      } else {
        const errData = await resposta.json();
        alert("Erro ao salvar: " + errData.erro);
      }
    } catch (erro) { console.error(erro); alert("Erro de conexão ao salvar."); }
  };

  const carregarAulasDoBanco = async () => {
    try {
      const resposta = await fetch('http://localhost:3333/planos');
      if (resposta.ok) {
        const dados = await resposta.json();
        setAulasSalvasNoBanco(dados);
      }
    } catch (erro) { console.error("Erro ao carregar aulas", erro); }
  };

  useEffect(() => {
    if (abaAtiva === 'salvas') carregarAulasDoBanco();
  }, [abaAtiva]);

  const toggleSelecaoExportacao = (id: number) => {
    if (selecionadosParaExportar.includes(id)) {
      setSelecionadosParaExportar(selecionadosParaExportar.filter(item => item !== id));
    } else {
      setSelecionadosParaExportar([...selecionadosParaExportar, id]);
    }
  };

  const handleExportarSelecionadas = () => {
    if (selecionadosParaExportar.length === 0) return alert("Selecione ao menos uma aula para exportar.");
    const idsString = selecionadosParaExportar.join(',');
    window.location.href = `http://localhost:3333/planos/exportar-lote?ids=${idsString}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md mt-8 border-t-4 border-blue-600 overflow-hidden">
      
      <div className="flex border-b bg-gray-50">
        <button onClick={() => setAbaAtiva('planejar')} className={`flex-1 py-4 font-bold text-lg transition-colors ${abaAtiva === 'planejar' ? 'bg-white text-blue-700 border-b-2 border-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}>
          📅 Planejar por Semana
        </button>
        <button onClick={() => setAbaAtiva('salvas')} className={`flex-1 py-4 font-bold text-lg transition-colors ${abaAtiva === 'salvas' ? 'bg-white text-blue-700 border-b-2 border-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}>
          📂 Aulas Salvas (Exportar)
        </button>
      </div>

      <div className="p-6">
        
        {abaAtiva === 'planejar' && (
          <div className="fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">📅 Data da Aula</label>
                <input 
                  type="date" 
                  value={dataSelecionada} 
                  onChange={e => setDataSelecionada(e.target.value)} 
                  className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium" 
                />
                {dataSelecionada && (
                  <span className="text-xs text-blue-600 font-bold mt-1 block">
                    📌 {calcularSemana(dataSelecionada)}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Turma</label>
                <select value={turmaId} onChange={e => setTurmaId(e.target.value)} className="w-full border rounded px-3 py-2 outline-none bg-white">
                  <option value="">Selecione...</option>
                  {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Disciplina</label>
                <select value={disciplinaId} onChange={e => { setDisciplinaId(e.target.value); setObjetosSelecionados([]); }} className="w-full border rounded px-3 py-2 outline-none bg-white">
                  <option value="">Selecione...</option>
                  {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Objetos de Conhecimento (BNCC)</label>
              <div className="flex gap-2 mb-2">
                <input list="lista-bncc" value={inputObjeto} onChange={e => setInputObjeto(e.target.value)} disabled={!disciplinaId} placeholder="Digite ou selecione da BNCC..." className="flex-1 border rounded px-3 py-2 outline-none disabled:bg-gray-100" />
                <button type="button" onClick={adicionarObjeto} disabled={!disciplinaId} className="bg-blue-100 text-blue-800 px-4 py-2 rounded font-medium">Add</button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {objetosSelecionados.map((obj, i) => (
                  <span key={i} className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    {obj} <button type="button" onClick={() => removerObjeto(obj)}>&times;</button>
                  </span>
                ))}
              </div>
              <datalist id="lista-bncc">{opcoesBnccFiltradas.map(o => <option key={o.id} value={`${o.descricao} (${o.codigo})`} />)}</datalist>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
              <label className="block text-sm font-bold text-blue-900 mb-2">Rascunho da Aula</label>
              <textarea rows={3} value={resumo} onChange={e => setResumo(e.target.value)} placeholder="Ex: Vou usar material dourado em grupos..." className="w-full border border-blue-200 rounded px-3 py-2 resize-none mb-3 outline-none"></textarea>
              <button type="button" onClick={handleGerarIA} disabled={isGerando} className="w-full bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 disabled:bg-blue-400">
                {isGerando ? '🧠 Processando...' : '✨ Estruturar com IA'}
              </button>
            </div>

            {estrategiaDesenvolvimento && (
              <div className="mb-6 p-4 border border-green-200 bg-green-50 rounded-lg fade-in">
                 <h4 className="font-bold text-green-900 mb-4 border-b border-green-200 pb-2">✏️ Revisão e Edição</h4>
                 <div className="space-y-4 mb-4">
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">(INÍCIO)</label><textarea rows={2} value={estrategiaInicio} onChange={e => setEstrategiaInicio(e.target.value)} className="w-full border rounded px-3 py-2 outline-none"></textarea></div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">(DESENVOLVIMENTO)</label><textarea rows={4} value={estrategiaDesenvolvimento} onChange={e => setEstrategiaDesenvolvimento(e.target.value)} className="w-full border rounded px-3 py-2 outline-none"></textarea></div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">(FIM DA AULA)</label><textarea rows={2} value={estrategiaFim} onChange={e => setEstrategiaFim(e.target.value)} className="w-full border rounded px-3 py-2 outline-none"></textarea></div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Materiais</label><input type="text" value={materiais} onChange={e => setMateriais(e.target.value)} className="w-full border rounded px-3 py-2 outline-none" /></div>
                 </div>
                 <button type="button" onClick={handleAdicionarAulaLista} className="w-full bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700 shadow-md text-lg">
                   ➕ Adicionar à Lista de Envio
                 </button>
              </div>
            )}

            {aulasPlanejadas.length > 0 && (
              <div className="mt-8 border-t-2 pt-6 fade-in">
                <h4 className="text-xl font-bold text-gray-800 mb-4">📊 Aulas Prontas para o Banco ({aulasPlanejadas.length})</h4>
                <div className="overflow-x-auto border border-gray-300 rounded-lg mb-6">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#002060] text-white">
                      <tr>
                        <th className="px-4 py-3 border-r text-center">Data / Semana</th>
                        <th className="px-4 py-3">Estratégia Principal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aulasPlanejadas.map((aula, i) => (
                        <tr key={i} className="border-b">
                          <td className="px-4 py-3 border-r text-center font-bold">
                            {new Date(aula.data_aula + 'T00:00:00').toLocaleDateString('pt-BR')}<br/>
                            <span className="text-xs font-normal text-gray-500">{aula.semana_referencia}</span>
                          </td>
                          <td className="px-4 py-3 line-clamp-2">{aula.estrategia_desenvolvimento}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button type="button" onClick={handleSalvarTodas} className="w-full bg-gray-800 text-white px-6 py-4 rounded-lg hover:bg-black font-bold text-lg shadow-lg">
                  💾 Salvar Definitivamente no Banco
                </button>
              </div>
            )}
          </div>
        )}

        {abaAtiva === 'salvas' && (
          <div className="fade-in">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-bold text-gray-800">📂 Aulas cadastradas</h4>
              <button onClick={handleExportarSelecionadas} disabled={selecionadosParaExportar.length === 0} className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 disabled:bg-gray-400 shadow-md">
                📄 Gerar Excel com as {selecionadosParaExportar.length} marcadas
              </button>
            </div>
            
            <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700 border-b border-gray-300">
                  <tr>
                    <th className="px-4 py-3 text-center w-16">Exportar</th>
                    <th className="px-4 py-3">Data / Semana</th>
                    <th className="px-4 py-3">Turma / Disciplina</th>
                    <th className="px-4 py-3">Resumo (Desenvolvimento)</th>
                  </tr>
                </thead>
                <tbody>
                  {aulasSalvasNoBanco.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-6 text-gray-500">Nenhuma aula salva no banco ainda.</td></tr>
                  ) : (
                    aulasSalvasNoBanco.map((aula) => (
                      <tr key={aula.id} className="bg-white border-b border-gray-200 hover:bg-blue-50 cursor-pointer" onClick={() => aula.id && toggleSelecaoExportacao(aula.id)}>
                        <td className="px-4 py-3 text-center">
                          <input type="checkbox" checked={aula.id ? selecionadosParaExportar.includes(aula.id) : false} onChange={() => {}} className="w-5 h-5 cursor-pointer accent-blue-600" />
                        </td>
                        <td className="px-4 py-3 font-bold">
                           {aula.data_aula ? new Date(aula.data_aula + 'T00:00:00').toLocaleDateString('pt-BR') : '-'} <br/>
                           <span className="text-xs font-normal text-blue-600">{aula.semana_referencia}</span>
                        </td>
                        <td className="px-4 py-3">Turma ID: {aula.turma_id} | Disc ID: {aula.disciplina_id}</td>
                        <td className="px-4 py-3">
                          <p className="line-clamp-2 text-gray-700">{aula.estrategia_desenvolvimento}</p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}