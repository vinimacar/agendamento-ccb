# Configuração de Deploy Automático

Este projeto está configurado para deploy automático em **GitHub Pages** e **Firebase Hosting** sempre que houver push na branch `main`.

## ✅ O que já está configurado

- ✅ Workflow do GitHub Actions (`.github/workflows/deploy.yml`)
- ✅ Firebase Hosting configurado (`firebase.json`)
- ✅ Build automático do projeto
- ✅ Deploy para GitHub Pages (automático)

## 🔧 Configuração necessária para Firebase Hosting

Para ativar o deploy automático no Firebase, você precisa adicionar o **Service Account** do Firebase como secret no GitHub:

### Passo 1: Gerar Service Account no Firebase

1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Selecione seu projeto: `directed-optics-460823-q5`
3. Vá em **Configurações do Projeto** (ícone de engrenagem) → **Contas de serviço**
4. Clique em **Gerar nova chave privada**
5. Baixe o arquivo JSON

### Passo 2: Adicionar Secret no GitHub

1. Acesse seu repositório no GitHub: `https://github.com/vinimacar/agendamento-ccb`
2. Vá em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Nome: `FIREBASE_SERVICE_ACCOUNT`
5. Valor: Cole todo o conteúdo do arquivo JSON baixado
6. Clique em **Add secret**

### Passo 3: Verificar o Deploy

Após configurar o secret:

1. Faça qualquer commit na branch `main`
2. Acesse a aba **Actions** no GitHub
3. Aguarde o workflow "Deploy to GitHub Pages and Firebase" completar
4. Seu site estará disponível em:
   - **GitHub Pages**: `https://vinimacar.github.io/agendamento-ccb/`
   - **Firebase Hosting**: URL do seu projeto Firebase

## 🚀 Como funciona

O workflow executa automaticamente quando você:
- Faz push na branch `main`
- Executa manualmente via GitHub Actions

### Etapas do Deploy:
1. ✅ Checkout do código
2. ✅ Instala Node.js 20
3. ✅ Instala dependências (`npm ci`)
4. ✅ Build do projeto (`npm run build`)
5. ✅ Deploy para GitHub Pages
6. ✅ Deploy para Firebase Hosting

## 📝 Comandos úteis

```bash
# Build local
npm run build

# Preview local do build
npm run preview

# Deploy manual para Firebase (requer firebase-tools)
npm install -g firebase-tools
firebase login
firebase deploy --only hosting
```

## ⚙️ Configuração do Vite para GitHub Pages

Se estiver usando GitHub Pages, adicione ao `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/agendamento-ccb/', // Nome do seu repositório
  // ... resto da config
})
```

## 🔍 Troubleshooting

### Deploy falha no Firebase
- Verifique se o secret `FIREBASE_SERVICE_ACCOUNT` foi adicionado corretamente
- Confirme que o Service Account tem permissões de deploy no Firebase

### Deploy falha no GitHub Pages
- Verifique se o GitHub Pages está ativado nas configurações do repositório
- Confirme que a branch `gh-pages` está sendo criada automaticamente

## 📚 Recursos

- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [GitHub Actions](https://docs.github.com/en/actions)
- [GitHub Pages](https://pages.github.com/)
