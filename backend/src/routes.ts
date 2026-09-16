import { Router } from 'express';
import { supabase } from './lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authMiddleware, AuthRequest } from './middlewares/auth';
import ExcelJS from 'exceljs';

export const routes = Router();

// ==========================================
// HEALTH CHECK
// ==========================================
routes.get('/ping', (_req, res) => {
  return res.json({ message: 'API do PlanejEasy rodando com sucesso! 🚀' });
});

// ==========================================
// DISCIPLINAS (Isolamento por Docente)
// ==========================================
routes.get('/disciplinas', authMiddleware, async (_req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('disciplinas')
      .select('*')
      .order('nome');

    if (error) {
      console.error('Erro em disciplinas:', error.message);
      return res.status(400).json({ erro: error.message });
    }

    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno ao buscar disciplinas.' });
  }
});

routes.post('/disciplinas', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório.' });

    const { data, error } = await supabase
      .from('disciplinas')
      .insert([{ nome, professor_id: req.userId }])
      .select();

    if (error) return res.status(400).json({ erro: error.message });
    return res.status(201).json(data);
  } catch {
    return res.status(500).json({ erro: 'Erro interno ao salvar disciplina.' });
  }
});

// ==========================================
// TURMAS (Isolamento por Docente)
// ==========================================
routes.get('/turmas', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('turmas')
      .select('*')
      .or(`professor_id.eq.${req.userId},professor_id.is.null`)
      .order('nome');

    if (error) {
      console.error('Erro em turmas:', error);

      const fallback = await supabase.from('turmas').select('*').order('nome');
      return res.json(fallback.data || []);
    }
    return res.json(data || []);
  } catch (err) {
    console.error('Catch turmas:', err);
    return res.status(500).json({ erro: 'Erro interno ao buscar turmas.' });
  }
});

routes.post('/turmas', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { nome, turno } = req.body;
    const { data, error } = await supabase
      .from('turmas')
      .insert([{ nome, turno: turno || 'Matutino', professor_id: req.userId }])
      .select();

    if (error) return res.status(400).json({ erro: error.message });
    return res.status(201).json(data);
  } catch {
    return res.status(500).json({ erro: 'Erro interno ao salvar turma.' });
  }
});

// ==========================================
// BNCC
// ==========================================
routes.get('/bncc', async (_req, res) => {
  try {
    const { data, error } = await supabase.from('objetos_bncc').select('*');
    if (error) return res.status(400).json({ erro: error.message });
    return res.json(data);
  } catch {
    return res.status(500).json({ erro: 'Erro interno ao buscar BNCC.' });
  }
});

// ==========================================
// PROFESSORES & PERFIL
// ==========================================
routes.get('/professor/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { data: prof, error } = await supabase
      .from('professores')
      .select('*')
      .eq('id', req.userId)
      .maybeSingle();

    if (error) return res.status(400).json({ erro: error.message });

    // Busca as turmas associadas a este professor
    const { data: turmas } = await supabase
      .from('turmas')
      .select('*')
      .eq('professor_id', req.userId);

    // Busca a lista de disciplinas disponíveis
    const { data: disciplinas } = await supabase
      .from('disciplinas')
      .select('*')
      .order('nome');

    return res.json({
      id: req.userId,
      nome: prof?.nome || '',
      email: prof?.email || '',
      turmas: turmas || [],
      disciplinasDisponiveis: disciplinas || []
    });
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno ao carregar perfil.' });
  }
});

routes.put('/professor/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { nome, email, turmas, disciplinasDisponiveis } = req.body;

    // Atualiza/Insere o perfil do professor logado
    await supabase.from('professores').upsert({
      id: req.userId,
      nome,
      email
    });

    // Sincroniza turmas
    if (turmas && Array.isArray(turmas)) {
      const turmasComId = turmas.filter((t: any) => t.id).map((t: any) => t.id);

      if (turmasComId.length > 0) {
        await supabase
          .from('turmas')
          .delete()
          .eq('professor_id', req.userId)
          .not('id', 'in', `(${turmasComId.join(',')})`);
      } else {
        await supabase.from('turmas').delete().eq('professor_id', req.userId);
      }

      for (const turma of turmas) {
        if (turma.id) {
          await supabase.from('turmas').update({ nome: turma.nome }).eq('id', turma.id).eq('professor_id', req.userId);
        } else {
          await supabase.from('turmas').insert({ nome: turma.nome, professor_id: req.userId, turno: 'Matutino' });
        }
      }
    }

    // Sincroniza disciplinas
    if (disciplinasDisponiveis && Array.isArray(disciplinasDisponiveis)) {
      const discComId = disciplinasDisponiveis.filter((d: any) => d.id).map((d: any) => d.id);

      if (discComId.length > 0) {
        await supabase
          .from('disciplinas')
          .delete()
          .eq('professor_id', req.userId)
          .not('id', 'in', `(${discComId.join(',')})`);
      }

      const novasDisciplinas = disciplinasDisponiveis.filter((d: any) => !d.id);
      for (const disc of novasDisciplinas) {
        await supabase.from('disciplinas').insert({ nome: disc.nome, professor_id: req.userId });
      }
    }

    return res.json({ mensagem: 'Perfil sincronizado com sucesso!' });
  } catch {
    return res.status(500).json({ erro: 'Erro interno ao sincronizar perfil.' });
  }
});

// ==========================================
// PLANOS DE AULA
// ==========================================
routes.get('/planos', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('planos_de_aula')
      .select('*, turmas(nome), disciplinas(nome)')
      .eq('professor_id', req.userId)
      .order('data_aula', { ascending: false });

    if (error) throw error;
    return res.json(data);
  } catch {
    return res.status(500).json({ erro: 'Erro ao buscar planos.' });
  }
});

routes.post('/planos', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const plano = {
      ...req.body,
      professor_id: req.userId
    };

    const { data, error } = await supabase
      .from('planos_de_aula')
      .insert([plano])
      .select();

    if (error) return res.status(400).json({ erro: error.message });
    return res.status(201).json(data);
  } catch {
    return res.status(500).json({ erro: 'Erro interno no servidor' });
  }
});

routes.post('/planos/lote', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const planosArray = req.body;
    if (!Array.isArray(planosArray) || planosArray.length === 0) {
      return res.status(400).json({ erro: 'Nenhum plano foi enviado.' });
    }

    const planosComProfessor = planosArray.map((plano: any) => ({
      ...plano,
      professor_id: req.userId
    }));

    const { data, error } = await supabase
      .from('planos_de_aula')
      .insert(planosComProfessor)
      .select();

    if (error) return res.status(400).json({ erro: error.message });
    return res.status(201).json(data);
  } catch {
    return res.status(500).json({ erro: 'Erro interno ao salvar lote.' });
  }
});

routes.put('/planos/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      data_aula,
      ordem_aula,
      turma_id,
      estrategia_inicio,
      estrategia_desenvolvimento,
      estrategia_fim,
      localizacao_materiais
    } = req.body;

    const { data, error } = await supabase
      .from('planos_de_aula')
      .update({
        data_aula,
        ordem_aula,
        turma_id: Number(turma_id),
        estrategia_inicio,
        estrategia_desenvolvimento,
        estrategia_fim,
        localizacao_materiais
      })
      .eq('id', id)
      .eq('professor_id', req.userId)
      .select('*, turmas(nome), disciplinas(nome)');

    if (error) return res.status(400).json({ erro: error.message });
    if (!data || data.length === 0) {
      return res.status(404).json({ erro: 'Plano não encontrado ou sem permissão para editar.' });
    }

    return res.json(data[0]);
  } catch {
    return res.status(500).json({ erro: 'Erro interno ao atualizar plano.' });
  }
});

routes.delete('/planos/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('planos_de_aula')
      .delete()
      .eq('id', id)
      .eq('professor_id', req.userId);

    if (error) return res.status(400).json({ erro: error.message });
    return res.status(204).send();
  } catch {
    return res.status(500).json({ erro: 'Erro interno ao excluir plano.' });
  }
});

// ==========================================
// INTELIGÊNCIA ARTIFICIAL (GEMINI)
// ==========================================
routes.post('/ia/gerar-plano', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { resumo, disciplina, turma } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    const prompt = `
      Atue como um professor especialista em didática e editor de texto pedagógico.
      Abaixo está o rascunho de planejamento de aula para a disciplina de "${disciplina}" (Turma: ${turma}).
      
      MEU RASCUNHO:
      "${resumo}"
      
      Sua tarefa é organizar, refinar e reescrever o rascunho de forma clara, didática e em padrão profissional.
      REGRAS:
      1. Baseie-se estritamente no que foi sugerido no rascunho.
      2. Só sugira atividades extras se houver solicitação explícita.
      3. Extraia e liste os materiais necessários.
      
      Retorne EXATAMENTE e APENAS um JSON válido, sem markdown (\`\`\`json), contendo:
      {
        "estrategia_inicio": "introdução/acolhimento",
        "estrategia_desenvolvimento": "desenvolvimento e prática central",
        "estrategia_fim": "conclusão e fechamento",
        "localizacao_materiais": "materiais separados por vírgula"
      }
    `;

    const result = await model.generateContent(prompt);
    const respostaRaw = result.response.text();
    const jsonLimpo = respostaRaw.replace(/```json/g, '').replace(/```/g, '').trim();
    const planoGerado = JSON.parse(jsonLimpo);

    return res.status(200).json(planoGerado);
  } catch (error: any) {
    console.error('Erro na IA:', error);
    if (error.status === 503 || (error.message && error.message.includes('503'))) {
      return res.status(503).json({ erro: 'Serviço de IA congestionado. Tente novamente em alguns segundos.' });
    }
    return res.status(500).json({ erro: 'Falha ao processar com a IA.' });
  }
});

// ==========================================
// EXPORTAÇÃO EXCEL / FORMATADA POR DIA
// ==========================================
routes.get('/planos/exportar-lote', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const idsString = req.query.ids as string;
    if (!idsString) return res.status(400).json({ erro: 'Nenhum ID fornecido.' });

    const ids = idsString.split(',').map(id => Number(id));

    // Busca apenas as aulas pertencentes ao professor autenticado
    const { data: planos, error } = await supabase
      .from('planos_de_aula')
      .select('*, turmas(nome), disciplinas(nome), professores(nome)')
      .in('id', ids)
      .eq('professor_id', req.userId);

    if (error || !planos || planos.length === 0) {
      return res.status(404).json({ erro: 'Planos não encontrados ou sem permissão.' });
    }

    let nomeProfessor = planos[0].professores?.nome || '';
    if (!nomeProfessor && planos[0].professor_id) {
      const { data: profData } = await supabase
        .from('professores')
        .select('nome')
        .eq('id', planos[0].professor_id)
        .single();
      if (profData) nomeProfessor = profData.nome;
    }

    const extrairNumeroOrdem = (ordemStr?: string) => {
      if (!ordemStr) return 999;
      const num = parseInt(ordemStr.replace(/\D/g, ''), 10);
      return isNaN(num) ? 999 : num;
    };

    planos.sort((a, b) => {
      if (a.data_aula !== b.data_aula) {
        return (a.data_aula || '').localeCompare(b.data_aula || '');
      }
      return extrairNumeroOrdem(a.ordem_aula) - extrairNumeroOrdem(b.ordem_aula);
    });

    const aulasPorDia = planos.reduce((acc, aula) => {
      const chaveData = aula.data_aula || 'Sem Data';
      if (!acc[chaveData]) acc[chaveData] = [];
      acc[chaveData].push(aula);
      return acc;
    }, {} as Record<string, any[]>);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Planejamento');

    worksheet.columns = [
      { key: 'A', width: 14 },
      { key: 'B', width: 14 },
      { key: 'C', width: 35 },
      { key: 'D', width: 68 },
      { key: 'E', width: 30 },
    ];

    let linhaAtual = 1;

    worksheet.getCell(`A${linhaAtual}`).value = 'Professor(a)';
    worksheet.mergeCells(`A${linhaAtual}:B${linhaAtual}`);

    worksheet.getCell(`C${linhaAtual}`).value = 'SEMANA DE REFERÊNCIA';
    worksheet.mergeCells(`C${linhaAtual}:E${linhaAtual}`);

    [`A${linhaAtual}`, `C${linhaAtual}`].forEach(cel => {
      const c = worksheet.getCell(cel);
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } };
      c.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
      c.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    linhaAtual++;

    worksheet.getCell(`A${linhaAtual}`).value = nomeProfessor || 'Professor(a)';
    worksheet.mergeCells(`A${linhaAtual}:B${linhaAtual}`);

    worksheet.getCell(`C${linhaAtual}`).value = planos[0].semana_referencia || 'Semana Atual';
    worksheet.mergeCells(`C${linhaAtual}:E${linhaAtual}`);

    [`A${linhaAtual}`, `C${linhaAtual}`].forEach(cel => {
      worksheet.getCell(cel).alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell(cel).font = { bold: true };
    });

    linhaAtual++;

    const posicoesAulas = ['1ª', '2ª', '3ª', '4ª', '5ª', '6ª'];
    const dias = Object.entries(aulasPorDia) as [string, any[]][];

    dias.forEach(([dataStr, listaAulasDoDia], indexDia) => {
      let textoDia = dataStr;
      if (dataStr !== 'Sem Data') {
        const d = new Date(dataStr + 'T00:00:00');
        const diaSemana = d.toLocaleDateString('pt-BR', { weekday: 'long' }).toUpperCase();
        const dataFmt = d.toLocaleDateString('pt-BR');
        textoDia = `${diaSemana} - ${dataFmt}`;
      }

      worksheet.getCell(`A${linhaAtual}`).value = textoDia;
      worksheet.mergeCells(`A${linhaAtual}:E${linhaAtual}`);
      worksheet.getCell(`A${linhaAtual}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
      worksheet.getCell(`A${linhaAtual}`).font = { bold: true, size: 11, color: { argb: 'FF002060' } };
      worksheet.getCell(`A${linhaAtual}`).alignment = { horizontal: 'center', vertical: 'middle' };
      linhaAtual++;

      worksheet.getCell(`A${linhaAtual}`).value = 'Aula / Turma\nComponente Curricular';
      worksheet.mergeCells(`A${linhaAtual}:B${linhaAtual}`);
      worksheet.getCell(`C${linhaAtual}`).value = 'Objeto do Conhecimento\nHabilidade';
      worksheet.getCell(`D${linhaAtual}`).value = 'Desenvolvimento / Estratégia';
      worksheet.getCell(`E${linhaAtual}`).value = 'Localização / Recursos';

      [`A${linhaAtual}`, `C${linhaAtual}`, `D${linhaAtual}`, `E${linhaAtual}`].forEach(cel => {
        const c = worksheet.getCell(cel);
        c.font = { bold: true, size: 10 };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
        c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });
      linhaAtual++;

      posicoesAulas.forEach(pos => {
        const plano = listaAulasDoDia.find(p => (p.ordem_aula || '').startsWith(pos));

        if (plano) {
          const ordem = plano.ordem_aula || `${pos} Aula`;
          const turma = plano.turmas?.nome || `Turma #${plano.turma_id}`;
          const disciplina = plano.disciplinas?.nome || '';

          worksheet.getCell(`A${linhaAtual}`).value = `${ordem}\n${turma}\n${disciplina}`;
          worksheet.getCell(`C${linhaAtual}`).value = `${plano.objeto_conhecimento || ''}\n\n${plano.habilidade_bncc || ''}`.trim();

          const estrategia = 
            `(INÍCIO)\n${plano.estrategia_inicio || '-'}\n\n` +
            `(DESENVOLVIMENTO)\n${plano.estrategia_desenvolvimento || '-'}\n\n` +
            `(FIM)\n${plano.estrategia_fim || '-'}`;

          worksheet.getCell(`D${linhaAtual}`).value = estrategia;
          worksheet.getCell(`E${linhaAtual}`).value = plano.localizacao_materiais || 'Sala de aula';
        } else {
          worksheet.getCell(`A${linhaAtual}`).value = `${pos} Aula\n-\n-`;
          worksheet.getCell(`C${linhaAtual}`).value = '';
          worksheet.getCell(`D${linhaAtual}`).value = '';
          worksheet.getCell(`E${linhaAtual}`).value = '';
        }

        worksheet.mergeCells(`A${linhaAtual}:B${linhaAtual}`);

        ['A', 'C', 'D', 'E'].forEach(col => {
          worksheet.getCell(`${col}${linhaAtual}`).alignment = {
            wrapText: true,
            vertical: 'top',
            horizontal: col === 'D' ? 'left' : 'center'
          };
        });

        linhaAtual++;
      });

      if (indexDia < dias.length - 1) {
        linhaAtual += 2;
      }
    });

    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Planejamento_Aulas.xlsx');
    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    console.error('Erro Excel:', error);
    return res.status(500).json({ erro: 'Erro interno ao gerar planilha.' });
  }
});