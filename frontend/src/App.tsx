import { useEffect, useState } from 'react';

interface Disciplina {
  id: number;
  nome: string;
}

export default function App() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);

  useEffect(() => {
    fetch('http://localhost:3333/disciplinas')
      .then((resposta) => resposta.json())
      .then((dados) => setDisciplinas(dados))
      .catch((erro) => console.error("Erro ao buscar disciplinas:", erro));
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-10">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-blue-700 mb-6 border-b pb-4">
          📚 PlanejEasy
        </h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Disciplinas Cadastradas no Banco:
        </h2>
        <ul className="space-y-2">
          {disciplinas.length > 0 ? (
            disciplinas.map((disciplina) => (
              <li key={disciplina.id} className="bg-blue-50 p-3 rounded border border-blue-100 text-blue-900 font-medium">
                {disciplina.nome}
              </li>
            ))
          ) : (
            <p className="text-gray-500 italic">Carregando disciplinas...</p>
          )}
        </ul>
      </div>
    </div>
  );
}