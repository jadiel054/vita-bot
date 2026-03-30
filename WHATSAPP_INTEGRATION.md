# Integração WhatsApp com Twilio — VitaBot

Este documento descreve como configurar e usar as notificações WhatsApp interativas no VitaBot.

## Visão Geral

O VitaBot envia automaticamente:

1. **Notificação ao dono da clínica** — Quando um novo agendamento é criado
2. **Confirmação ao paciente** — Com instruções para confirmar ou cancelar via WhatsApp
3. **Notificação de cancelamento** — Quando um agendamento é cancelado

## Configuração

### 1. Obter Credenciais Twilio

1. Acesse [twilio.com](https://www.twilio.com)
2. Crie uma conta ou faça login
3. Vá para **Console → Account Info**
4. Copie seu **Account SID** e **Auth Token**
5. Vá para **Messaging → Services** e crie um novo WhatsApp Service ou use o Sandbox
6. Obtenha seu número Twilio WhatsApp

### 2. Configurar Variáveis de Ambiente

Adicione ao seu arquivo `.env`:

```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=+1234567890
```

### 3. Configurar Número WhatsApp do Dono da Clínica

No painel administrativo, vá para **Configurações** e adicione o número WhatsApp do dono da clínica no campo `whatsapp`.

## Fluxo de Notificações

### Novo Agendamento

```
1. Paciente agenda consulta no app
   ↓
2. Notificação enviada ao dono da clínica:
   "Nova consulta agendada! Paciente: João Silva, 
    Especialidade: Cardiologia, Data: 15/03/2025, 
    Horário: 14:30"
   ↓
3. Confirmação enviada ao paciente:
   "Sua consulta foi agendada com sucesso!
    📋 Especialidade: Cardiologia
    📋 Médico: Dr. Carlos
    📋 Data: 15/03/2025
    📋 Horário: 14:30
    
    🔔 Responda com:
    ✅ CONFIRMAR - para confirmar
    ❌ CANCELAR - para cancelar"
```

### Resposta do Paciente

O paciente responde com `CONFIRMAR` ou `CANCELAR` (ou variações como `SIM`, `NÃO`, emojis).

**Nota:** A integração do webhook ainda precisa ser configurada no seu servidor. Veja a seção "Webhook" abaixo.

### Cancelamento

```
1. Paciente cancela consulta no app
   ↓
2. Notificação enviada ao dono da clínica:
   "Consulta cancelada ❌
    Paciente: João Silva,
    Especialidade: Cardiologia,
    Data: 15/03/2025,
    Horário: 14:30"
```

## Webhook (Configuração Avançada)

Para processar respostas dos pacientes automaticamente, você precisa configurar um webhook no Twilio.

### 1. Criar Endpoint Webhook

Você precisa adicionar um endpoint no seu servidor que receba mensagens do Twilio:

```typescript
// Exemplo em Express.js
app.post("/api/whatsapp/webhook", async (req, res) => {
  const { From, Body, MessageSid } = req.body;
  
  const result = await handlePatientResponse({
    From,
    Body,
    MessageSid,
  });
  
  // Responder com TwiML
  const twiml = generateTwiMLResponse(result.message || "");
  res.type("text/xml");
  res.send(twiml);
});
```

### 2. Configurar Webhook no Twilio

1. Vá para **Messaging → Services → WhatsApp Service**
2. Clique em **Integration**
3. Configure o **Inbound Request URL** para `https://seu-dominio.com/api/whatsapp/webhook`
4. Salve as alterações

### 3. Verificar Assinatura (Segurança)

Sempre verifique a assinatura do Twilio para garantir que a requisição é legítima:

```typescript
import twilio from "twilio";

const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

app.post("/api/whatsapp/webhook", (req, res) => {
  // Verificar assinatura
  const signature = req.headers["x-twilio-signature"];
  const url = `https://seu-dominio.com/api/whatsapp/webhook`;
  
  if (!twilio.validateRequest(twilioAuthToken, signature, url, req.body)) {
    return res.status(403).send("Unauthorized");
  }
  
  // Processar mensagem...
});
```

## Estrutura de Dados

### Appointment com Phone

O modelo de `Appointment` já inclui o campo `patientPhone` para armazenar o número WhatsApp do paciente:

```typescript
interface Patient {
  id: string;
  fullName: string;
  phone: string;      // Número WhatsApp do paciente
  whatsapp: string;   // Alias para phone
  // ... outros campos
}
```

## Testes

Os testes incluem:

- Parsing de mensagens (`CONFIRMAR`, `CANCELAR`, emojis, etc.)
- Extração de números de telefone
- Geração de respostas TwiML
- Tratamento de erros

Execute os testes com:

```bash
pnpm test
```

## Limitações e Considerações

1. **Twilio Sandbox** — Para desenvolvimento, use o Twilio WhatsApp Sandbox. Você precisa "optar" por receber mensagens do Sandbox.

2. **Números Comerciais** — Para produção, você precisará de um número comercial aprovado pelo Twilio.

3. **Aprovação de Template** — Twilio pode exigir aprovação de templates de mensagens antes de enviar em produção.

4. **Rate Limiting** — Twilio tem limites de taxa. Consulte a documentação para detalhes.

5. **Armazenamento de Dados** — As respostas dos pacientes devem ser armazenadas no banco de dados para auditoria.

## Troubleshooting

### Mensagens não estão sendo enviadas

1. Verifique se as credenciais Twilio estão corretas
2. Verifique se o número WhatsApp está no formato correto (`+5511999999999`)
3. Verifique os logs do servidor para mensagens de erro

### Webhook não está recebendo mensagens

1. Verifique se a URL do webhook está acessível publicamente
2. Verifique se o Twilio pode alcançar o endpoint (teste com `curl`)
3. Verifique a assinatura do Twilio

### Respostas não estão sendo processadas

1. Verifique se o webhook está configurado corretamente no Twilio
2. Verifique se a lógica de parsing está reconhecendo a mensagem
3. Verifique se o banco de dados está sendo atualizado

## Próximos Passos

1. **Integração com Banco de Dados** — Armazenar respostas dos pacientes
2. **Notificações de Lembrete** — Enviar lembretes 24h e 2h antes da consulta
3. **Rastreamento de Entrega** — Monitorar status de entrega das mensagens
4. **Respostas Personalizadas** — Personalizar mensagens por clínica

## Referências

- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)
- [Twilio Messaging Services](https://www.twilio.com/docs/messaging/services)
- [TwiML Reference](https://www.twilio.com/docs/twiml)
