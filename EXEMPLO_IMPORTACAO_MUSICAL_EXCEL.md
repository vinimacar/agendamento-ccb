# Exemplo de Importação Musical - Excel/CSV

## Template Excel

Copie e cole este conteúdo em um arquivo Excel ou salve como CSV:

| Nome | Congregação | Cidade | Telefone | Instrumento | Etapa |
|------|-------------|--------|----------|-------------|-------|
| João Silva | Central São Paulo | São Paulo | (11) 98765-4321 | Trompete | Culto Oficial |
| Maria Santos | Brás | São Paulo | (11) 91234-5678 | Sax Alto | RJM |
| Pedro Oliveira | Mooca | São Paulo | (11) 99876-5432 | Trombone | Ensaio |
| Ana Costa | Vila Mariana | São Paulo | (11) 98888-7777 | Clarinete | Oficialização |
| Carlos Souza | Ipiranga | São Paulo | (11) 97777-6666 | Órgão | Culto Oficial |

## Template CSV

```csv
Nome,Congregação,Cidade,Telefone,Instrumento,Etapa
João Silva,Central São Paulo,São Paulo,(11) 98765-4321,Trompete,Culto Oficial
Maria Santos,Brás,São Paulo,(11) 91234-5678,Sax Alto,RJM
Pedro Oliveira,Mooca,São Paulo,(11) 99876-5432,Trombone,Ensaio
Ana Costa,Vila Mariana,São Paulo,(11) 98888-7777,Clarinete,Oficialização
Carlos Souza,Ipiranga,São Paulo,(11) 97777-6666,Órgão,Culto Oficial
```

## Instrumentos Válidos

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

## Etapas Válidas

- Ensaio
- RJM
- Culto Oficial
- Oficialização

## Passo a Passo para Criar o Arquivo

### Excel (.xlsx)

1. Abra o Microsoft Excel ou Google Sheets
2. Na primeira linha, coloque os cabeçalhos:
   - A1: Nome
   - B1: Congregação
   - C1: Cidade
   - D1: Telefone
   - E1: Instrumento
   - F1: Etapa
3. A partir da linha 2, preencha os dados dos músicos
4. Salve como .xlsx ou .xls
5. Importe na aba Musical

### CSV (.csv)

1. Abra um editor de texto (Notepad, VSCode, etc.)
2. Cole o template CSV acima
3. Edite os dados conforme necessário
4. Salve com extensão .csv
5. Importe na aba Musical

### Google Sheets

1. Crie uma nova planilha no Google Sheets
2. Cole os dados do template
3. Baixe como: Arquivo > Fazer download > Microsoft Excel (.xlsx)
4. Importe na aba Musical

## Dicas Importantes

✅ **Faça**:
- Use os nomes exatos dos instrumentos e etapas
- Certifique-se de que as congregações já estão cadastradas
- Mantenha o formato de telefone (11) 99999-9999
- Revise a prévia antes de importar

❌ **Não Faça**:
- Não deixe células vazias em campos obrigatórios
- Não use nomes de instrumentos diferentes dos listados
- Não use etapas diferentes das listadas
- Não pule a linha de cabeçalho

## Exemplo Completo de Arquivo Excel

Para facilitar, você pode criar um arquivo Excel com esta estrutura:

```
Linha 1 (Cabeçalho):
Nome | Congregação | Cidade | Telefone | Instrumento | Etapa

Linha 2 em diante (Dados):
João Silva | Central São Paulo | São Paulo | (11) 98765-4321 | Trompete | Culto Oficial
[...mais linhas...]
```

## Testando sua Importação

1. Comece com um arquivo pequeno (2-3 músicos)
2. Importe e verifique a prévia
3. Se estiver correto, confirme a importação
4. Depois importe o arquivo completo

## Resolução de Problemas

**Problema**: "Nenhum dado encontrado"
- **Solução**: Verifique se a primeira linha é o cabeçalho e se as colunas estão na ordem correta

**Problema**: "Congregação não encontrada"
- **Solução**: Cadastre primeiro a congregação no sistema antes de importar os músicos

**Problema**: "Instrumento inválido"
- **Solução**: Use exatamente um dos instrumentos da lista acima (com acentuação correta)

**Problema**: "Etapa inválida"
- **Solução**: Use exatamente uma das etapas da lista acima
