import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';

// Estende a tipagem do Request do Express para incluir o id do usuário logado
export interface AuthRequest extends Request {
  userId?: string;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ erro: 'Token de autenticação não fornecido.' });
  }

  // O cabeçalho vem no formato "Bearer <TOKEN>"
  const [, token] = authHeader.split(' ');

  if (!token) {
    return res.status(401).json({ erro: 'Formato de token inválido.' });
  }

  try {
    // Valida o JWT diretamente na API do Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ erro: 'Sessão inválida ou expirada.' });
    }

    // Injeta o UUID do professor autenticado na requisição
    req.userId = user.id;
    next();
  } catch (err) {
    console.error('Erro na validação do token:', err);
    return res.status(401).json({ erro: 'Falha ao autenticar requisição.' });
  }
}