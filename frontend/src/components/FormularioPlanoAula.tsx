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
  const [quinzena, setQuinzena] = useState('');
  const [turmaId, setTurmaId] = useState('');
  const [disciplinaId, setDisciplinaId] = useState('');
  const [estrategia, setEstrategia] = useState('');
  
  const [objetosSelecionados, setObjetosSelecionados] = useState<string[]>([]);
  const [inputObjeto, setInputObjeto] = useState('');

  const adicionarObjeto = () => {
    if (inputObjeto.trim() !== '' && !objetosSelecionados.includes(inputObjeto)) {
      setObjetosSelecionados([...objetosSelecionados, inputObjeto]);
      setInputObjeto('');
    }
  };

  const removerObjeto = (objeto: string) => {
    setObjetosSelecionados(objetosSelecionados.filter(obj => obj !== objeto));
  };

  const opcoesBnccFiltradas = bncc.filter(
    (objeto) => objeto.disciplina_id === Number(disciplinaId)
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    let objetosFinais = [...objetosSelecionados];
    if (inputObjeto.trim() !== '' && !objetosFinais.includes(inputObjeto)) {
      objetosFinais.push(inputObjeto.trim());
    }

    const pacoteDeDados = {
      quinzena,
      turma_id: Number(turmaId),
      disciplina_id: Number(disciplinaId),
      objeto_conhecimento: objetosFinais.join(', '),
      estrategia_desenvolvimento: estrategia
    };

    try {
      const resposta = await fetch('http://localhost:3333/planos-de-aula', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pacoteDeDados)
      });

      if (resposta.ok) {
        alert("🎉 Plano de Aula salvo com sucesso no Supabase!");
        setQuinzena('');
        setTurmaId('');
        setDisciplinaId('');
        setObjetosSelecionados([]);
        setInputObjeto('');
        setEstrategia('');
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
    <div className="bg-white p-6 rounded-lg shadow-md mt-8 border-t-4 border-green-500">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">📝 Novo Plano de Aula</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quinzena</label>
            <input 
              type="text" 
              value={quinzena}
              onChange={(e) => setQuinzena(e.target.value)}
              placeholder="Ex: 09/02 - 20/02" 
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-500" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Turma</label>
            <select 
              value={turmaId}
              onChange={(e) => setTurmaId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-500 bg-white"
            >
              <option value="">Selecione a turma...</option>
              {turmas.map(t => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina</label>
            <select 
              value={disciplinaId}
              onChange={(e) => {
                setDisciplinaId(e.target.value);
                setObjetosSelecionados([]);
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-500 bg-white"
            >
              <option value="">Selecione a disciplina...</option>
              {disciplinas.map(d => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Objetos de Conhecimento (BNCC)</label>
            <div className="flex gap-2 mb-2">
              <input 
                list="lista-bncc" 
                type="text" 
                value={inputObjeto} 
                onChange={(e) => setInputObjeto(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarObjeto(); } }} 
                placeholder={!disciplinaId ? "Selecione a disciplina primeiro..." : "Selecione na lista ou digite..."} 
                disabled={!disciplinaId} 
                className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed" 
              />
              <button 
                type="button" 
                onClick={adicionarObjeto} 
                disabled={!disciplinaId} 
                className="bg-green-100 text-green-800 px-4 py-2 rounded hover:bg-green-200 font-medium disabled:opacity-50"
              >
                Add
              </button>
            </div>
            
            {objetosSelecionados.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {objetosSelecionados.map((obj, index) => (
                  <span key={index} className="bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-sm">
                    {obj} <button type="button" onClick={() => removerObjeto(obj)} className="text-green-200 hover:text-white font-bold">&times;</button>
                  </span>
                ))}
              </div>
            )}
            <datalist id="lista-bncc">
              {opcoesBnccFiltradas.map((opcao) => (
                <option key={opcao.id} value={`${opcao.descricao} (${opcao.codigo})`} />
              ))}
            </datalist>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Estratégia de Desenvolvimento</label>
            <textarea 
              rows={3} 
              value={estrategia}
              onChange={(e) => setEstrategia(e.target.value)}
              placeholder="Descreva a atividade principal..." 
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-500 resize-none"
            ></textarea>
          </div>

        </div>

        <button type="submit" className="mt-6 w-full bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 font-bold text-lg">
          Salvar Plano de Aula
        </button>
      </form>
    </div>
  );
}