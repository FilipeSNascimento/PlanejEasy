import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Garante que as variáveis de ambiente estão carregadas
dotenv.config();

// Pega as chaves do arquivo .env
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;

// Se faltar alguma chave, o servidor avisa na hora de rodar
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltam as credenciais do Supabase no arquivo .env');
}

// Cria a conexão e exporta para usarmos no resto do projeto
export const supabase = createClient(supabaseUrl, supabaseKey);