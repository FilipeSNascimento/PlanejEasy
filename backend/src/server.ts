import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './lib/supabase';

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

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});