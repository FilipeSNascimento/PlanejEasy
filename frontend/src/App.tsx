import { useEffect, useState } from 'react';
import { Menu, Loader2 } from 'lucide-react';
import { type Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { apiFetch } from './lib/api';
import Auth from './components/Auth';
import Sidebar, { type AbaNavegacao } from './components/Sidebar';
import CriarPlanejamento from './components/CriarPlanejamento';
import PerfilProfessor from './components/PerfilProfessor';
import AulasPlanejadas from './components/AulasPlanejadas';

interface Disciplina { id: number; nome: string; }
interface Turma { id: number; nome: string; }
interface ObjetoBncc { id: number; codigo: string; descricao: string; disciplina_id: number; }

export default function App() {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [checandoSessao, setChecandoSessao] = useState(true);

  const [abaAtiva, setAbaAtiva] = useState<AbaNavegacao>('criar');
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [bncc, setBncc] = useState<ObjetoBncc[]>([]);

  // 1. Gerencia estado de login/sessão do Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session);
      setChecandoSessao(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Busca dados auxiliares autenticados via apiFetch
  useEffect(() => {
    if (!sessao) return;

    async function carregarDados() {
      try {
        const [resDisc, resTurm, resBncc] = await Promise.all([
          apiFetch('/disciplinas'),
          apiFetch('/turmas'),
          apiFetch('/bncc')
        ]);

        if (resDisc.ok) {
          const dadosDisc = await resDisc.json();
          setDisciplinas(Array.isArray(dadosDisc) ? dadosDisc : []);
        }

        if (resTurm.ok) {
          const dadosTurm = await resTurm.json();
          setTurmas(Array.isArray(dadosTurm) ? dadosTurm : []);
        }

        if (resBncc.ok) {
          const dadosBncc = await resBncc.json();
          setBncc(Array.isArray(dadosBncc) ? dadosBncc : []);
        }
      } catch (erro) {
        console.error("Erro ao carregar dados auxiliares:", erro);
      }
    }

    carregarDados();
  }, [sessao]);

  // Loading suave enquanto valida o token inicial
  if (checandoSessao) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3 text-slate-500 font-medium">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-sm">Iniciando sessão segura...</span>
      </div>
    );
  }

  // Se não estiver logado, exibe a tela de login
  if (!sessao) {
    return <Auth onSuccess={() => {}} />;
  }

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

      {/* Barra Lateral com suporte mobile e logout */}
      <Sidebar 
        abaAtiva={abaAtiva} 
        aoMudarAba={setAbaAtiva}
        abertaNoMobile={menuMobileAberto}
        fecharMobile={() => setMenuMobileAberto(false)}
        aoSair={() => supabase.auth.signOut()}
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