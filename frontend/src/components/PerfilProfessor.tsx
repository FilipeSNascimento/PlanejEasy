import { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  GraduationCap, 
  BookOpen, 
  Plus, 
  X, 
  Save, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';

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
    id: 1, 
    nome: '', 
    email: '', 
    turmas: [], 
    disciplinasDisponiveis: []
  });
  
  const [novaTurmaNome, setNovaTurmaNome] = useState('');
  const [novaDisciplinaNome, setNovaDisciplinaNome] = useState('');
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
      } catch (erro) { 
        console.error("Erro ao carregar:", erro); 
      } finally { 
        setLoading(false); 
      }
    }
    carregarPerfil();
  }, []);

  const adicionarTurma = () => {
    if (!novaTurmaNome.trim()) return;
    setPerfil({ ...perfil, turmas: [...perfil.turmas, { nome: novaTurmaNome }] });
    setNovaTurmaNome('');
  };

  const removerTurma = (index: number) => {
    const novasTurmas = perfil.turmas.filter((_, i) => i !== index);
    setPerfil({ ...perfil, turmas: novasTurmas });
  };

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
        setMensagemSucesso('Perfil atualizado com sucesso! Sincronizando sistema...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        alert('Erro ao atualizar perfil. Certifique-se de não apagar turmas ou disciplinas já vinculadas a aulas salvas.');
      }
    } catch (erro) {
      console.error("Erro:", erro);
      alert('Erro de conexão com o servidor.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 font-medium">
        <Sparkles className="w-5 h-5 animate-spin mr-2 text-blue-600" />
        Carregando informações do perfil...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-blue-900 to-blue-600">
            Editar Perfil
          </h1>
          <p className="text-sm text-slate-500">
            Gerencie seus dados pessoais, suas turmas ativas e os componentes curriculares que você leciona.
          </p>
        </div>
      </div>

      {mensagemSucesso && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-semibold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {mensagemSucesso}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Card: Dados Cadastrais */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Identificação do Docente
            </h2>
            <p className="text-xs text-slate-400">Informações de contato e exibição no sistema.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Nome Completo
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={perfil.nome} 
                  onChange={e => setPerfil({ ...perfil, nome: e.target.value })} 
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                  required 
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                E-mail Institucional / Profissional
              </label>
              <div className="relative">
                <input 
                  type="email" 
                  value={perfil.email} 
                  onChange={e => setPerfil({ ...perfil, email: e.target.value })} 
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                  required 
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Card: Turmas e Disciplinas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gestão de Turmas */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  Minhas Turmas
                </h3>
                <p className="text-xs text-slate-400">Turmas atribuídas às suas aulas semanais.</p>
              </div>

              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={novaTurmaNome} 
                  onChange={e => setNovaTurmaNome(e.target.value)} 
                  placeholder="Ex: 9º Ano A" 
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button 
                  type="button" 
                  onClick={adicionarTurma} 
                  className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all inline-flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[60px]">
                {perfil.turmas.map((turma, index) => (
                  <span key={index} className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm">
                    {turma.nome}
                    <button 
                      type="button" 
                      onClick={() => removerTurma(index)} 
                      className="text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Gestão de Disciplinas */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Minhas Disciplinas
                </h3>
                <p className="text-xs text-slate-400">Componentes curriculares cadastrados.</p>
              </div>

              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={novaDisciplinaNome} 
                  onChange={e => setNovaDisciplinaNome(e.target.value)} 
                  placeholder="Ex: Matemática" 
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button 
                  type="button" 
                  onClick={adicionarDisciplina} 
                  className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all inline-flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[60px]">
                {perfil.disciplinasDisponiveis.map((disc, index) => (
                  <span key={index} className="bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm">
                    {disc.nome}
                    <button 
                      type="button" 
                      onClick={() => removerDisciplina(index)} 
                      className="text-blue-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Botão de Salvar Alterações */}
        <div className="flex justify-center pt-2">
          <button 
            type="submit" 
            disabled={salvando} 
            className="w-full max-w-sm flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all duration-200"
          >
            <Save className="w-4 h-4" />
            {salvando ? 'Sincronizando Dados...' : 'Salvar Alterações do Perfil'}
          </button>
        </div>
      </form>
    </div>
  );
}