import { useEffect, useState, type FormEvent } from 'react';
import FormularioPlanoAula from './components/FormularioPlanoAula';

interface Disciplina { id: number; nome: string; }
interface Turma { id: number; nome: string; }

interface ObjetoBncc { id: number; codigo: string; descricao: string; disciplina_id: number; }

export default function App() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);

  const [bncc, setBncc] = useState<ObjetoBncc[]>([]);
  const [novaDisciplina, setNovaDisciplina] = useState(''); 

  useEffect(() => {
    fetch('http://localhost:3333/disciplinas')
      .then(res => res.json())
      .then(dados => setDisciplinas(dados))
      .catch(erro => console.error("Erro em disciplinas:", erro));

    fetch('http://localhost:3333/turmas')
      .then(res => res.json())
      .then(dados => setTurmas(dados))
      .catch(erro => console.error("Erro em turmas:", erro));

    // 3. Busca a BNCC na API
    fetch('http://localhost:3333/bncc')
      .then(res => res.json())
      .then(dados => setBncc(dados))
      .catch(erro => console.error("Erro na BNCC:", erro));
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

        <form onSubmit={handleCadastrar} className="mb-8 flex gap-2">
          <input
            type="text"
            placeholder="Nome da nova disciplina (ex: História)..."
            value={novaDisciplina}
            onChange={(e) => setNovaDisciplina(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
          />
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium">
            Cadastrar
          </button>
        </form>
        
        <FormularioPlanoAula disciplinas={disciplinas} turmas={turmas} bncc={bncc} />

      </div>
    </div>
  );
}