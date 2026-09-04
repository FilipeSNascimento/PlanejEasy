import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/ping', (req, res) => {
  res.json({ message: 'API do PlanejEasy rodando com sucesso! 🚀' });
});

// ==========================================
// ROTAS DE DISCIPLINAS
// ==========================================

app.get('/disciplinas', async (req, res) => {
  try {
    const { data, error } = await supabase.from('disciplinas').select('*');

    if (error) {
      return res.status(400).json({ erro: error.message });
    }

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno no servidor' });
  }
});

// Cadastrar uma disciplina
app.post('/disciplinas', async (req, res) => {
  try {
    const { nome } = req.body;

    const { data, error } = await supabase
      .from('disciplinas')
      .insert([{ nome }])
      .select(); 

    if (error) {
      return res.status(400).json({ erro: error.message });
    }

    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno no servidor' });
  }
});

// ==========================================
// ROTAS DE PROFESSORES
// ==========================================

// Listar todos os professores
app.get('/professores', async (req, res) => {
  try {
    const { data, error } = await supabase.from('professores').select('*');
    if (error) return res.status(400).json({ erro: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno no servidor' });
  }
});

// Cadastrar um professor
app.post('/professores', async (req, res) => {
  try {
    const { nome, email, senha_hash } = req.body;

    const { data, error } = await supabase
      .from('professores')
      .insert([{ nome, email, senha_hash }])
      .select();

    if (error) return res.status(400).json({ erro: error.message });
    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno no servidor' });
  }
});

// ==========================================
// ROTAS DE TURMAS
// ==========================================

// Listar todas as turmas
app.get('/turmas', async (req, res) => {
  try {
    const { data, error } = await supabase.from('turmas').select('*');
    if (error) return res.status(400).json({ erro: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno no servidor' });
  }
});

// Cadastrar uma nova turma vinculada a um professor
app.post('/turmas', async (req, res) => {
  try {
    const { nome, turno, professor_id } = req.body;

    const { data, error } = await supabase
      .from('turmas')
      .insert([{ nome, turno, professor_id }])
      .select();

    if (error) return res.status(400).json({ erro: error.message });
    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno no servidor' });
  }
});

// ==========================================
// ROTAS DE PLANOS DE AULA
// ==========================================

// Listar todos os planos de aula
app.get('/planos', async (req, res) => {
  try {
    const { data, error } = await supabase.from('planos_de_aula').select('*');
    if (error) return res.status(400).json({ erro: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno no servidor' });
  }
});

// Cadastrar um novo plano de aula
app.post('/planos', async (req, res) => {
  try {
    const {
      professor_id,
      turma_id,
      disciplina_id,
      quinzena,
      ordem_aula,
      dia_semana,
      objeto_conhecimento,
      habilidade_bncc,
      estrategia_inicio,
      estrategia_desenvolvimento,
      estrategia_fim,
      localizacao_materiais
    } = req.body;

    const { data, error } = await supabase
      .from('planos_de_aula')
      .insert([{
        professor_id,
        turma_id,
        disciplina_id,
        quinzena,
        ordem_aula,
        dia_semana,
        objeto_conhecimento,
        habilidade_bncc,
        estrategia_inicio,
        estrategia_desenvolvimento,
        estrategia_fim,
        localizacao_materiais
      }])
      .select();

    if (error) return res.status(400).json({ erro: error.message });
    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno no servidor' });
  }
});

// Rota para buscar os objetos da BNCC
app.get('/bncc', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('objetos_bncc')
      .select('*');

    if (error) {
      return res.status(400).json({ erro: error.message });
    }

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro interno no servidor' });
  }
});

// Rota para cadastrar um novo Plano de Aula
app.post('/planos-de-aula', async (req, res) => {
  try {
    const { quinzena, turma_id, disciplina_id, objeto_conhecimento, estrategia_desenvolvimento } = req.body;

    const { data, error } = await supabase
      .from('planos_de_aula')
      .insert([
        { 
          quinzena, 
          turma_id, 
          disciplina_id, 
          objeto_conhecimento, 
          estrategia_desenvolvimento 
        }
      ])
      .select();

    if (error) {
      return res.status(400).json({ erro: error.message });
    }

    return res.status(201).json(data);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro interno no servidor ao salvar plano de aula' });
  }
});

// Rota para a IA gerar o conteúdo do Plano de Aula
app.post('/ia/gerar-plano', async (req, res) => {
  try {
    // Agora recebemos o "resumo" do professor, e não apenas um "tema"
    const { resumo, disciplina, turma } = req.body;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    
    // Novo Prompt: A IA agora atua como editora e organizadora da sua ideia
    const prompt = `
      Atue como um professor especialista em didática e editor de texto pedagógico.
      Abaixo está o meu rascunho de planejamento de aula para a disciplina de "${disciplina}" (Turma: ${turma}).
      
      MEU RASCUNHO:
      "${resumo}"
      
      Sua tarefa é organizar, refinar e reescrever o MEU rascunho de uma forma mais clara, didática e no padrão profissional, dividindo-o nas etapas de uma aula.
      
      REGRAS IMPORTANTES:
      1. NÃO invente novas dinâmicas do zero. Baseie-se estritamente no que eu sugeri no rascunho.
      2. Só sugira atividades extras se eu pedir explicitamente no texto do rascunho.
      3. Extraia e liste os materiais que eu mencionei (ou os materiais óbvios para executar a minha ideia).
      
      Retorne EXATAMENTE e APENAS um objeto JSON válido, sem formatação markdown (como \`\`\`json), contendo estas 4 chaves:
      {
        "estrategia_inicio": "texto refinado para introdução/aquecimento baseado no rascunho",
        "estrategia_desenvolvimento": "texto refinado do desenvolvimento baseado no rascunho",
        "estrategia_fim": "texto refinado para conclusão baseado no rascunho",
        "localizacao_materiais": "lista de materiais necessários (separados por vírgula)"
      }
    `;

    const result = await model.generateContent(prompt);
    const respostaRaw = result.response.text();

    const jsonLimpo = respostaRaw.replace(/```json/g, '').replace(/```/g, '').trim();
    const planoGerado = JSON.parse(jsonLimpo);

    return res.status(200).json(planoGerado);

  } catch (error) {
    console.error("Erro ao gerar com IA:", error);
    return res.status(500).json({ erro: 'Falha ao conectar com a inteligência artificial.' });
  }
});

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});