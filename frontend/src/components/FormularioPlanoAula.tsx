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
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState<Disciplina[]>([]);
  const [inputDisciplina, setInputDisciplina] = useState('');
  
  const [objetosSelecionados, setObjetosSelecionados] = useState<string[]>([]);
  const [inputObjeto, setInputObjeto] = useState('');

  const adicionarDisciplina = () => {
    const disciplinaEncontrada = disciplinas.find(d => d.nome.toLowerCase() === inputDisciplina.trim().toLowerCase());
    if (disciplinaEncontrada && !disciplinasSelecionadas.some(d => d.id === disciplinaEncontrada.id)) {
      setDisciplinasSelecionadas([...disciplinasSelecionadas, disciplinaEncontrada]);
      setInputDisciplina('');
    }
  };

  const removerDisciplina = (id: number) => {
    setDisciplinasSelecionadas(disciplinasSelecionadas.filter(d => d.id !== id));
  };

  const adicionarObjeto = () => {
    if (inputObjeto.trim() !== '' && !objetosSelecionados.includes(inputObjeto)) {
      setObjetosSelecionados([...objetosSelecionados, inputObjeto]);
      setInputObjeto('');
    }
  };

  const removerObjeto = (objeto: string) => {
    setObjetosSelecionados(objetosSelecionados.filter(obj => obj !== objeto));
  };

  // Procura nos objetos da BNCC apenas aqueles cujo disciplina_id exista na lista de matérias que o usuário selecionou
  const opcoesBnccFiltradas = bncc.filter(objeto => 
    disciplinasSelecionadas.some(disc => disc.id === objeto.disciplina_id)
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    alert("Plano estruturado com sucesso!");
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8 border-t-4 border-green-500">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">📝 Novo Plano de Aula</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quinzena</label>
            <input type="text" placeholder="Ex: 09/02 - 20/02" className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Turma</label>
            <select className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-500 bg-white">
              <option value="">Selecione a turma...</option>
              {turmas.map(t => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Disciplinas</label>
            <div className="flex gap-2 mb-2">
              <input list="lista-disciplinas" type="text" value={inputDisciplina} onChange={(e) => setInputDisciplina(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarDisciplina(); } }} placeholder="Selecione as matérias..." className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-500" />
              <button type="button" onClick={adicionarDisciplina} className="bg-green-100 text-green-800 px-4 py-2 rounded hover:bg-green-200 font-medium">Add</button>
            </div>
            <datalist id="lista-disciplinas">
              {disciplinas.map(d => <option key={d.id} value={d.nome} />)}
            </datalist>
            {disciplinasSelecionadas.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {disciplinasSelecionadas.map(d => (
                  <span key={d.id} className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-sm">
                    {d.nome} <button type="button" onClick={() => removerDisciplina(d.id)} className="text-blue-200 hover:text-white font-bold">&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Objetos de Conhecimento (BNCC)</label>
            <div className="flex gap-2 mb-2">
              <input list="lista-bncc" type="text" value={inputObjeto} onChange={(e) => setInputObjeto(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarObjeto(); } }} placeholder={disciplinasSelecionadas.length === 0 ? "Selecione uma matéria primeiro..." : "Selecione na lista ou digite..."} disabled={disciplinasSelecionadas.length === 0} className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed" />
              <button type="button" onClick={adicionarObjeto} disabled={disciplinasSelecionadas.length === 0} className="bg-green-100 text-green-800 px-4 py-2 rounded hover:bg-green-200 font-medium disabled:opacity-50">Add</button>
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
              {/* 3. Renderizamos a descrição e o código juntos para ficar bonito na tela */}
              {opcoesBnccFiltradas.map((opcao) => (
                <option key={opcao.id} value={`${opcao.descricao} (${opcao.codigo})`} />
              ))}
            </datalist>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Estratégia de Desenvolvimento</label>
            <textarea rows={3} placeholder="Descreva a atividade principal..." className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-500 resize-none"></textarea>
          </div>

        </div>

        <button type="submit" className="mt-6 w-full bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 font-bold text-lg">
          Salvar Plano de Aula
        </button>
      </form>
    </div>
  );
}