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

## 📌 Status de Desenvolvimento

### ✅ Concluído
- [x] **Modelagem Relacional (Supabase/PostgreSQL):** Tabelas estruturadas e relacionadas (`professores`, `turmas`, `disciplinas`, `objetos_bncc`, `planos_de_aula`).
- [x] **Motor de GenAI com Google Gemini API:** Pipeline funcional no backend que recebe rascunhos livres e retorna planos didáticos divididos em Início, Desenvolvimento, Fim e Materiais.
- [x] **Módulo de Exportação Customizada em Excel (`ExcelJS`):** Geração programática de planilhas formatadas no padrão institucional, com cabeçalhos mesclados e linhas consolidadas em lote.
- [x] **Planejamento por Calendário Semanal:** Seletor nativo de datas com cálculo automático do período letivo semanal.
- [x] **Interface de Criação e Edição em Lote:** Edição manual em tempo real dos textos da IA, agrupamento de múltiplas aulas na fila e salvamento em lote no banco.
- [x] **Gestão de Perfil, Turmas e Disciplinas:** Painel interativo para atualização cadastral e sincronização imediata de turmas e componentes curriculares lecionados.

---

### 🚧 Em Andamento / Próximos Passos
- [x] **Página Dedicada de Aulas Planejadas:** Interface exclusiva para visualização, filtros e gestão do histórico geral de aulas.
- [ ] **Reaproveitamento Inteligente (Clonagem de Aulas):** Fluxo para duplicar e adaptar planos já existentes entre diferentes turmas.
- [ ] **Filtros de Busca Avançada:** Pesquisa refinada no acervo por data, turma, disciplina e termos-chave.
- [ ] **Autenticação & Controle de Acesso:** Sistema de autenticação e isolamento de sessão multiusuário via Supabase Auth.
- [ ] **Modelos de Planejamento Segmentados:** Adequação de fluxos para o perfil de **Professor Regente** (visão diária/integrada) e **Professor Aulista** (visão por horários e réplica rápida de conteúdos).

---

### 💡 Backlog de Melhorias Futuras
- [ ] **Base Completa da BNCC & Indicador de Cobertura:** População integral de códigos curriculares e medidor visual de progresso por bimestre.
- [ ] **Exportação em PDF:** Geração de relatórios visuais individuais ou semanais para impressão direta.
- [ ] **Banco de Aulas Favoritas:** Marcação de estratégias didáticas de sucesso para reuso em semestres futuros.
- [ ] **Modo Escuro (Dark Mode):** Alternância de contraste da UI com foco em conforto visual no planejamento noturno.

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
