# 🚀 Guia de Deploy do VitaBot no Vercel

Este guia mostra como hospedar o backend do VitaBot no Vercel de forma gratuita.

## Pré-requisitos

1. Conta no GitHub (você já tem)
2. Conta no Vercel (crie em https://vercel.com)
3. Variáveis de ambiente configuradas

## Passo 1: Preparar o Repositório

O repositório já está pronto! Todos os arquivos de configuração estão no lugar:
- `vercel.json` - Configuração de build e rotas
- `.vercelignore` - Arquivos a ignorar no deploy
- `package.json` - Scripts de build e start já configurados

## Passo 2: Deploy no Vercel

### Opção A: Via Dashboard do Vercel (Recomendado)

1. Acesse https://vercel.com/dashboard
2. Clique em **"Add New..."** → **"Project"**
3. Selecione **"Import Git Repository"**
4. Procure por **`vita-bot`** e clique em **"Import"**
5. Configure as variáveis de ambiente (veja abaixo)
6. Clique em **"Deploy"**

### Opção B: Via Vercel CLI

```bash
npm install -g vercel
cd /caminho/para/vita-bot
vercel
```

## Passo 3: Configurar Variáveis de Ambiente

No dashboard do Vercel, vá para **Settings** → **Environment Variables** e adicione:

```
TWILIO_ACCOUNT_SID=AC29478060b6b3c00aa01b78a0c1f968fa
TWILIO_AUTH_TOKEN=c0e4ad2225920c039f7862ac5de444cd
TWILIO_WHATSAPP_NUMBER=+1 415 523 8886
PATIENT_PHONE=+5549999940482
BUILT_IN_FORGE_API_KEY=<sua chave do Manus>
NODE_ENV=production
```

## Passo 4: Atualizar URL do App

Após o deploy, o Vercel fornecerá uma URL como: `https://vita-bot-xxxxx.vercel.app`

Você precisará atualizar o arquivo `lib/trpc.ts` no seu app para apontar para essa URL:

```typescript
// Antes:
const baseUrl = "http://localhost:3000";

// Depois:
const baseUrl = "https://vita-bot-xxxxx.vercel.app";
```

## Passo 5: Testar

1. Clone o repositório atualizado
2. Execute `pnpm install`
3. Execute `pnpm dev`
4. Teste o chat e agendamento

## Possíveis Problemas

### ❌ "Build failed"
- Verifique se todas as variáveis de ambiente estão configuradas
- Verifique se o `package.json` tem os scripts `build` e `start`

### ❌ "Timeout na requisição"
- Vercel tem limite de 60 segundos por requisição
- Se a IA demora muito, o Vercel pode cancelar
- Neste caso, use **Railway** ou **Render** como alternativa

### ❌ "Erro de conexão com Twilio"
- Verifique se as credenciais estão corretas
- Teste no painel do Twilio se o número está ativo

## Alternativas se Vercel não funcionar

Se o Vercel não atender bem ao seu projeto, aqui estão as alternativas:

### 1. **Railway** (Recomendado)
- Melhor suporte para Node.js
- Mais tempo de execução (até 120 segundos)
- Plano gratuito com $5/mês de crédito
- Deploy: https://railway.app

### 2. **Render**
- Gratuito com limitações
- Ótimo para projetos pequenos
- Deploy: https://render.com

### 3. **Heroku** (Descontinuado)
- Não recomendado (parou de oferecer plano gratuito)

## Monitoramento

Após o deploy, você pode monitorar:
- Logs: Dashboard do Vercel → **Deployments** → **Logs**
- Performance: **Analytics** → **Real-time**
- Erros: **Monitoring** → **Error Tracking**

## Próximos Passos

1. ✅ Deploy no Vercel
2. ✅ Atualizar URL no app
3. ✅ Testar no celular com Expo Go
4. ✅ Configurar domínio customizado (opcional)

---

**Dúvidas?** Verifique a documentação do Vercel: https://vercel.com/docs
