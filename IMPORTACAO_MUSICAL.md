# Importação de Músicos via PDF e Excel

## Descrição
A aba Musical possui funcionalidade de importação de dados de músicos através de arquivos PDF, Excel (.xlsx, .xls) ou CSV.

## Como Usar

1. **Acessar a aba Musical**
   - Navegue até a página Musical no sistema

2. **Clicar no botão "Importar Dados"**
   - No canto superior direito, clique no botão dropdown "Importar Dados"
   - Escolha entre "Importar PDF" ou "Importar Excel"

3. **Selecionar o arquivo**
   - Uma janela será aberta com abas para PDF ou Excel/CSV
   - Clique na aba correspondente ao tipo de arquivo
   - Clique na área de upload ou arraste o arquivo
   - O sistema irá processar o arquivo automaticamente

4. **Revisar os dados importados (PREVIEW)**
   - ✨ **NOVO**: Após o processamento, você verá uma prévia detalhada de todos os músicos encontrados
   - A tela mostrará:
     - Total de músicos encontrados
     - Quantidade de instrumentos diferentes
     - Quantidade de congregações
     - Quantidade de cidades
   - Revise cada registro individualmente:
     - Nome, Instrumento, Etapa, Congregação, Cidade e Telefone
   - Certifique-se de que todos os dados estão corretos antes de importar

5. **Confirmar a importação**
   - Se os dados estiverem corretos, clique em "Confirmar e Importar"
   - O sistema gravará todos os músicos no banco de dados Firebase
   - Uma notificação confirmará quantos músicos foram importados com sucesso

6. **Cancelar ou limpar**
   - Se houver algum erro, clique em "Cancelar" ou "Limpar" para começar novamente
   - Você pode importar um novo arquivo sem fechar o diálogo

## Formatos de Arquivo Suportados

### 1. PDF
O PDF deve conter uma tabela ou lista com as seguintes colunas, separadas por `|` (pipe), tabulação ou múltiplos espaços:

```
Nome | Congregação | Cidade | Telefone | Instrumento | Etapa
```

**Exemplo de Linha Válida:**
```
João Silva | Central São Paulo | São Paulo | (11) 98765-4321 | Trompete | Culto Oficial
```

### 2. Excel (.xlsx, .xls) ou CSV
O arquivo deve ter a primeira linha como cabeçalho e as seguintes colunas na ordem:

| Nome | Congregação | Cidade | Telefone | Instrumento | Etapa |
|------|-------------|--------|----------|-------------|-------|
| João Silva | Central São Paulo | São Paulo | (11) 98765-4321 | Trompete | Culto Oficial |
| Maria Santos | Brás | São Paulo | (11) 91234-5678 | Sax Alto | RJM |

**Formato CSV:**
```csv
Nome,Congregação,Cidade,Telefone,Instrumento,Etapa
João Silva,Central São Paulo,São Paulo,(11) 98765-4321,Trompete,Culto Oficial
Maria Santos,Brás,São Paulo,(11) 91234-5678,Sax Alto,RJM
```

### Campos Obrigatórios:

1. **Nome**: Nome completo do músico
2. **Congregação**: Nome da congregação (deve corresponder a uma congregação cadastrada)
3. **Cidade**: Cidade da congregação
4. **Telefone**: Telefone de contato (formato: (99) 99999-9999)
5. **Instrumento**: Deve ser um dos seguintes:
   - Clarinete
   - Clarone
   - Sax Soprano
   - Sax Alto
   - Sax Tenor
   - Sax Barítono
   - Trompete
   - Flugelhorn
   - Eufônio
   - Trombone
   - Trombonito
   - Tuba
   - Viola
   - Violino
   - Cello
   - Órgão

6. **Etapa**: Deve ser uma das seguintes:
   - Ensaio
   - RJM
   - Culto Oficial
   - Oficialização

## Observações Importantes

- **Congregações**: A congregação informada deve estar previamente cadastrada no sistema. O sistema faz uma busca flexível pelo nome.
- **Validação com Preview**: Todos os dados são exibidos em uma tela de prévia antes da importação, permitindo revisão completa
- **Estatísticas**: A tela de prévia mostra resumo estatístico dos dados (total, instrumentos, congregações, cidades)
- **Duplicatas**: O sistema não verifica duplicatas automaticamente. Evite importar o mesmo arquivo múltiplas vezes.
- **Formato**: 
  - PDF: O sistema tenta identificar diferentes separadores (|, tabulação, múltiplos espaços)
  - Excel/CSV: Primeira linha deve ser o cabeçalho com os nomes das colunas
- **Processamento**: Arquivos grandes podem levar alguns segundos para processar.
- **Tipos de Arquivo**: Aceita .pdf, .xlsx, .xls e .csv

## Tratamento de Erros

- Se o arquivo não for válido (PDF, Excel ou CSV), uma mensagem de erro será exibida
- Se nenhum dado válido for encontrado, o sistema alertará
- Dados inválidos são registrados no console do navegador para análise
- Durante a importação, se algum músico falhar, o sistema continuará com os demais e informará quantos falharam
- A tela de prévia permite identificar problemas antes de salvar no banco de dados

## Dicas para Melhores Resultados

1. **Prepare seus dados**: Certifique-se de que todas as congregações estejam cadastradas antes de importar
2. **Use nomes exatos**: Instrumentos e etapas devem ser exatamente como listados acima
3. **Formato consistente**: Mantenha o mesmo formato em todas as linhas
4. **Excel recomendado**: Para dados estruturados, Excel/CSV é mais confiável que PDF
5. **Preview primeiro**: Sempre revise a prévia antes de confirmar a importação
6. **Evite caracteres especiais**: Não use caracteres especiais desnecessários nos nomes
7. **Uma linha por músico**: Cada músico deve ocupar uma linha completa
8. **Teste com poucos dados**: Teste primeiro com 2-3 músicos antes de importar listas grandes

## Tecnologias Utilizadas

- **pdfjs-dist**: Biblioteca para leitura e extração de texto de arquivos PDF
- **xlsx**: Biblioteca para leitura e escrita de arquivos Excel e CSV
- **Firebase Firestore**: Armazenamento dos dados importados
- **React**: Interface de usuário com preview e validação
- **React**: Interface de usuário com feedback em tempo real
