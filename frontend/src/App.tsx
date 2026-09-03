import { useEffect, useState, type FormEvent } from 'react';

interface Disciplina {
  id: number;
  nome: string;
}

export default function App() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);

  const [novaDisciplina, setNovaDisciplina] = useState(''); 

  useEffect(() => {
    fetch('http://localhost:3333/disciplinas')
      .then((resposta) => resposta.json())
      .then((dados) => setDisciplinas(dados))
      .catch((erro) => console.error("Erro ao buscar disciplinas:", erro));
  }, []);

  const handleCadastrar = async (e: FormEvent) => {
    e.preventDefault(); 

    if (!novaDisciplina.trim()) return;

    try {
      const resposta = await fetch('http://localhost:3333/disciplinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novaDisciplina })
      });

      if (resposta.ok) {
        const dadosCadastrados = await resposta.json();
        
        setDisciplinas([...disciplinas, dadosCadastrados[0]]);
        setNovaDisciplina('');
      }
    } catch (erro) {
      console.error("Erro ao cadastrar:", erro);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-10">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        
        <h1 className="text-3xl font-bold text-blue-700 mb-6 border-b pb-4">
          📚 PlanejEasy
        </h1>

        {/* FORMULÁRIO DE ENVIO*/}
        <form onSubmit={handleCadastrar} className="mb-8 flex gap-2">
          <input
            type="text"
            placeholder="Nome da nova disciplina (ex: História)..."
            value={novaDisciplina}
            onChange={(e) => setNovaDisciplina(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium transition-colors"
          >
            Cadastrar
          </button>
        </form>
        
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Disciplinas Cadastradas no Banco:
        </h2>

        <ul className="space-y-2">
          {disciplinas.length > 0 ? (
            disciplinas.map((disciplina) => (
              <li 
                key={disciplina.id} 
                className="bg-blue-50 p-3 rounded border border-blue-100 text-blue-900 font-medium flex justify-between items-center"
              >
                {disciplina.nome}
              </li>
            ))
          ) : (
            <p className="text-gray-500 italic">Nenhuma disciplina carregada...</p>
          )}
        </ul>

      </div>
    </div>
  );
}