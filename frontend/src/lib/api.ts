import { supabase } from './supabase';

const BASE_URL = 'http://localhost:3333';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  // Pega a sessão ativa do usuário atual no Supabase
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  // Monta os headers com o token JWT
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Se não foi definido Content-Type e estiver enviando body em string/JSON
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  // Faz a chamada unificada
  return fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
}