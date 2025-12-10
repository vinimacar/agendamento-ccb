# Configuração do Firebase

## Erro: "Missing or insufficient permissions"

Este erro ocorre quando as regras de segurança do Firestore não estão configuradas corretamente. Siga os passos abaixo para resolver:

## Passo 1: Acesse o Console do Firebase

1. Acesse: https://console.firebase.google.com/
2. Selecione o projeto: **directed-optics-460823-q5**

## Passo 2: Configure as Regras do Firestore

1. No menu lateral, clique em **Firestore Database**
2. Clique na aba **Regras** (Rules)
3. Substitua as regras existentes pelo conteúdo do arquivo `firestore.rules` deste projeto
4. Clique em **Publicar** (Publish)

### Regras Recomendadas

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    match /congregations/{congregationId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
    
    match /events/{eventId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
    
    match /users/{userId} {
      allow read: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isAuthenticated() && request.auth.uid == userId;
      allow create: if isAuthenticated();
    }
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Passo 3: Configure a Autenticação

1. No menu lateral, clique em **Authentication**
2. Clique na aba **Sign-in method**
3. Habilite o provedor **Email/Password**
4. Clique em **Salvar**

## Passo 4: Crie um Usuário de Teste

1. Na aba **Users** do Authentication
2. Clique em **Add user**
3. Crie um usuário com:
   - Email: seu-email@exemplo.com
   - Senha: sua-senha-segura

## Passo 5: Teste a Aplicação

1. Acesse: https://vinimacar.github.io/agendamento-ccb/
2. Faça login com o usuário criado
3. Verifique se os erros de permissão foram resolvidos

## Alternativa: Regras Abertas (Apenas para Desenvolvimento)

**⚠️ ATENÇÃO: NÃO USE EM PRODUÇÃO!**

Se você está apenas testando e quer acesso irrestrito temporariamente:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Importante:** Lembre-se de configurar as regras adequadas antes de colocar em produção!

## Recursos Adicionais

- [Documentação do Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Documentação do Firebase Authentication](https://firebase.google.com/docs/auth)
