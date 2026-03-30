# Correção de Notificações WhatsApp — VitaBot

## Problema Identificado

As notificações WhatsApp não estavam chegando no número da clínica (+5549999940482) quando um novo agendamento era feito.

### Causa Raiz

A integração original usava **tRPC mutations** para enviar notificações, mas havia um problema na forma como o cliente tRPC estava enviando os dados para o servidor. O tRPC esperava um envelope específico de JSON-RPC que não estava sendo enviado corretamente.

**Erro no servidor:**
```
Invalid input: expected object, received undefined
```

## Solução Implementada

Criamos **rotas HTTP diretas** (Express) para contornar o problema do tRPC e enviar notificações de forma mais confiável.

### Novas Rotas HTTP

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/whatsapp/notify-appointment` | POST | Envia notificação de novo agendamento para a clínica |
| `/api/whatsapp/notify-cancellation` | POST | Envia notificação de cancelamento para a clínica |
| `/api/whatsapp/send-confirmation` | POST | Envia confirmação interativa para o paciente |

### Arquivos Modificados

1. **`server/routes/whatsapp.ts`** (novo)
   - Implementa as 3 rotas HTTP
   - Validação com Zod
   - Tratamento de erros

2. **`server/_core/index.ts`**
   - Registra o router de WhatsApp
   - Monta em `/api/whatsapp`

3. **`app/booking.tsx`**
   - Substitui `notifyMutation.mutateAsync()` por `fetch("/api/whatsapp/notify-appointment")`
   - Substitui `confirmMutation.mutateAsync()` por `fetch("/api/whatsapp/send-confirmation")`

4. **`app/(tabs)/appointments.tsx`**
   - Substitui `cancelMutation.mutateAsync()` por `fetch("/api/whatsapp/notify-cancellation")`

### Testes

Adicionados 9 testes em `tests/whatsapp-http.test.ts`:
- ✅ Envio de notificação de agendamento
- ✅ Envio de notificação de cancelamento
- ✅ Envio de confirmação ao paciente
- ✅ Validação de payloads inválidos
- ✅ Tratamento de erros

**Resultado:** 47 testes passando (incluindo os novos)

## Como Testar

### 1. Teste via cURL

```bash
bash server/test-notify-curl.sh
```

Resposta esperada:
```json
{
  "success": true,
  "messageId": "SM8f7046ab5234ad8d0c42bb1a7a44928f"
}
```

### 2. Teste no App

1. Abra o VitaBot no Expo Go
2. Toque em "Agendar consulta"
3. Siga o fluxo de 4 etapas
4. Confirme o agendamento
5. Verifique se a mensagem WhatsApp chegou em +5549999940482

### 3. Teste via Vitest

```bash
pnpm test tests/whatsapp-http.test.ts
```

## Credenciais Twilio Configuradas

- **Account SID:** `AC29478060b6b3c00aa01b78a0c1f968fa`
- **Auth Token:** Configurado em variáveis de ambiente
- **Número WhatsApp:** `+14155238886`
- **Número da Clínica:** `+5549999940482`

## Fluxo Completo

```
Usuário agenda consulta
    ↓
App salva no AsyncStorage
    ↓
App envia POST /api/whatsapp/notify-appointment
    ↓
Servidor valida payload com Zod
    ↓
Twilio envia mensagem para +5549999940482
    ↓
Clínica recebe: "Nova consulta agendada! Paciente: [nome], ..."
```

## Próximas Melhorias

1. **Webhook para respostas** — Implementar endpoint para processar quando o dono responde via WhatsApp
2. **Notificações de lembrete** — Enviar lembretes 24h e 2h antes da consulta
3. **Dashboard de rastreamento** — Mostrar status de entrega/leitura das mensagens

## Status

✅ **Problema resolvido**
✅ **Testes passando**
✅ **Pronto para produção**
