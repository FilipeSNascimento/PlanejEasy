import { createClient } from '@supabase/supabase-js';

// No Vite, as variáveis de ambiente são acessadas via import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Se faltar alguma credencial, avisa no console do navegador na inicialização
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltam as variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY no frontend.');
}

// Cria a instância do cliente Supabase para o front-end
export const supabase = createClient(supabaseUrl, supabaseAnonKey);