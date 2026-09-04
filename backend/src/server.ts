import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ExcelJS from 'exceljs';

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

// ==========================================
// ROTA PARA IA GERAR O PLANO DE AULA (USANDO GOOGLE GEMINI)
// ==========================================

// Rota para a IA gerar o conteúdo do Plano de Aula
app.post('/ia/gerar-plano', async (req, res) => {
  try {
    // Agora recebemos o "resumo" do professor, e não apenas um "tema"
    const { resumo, disciplina, turma } = req.body;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    
    // Prompt: A IA agora atua como editora e organizadora da sua ideia
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

 } catch (error: any) {
    console.error("Erro ao gerar com IA:", error);
    
    // Se o erro for de sobrecarga no Google
    if (error.status === 503 || (error.message && error.message.includes('503'))) {
      return res.status(503).json({ 
        erro: 'O servidor da IA está muito requisitado no momento. Aguarde alguns segundos e clique em gerar novamente!' 
      });
    }

    return res.status(500).json({ erro: 'Falha ao conectar com a inteligência artificial.' });
  }
});

// ==========================================
// ROTA PARA SALVAR MÚLTIPLOS PLANOS (LOTE)
// ==========================================
app.post('/planos/lote', async (req, res) => {
  try {
    const planosArray = req.body; 

    if (!Array.isArray(planosArray) || planosArray.length === 0) {
      return res.status(400).json({ erro: 'Nenhum plano foi enviado.' });
    }

    const { data, error } = await supabase
      .from('planos_de_aula')
      .insert(planosArray)
      .select();

    if (error) {
      console.error("Erro do Supabase ao salvar lote:", error);
      return res.status(400).json({ erro: error.message });
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error("Erro interno ao salvar lote:", err);
    return res.status(500).json({ erro: 'Erro interno no servidor' });
  }
});

// ==========================================
// ROTA DE EXPORTAÇÃO (MOLDES DO COLÉGIO)
// ==========================================
app.get('/planos/:id/exportar', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: plano, error } = await supabase
      .from('planos_de_aula')
      .select('*, turmas(nome), disciplinas(nome)')
      .eq('id', id)
      .single();

    if (error || !plano) {
      return res.status(404).json({ erro: 'Plano de aula não encontrado no banco.' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Planejamento');

    // 1. Configura a largura exata das colunas (A até E)
    worksheet.columns = [
      { key: 'A', width: 15 }, // Aula / Componente
      { key: 'B', width: 15 }, // Espaço extra caso precise mesclar
      { key: 'C', width: 40 }, // Objeto/Habilidade
      { key: 'D', width: 65 }, // Desenvolvimento/Estratégia (Bem larga)
      { key: 'E', width: 30 }, // Localização
    ];

    // 2. LINHA 1 (Cabeçalhos Azuis)
    worksheet.getCell('A1').value = 'Professor(a)';
    worksheet.mergeCells('A1:B1');
    worksheet.getCell('C1').value = 'Turma';
    worksheet.getCell('D1').value = 'QUINZENA';
    worksheet.mergeCells('D1:E1');

    ['A1', 'C1', 'D1'].forEach(celula => {
      const c = worksheet.getCell(celula);
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } }; // Azul escuro do colégio
      c.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
      c.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // 3. LINHA 2 (Dados do Cabeçalho)
    worksheet.getCell('A2').value = '-'; // Aqui entrará o nome do professor no futuro
    worksheet.mergeCells('A2:B2');
    worksheet.getCell('C2').value = plano.turmas?.nome || '-';
    worksheet.getCell('D2').value = plano.quinzena || '00/00 - 00/00';
    worksheet.mergeCells('D2:E2');

    ['A2', 'C2', 'D2'].forEach(celula => {
      worksheet.getCell(celula).alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // 4. LINHA 3 (Solicitação de Materiais)
    worksheet.getCell('A3').value = 'Solicitação de Materiais: ' + (plano.localizacao_materiais || '');
    worksheet.mergeCells('A3:E3');
    worksheet.getCell('A3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE599' } }; // Amarelo claro
    worksheet.getCell('A3').font = { bold: true };

    // 5. LINHA 4 (Dia da Semana)
    worksheet.getCell('A4').value = (plano.dia_semana || 'SEGUNDA-FEIRA').toUpperCase();
    worksheet.mergeCells('A4:E4');
    worksheet.getCell('A4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }; // Cinza claro
    worksheet.getCell('A4').font = { bold: true };
    worksheet.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };

    // 6. LINHA 5 (Títulos das Colunas)
    worksheet.getCell('A5').value = 'Aula\nComponente Curricular';
    worksheet.mergeCells('A5:B5');
    worksheet.getCell('C5').value = 'Objeto do Conhecimento\nHabilidade';
    worksheet.getCell('D5').value = 'Desenvolvimento / Estratégia';
    worksheet.getCell('E5').value = 'Localização';

    ['A5', 'C5', 'D5', 'E5'].forEach(celula => {
      const c = worksheet.getCell(celula);
      c.font = { bold: true };
      c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });

    // 7. LINHA 6 (O Conteúdo Principal do Plano)
    worksheet.getCell('A6').value = `${plano.ordem_aula || '1ª'}\n${plano.disciplinas?.nome || ''}`;
    worksheet.mergeCells('A6:B6');
    
    // Objeto e Habilidade
    worksheet.getCell('C6').value = `${plano.objeto_conhecimento || ''}\n\n${plano.habilidade_bncc || ''}`;

    // A Mágica da Estratégia (Juntando os textos da IA com formatação)
    const estrategiaFormatada = 
      `(INÍCIO)\n${plano.estrategia_inicio || 'Sem dados de início.'}\n\n` +
      `(DESENVOLVIMENTO)\n${plano.estrategia_desenvolvimento || 'Sem dados de desenvolvimento.'}\n\n` +
      `(FIM DA AULA)\n${plano.estrategia_fim || 'Sem dados de fim.'}`;
    
    worksheet.getCell('D6').value = estrategiaFormatada;
    worksheet.getCell('E6').value = plano.localizacao_materiais || 'Sala de aula';

    ['A6', 'C6', 'D6', 'E6'].forEach(celula => {
      worksheet.getCell(celula).alignment = { wrapText: true, vertical: 'top', horizontal: 'center' };
    });
    // Alinha a coluna D (Estratégia) à esquerda para leitura de texto longo
    worksheet.getCell('D6').alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };

    // 8. Aplica bordas finas em todas as células desenhadas
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Planejamento_${id}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Erro ao gerar Excel:", error);
    return res.status(500).json({ erro: 'Erro interno ao gerar a planilha.' });
  }
});

// ==========================================
// ROTA DE EXPORTAÇÃO EM LOTE PARA EXCEL
// ==========================================
app.get('/planos/exportar-lote', async (req, res) => {
  try {
    const idsString = req.query.ids as string;
    if (!idsString) return res.status(400).json({ erro: 'Nenhum ID fornecido.' });
    
    // Converte a string "1,2,3" em um array numérico [1, 2, 3]
    const ids = idsString.split(',').map(id => Number(id));

    // Busca os planos selecionados no banco
    const { data: planos, error } = await supabase
      .from('planos_de_aula')
      .select('*, turmas(nome), disciplinas(nome)')
      .in('id', ids)
      .order('id', { ascending: true });

    if (error || !planos || planos.length === 0) {
      return res.status(404).json({ erro: 'Planos não encontrados.' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Planejamento da Quinzena');

    worksheet.columns = [
      { key: 'A', width: 15 }, { key: 'B', width: 15 },
      { key: 'C', width: 40 }, { key: 'D', width: 65 }, { key: 'E', width: 30 },
    ];

    // Cabeçalhos Base (Usando a semana de referência da primeira aula selecionada)
    worksheet.getCell('A1').value = 'Professor(a)';
    worksheet.mergeCells('A1:B1');
    worksheet.getCell('C1').value = 'Turma';
    worksheet.getCell('D1').value = 'SEMANA DE REFERÊNCIA';
    worksheet.mergeCells('D1:E1');

    ['A1', 'C1', 'D1'].forEach(cel => {
      const c = worksheet.getCell(cel);
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } };
      c.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
      c.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    worksheet.getCell('A2').value = '-';
    worksheet.mergeCells('A2:B2');
    worksheet.getCell('C2').value = planos[0].turmas?.nome || '-';
    worksheet.getCell('D2').value = planos[0].semana_referencia || 'Semana Atual';
    worksheet.mergeCells('D2:E2');
    ['A2', 'C2', 'D2'].forEach(cel => worksheet.getCell(cel).alignment = { horizontal: 'center', vertical: 'middle' });

    worksheet.getCell('A3').value = 'Solicitação de Materiais Gerais: ' + planos.map(p => p.localizacao_materiais).filter(Boolean).join(' | ');
    worksheet.mergeCells('A3:E3');
    worksheet.getCell('A3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE599' } };
    worksheet.getCell('A3').font = { bold: true };

    worksheet.getCell('A4').value = 'AULAS PLANEJADAS';
    worksheet.mergeCells('A4:E4');
    worksheet.getCell('A4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
    worksheet.getCell('A4').font = { bold: true };
    worksheet.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.getCell('A5').value = 'Aula\nComponente';
    worksheet.mergeCells('A5:B5');
    worksheet.getCell('C5').value = 'Objeto do Conhecimento\nHabilidade';
    worksheet.getCell('D5').value = 'Desenvolvimento / Estratégia';
    worksheet.getCell('E5').value = 'Localização / Materiais Específicos';
    ['A5', 'C5', 'D5', 'E5'].forEach(cel => {
      const c = worksheet.getCell(cel);
      c.font = { bold: true };
      c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });

    // Loop Dinâmico: Adiciona cada aula selecionada em uma nova linha do Grid
    let linhaAtual = 6;
    planos.forEach((plano) => {
      worksheet.getCell(`A${linhaAtual}`).value = `${plano.dia_semana || ''}\n${plano.ordem_aula || ''}\n${plano.disciplinas?.nome || ''}`;
      worksheet.mergeCells(`A${linhaAtual}:B${linhaAtual}`);
      
      worksheet.getCell(`C${linhaAtual}`).value = `${plano.objeto_conhecimento || ''}\n\n${plano.habilidade_bncc || ''}`;
      
      const estrategiaFormatada = 
        `(INÍCIO)\n${plano.estrategia_inicio || ''}\n\n` +
        `(DESENVOLVIMENTO)\n${plano.estrategia_desenvolvimento || ''}\n\n` +
        `(FIM DA AULA)\n${plano.estrategia_fim || ''}`;
      
      worksheet.getCell(`D${linhaAtual}`).value = estrategiaFormatada;
      worksheet.getCell(`E${linhaAtual}`).value = plano.localizacao_materiais || 'Sala de aula';

      ['A', 'C', 'D', 'E'].forEach(col => {
        worksheet.getCell(`${col}${linhaAtual}`).alignment = { wrapText: true, vertical: 'top', horizontal: col === 'D' ? 'left' : 'center' };
      });

      linhaAtual++;
    });

    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Planejamento_Lote.xlsx`);
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Erro ao gerar Excel em Lote:", error);
    return res.status(500).json({ erro: 'Erro interno ao gerar a planilha.' });
  }
});

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});