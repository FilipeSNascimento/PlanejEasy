import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar, { type AbaNavegacao } from './components/Sidebar';
import CriarPlanejamento from './components/CriarPlanejamento';
import PerfilProfessor from './components/PerfilProfessor';
import AulasPlanejadas from './components/AulasPlanejadas';

interface Disciplina { id: number; nome: string; }
interface Turma { id: number; nome: string; }
interface ObjetoBncc { id: number; codigo: string; descricao: string; disciplina_id: number; }

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState<AbaNavegacao>('criar');
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [bncc, setBncc] = useState<ObjetoBncc[]>([]);

  useEffect(() => {
    fetch('http://localhost:3333/disciplinas')
      .then(res => res.json())
      .then(dados => setDisciplinas(dados))
      .catch(erro => console.error("Erro em disciplinas:", erro));

    fetch('http://localhost:3333/turmas')
      .then(res => res.json())
      .then(dados => setTurmas(dados))
      .catch(erro => console.error("Erro em turmas:", erro));

    fetch('http://localhost:3333/bncc')
      .then(res => res.json())
      .then(dados => setBncc(dados))
      .catch(erro => console.error("Erro na BNCC:", erro));
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50/50 font-sans text-slate-800 antialiased">
      {/* Barra de Topo exclusiva para celular */}
      <header className="md:hidden flex items-center justify-between px-5 py-3.5 bg-white border-b border-slate-200 sticky top-0 z-30">
        <span className="font-black text-slate-900 text-lg">
          Planej<span className="text-blue-600">Easy</span>
        </span>
        <button 
          onClick={() => setMenuMobileAberto(true)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Abrir Menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Barra Lateral com suporte mobile */}
      <Sidebar 
        abaAtiva={abaAtiva} 
        aoMudarAba={setAbaAtiva}
        abertaNoMobile={menuMobileAberto}
        fecharMobile={() => setMenuMobileAberto(false)}
      />

      {/* Área de Conteúdo */}
      <main className="flex-1 p-4 sm:p-6 lg:p-12 overflow-y-auto w-full">
        {abaAtiva === 'criar' && (
          <CriarPlanejamento disciplinas={disciplinas} turmas={turmas} bncc={bncc} />
        )}

        {abaAtiva === 'perfil' && (
          <div className="max-w-4xl mx-auto">
            <PerfilProfessor />
          </div>
        )}

       {abaAtiva === 'aulas' && (
            <AulasPlanejadas />
        )}

        {abaAtiva === 'inicio' && (
          <div className="max-w-6xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Bem-vindo ao PlanejEasy</h2>
            <p className="text-sm text-slate-500">Selecione "Criar Planejamento" no menu para começar.</p>
          </div>
        )}
      </main>
    </div>
  );
}