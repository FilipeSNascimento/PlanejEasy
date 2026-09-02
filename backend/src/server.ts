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

// NOVA ROTA: Cadastrar uma disciplina
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

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});