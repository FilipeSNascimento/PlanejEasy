# PlanejEasy 📚✨

Plataforma web desenvolvida para otimizar o fluxo de trabalho pedagógico de educadores, reduzindo a sobrecarga burocrática por meio da estruturação de planos de aula assistida por IA generativa e exportação direta em planilhas institucionais padronizadas.

---

## 💡 O Problema & A Solução

* **O Problema:** Professores investem horas semanais fora da sala de aula preenchendo grades de planejamento manuais, repetitivas e burocráticas exigidas pela coordenação pedagógica.
* **A Solução:** O PlanejEasy centraliza turmas e disciplinas, processa anotações informais e rascunhos livres por meio de LLMs contextualizadas no domínio pedagógico e gera planos estruturados por semana, prontos para persistência no banco e exportação em formato `.xlsx` oficial.

---

## 🛠️ Stack & Decisões Técnicas

| Camada | Tecnologias | Objetivo da Escolha |
| :--- | :--- | :--- |
| **Frontend** | React, TypeScript, Tailwind CSS | Tipagem estática, componentização desacoplada e interface responsiva com agilidade visual |
| **Backend** | Node.js, Express, TypeScript | Consistência de linguagem em todo o ecossistema e robustez no tratamento de requisições |
| **Database** | Supabase (PostgreSQL) | Modelo relacional confiável com integridade referencial via chaves estrangeiras |
| **GenAI Engine** | Google Gemini API | Processamento de linguagem natural refinado via prompt engineering com restrições pedagógicas |
| **Exportação** | ExcelJS | Manipulação programática em nível de célula, formatação visual e suporte a mesclagem em lote |

---

## 🚀 Arquitetura & Fluxo de Dados

1. **Gestão de Contexto:** Definição de dados docentes, turmas e componentes curriculares atrelados ao professor.
2. **Geração Assistida:** Envio do rascunho de aula via API para o modelo do Gemini, que categoriza e estrutura a proposta em etapas pedagógicas claras: Início/Acolhimento, Desenvolvimento, Fim da Aula e Recursos/Materiais.
3. **Revisão Humana & Planejamento por Calendário:** O professor revisa e edita o texto gerado, define a data letiva por seletor de calendário (com cálculo dinâmico da semana de referência) e adiciona as aulas a uma fila de lote.
4. **Persistência em Lote:** Envio de múltiplos planejamentos simultâneos ao PostgreSQL em uma única transação/requisição.
5. **Pipeline de Exportação:** Mapeamento dos registros relacionais em estrutura tabular do ExcelJS, aplicando cabeçalhos unificados e gerando planilhas `.xlsx` compatíveis com o padrão institucional da escola.

---

# 📌 Status de Desenvolvimento — PlanejEasy

---

### ✅ Concluído

- [x] **Modelagem Relacional (Supabase/PostgreSQL):** Tabelas estruturadas e relacionadas (`professores`, `turmas`, `disciplinas`, `objetos_bncc`, `planos_de_aula`).
- [x] **Migração para UUID & Integridade Referencial:** Transição de chaves primárias e estrangeiras de inteiros para UUID, alinhando a persistência diretamente com o `auth.users` do Supabase via trigger automatizado.
- [x] **Autenticação & Isolamento Multiusuário:** Supabase Auth integrado ponta a ponta (login restrito, validação de tokens JWT no backend via `authMiddleware` e isolamento de consultas com `req.userId`).
- [x] **Arquitetura Modular do Backend:** Separação estrutural entre o servidor (`server.ts`) e o roteamento desacoplado (`routes.ts`) com tratamento centralizado de erros e controle de acesso.
- [x] **Motor de GenAI (Google Gemini API):** Integração com o modelo `gemini-3.6-flash` para estruturação de rascunhos livres em etapas didáticas formais (Início, Desenvolvimento, Fim e Recursos/Localização).
- [x] **Interface de Criação com Fila em Lote:** Seletor dinâmico de objetos BNCC por disciplina, cálculo automático da semana letiva e sistema de toasts flutuantes para feedback de operações.
- [x] **Página Dedicada de Aulas Planejadas:** Visualização do acervo com seleção múltipla para exportação, remoção do banco de dados e modal de edição completa (ajuste de turma, data, ordem da aula e etapas didáticas).
- [x] **Hierarquia Visual Multinível:** Agrupamento de aulas por Turma e Semana de referência com sanfonas (*accordions* colapsáveis iniciando recolhidos por padrão).
- [x] **Clonagem Transversal entre Turmas:** Duplicação direta e flexível de planos com suporte a seleção da turma de destino no momento da cópia.
- [x] **Busca e Filtros Combinados em Tempo Real:** Filtragem dinâmica simultânea por busca textual ampla, seleção por componente curricular (disciplina) e intervalo de datas (De / Até).
- [x] **Exportação Institucional por Grade Diária (ExcelJS):** Geração de planilhas formatadas com tabelas segmentadas por dia, cabeçalho de professor automatizado e grade fixa de 1ª a 6ª aula (com suporte a lacunas de horários vagos e validação de posse do plano).
- [x] **Gestão de Perfil, Turmas e Disciplinas:** Painel interativo com consumo autenticado (`apiFetch` / `/professor/me`) para sincronização dinâmica dos dados do professor logado e das turmas ativas.
- [x] **Navegação & Encerramento de Sessão:** Sidebar com fluxo de logout integrado (`supabase.auth.signOut()`) e transições seguras de interface.

---

### 🚧 Em Andamento / Próximos Passos

- [ ] **Modelos Didáticos Segmentados:** Ajuste de fluxos para Professor Regente (rotina contínua diária) vs. Professor Aulista (visão por grade horária e replicação paralela).

---

### 💡 Backlog de Melhorias Futuras

- [ ] **Base Completa da BNCC & Indicador de Cobertura:** Carga integral dos códigos curriculares com medidor visual de habilidades trabalhadas por bimestre.
- [ ] **Exportação Direta em PDF:** Geração de relatórios visuais formatados para impressão e download em PDF direto pelo navegador.
- [ ] **Banco de Aulas Favoritas:** Sistema de marcação de planos modelo para reaproveitamento rápido em semestres futuros.
- [ ] **Modo Escuro (Dark Mode):** Alternância de contraste na interface com foco em conforto visual para planejamento noturno.

---

## 💻 Como Rodar o Projeto Localmente

### Pré-requisitos
* Node.js (v18+)
* Gerenciador de pacotes (`npm` ou `yarn`)
* Projeto configurado no [Supabase](https://supabase.com/)
* Chave de API da [Google Gemini](https://ai.google.dev/)

### Instalação

1. Clone o repositório:
```bash
git clone [https://github.com/FilipeSNascimento/PlanejEasy.git]
cd PlanejEasy
```

2. Configure e execute o Backend:
```bash
cd backend
npm install
```

> Crie um arquivo `.env` dentro da pasta `backend` com as seguintes variáveis:
> ```env
> PORT=3333
> SUPABASE_URL=sua_url_do_supabase
> SUPABASE_KEY=sua_chave_anon_ou_service
> GEMINI_API_KEY=sua_chave_da_api_gemini
> ```

Inicie o servidor do backend:
```bash
npm run dev
```

3. Configure e execute o Frontend:
```bash
cd ../frontend
npm install
npm run dev
```

4. Acesse a aplicação:
Abra `http://localhost:5173` no seu navegador.
