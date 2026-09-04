import { useState, useEffect } from 'react';

interface Turma { id?: number; nome: string; }
interface Disciplina { id?: number; nome: string; }

interface ProfessorPerfil {
  id: number;
  nome: string;
  email: string;
  turmas: Turma[];
  disciplinasDisponiveis: Disciplina[];
}

export default function PerfilProfessor() {
  const [perfil, setPerfil] = useState<ProfessorPerfil>({
    id: 1, nome: '', email: '', turmas: [], disciplinasDisponiveis: []
  });
  
  const [novaTurmaNome, setNovaTurmaNome] = useState('');
  const [novaDisciplinaNome, setNovaDisciplinaNome] = useState(''); // Estado para nova disciplina
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  useEffect(() => {
    async function carregarPerfil() {
      try {
        const resposta = await fetch('http://localhost:3333/professor/1');
        if (resposta.ok) {
          const dados = await resposta.json();
          setPerfil(dados);
        }
      } catch (erro) { console.error("Erro ao carregar:", erro); } 
      finally { setLoading(false); }
    }
    carregarPerfil();
  }, []);

  // --- Funções de Turmas ---
  const adicionarTurma = () => {
    if (!novaTurmaNome.trim()) return;
    setPerfil({ ...perfil, turmas: [...perfil.turmas, { nome: novaTurmaNome }] });
    setNovaTurmaNome('');
  };
  const removerTurma = (index: number) => {
    const novasTurmas = perfil.turmas.filter((_, i) => i !== index);
    setPerfil({ ...perfil, turmas: novasTurmas });
  };

  // --- Funções de Disciplinas ---
  const adicionarDisciplina = () => {
    if (!novaDisciplinaNome.trim()) return;
    setPerfil({ ...perfil, disciplinasDisponiveis: [...perfil.disciplinasDisponiveis, { nome: novaDisciplinaNome }] });
    setNovaDisciplinaNome('');
  };
  const removerDisciplina = (index: number) => {
    const novasDisc = perfil.disciplinasDisponiveis.filter((_, i) => i !== index);
    setPerfil({ ...perfil, disciplinasDisponiveis: novasDisc });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setMensagemSucesso('');

    try {
      const resposta = await fetch('http://localhost:3333/professor/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(perfil)
      });

      if (resposta.ok) {
        setMensagemSucesso('✨ Atualizado com sucesso! Recarregando dados...');
        // Recarrega a página após 1.5 segundos para o formulário de planejamento puxar os novos dados
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        alert('Erro ao atualizar perfil. Certifique-se de não estar apagando turmas ou disciplinas que já possuem aulas cadastradas.');
      }
    } catch (erro) {
      console.error("Erro:", erro);
      alert('Erro de conexão com o servidor.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-600">Carregando perfil...</div>;

  return (
    <div className="bg-white p-8 rounded-lg shadow-md mt-8 border-t-4 border-blue-600 max-w-3xl mx-auto">
      <h3 className="text-2xl font-bold text-gray-800 mb-2">👤 Gerenciamento de Perfil e Classes</h3>
      <p className="text-sm text-gray-500 mb-6">Atualize suas informações, turmas e disciplinas. Ao salvar, o sistema será atualizado automaticamente.</p>

      {mensagemSucesso && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg font-medium text-center">
          {mensagemSucesso}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Dados Básicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
            <input type="text" value={perfil.nome} onChange={e => setPerfil({ ...perfil, nome: e.target.value })} className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">E-mail Profissional</label>
            <input type="email" value={perfil.email} onChange={e => setPerfil({ ...perfil, email: e.target.value })} className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
        </div>

        {/* Gestão de Turmas */}
        <div className="border-t pt-4">
          <label className="block text-sm font-bold text-gray-700 mb-2">Turmas Lecionadas</label>
          <div className="flex gap-2 mb-3">
            <input type="text" value={novaTurmaNome} onChange={e => setNovaTurmaNome(e.target.value)} placeholder="Nova turma (Ex: 9º Ano A)" className="flex-1 border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="button" onClick={adicionarTurma} className="bg-blue-100 text-blue-800 px-4 py-2 rounded font-medium hover:bg-blue-200">Add Turma</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {perfil.turmas.map((turma, index) => (
              <span key={index} className="bg-gray-100 border border-gray-300 text-gray-800 px-3 py-1 rounded-md text-sm flex items-center gap-2">
                {turma.nome}
                <button type="button" onClick={() => removerTurma(index)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
              </span>
            ))}
          </div>
        </div>

        {/* Gestão de Disciplinas */}
        <div className="border-t pt-4">
          <label className="block text-sm font-bold text-gray-700 mb-2">Disciplinas Ministradas</label>
          <div className="flex gap-2 mb-3">
            <input type="text" value={novaDisciplinaNome} onChange={e => setNovaDisciplinaNome(e.target.value)} placeholder="Nova disciplina (Ex: Matemática)" className="flex-1 border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="button" onClick={adicionarDisciplina} className="bg-blue-100 text-blue-800 px-4 py-2 rounded font-medium hover:bg-blue-200">Add Disciplina</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {perfil.disciplinasDisponiveis.map((disc, index) => (
              <span key={index} className="bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1 rounded-md text-sm flex items-center gap-2 font-medium">
                {disc.nome}
                <button type="button" onClick={() => removerDisciplina(index)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
              </span>
            ))}
          </div>
        </div>

        <button type="submit" disabled={salvando} className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-blue-400 shadow-md transition-colors text-lg">
          {salvando ? 'Salvando...' : '💾 Salvar e Atualizar Sistema'}
        </button>
      </form>
    </div>
  );
}