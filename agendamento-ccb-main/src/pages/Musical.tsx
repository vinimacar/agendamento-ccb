
import { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, startOfYear, endOfYear, getMonth, getYear } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { useToast } from '../hooks/use-toast';
import { useCongregations } from '../hooks/useCongregations';
import { musicianService } from '../services/musicianService';
import { ensaioDataService } from '../services/dataLancamentoService';
import type { Musician, EnsaioData } from '../types';
import { Music, Plus, Trash2, Loader2, Search, Calendar, Filter, FileSpreadsheet, FileText, Upload, FileUp, Printer } from 'lucide-react';

const INSTRUMENTS = [
  'Clarinete',
  'Clarone',
  'Sax Soprano',
  'Sax Alto',
  'Sax Tenor',
  'Sax Barítono',
  'Trompete',
  'Flugelhorn',
  'Eufônio',
  'Trombone',
  'Trombonito',
  'Tuba',
  'Viola',
  'Violino',
  'Cello',
  'Órgão',
  'Acordeon',
  'Flauta',
];

const STAGES = ['Ensaio', 'RJM', 'Culto Oficial', 'Oficialização'] as const;

export default function Musical() {
    // Frequência de Ensaios modal state
    const [frequenciaDialogOpen, setFrequenciaDialogOpen] = useState(false);
    const [frequenciaTipo, setFrequenciaTipo] = useState<'local' | 'regional' | 'gem' | 'geral' | 'darpe'>('local');
    const [frequenciaData, setFrequenciaData] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [frequenciaCongregacaoId, setFrequenciaCongregacaoId] = useState('');
    const [frequenciaAnciao, setFrequenciaAnciao] = useState('');
    const [frequenciaEncarregado, setFrequenciaEncarregado] = useState('');
    const [frequenciaInstrumentos, setFrequenciaInstrumentos] = useState({
      clarinete: 0,
      clarone: 0,
      saxSoprano: 0,
      saxAlto: 0,
      saxTenor: 0,
      saxBaritono: 0,
      trompete: 0,
      flugelhorn: 0,
      euphonio: 0,
      trombone: 0,
      trombonito: 0,
      tuba: 0,
      viola: 0,
      violino: 0,
      cello: 0,
      organista: 0,
    });

    // Handler for printing Frequência de Ensaios
    const handleImprimirFrequencia = () => {
      // TODO: Implement PDF export for Frequência de Ensaios if not already present
      toast({ title: 'Exportação não implementada', description: 'Função de exportar frequência ainda não implementada.' });
    };
  const { toast } = useToast();
  const { congregations } = useCongregations();

  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [loadingMusicians, setLoadingMusicians] = useState(false);
  const [savingMusician, setSavingMusician] = useState(false);

  // Formulário
  const [name, setName] = useState('');
  const [selectedCongregationId, setSelectedCongregationId] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [instrument, setInstrument] = useState('');
  const [stage, setStage] = useState<typeof STAGES[number]>('Ensaio');

  // Filtros
  const [filterInstrument, setFilterInstrument] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterCongregation, setFilterCongregation] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [musicianToDelete, setMusicianToDelete] = useState<{ id: string; name: string } | null>(null);

  // Import PDF/Excel
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importedData, setImportedData] = useState<Omit<Musician, 'id' | 'createdAt' | 'updatedAt'>[]>([]);
  const [processingPDF, setProcessingPDF] = useState(false);
  const [savingImportedData, setSavingImportedData] = useState(false);

  // Calendário e filtros
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [ensaios, setEnsaios] = useState<EnsaioData[]>([]);
  const [loadingEnsaios, setLoadingEnsaios] = useState(false);
  const [filterCalendarCongregation, setFilterCalendarCongregation] = useState('all');
  const [filterCalendarCity, setFilterCalendarCity] = useState('all');
  const [filterCalendarMonth, setFilterCalendarMonth] = useState('all');
  const [filterCalendarYear, setFilterCalendarYear] = useState(new Date().getFullYear().toString());
  const [filterCalendarType, setFilterCalendarType] = useState<'all' | 'local' | 'regional' | 'gem' | 'geral' | 'darpe'>('all');
  const [showCalendarPreview, setShowCalendarPreview] = useState(false);

  const loadMusicians = useCallback(async () => {
    setLoadingMusicians(true);
    try {
      const data = await musicianService.getAll();
      setMusicians(data);
    } catch (error) {
      console.error('Error loading musicians:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar os músicos.',
        variant: 'destructive',
      });
    } finally {
      setLoadingMusicians(false);
    }
  }, [toast]);

  const loadEnsaios = useCallback(async () => {
    setLoadingEnsaios(true);
    try {
      const data = await ensaioDataService.getAll();
      setEnsaios(data);
    } catch (error) {
      console.error('Error loading ensaios:', error);
      toast({
        title: 'Erro ao carregar ensaios',
        description: 'Não foi possível carregar os ensaios cadastrados.',
        variant: 'destructive',
      });
    } finally {
      setLoadingEnsaios(false);
    }
  }, [toast]);

  useEffect(() => {
    loadMusicians();
  }, [loadMusicians]);

  // Carregar ensaios do Firebase
  useEffect(() => {
    loadEnsaios();
  }, [loadEnsaios]);

  // Atualizar cidade quando congregação é selecionada
  useEffect(() => {
    if (selectedCongregationId) {
      const congregation = congregations.find((c: any) => c.id === selectedCongregationId);
      if (congregation) {
        setCity(congregation.city);
      }
    }
  }, [selectedCongregationId, congregations]);

  const handleAddMusician = async () => {
    if (!name || !selectedCongregationId || !city || !phone || !instrument || !stage) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos para cadastrar um músico.',
        variant: 'destructive',
      });
      return;
    }

    const congregation = congregations.find((c: any) => c.id === selectedCongregationId);
    if (!congregation) return;

    setSavingMusician(true);
    try {
      await musicianService.create({
        name,
        congregationId: selectedCongregationId,
        congregationName: congregation.name,
        city,
        phone,
        instrument,
        stage,
      });

      toast({
        title: 'Músico cadastrado!',
        description: `${name} foi cadastrado com sucesso.`,
      });

      // Limpar formulário
      setName('');
      setSelectedCongregationId('');
      setCity('');
      setPhone('');
      setInstrument('');
      setStage('Ensaio');

      loadMusicians();
    } catch (error) {
      console.error('Error adding musician:', error);
      toast({
        title: 'Erro ao cadastrar',
        description: 'Não foi possível cadastrar o músico.',
        variant: 'destructive',
      });
    } finally {
      setSavingMusician(false);
    }
  };

  const confirmDelete = (id: string, name: string) => {
    setMusicianToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!musicianToDelete) return;

    try {
      await musicianService.delete(musicianToDelete.id);
      loadMusicians();
      toast({
        title: 'Músico removido',
        description: `${musicianToDelete.name} foi removido com sucesso.`,
      });
    } catch (error) {
      console.error('Error deleting musician:', error);
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível remover o músico.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setMusicianToDelete(null);
    }
  };

  // Configurar worker do PDF.js
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const handlePDFUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione um arquivo PDF.',
        variant: 'destructive',
      });
      return;
    }

    setProcessingPDF(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      const structuredText: string[] = [];

      console.log(`📄 Processando PDF com ${pdf.numPages} página(s)...`);

      // Extrair texto de todas as páginas com melhor estruturação
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Agrupar itens por linha usando posição Y
        const itemsByLine: Map<number, { str: string; transform: number[] }[]> = new Map();
        
        textContent.items.forEach((item: unknown) => {
          const textItem = item as { str?: string; transform?: number[] };
          if (textItem.str && textItem.str.trim() && textItem.transform) {
            const y = Math.round(textItem.transform[5]); // Posição Y
            if (!itemsByLine.has(y)) {
              itemsByLine.set(y, []);
            }
            itemsByLine.get(y)!.push({ str: textItem.str, transform: textItem.transform });
          }
        });

        // Ordenar por posição Y (de cima para baixo)
        const sortedLines = Array.from(itemsByLine.entries())
          .sort((a, b) => b[0] - a[0]); // Inverter para ler de cima para baixo

        // Construir linhas de texto
        sortedLines.forEach(([_, items]) => {
          // Ordenar itens da linha por posição X (esquerda para direita)
          items.sort((a, b) => a.transform[4] - b.transform[4]);
          const lineText = items.map(item => item.str).join(' ');
          if (lineText.trim()) {
            structuredText.push(lineText.trim());
            fullText += lineText + '\n';
          }
        });
      }

      console.log('📋 Texto extraído do PDF:');
      console.log('─'.repeat(80));
      console.log(fullText.substring(0, 1000)); // Mostrar primeiros 1000 caracteres
      console.log('─'.repeat(80));
      console.log(`Total de linhas: ${structuredText.length}`);

      // Parsear os dados do PDF
      const parsedMusicians = parsePDFText(fullText, structuredText);
      
      console.log(`✅ Músicos encontrados: ${parsedMusicians.length}`);
      
      if (parsedMusicians.length === 0) {
        console.warn('⚠️ Nenhum músico válido encontrado.');
        console.log('💡 Dica: Verifique se o PDF está no formato correto:');
        console.log('   Nome | Congregação | Cidade | Telefone | Instrumento | Etapa');
        
        toast({
          title: 'Nenhum dado encontrado',
          description: 'Verifique o console do navegador (F12) para ver o texto extraído e ajustar o formato.',
          variant: 'destructive',
        });
      } else {
        setImportedData(parsedMusicians);
        // Import type set to pdf
        toast({
          title: 'PDF processado!',
          description: `${parsedMusicians.length} músico(s) encontrado(s) no arquivo.`,
        });
      }
    } catch (error) {
      console.error('❌ Error processing PDF:', error);
      toast({
        title: 'Erro ao processar PDF',
        description: 'Não foi possível ler o arquivo PDF. Verifique o console (F12).',
        variant: 'destructive',
      });
    } finally {
      setProcessingPDF(false);
      // Limpar o input para permitir upload do mesmo arquivo novamente
      event.target.value = '';
    }
  };

  const parseExcelData = (data: string[][]): Omit<Musician, 'id' | 'createdAt' | 'updatedAt'>[] => {
    const musicians: Omit<Musician, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    
    // Ignorar a primeira linha (cabeçalho)
    const rows = data.slice(1);

    for (const row of rows) {
      // Verificar se a linha tem todos os campos necessários
      if (row.length < 6) continue;

      const [name, congregationName, city, phone, instrument, stageName] = row.map(cell => 
        String(cell || '').trim()
      );

      // Validar campos vazios
      if (!name || !congregationName || !city || !phone || !instrument || !stageName) {
        continue;
      }

      // Validar instrumento
      if (!INSTRUMENTS.includes(instrument)) {
        console.warn(`Instrumento inválido: ${instrument} para ${name}`);
        continue;
      }

      // Validar etapa
      if (!STAGES.includes(stageName as typeof STAGES[number])) {
        console.warn(`Etapa inválida: ${stageName} para ${name}`);
        continue;
      }

      // Encontrar congregação pelo nome
      const congregation = congregations.find((c: any) => 
        c.name.toLowerCase().includes(congregationName.toLowerCase()) ||
        congregationName.toLowerCase().includes(c.name.toLowerCase())
      );

      if (congregation) {
        musicians.push({
          name,
          congregationId: congregation.id!,
          congregationName: congregation.name,
          city: city || congregation.city,
          phone,
          instrument,
          stage: stageName as typeof STAGES[number],
        });
      } else {
        console.warn(`Congregação não encontrada: ${congregationName} para ${name}`);
      }
    }

    return musicians;
  };

  const parsePDFText = (text: string, lines?: string[]): Omit<Musician, 'id' | 'createdAt' | 'updatedAt'>[] => {
    const musicians: Omit<Musician, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    const textLines = lines || text.split('\n').filter(line => line.trim());

    console.log('🔍 Iniciando parsing do PDF...');
    console.log(`📊 Total de linhas a processar: ${textLines.length}`);

    // Detectar formato do PDF
    let pdfFormat: 'standard' | 'alternative' = 'standard';
    const firstLines = textLines.slice(0, 10).join(' ').toUpperCase();
    
    if (firstLines.includes('LOCALIDADE') && firstLines.includes('NIVEL')) {
      pdfFormat = 'alternative';
      console.log('📋 Formato alternativo detectado (NOME | INSTRUMENTO | LOCALIDADE | NIVEL)');
    } else {
      console.log('📋 Formato padrão detectado (Nome | Congregação | Cidade | Telefone | Instrumento | Etapa)');
    }

    // Mapear níveis para etapas
    const mapNivelToStage = (nivel: string): typeof STAGES[number] | null => {
      const nivelUpper = nivel.toUpperCase().trim();
      
      if (nivelUpper.includes('OFICIALIZADO')) return 'Oficialização';
      if (nivelUpper.includes('CULTO OFICIAL')) return 'Culto Oficial';
      if (nivelUpper.includes('RJM') && !nivelUpper.includes('ENSAIO')) return 'RJM';
      if (nivelUpper.includes('ENSAIO') && !nivelUpper.includes('RJM')) return 'Ensaio';
      if (nivelUpper.includes('RJM') && nivelUpper.includes('ENSAIO')) return 'RJM'; // Priorizar RJM
      
      return null;
    };

    // Padrão esperado: Nome | Congregação | Cidade | Telefone | Instrumento | Etapa
    for (let i = 0; i < textLines.length; i++) {
      const line = textLines[i];
      if (!line.trim()) continue;

      // Pular linhas que parecem ser cabeçalhos ou metadados
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('nome') && (lowerLine.includes('congregação') || lowerLine.includes('instrumento'))) {
        console.log(`⏭️  Pulando cabeçalho na linha ${i + 1}: ${line}`);
        continue;
      }
      if (lowerLine.includes('relatório') || lowerLine.includes('sistema') || lowerLine.includes('gerado em')) {
        console.log(`⏭️  Pulando metadado na linha ${i + 1}: ${line}`);
        continue;
      }

      // Tentar diferentes estratégias de separação
      let parts: string[] = [];
      let separator = '';

      // Estratégia 1: Pipe |
      if (line.includes('|')) {
        parts = line.split('|').map(p => p.trim()).filter(p => p);
        separator = 'pipe (|)';
      }
      
      // Estratégia 2: Tabulação
      if (parts.length < 4 && line.includes('\t')) {
        parts = line.split('\t').map(p => p.trim()).filter(p => p);
        separator = 'tabulação';
      }
      
      // Estratégia 3: Múltiplos espaços (2 ou mais)
      if (parts.length < 4) {
        const spaceParts = line.split(/\s{2,}/).map(p => p.trim()).filter(p => p);
        if (spaceParts.length >= 4) {
          parts = spaceParts;
          separator = 'espaços múltiplos';
        }
      }

      // Estratégia 4: Tentar identificar por padrões conhecidos (telefone, instrumentos)
      if (parts.length < 4) {
        // Buscar telefone no formato (XX) XXXXX-XXXX ou similar
        const phoneMatch = line.match(/\(?\d{2}\)?\s?\d{4,5}-?\d{4}/);
        if (phoneMatch) {
          const phone = phoneMatch[0];
          const beforePhone = line.substring(0, phoneMatch.index).trim();
          const afterPhone = line.substring((phoneMatch.index || 0) + phone.length).trim();
          
          // Tentar extrair campos antes do telefone
          const beforeParts = beforePhone.split(/\s{2,}/).filter(p => p.trim());
          // Tentar extrair campos depois do telefone
          const afterParts = afterPhone.split(/\s{2,}/).filter(p => p.trim());
          
          if (beforeParts.length >= 3 && afterParts.length >= 2) {
            parts = [...beforeParts, phone, ...afterParts];
            separator = 'padrão de telefone';
          }
        }
      }

      // Se ainda não conseguiu separar adequadamente, pular esta linha
      if (parts.length < 4) {
        if (parts.length > 0 && !lowerLine.includes('página') && !lowerLine.includes('total')) {
          console.log(`⚠️  Linha ${i + 1} ignorada (${parts.length} campos): ${line.substring(0, 100)}`);
        }
        continue;
      }

      let name = '';
      let congregationName = '';
      let city = '';
      let phone = '';
      let instrument = '';
      let stageName = '';

      if (pdfFormat === 'alternative') {
        // Formato: NOME | INSTRUMENTO | LOCALIDADE | CARGO/MINISTÉRIO | NIVEL
        if (parts.length >= 4) {
          name = parts[0];
          instrument = parts[1];
          const localidade = parts[2];
          // parts[3] é CARGO/MINISTÉRIO (ignorar)
          const nivel = parts[parts.length - 1]; // Último campo é NIVEL

          // Extrair congregação e cidade da localidade (ex: "RECANTO DAS ACÁCIAS - CAPINÓPOLIS")
          if (localidade.includes(' - ')) {
            const localParts = localidade.split(' - ').map(p => p.trim());
            congregationName = localParts[0];
            city = localParts[localParts.length - 1];
          } else {
            congregationName = localidade;
            city = localidade;
          }

          // Mapear NIVEL para etapa válida
          const mappedStage = mapNivelToStage(nivel);
          if (mappedStage) {
            stageName = mappedStage;
          } else {
            stageName = nivel; // Tentar usar o valor original
          }

          phone = ''; // Não tem telefone neste formato
        }
      } else {
        // Formato padrão: Nome | Congregação | Cidade | Telefone | Instrumento | Etapa
        if (parts.length >= 6) {
          [name, congregationName, city, phone, instrument, stageName] = parts;
        }
      }

      console.log(`\n📝 Linha ${i + 1} (${separator}):`);
      console.log(`   Nome: "${name}"`);
      console.log(`   Instrumento: "${instrument}"`);
      console.log(`   Congregação: "${congregationName}"`);
      console.log(`   Cidade: "${city}"`);
      console.log(`   Telefone: "${phone || '(não informado)'}"`);
      console.log(`   Etapa: "${stageName}"`);

      // Validar campos obrigatórios
      if (!name || !congregationName || !instrument || !stageName) {
        console.log(`   ❌ Campos vazios detectados`);
        continue;
      }

      // Validar instrumento
      if (!INSTRUMENTS.includes(instrument)) {
        console.log(`   ❌ Instrumento inválido: "${instrument}"`);
        console.log(`   💡 Instrumentos válidos: ${INSTRUMENTS.join(', ')}`);
        
        // Tentar encontrar instrumento similar
        const similarInstrument = INSTRUMENTS.find(i => 
          i.toLowerCase().includes(instrument.toLowerCase()) ||
          instrument.toLowerCase().includes(i.toLowerCase())
        );
        if (similarInstrument) {
          console.log(`   🔄 Usando instrumento similar: "${similarInstrument}"`);
          instrument = similarInstrument;
        } else {
          continue;
        }
      }

      // Validar etapa
      if (!STAGES.includes(stageName as typeof STAGES[number])) {
        console.log(`   ❌ Etapa inválida: "${stageName}"`);
        console.log(`   💡 Etapas válidas: ${STAGES.join(', ')}`);
        continue;
      }

      // Encontrar congregação pelo nome
      const congregation = congregations.find((c: any) => 
        c.name.toLowerCase().includes(congregationName.toLowerCase()) ||
        congregationName.toLowerCase().includes(c.name.toLowerCase())
      );

      if (congregation) {
        console.log(`   ✅ Congregação encontrada: ${congregation.name}`);
        musicians.push({
          name,
          congregationId: congregation.id!,
          congregationName: congregation.name,
          city: city || congregation.city,
          phone: phone || '',
          instrument,
          stage: stageName as typeof STAGES[number],
        });
      } else {
        console.log(`   ⚠️  Congregação não encontrada: "${congregationName}"`);
        console.log(`   💡 Cadastrando com nome do PDF. Congregações disponíveis: ${congregations.map((c: any) => c.name).slice(0, 5).join(', ')}...`);
        
        // Criar um ID temporário baseado no nome da congregação
        const tempId = `temp_${congregationName.toLowerCase().replace(/\s+/g, '_')}`;
        
        musicians.push({
          name,
          congregationId: tempId,
          congregationName: congregationName,
          city: city || 'Não informada',
          phone: phone || '',
          instrument,
          stage: stageName as typeof STAGES[number],
        });
      }
    }

    console.log(`\n✅ Total de músicos válidos encontrados: ${musicians.length}`);
    return musicians;
  };

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx?|csv)$/i)) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV.',
        variant: 'destructive',
      });
      return;
    }

    setProcessingPDF(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Pegar a primeira planilha
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data: string[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      // Parsear os dados do Excel
      const parsedMusicians = parseExcelData(data);
      
      if (parsedMusicians.length === 0) {
        toast({
          title: 'Nenhum dado encontrado',
          description: 'Não foi possível extrair dados do arquivo. Verifique o formato.',
          variant: 'destructive',
        });
      } else {
        setImportedData(parsedMusicians);
        // Import type set to excel
        toast({
          title: 'Arquivo processado!',
          description: `${parsedMusicians.length} músico(s) encontrado(s) no arquivo.`,
        });
      }
    } catch (error) {
      console.error('Error processing Excel:', error);
      toast({
        title: 'Erro ao processar arquivo',
        description: 'Não foi possível ler o arquivo Excel/CSV.',
        variant: 'destructive',
      });
    } finally {
      setProcessingPDF(false);
      event.target.value = '';
    }
  };

  const handleConfirmImport = async () => {
    if (importedData.length === 0) return;

    setSavingImportedData(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const musician of importedData) {
        try {
          await musicianService.create(musician);
          successCount++;
        } catch (error) {
          console.error('Error importing musician:', musician.name, error);
          errorCount++;
        }
      }

      toast({
        title: 'Importação concluída!',
        description: `${successCount} músico(s) importado(s) com sucesso${errorCount > 0 ? `. ${errorCount} falha(s).` : '.'}`,
      });

      // Limpar dados e fechar diálogo
      setImportedData([]);
      // Import type reset
      setImportDialogOpen(false);
      loadMusicians();
    } catch (error) {
      console.error('Error during import:', error);
      toast({
        title: 'Erro na importação',
        description: 'Ocorreu um erro ao importar os dados.',
        variant: 'destructive',
      });
    } finally {
      setSavingImportedData(false);
    }
  };

  const handleCancelImport = () => {
    setImportedData([]);
    setImportDialogOpen(false);
  };

  // Aplicar filtros
  const filteredMusicians = musicians.filter((musician) => {
    if (filterInstrument && musician.instrument !== filterInstrument) return false;
    if (filterStage && musician.stage !== filterStage) return false;
    if (filterCongregation && musician.congregationId !== filterCongregation) return false;
    if (searchTerm && !musician.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Agrupar por etapa
  const musiciansByStage = STAGES.reduce((acc, s) => {
    acc[s] = filteredMusicians.filter(m => m.stage === s);
    return acc;
  }, {} as Record<string, Musician[]>);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Ensaio': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'RJM': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Culto Oficial': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Oficialização': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  // Mapear dias da semana para índices (0 = Domingo, 6 = Sábado)
  const dayToIndex: Record<string, number> = {
    'domingo': 0,
    'segunda': 1,
    'terca': 2,
    'quarta': 3,
    'quinta': 4,
    'sexta': 5,
    'sabado': 6,
  };

  // Função para gerar ensaios recorrentes das congregações
  const generateRecurringRehearsals = (): EnsaioData[] => {
    const generated: EnsaioData[] = [];
    
    // Determinar período baseado nos filtros
    const year = parseInt(filterCalendarYear || new Date().getFullYear().toString());
    let startDate: Date;
    let endDate: Date;

    if (filterCalendarMonth === 'all') {
      // Próximos 3 meses
      startDate = new Date();
      endDate = addMonths(startDate, 3);
    } else if (filterCalendarMonth === 'annual') {
      // Ano inteiro
      startDate = startOfYear(new Date(year, 0, 1));
      endDate = endOfYear(new Date(year, 0, 1));
    } else if (filterCalendarMonth) {
      // Mês específico
      const monthIndex = parseInt(filterCalendarMonth) - 1;
      startDate = startOfMonth(new Date(year, monthIndex, 1));
      endDate = endOfMonth(new Date(year, monthIndex, 1));
    } else {
      startDate = new Date();
      endDate = addMonths(startDate, 3);
    }

    // Filtrar congregações
    let filteredCongregations = congregations;
    
    if (filterCalendarCongregation && filterCalendarCongregation !== 'all') {
      filteredCongregations = congregations.filter((c: any) => c.id === filterCalendarCongregation);
    }
    
    if (filterCalendarCity && filterCalendarCity !== 'all') {
      filteredCongregations = filteredCongregations.filter((c: any) => c.city === filterCalendarCity);
    }

    // Para cada congregação, gerar ensaios baseado nas configurações salvas
    filteredCongregations.forEach((congregation: any) => {
      if (!congregation.rehearsals || congregation.rehearsals.length === 0) return;

      congregation.rehearsals.forEach((rehearsal: any) => {
        // Filtrar por tipo de ensaio
        const rehearsalType = rehearsal.type.toLowerCase() as 'local' | 'regional' | 'gem' | 'geral' | 'darpe';
        if (filterCalendarType && filterCalendarType !== 'all' && filterCalendarType !== rehearsalType) {
          return;
        }

        const dates: Date[] = [];

        // Ensaio Agendado (data específica)
        if (rehearsal.recurrenceType === 'Agendado') {
          if (rehearsal.date) {
            const rehearsalDate = rehearsal.date instanceof Date ? rehearsal.date : new Date(rehearsal.date);
            if (rehearsalDate >= startDate && rehearsalDate <= endDate) {
              dates.push(rehearsalDate);
            }
          }
        } 
        // Ensaio Semanal ou Mensal
        else if (rehearsal.day) {
          const dayIndex = dayToIndex[rehearsal.day.toLowerCase()];
          if (dayIndex !== undefined) {
            const monthsToProcess = rehearsal.recurrenceType === 'Mensal' && rehearsal.months && rehearsal.months.length > 0
              ? rehearsal.months
              : Array.from({ length: 12 }, (_, i) => i + 1);
            
            monthsToProcess.forEach((month: any) => {
              const firstDay = new Date(year, month - 1, 1);
              const lastDay = new Date(year, month, 0);
              
              // Verificar se o mês está dentro do período filtrado
              if (lastDay < startDate || firstDay > endDate) return;
              
              // Encontrar o primeiro dia da semana alvo no mês
              const currentDate = new Date(firstDay);
              while (currentDate.getDay() !== dayIndex) {
                currentDate.setDate(currentDate.getDate() + 1);
                if (currentDate > lastDay) break;
              }
              
              // Se for ensaio mensal com semana específica
              if (rehearsal.recurrenceType === 'Mensal' && rehearsal.weekOfMonth) {
                const weeksToAdvance = rehearsal.weekOfMonth - 1;
                currentDate.setDate(currentDate.getDate() + (weeksToAdvance * 7));
                
                if (currentDate <= lastDay && currentDate >= startDate && currentDate <= endDate) {
                  dates.push(new Date(currentDate));
                }
              } 
              // Ensaio semanal - pegar apenas o primeiro de cada mês
              else {
                if (currentDate <= lastDay && currentDate >= startDate && currentDate <= endDate) {
                  dates.push(new Date(currentDate));
                }
              }
            });
          }
        }

        // Criar os objetos EnsaioData
        dates.forEach(date => {
          generated.push({
            id: `${congregation.id}-${format(date, 'yyyy-MM-dd')}-${rehearsal.type}`,
            congregationId: congregation.id!,
            congregationName: congregation.name,
            date: date,
            type: rehearsalType,
            instrumentos: {
              clarinete: 0,
              clarone: 0,
              saxSoprano: 0,
              saxAlto: 0,
              saxTenor: 0,
              saxBaritono: 0,
              trompete: 0,
              flugelhorn: 0,
              euphonio: 0,
              trombone: 0,
              trombonito: 0,
              tuba: 0,
              viola: 0,
              violino: 0,
              cello: 0,
              organista: 0,
            },
          });
        });
      });
    });

    return generated;
  };

  // Função para filtrar ensaios
  const getFilteredEnsaios = () => {
    // Combinar ensaios salvos + ensaios recorrentes gerados das configurações das congregações
    const recurringRehearsals = generateRecurringRehearsals();
    let filtered = [...ensaios, ...recurringRehearsals];

    console.log('Ensaios salvos no banco:', ensaios.length);
    console.log('Ensaios recorrentes gerados:', recurringRehearsals.length);
    console.log('Total combinado:', filtered.length);
    console.log('Tipos de ensaios gerados:', recurringRehearsals.map(e => `${e.congregationName} - ${e.type}`));

    // Filtro por ano
    if (filterCalendarYear) {
      const year = parseInt(filterCalendarYear);
      filtered = filtered.filter(e => getYear(e.date) === year);
    }

    // Filtro por congregação
    if (filterCalendarCongregation && filterCalendarCongregation !== 'all') {
      filtered = filtered.filter(e => e.congregationId === filterCalendarCongregation);
    }

    // Filtro por cidade
    if (filterCalendarCity && filterCalendarCity !== 'all') {
      filtered = filtered.filter(e => {
        const cong = congregations.find((c: any) => c.id === e.congregationId);
        return cong?.city === filterCalendarCity;
      });
    }

    // Filtro por mês
    if (filterCalendarMonth && filterCalendarMonth !== 'all' && filterCalendarMonth !== 'annual') {
      const monthIndex = parseInt(filterCalendarMonth) - 1; // Ajustar para índice 0-based
      filtered = filtered.filter(e => getMonth(e.date) === monthIndex);
    }

    // Filtro por tipo de ensaio
    if (filterCalendarType && filterCalendarType !== 'all') {
      filtered = filtered.filter(e => e.type === filterCalendarType);
    }

    console.log('Após filtros:', filtered.length);
    return filtered;
  };

  // Função para gerar calendário em Excel
  const exportToExcel = async () => {
    await loadEnsaios();
    const filteredEnsaios = getFilteredEnsaios();
    
    if (filteredEnsaios.length === 0) {
      toast({
        title: 'Nenhum ensaio encontrado',
        description: 'Não há ensaios cadastrados com os filtros selecionados.',
        variant: 'destructive',
      });
      return;
    }

    const worksheetData: (string | number)[][] = [];

    // Título e filtros aplicados
    worksheetData.push(['CALENDÁRIO DE ENSAIOS MUSICAIS']);
    worksheetData.push([]);
    
    const filters = [];
    if (filterCalendarCongregation) {
      const cong = congregations.find((c: any) => c.id === filterCalendarCongregation);
      filters.push(`Congregação: ${cong?.name}`);
    }
    if (filterCalendarCity) {
      filters.push(`Cidade: ${filterCalendarCity}`);
    }
    if (filterCalendarType && filterCalendarType !== 'all') {
      const tipoLabel = filterCalendarType === 'local' ? 'Local' : 
                       filterCalendarType === 'regional' ? 'Regional' :
                       filterCalendarType === 'gem' ? 'GEM' : 
                       filterCalendarType === 'darpe' ? 'DARPE' : 'Geral';
      filters.push(`Tipo: ${tipoLabel}`);
    }
    if (filterCalendarMonth && filterCalendarMonth !== 'all' && filterCalendarMonth !== 'annual') {
      const monthName = format(new Date(2000, parseInt(filterCalendarMonth) - 1, 1), 'MMMM');
      filters.push(`Mês: ${monthName}`);
    } else if (filterCalendarMonth === 'annual') {
      filters.push(`Período: Anual`);
    }
    filters.push(`Ano: ${filterCalendarYear}`);
    
    filters.forEach(f => worksheetData.push([f]));
    worksheetData.push([]);
    worksheetData.push(['Data', 'Congregação', 'Tipo', 'Cidade']);

    // Ordenar por data
    const sortedEnsaios = filteredEnsaios.sort((a, b) => a.date.getTime() - b.date.getTime());

    sortedEnsaios.forEach(ensaio => {
      const congregation = congregations.find((c: any) => c.id === ensaio.congregationId);
      const tipoLabel = ensaio.type === 'regional' ? 'Regional' : 
                       ensaio.type === 'local' ? 'Local' :
                       ensaio.type === 'gem' ? 'GEM' : 
                       ensaio.type === 'darpe' ? 'DARPE' : 'Geral';
      worksheetData.push([
        format(ensaio.date, 'dd/MM/yyyy'),
        ensaio.congregationName,
        tipoLabel,
        congregation?.city || '-',
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ensaios');

    const fileName = `calendario-ensaios-${filterCalendarYear}${filterCalendarMonth === 'annual' ? '-anual' : filterCalendarMonth && filterCalendarMonth !== 'all' ? `-${filterCalendarMonth.padStart(2, '0')}` : ''}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: 'Calendário exportado!',
      description: 'O arquivo Excel foi gerado com sucesso.',
    });
    
    setCalendarDialogOpen(false);
  };

  // Função para gerar calendário em PDF
  const exportToPDF = async () => {
    await loadEnsaios();
    const filteredEnsaios = getFilteredEnsaios();
    
    if (filteredEnsaios.length === 0) {
      toast({
        title: 'Nenhum ensaio encontrado',
        description: 'Não há ensaios cadastrados com os filtros selecionados.',
        variant: 'destructive',
      });
      return;
    }

    const doc = new jsPDF('landscape');
    
    // Configurar fonte e cores
    doc.setFont('helvetica');
    
    // Cabeçalho
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('CONGREGAÇÃO CRISTÃ NO BRASIL', doc.internal.pageSize.getWidth() / 2, 10, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text('Administração Ituiutaba-MG', doc.internal.pageSize.getWidth() / 2, 16, { align: 'center' });
    
    doc.setFontSize(11);
    doc.text(`Calendário de Ensaios Musicais ${filterCalendarYear}`, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });
    
    // Filtros
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(60, 60, 60);
    let filterText = '';
    if (filterCalendarCongregation && filterCalendarCongregation !== 'all') {
      const cong = congregations.find((c: any) => c.id === filterCalendarCongregation);
      filterText += `Congregação: ${cong?.name}  `;
    }
    if (filterCalendarCity && filterCalendarCity !== 'all') {
      filterText += `Cidade: ${filterCalendarCity}  `;
    }
    if (filterText) {
      doc.text(filterText, doc.internal.pageSize.getWidth() / 2, 27, { align: 'center' });
    }
    
    let yPos = 32;
    
    // Agrupar ensaios por tipo (case-insensitive)
    const ensaiosPorTipo: Record<string, typeof filteredEnsaios> = {
      'regional': filteredEnsaios.filter(e => e.type.toLowerCase() === 'regional'),
      'local': filteredEnsaios.filter(e => e.type.toLowerCase() === 'local'),
      'gem': filteredEnsaios.filter(e => e.type.toLowerCase() === 'gem'),
      'geral': filteredEnsaios.filter(e => e.type.toLowerCase() === 'geral'),
      'darpe': filteredEnsaios.filter(e => e.type.toLowerCase() === 'darpe'),
    };
    
    const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    
    // ENSAIOS REGIONAIS, GEM, GERAIS e DARPE (sem agrupamento por cidade)
    ['regional', 'gem', 'geral', 'darpe'].forEach(tipoEnsaio => {
      const ensaiosDoTipo = ensaiosPorTipo[tipoEnsaio];
      if (ensaiosDoTipo.length === 0) return;
      
      const ensaiosPorCongregacao = ensaiosDoTipo.reduce((acc, ensaio) => {
        if (!acc[ensaio.congregationId]) {
          acc[ensaio.congregationId] = [];
        }
        acc[ensaio.congregationId].push(ensaio);
        return acc;
      }, {} as Record<string, typeof filteredEnsaios>);
      
      const tableData = Object.entries(ensaiosPorCongregacao).map(([congId, ensaios]) => {
        const cong = congregations.find((c: any) => c.id === congId);
        const ensaioPorMes: Record<number, number> = {};
        
        (ensaios as any).forEach((e: any) => {
          const mes = e.date.getMonth();
          if (!ensaioPorMes[mes]) {
            ensaioPorMes[mes] = e.date.getDate();
          }
        });

        const primeiroEnsaio = (ensaios as any)[0];
        const diaSemana = format(primeiroEnsaio.date, 'EEEE').substring(0, 3);
        const hora = cong?.rehearsals?.find((r: any) => r.type.toLowerCase() === tipoEnsaio)?.time || '09h00';

        const row = [
          cong?.city ? `${cong.city} - ${cong.name}` : (cong?.name || ''),
          diaSemana,
          hora,
        ];
        
        meses.forEach((_, idx) => {
          row.push(ensaioPorMes[idx] ? ensaioPorMes[idx].toString() : '-');
        });
        
        return row;
      });

      if (yPos > 160) {
        doc.addPage();
        yPos = 15;
      }

      const tipoLabel = tipoEnsaio === 'regional' ? 'REGIONAIS' : 
                       tipoEnsaio === 'gem' ? 'GEM' : 
                       tipoEnsaio === 'geral' ? 'GERAIS' : 
                       tipoEnsaio === 'darpe' ? 'DARPE' : '';

      autoTable(doc, {
        startY: yPos,
        head: [
          [{ content: `ENSAIOS ${tipoLabel}`, colSpan: 15, styles: { halign: 'center', fillColor: [30, 58, 138], textColor: 255, fontSize: 8, fontStyle: 'bold' } }],
          ['LOCALIDADE', 'DIA', 'HORA', ...meses]
        ],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [209, 213, 219],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 6.5,
          halign: 'center',
        },
        bodyStyles: {
          fontSize: 6,
          textColor: [0, 0, 0],
        },
        columnStyles: {
          0: { cellWidth: 32, halign: 'left' },
          1: { cellWidth: 11, halign: 'center' },
          2: { cellWidth: 11, halign: 'center' },
        },
        styles: {
          cellPadding: 1.5,
          lineColor: [100, 100, 100],
          lineWidth: 0.1,
          halign: 'center',
        },
      });

      yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3;
    });

    // ENSAIOS LOCAIS POR CIDADE
    const locais = ensaiosPorTipo['local'];
    if (locais.length > 0) {
      const locaisPorCidade = locais.reduce((acc, ensaio) => {
        const cong = congregations.find((c: any) => c.id === ensaio.congregationId);
        // Chaveslândia é distrito de Santa Vitória
        let cidade = cong?.city || 'Sem cidade';
        if (cong?.name.toLowerCase().includes('chaveslândia') || cong?.name.toLowerCase().includes('chaveslandia')) {
          cidade = 'Santa Vitória';
        }
        // Normalizar o nome da cidade para evitar duplicação
        cidade = cidade.trim();
        if (!acc[cidade]) {
          acc[cidade] = {};
        }
        if (!acc[cidade][ensaio.congregationId]) {
          acc[cidade][ensaio.congregationId] = [];
        }
        acc[cidade][ensaio.congregationId].push(ensaio);
        return acc;
      }, {} as Record<string, Record<string, typeof filteredEnsaios>>);
      Object.entries(locaisPorCidade).forEach(([cidade, congregacoes]) => {
        if (yPos > 160) {
          doc.addPage();
          yPos = 15;
        }

        const tableData = Object.entries(congregacoes as any)
          .sort(([idA], [idB]) => {
            const congA = congregations.find((c: any) => c.id === idA);
            const congB = congregations.find((c: any) => c.id === idB);
            return (congA?.name || '').localeCompare(congB?.name || '');
          })
          .map(([congId, ensaios]) => {
          const cong = congregations.find((c: any) => c.id === congId);
          const ensaioPorMes: Record<number, number> = {};
          
          (ensaios as any).forEach((e: any) => {
            const mes = e.date.getMonth();
            if (!ensaioPorMes[mes]) {
              ensaioPorMes[mes] = e.date.getDate();
            }
          });

          const primeiroEnsaio = (ensaios as any)[0];
          const diaSemana = format(primeiroEnsaio.date, 'EEEE').substring(0, 3);
          const hora = cong?.rehearsals?.find((r: any) => r.type.toLowerCase() === 'local')?.time || '19h30';

          const row = [
            cong?.name || '',
            diaSemana,
            hora,
          ];
          
          meses.forEach((_, idx) => {
            row.push(ensaioPorMes[idx] ? ensaioPorMes[idx].toString() : '-');
          });
          
          return row;
        });

        autoTable(doc, {
          startY: yPos,
          head: [
            [{ content: 'ENSAIOS LOCAIS', colSpan: 15, styles: { halign: 'center', fillColor: [30, 58, 138], textColor: 255, fontSize: 8, fontStyle: 'bold' } }],
            [{ content: cidade.toUpperCase(), colSpan: 15, styles: { halign: 'center', fillColor: [30, 58, 138], textColor: 255, fontSize: 7.5, fontStyle: 'bold' } }],
            ['LOCALIDADE', 'DIA', 'HORA', ...meses]
          ],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [209, 213, 219],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            fontSize: 6.5,
            halign: 'center',
          },
          bodyStyles: {
            fontSize: 6,
            textColor: [0, 0, 0],
          },
          columnStyles: {
            0: { cellWidth: 32, halign: 'left' },
            1: { cellWidth: 11, halign: 'center' },
            2: { cellWidth: 11, halign: 'center' },
          },
          styles: {
            cellPadding: 1.5,
            lineColor: [100, 100, 100],
            lineWidth: 0.1,
            halign: 'center',
          },
        });

        yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3;
      });
    }

    // Rodapé
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Total de ensaios: ${filteredEnsaios.length} | Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 7,
        { align: 'center' }
      );
    }

    const fileName = `calendario-ensaios-${filterCalendarYear}${filterCalendarMonth === 'annual' ? '-anual' : filterCalendarMonth && filterCalendarMonth !== 'all' ? `-${filterCalendarMonth.padStart(2, '0')}` : ''}.pdf`;
    doc.save(fileName);

    toast({
      title: 'Calendário exportado!',
      description: 'O arquivo PDF foi gerado com sucesso.',
    });
    
    setCalendarDialogOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Musical</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie músicos e organistas da região
            </p>
          </div>
          
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <FileUp className="h-4 w-4" />
                  Importar Dados
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Importar PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Importar Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setFrequenciaDialogOpen(true)}
            >
              <Music className="h-4 w-4" />
              Frequência de Ensaios
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => {
                loadEnsaios();
                setCalendarDialogOpen(true);
              }}
            >
              <Calendar className="h-4 w-4" />
              Calendário de Ensaios
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Modal Frequência de Ensaios */}
        <Dialog open={frequenciaDialogOpen} onOpenChange={setFrequenciaDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Lançar Frequência de Ensaios</DialogTitle>
              <DialogDescription>
                Preencha os dados para registrar a frequência dos ensaios.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end pb-2">
              <Button variant="secondary" size="sm" onClick={handleImprimirFrequencia}>
                <Printer className="h-4 w-4 mr-1" /> Imprimir Frequência
              </Button>
            </div>
            <form className="space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              const congregation = congregations.find((c: any) => c.id === frequenciaCongregacaoId);
              if (!frequenciaTipo || !frequenciaData || !frequenciaCongregacaoId || !congregation) {
                toast({ title: 'Campos obrigatórios', description: 'Preencha todos os campos obrigatórios.', variant: 'destructive' });
                return;
              }
              if (frequenciaTipo === 'regional' && (!frequenciaAnciao || !frequenciaEncarregado)) {
                toast({ title: 'Campos obrigatórios', description: 'Informe o nome do Ancião e Encarregado Regional.', variant: 'destructive' });
                return;
              }
              try {
                await ensaioDataService.create({
                  congregationId: frequenciaCongregacaoId,
                  congregationName: congregation.name,
                  date: new Date(frequenciaData),
                  type: frequenciaTipo,
                  instrumentos: frequenciaInstrumentos,
                  anciao: frequenciaTipo === 'regional' ? frequenciaAnciao : undefined,
                  encarregado: frequenciaTipo === 'regional' ? frequenciaEncarregado : undefined,
                });
                toast({ title: 'Frequência lançada!', description: 'Frequência de ensaio registrada com sucesso.' });
                setFrequenciaDialogOpen(false);
                // Resetar formulário
                setFrequenciaTipo('local');
                setFrequenciaData(format(new Date(), 'yyyy-MM-dd'));
                setFrequenciaCongregacaoId('');
                setFrequenciaAnciao('');
                setFrequenciaEncarregado('');
                setFrequenciaInstrumentos({
                  clarinete: 0, clarone: 0, saxSoprano: 0, saxAlto: 0, saxTenor: 0, saxBaritono: 0,
                  trompete: 0, flugelhorn: 0, euphonio: 0, trombone: 0, trombonito: 0, tuba: 0,
                  viola: 0, violino: 0, cello: 0, organista: 0
                });
              } catch (err) {
                toast({ title: 'Erro ao lançar frequência', description: 'Ocorreu um erro ao salvar.', variant: 'destructive' });
              }
            }}>
              <div className="space-y-2">
                <Label htmlFor="frequencia-tipo">Tipo de Ensaio *</Label>
                <Select value={frequenciaTipo} onValueChange={(v: any) => setFrequenciaTipo(v as 'local' | 'regional' | 'gem' | 'geral' | 'darpe')}>
                  <SelectTrigger id="frequencia-tipo">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regional">Regional</SelectItem>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="gem">GEM</SelectItem>
                    <SelectItem value="geral">Geral</SelectItem>
                    <SelectItem value="darpe">DARPE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequencia-data">Data *</Label>
                <Input
                  id="frequencia-data"
                  type="date"
                  value={frequenciaData}
                  onChange={(e: any) => setFrequenciaData(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequencia-congregacao">Congregação *</Label>
                <Select value={frequenciaCongregacaoId} onValueChange={setFrequenciaCongregacaoId}>
                  <SelectTrigger id="frequencia-congregacao">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {congregations.map((cong: any) => (
                      <SelectItem key={cong.id} value={cong.id!}>{cong.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {frequenciaTipo === 'regional' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="frequencia-anciao">Nome do Ancião *</Label>
                    <Input id="frequencia-anciao" value={frequenciaAnciao} onChange={(e: any) => setFrequenciaAnciao(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequencia-encarregado">Encarregado Regional *</Label>
                    <Input id="frequencia-encarregado" value={frequenciaEncarregado} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFrequenciaEncarregado(e.target.value)} />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label>Instrumentos (quantidade)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(frequenciaInstrumentos).map((inst) => (
                    <div key={inst} className="flex items-center gap-2">
                      <span className="capitalize">{inst}</span>
                      <Input
                        type="number"
                        min={0}
                        value={frequenciaInstrumentos[inst as keyof typeof frequenciaInstrumentos]}
                        onChange={(e: any) => setFrequenciaInstrumentos({
                          ...frequenciaInstrumentos,
                          [inst]: Number(e.target.value)
                        })}
                        className="w-16"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button variant="outline" type="button" onClick={() => setFrequenciaDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar Frequência</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Formulário de cadastro */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Cadastrar Músico/Organista
              </CardTitle>
              <CardDescription>Adicione novos músicos da região</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="musician-name">Nome *</Label>
                <Input
                  id="musician-name"
                  placeholder="Nome completo"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="musician-congregation">Comum Congregação *</Label>
                <Select value={selectedCongregationId} onValueChange={setSelectedCongregationId}>
                  <SelectTrigger id="musician-congregation">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {congregations.map((cong: any) => (
                      <SelectItem key={cong.id} value={cong.id!}>
                        {cong.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="musician-city">Cidade *</Label>
                <Input
                  id="musician-city"
                  placeholder="Cidade"
                  value={city}
                  onChange={(e: any) => setCity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="musician-phone">Telefone *</Label>
                <Input
                  id="musician-phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e: any) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="musician-instrument">Instrumento *</Label>
                <Select value={instrument} onValueChange={setInstrument}>
                  <SelectTrigger id="musician-instrument">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTRUMENTS.map((inst) => (
                      <SelectItem key={inst} value={inst}>
                        {inst}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="musician-stage">Etapa *</Label>
                <Select value={stage} onValueChange={(v: any) => setStage(v as typeof STAGES[number])}>
                  <SelectTrigger id="musician-stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAddMusician}
                disabled={savingMusician}
                className="w-full"
              >
                {savingMusician ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Lista de músicos */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Músicos e Organistas
              </CardTitle>
              <CardDescription>
                Total: {filteredMusicians.length} músico{filteredMusicians.length !== 1 ? 's' : ''}
              </CardDescription>
              
              {/* Filtros */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar nome..."
                    value={searchTerm}
                    onChange={(e: any) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={filterInstrument} onValueChange={setFilterInstrument}>
                  <SelectTrigger>
                    <SelectValue placeholder="Instrumento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">Todos</SelectItem>
                    {INSTRUMENTS.map((inst) => (
                      <SelectItem key={inst} value={inst}>
                        {inst}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStage} onValueChange={setFilterStage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">Todas</SelectItem>
                    {STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterCongregation} onValueChange={setFilterCongregation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Congregação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">Todas</SelectItem>
                    {congregations.map((cong: any) => (
                      <SelectItem key={cong.id} value={cong.id!}>
                        {cong.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingMusicians ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredMusicians.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Nenhum músico encontrado</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {STAGES.map((stageName) => {
                    const stageMusicians = musiciansByStage[stageName];
                    if (stageMusicians.length === 0) return null;

                    return (
                      <div key={stageName} className="space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-border">
                          <Badge className={getStageColor(stageName)}>
                            {stageName}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            ({stageMusicians.length})
                          </span>
                        </div>
                        <div className="grid gap-2">
                          {stageMusicians.map((musician) => (
                            <div
                              key={musician.id}
                              className="flex items-start justify-between p-3 rounded-lg bg-secondary/20 border border-secondary/40"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold">{musician.name}</h3>
                                  <Badge variant="outline">{musician.instrument}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {musician.congregationName} • {musician.city}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  📞 {musician.phone}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => confirmDelete(musician.id!, musician.name)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Importar Músicos</DialogTitle>
            <DialogDescription>
              Selecione um arquivo PDF ou Excel/CSV contendo dados de músicos
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {importedData.length === 0 ? (
              <Tabs defaultValue="pdf" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="pdf">
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </TabsTrigger>
                  <TabsTrigger value="excel">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel/CSV
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="pdf" className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <Label htmlFor="pdf-upload" className="cursor-pointer">
                      <div className="text-sm font-medium mb-2">
                        {processingPDF ? 'Processando PDF...' : 'Clique para selecionar um arquivo PDF'}
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">
                        Formato esperado: Nome | Congregação | Cidade | Telefone | Instrumento | Etapa
                      </div>
                      <Button variant="outline" size="sm" type="button">
                        <FileText className="h-4 w-4 mr-2" />
                        Selecionar PDF
                      </Button>
                    </Label>
                    <Input
                      id="pdf-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handlePDFUpload}
                      disabled={processingPDF}
                      className="hidden"
                    />
                    {processingPDF && (
                      <div className="mt-4 flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="excel" className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <Label htmlFor="excel-upload" className="cursor-pointer">
                      <div className="text-sm font-medium mb-2">
                        {processingPDF ? 'Processando arquivo...' : 'Clique para selecionar um arquivo Excel ou CSV'}
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">
                        Formato esperado: Colunas - Nome | Congregação | Cidade | Telefone | Instrumento | Etapa
                      </div>
                      <Button variant="outline" size="sm" type="button">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Selecionar Excel/CSV
                      </Button>
                    </Label>
                    <Input
                      id="excel-upload"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleExcelUpload}
                      disabled={processingPDF}
                      className="hidden"
                    />
                    {processingPDF && (
                      <div className="mt-4 flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Music className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Dados Prontos para Importação</p>
                      <p className="text-sm text-muted-foreground">
                        {importedData.length} músico(s) encontrado(s) • Revise antes de confirmar
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelImport}
                  >
                    Limpar
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between px-2">
                    <Label className="text-xs text-muted-foreground uppercase">Preview dos Dados</Label>
                    <span className="text-xs text-muted-foreground">
                      {importedData.length} {importedData.length === 1 ? 'registro' : 'registros'}
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto space-y-2 border rounded-lg p-4 bg-muted/30">
                    {importedData.map((musician, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between p-3 rounded-lg bg-secondary/20 border border-secondary/40"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{musician.name}</h3>
                            <Badge variant="outline">{musician.instrument}</Badge>
                            <Badge className={getStageColor(musician.stage)}>
                              {musician.stage}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {musician.congregationName} • {musician.city}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            📞 {musician.phone}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {importedData.length > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancelImport}
                  disabled={savingImportedData}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmImport}
                  disabled={savingImportedData}
                >
                  {savingImportedData ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Confirmar e Importar
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calendar Filter Dialog */}
      <Dialog open={calendarDialogOpen} onOpenChange={setCalendarDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Exportar Calendário de Ensaios</DialogTitle>
            <DialogDescription>
              {loadingEnsaios ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Carregando ensaios...
                </span>
              ) : (
                <>
                  {ensaios.length} ensaio{ensaios.length !== 1 ? 's' : ''} encontrado{ensaios.length !== 1 ? 's' : ''} • Escolha os filtros para gerar o calendário
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Filtro de Congregação */}
            <div className="space-y-2">
              <Label>Congregação</Label>
              <Select
                value={filterCalendarCongregation}
                onValueChange={setFilterCalendarCongregation}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {congregations.map((cong: any) => (
                    <SelectItem key={cong.id} value={cong.id!}>
                      {cong.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Cidade */}
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Select
                value={filterCalendarCity}
                onValueChange={setFilterCalendarCity}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Array.from(new Set(congregations.map((c: any) => c.city)))
                    .sort()
                    .map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Tipo de Ensaio */}
            <div className="space-y-2">
              <Label>Tipo de Ensaio</Label>
              <Select
                value={filterCalendarType}
                onValueChange={(value: any) => setFilterCalendarType(value as 'all' | 'local' | 'regional' | 'gem' | 'geral' | 'darpe')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="regional">Regional</SelectItem>
                  <SelectItem value="gem">GEM</SelectItem>
                  <SelectItem value="geral">Geral</SelectItem>
                  <SelectItem value="darpe">DARPE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Mês */}
            <div className="space-y-2">
              <Label>Mês</Label>
              <Select
                value={filterCalendarMonth}
                onValueChange={setFilterCalendarMonth}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Próximos 3 meses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Próximos 3 meses</SelectItem>
                  <SelectItem value="annual">Anual (12 meses)</SelectItem>
                  <SelectItem value="1">Janeiro</SelectItem>
                  <SelectItem value="2">Fevereiro</SelectItem>
                  <SelectItem value="3">Março</SelectItem>
                  <SelectItem value="4">Abril</SelectItem>
                  <SelectItem value="5">Maio</SelectItem>
                  <SelectItem value="6">Junho</SelectItem>
                  <SelectItem value="7">Julho</SelectItem>
                  <SelectItem value="8">Agosto</SelectItem>
                  <SelectItem value="9">Setembro</SelectItem>
                  <SelectItem value="10">Outubro</SelectItem>
                  <SelectItem value="11">Novembro</SelectItem>
                  <SelectItem value="12">Dezembro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Ano */}
            <div className="space-y-2">
              <Label>Ano</Label>
              <Select
                value={filterCalendarYear}
                onValueChange={setFilterCalendarYear}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ano atual" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(new Date().getFullYear())}>{new Date().getFullYear()}</SelectItem>
                  <SelectItem value={String(new Date().getFullYear() + 1)}>
                    {new Date().getFullYear() + 1}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview dos ensaios filtrados */}
          {!loadingEnsaios && ensaios.length > 0 && (
            <div className="border-t pt-4">
              <Label className="text-sm font-semibold mb-2 block">
                Ensaios que serão exportados ({getFilteredEnsaios().length})
              </Label>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {getFilteredEnsaios().length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum ensaio encontrado com os filtros selecionados
                  </p>
                ) : (
                  getFilteredEnsaios()
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .map((ensaio, idx) => {
                      const cong = congregations.find((c: any) => c.id === ensaio.congregationId);
                      const tipoLabel = ensaio.type === 'regional' ? 'Regional' : 
                                       ensaio.type === 'local' ? 'Local' :
                                       ensaio.type === 'gem' ? 'GEM' : 
                                       ensaio.type === 'darpe' ? 'DARPE' : 'Geral';
                      return (
                        <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                          <div className="flex-1">
                            <span className="font-medium">{format(ensaio.date, 'dd/MM/yyyy')}</span>
                            <span className="mx-2">•</span>
                            <span>{ensaio.congregationName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {tipoLabel}
                            </Badge>
                            {cong && (
                              <span className="text-muted-foreground">{cong.city}</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              onClick={() => {
                if (getFilteredEnsaios().length === 0) {
                  toast({
                    title: 'Nenhum ensaio encontrado',
                    description: 'Não há ensaios cadastrados com os filtros selecionados.',
                    variant: 'destructive',
                  });
                  return;
                }
                setShowCalendarPreview(true);
              }}
              disabled={loadingEnsaios}
              variant="default"
              className="w-full sm:w-auto"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Preview e Imprimir
            </Button>
            <Button
              onClick={exportToExcel}
              disabled={loadingEnsaios}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calendar Preview Dialog */}
      <Dialog open={showCalendarPreview} onOpenChange={setShowCalendarPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Preview do Calendário de Ensaios Musicais</DialogTitle>
            <DialogDescription>
              Visualize o calendário antes de imprimir
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto border rounded-lg p-6 bg-white" id="calendar-preview-content">
            {/* Header com logo */}
            <div className="text-center mb-6 print:mb-4">
              <h1 className="text-2xl font-bold text-gray-800 mb-1 print:text-xl">
                CONGREGAÇÃO CRISTÃ NO BRASIL
              </h1>
              <h2 className="text-lg font-semibold text-gray-700 mb-1 print:text-base">
                Calendário de Ensaios Musicais {filterCalendarYear}
              </h2>
              <div className="text-sm text-gray-600 mb-4 print:text-xs">
                {filterCalendarCongregation && filterCalendarCongregation !== 'all' && (
                  <span className="mr-3">📍 {congregations.find((c: any) => c.id === filterCalendarCongregation)?.name}</span>
                )}
                {filterCalendarCity && filterCalendarCity !== 'all' && (
                  <span className="mr-3">🏙️ {filterCalendarCity}</span>
                )}
              </div>
            </div>

            {(() => {
              const filteredEnsaios = getFilteredEnsaios().sort((a, b) => a.date.getTime() - b.date.getTime());
              
              // Agrupar ensaios por tipo (case-insensitive)
              const ensaiosPorTipo: Record<string, typeof filteredEnsaios> = {
                'regional': filteredEnsaios.filter(e => e.type.toLowerCase() === 'regional'),
                'gem': filteredEnsaios.filter(e => e.type.toLowerCase() === 'gem'),
                'geral': filteredEnsaios.filter(e => e.type.toLowerCase() === 'geral'),
                'darpe': filteredEnsaios.filter(e => e.type.toLowerCase() === 'darpe'),
                'local': filteredEnsaios.filter(e => e.type.toLowerCase() === 'local'),
              };

              // Agrupar ensaios locais por cidade e congregação
              const locaisPorCidade = ensaiosPorTipo['local'].reduce((acc, ensaio) => {
                const cong = congregations.find((c: any) => c.id === ensaio.congregationId);
                // Chaveslândia é distrito de Santa Vitória
                let cidade = cong?.city || 'Sem cidade';
                if (cong?.name.toLowerCase().includes('chaveslândia') || cong?.name.toLowerCase().includes('chaveslandia')) {
                  cidade = 'Santa Vitória';
                }
                // Normalizar o nome da cidade para evitar duplicação
                cidade = cidade.trim();
                if (!acc[cidade]) {
                  acc[cidade] = {};
                }
                if (!acc[cidade][ensaio.congregationId]) {
                  acc[cidade][ensaio.congregationId] = [];
                }
                acc[cidade][ensaio.congregationId].push(ensaio);
                return acc;
              }, {} as Record<string, Record<string, typeof filteredEnsaios>>);

              const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
              
              return (
                <>
                  {/* ENSAIOS REGIONAIS, GEM, GERAIS e DARPE */}
                  {(['regional', 'gem', 'geral', 'darpe'] as const).map(tipoEnsaio => {
                    const ensaiosDoTipo = ensaiosPorTipo[tipoEnsaio];
                    if (ensaiosDoTipo.length === 0) return null;
                    
                    const ensaiosPorCongregacao = ensaiosDoTipo.reduce((acc, ensaio) => {
                      if (!acc[ensaio.congregationId]) {
                        acc[ensaio.congregationId] = [];
                      }
                      acc[ensaio.congregationId].push(ensaio);
                      return acc;
                    }, {} as Record<string, typeof filteredEnsaios>);
                    
                    const tipoLabel = tipoEnsaio === 'regional' ? 'REGIONAIS' : 
                                     tipoEnsaio === 'gem' ? 'GEM' : 
                                     tipoEnsaio === 'darpe' ? 'DARPE' : 'GERAIS';

                    return (
                      <div key={tipoEnsaio} className="mb-6">
                        <h3 className="bg-blue-900 text-white text-center font-bold py-2 text-sm print:text-xs">
                          ENSAIOS {tipoLabel}
                        </h3>
                        <table className="w-full border-collapse text-xs print:text-[10px]">
                          <thead>
                            <tr className="bg-gray-300">
                              <th className="border border-gray-400 px-2 py-1 text-left font-semibold">LOCALIDADE</th>
                              <th className="border border-gray-400 px-2 py-1 text-center font-semibold">DIA</th>
                              <th className="border border-gray-400 px-2 py-1 text-center font-semibold">HORA</th>
                              {meses.map(mes => (
                                <th key={mes} className="border border-gray-400 px-1 py-1 text-center font-semibold">{mes}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(ensaiosPorCongregacao).map(([congId, ensaios]) => {
                              const cong = congregations.find((c: any) => c.id === congId);
                              const ensaioPorMes: Record<number, number> = {};
                              
                              (ensaios as any).forEach((e: any) => {
                                const mes = e.date.getMonth();
                                if (!ensaioPorMes[mes]) {
                                  ensaioPorMes[mes] = e.date.getDate();
                                }
                              });

                              const primeiroEnsaio = (ensaios as any)[0];
                              const diaSemana = format(primeiroEnsaio.date, 'EEEE');
                              const hora = cong?.rehearsals?.find((r: any) => r.type.toLowerCase() === tipoEnsaio)?.time || '09h00';

                              return (
                                <tr key={congId} className="hover:bg-gray-50">
                                  <td className="border border-gray-400 px-2 py-1">{cong?.city ? `${cong.city} - ${cong.name}` : cong?.name}</td>
                                  <td className="border border-gray-400 px-2 py-1 text-center capitalize">{diaSemana.substring(0, 3)}</td>
                                  <td className="border border-gray-400 px-2 py-1 text-center">{hora}</td>
                                  {meses.map((_, idx) => (
                                    <td key={idx} className="border border-gray-400 px-1 py-1 text-center">
                                      {ensaioPorMes[idx] || '-'}
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}

                  {/* ENSAIOS LOCAIS POR CIDADE */}
                  {Object.keys(locaisPorCidade).length > 0 && (
                    <div className="mb-6">
                      <h3 className="bg-blue-900 text-white text-center font-bold py-2 text-sm print:text-xs">
                        ENSAIOS LOCAIS
                      </h3>
                      {Object.entries(locaisPorCidade).map(([cidade, congregacoes]) => (
                        <div key={cidade} className="mb-4">
                          <h4 className="bg-blue-900 text-white text-center font-bold py-1.5 text-sm print:text-xs">
                            {cidade.toUpperCase()}
                          </h4>
                          <table className="w-full border-collapse text-xs print:text-[10px]">
                            <thead>
                              <tr className="bg-gray-300">
                                <th className="border border-gray-400 px-2 py-1 text-left font-semibold">LOCALIDADE</th>
                                <th className="border border-gray-400 px-2 py-1 text-center font-semibold">DIA</th>
                                <th className="border border-gray-400 px-2 py-1 text-center font-semibold">HORA</th>
                                {meses.map(mes => (
                                  <th key={mes} className="border border-gray-400 px-1 py-1 text-center font-semibold">{mes}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(congregacoes as any)
                                .sort(([idA], [idB]) => {
                                  const congA = congregations.find((c: any) => c.id === idA);
                                  const congB = congregations.find((c: any) => c.id === idB);
                                  return (congA?.name || '').localeCompare(congB?.name || '');
                                })
                                .map(([congId, ensaios]) => {
                                const cong = congregations.find((c: any) => c.id === congId);
                                const ensaioPorMes: Record<number, number> = {};
                                
                                (ensaios as any).forEach((e: any) => {
                                  const mes = e.date.getMonth();
                                  if (!ensaioPorMes[mes]) {
                                    ensaioPorMes[mes] = e.date.getDate();
                                  }
                                });

                                const primeiroEnsaio = (ensaios as any)[0];
                                const diaSemana = format(primeiroEnsaio.date, 'EEEE');
                                const hora = cong?.rehearsals?.find((r: any) => r.type.toLowerCase() === 'local')?.time || '19h30';

                                return (
                                  <tr key={congId} className="hover:bg-gray-50">
                                    <td className="border border-gray-400 px-2 py-1">{cong?.name}</td>
                                    <td className="border border-gray-400 px-2 py-1 text-center capitalize">{diaSemana.substring(0, 3)}</td>
                                    <td className="border border-gray-400 px-2 py-1 text-center">{hora}</td>
                                    {meses.map((_, idx) => (
                                      <td key={idx} className="border border-gray-400 px-1 py-1 text-center">
                                        {ensaioPorMes[idx] || '-'}
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  )}

                  {filteredEnsaios.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>Nenhum ensaio encontrado com os filtros selecionados</p>
                    </div>
                  )}

                  {/* Rodapé */}
                  <div className="mt-6 text-xs text-gray-600 print:text-[10px]">
                    <p className="font-semibold">Total de ensaios: {filteredEnsaios.length}</p>
                    <p className="mt-1">Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
                  </div>
                </>
              );
            })()}
          </div>

          <DialogFooter className="gap-2 no-print">
            <Button
              onClick={() => setShowCalendarPreview(false)}
              variant="outline"
            >
              Fechar
            </Button>
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimir Direto
            </Button>
            <Button
              onClick={() => {
                exportToPDF();
                setShowCalendarPreview(false);
              }}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Salvar como PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover{' '}
              <span className="font-semibold">{musicianToDelete?.name}</span>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}