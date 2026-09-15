import { 
  BookOpen, 
  Sparkles, 
  Layers, 
  User, 
  LayoutDashboard,
  X
} from 'lucide-react';

export type AbaNavegacao = 'inicio' | 'criar' | 'aulas' | 'perfil';

interface SidebarProps {
  abaAtiva: AbaNavegacao;
  aoMudarAba: (aba: AbaNavegacao) => void;
  abertaNoMobile: boolean;
  fecharMobile: () => void;
}

export default function Sidebar({ abaAtiva, aoMudarAba, abertaNoMobile, fecharMobile }: SidebarProps) {
  const itensMenu = [
    { id: 'inicio' as AbaNavegacao, label: 'Página Inicial', icone: LayoutDashboard },
    { id: 'criar' as AbaNavegacao, label: 'Criar Planejamento', icone: Sparkles },
    { id: 'aulas' as AbaNavegacao, label: 'Aulas Planejadas', icone: Layers },
    { id: 'perfil' as AbaNavegacao, label: 'Editar Perfil', icone: User },
  ];

  const handleNavegar = (id: AbaNavegacao) => {
    aoMudarAba(id);
    fecharMobile();
  };

  return (
    <>
      {/* Overlay escuro no celular quando a sidebar estiver aberta */}
      {abertaNoMobile && (
        <div 
          onClick={fecharMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 border-r border-slate-200/80 bg-white md:bg-white/80 md:backdrop-blur-xl p-6 flex flex-col justify-between shrink-0 transition-transform duration-300 ease-in-out ${
          abertaNoMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo + Botão Fechar no Mobile */}
          <div className="flex items-center justify-between px-2 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-slate-900">
                  Planej<span className="text-blue-600">Easy</span>
                </span>
                <span className="block text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                  Planejamento Pedagógico
                </span>
              </div>
            </div>

            <button 
              onClick={fecharMobile}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Links de Navegação */}
          <div>
            <span className="px-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              Menu
            </span>
            
            <nav className="mt-3 space-y-1.5">
              {itensMenu.map((item) => {
                const Icone = item.icone;
                const estaAtivo = abaAtiva === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavegar(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      estaAtivo
                        ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/10'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                    }`}
                  >
                    <Icone className={`w-4 h-4 transition-colors ${estaAtivo ? 'text-blue-600' : 'text-slate-400'}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 px-2 text-xs text-slate-400">
          PlanejEasy v1.0
        </div>
      </aside>
    </>
  );
}