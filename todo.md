# VitaBot — TODO

## Setup & Configuração
- [x] Configurar tema navy/cyan no theme.config.js
- [x] Gerar logo VitaBot (heartbeat + bot icon)
- [x] Atualizar app.config.ts com nome e logo
- [x] Configurar navegação principal (tabs + admin stack)
- [x] Adicionar ícones necessários ao icon-symbol.tsx

## Telas do Paciente
- [x] Tela de Chat Principal com VitaBot
- [x] Integração com IA do servidor (chat inteligente)
- [x] Fluxo de boas-vindas com opções rápidas
- [x] Tela de Agendamento (stepper 4 etapas)
- [x] Seletor de especialidade e médico
- [x] Calendário de seleção de data
- [x] Grade de horários disponíveis
- [x] Tela de confirmação de agendamento
- [x] Tela Minhas Consultas (lista)
- [x] Fluxo de Cancelamento/Remarcação
- [x] Cadastro de Novo Paciente (formulário completo)
- [x] Tela de Informações da Clínica
- [x] Tela de Planos (Free/Pro/Premium)
- [x] Transferência para atendente humano (via chat)

## Dashboard Administrativo
- [x] Tela de Login Admin
- [x] Dashboard com métricas do dia
- [x] Agenda completa (lista de consultas)
- [x] Base de pacientes
- [x] Gestão de médicos e especialidades
- [x] Analytics (gráficos de barras)
- [x] Configurações da clínica

## Backend / Dados
- [x] Schema de dados: pacientes, consultas, médicos, clínica
- [x] Armazenamento local com AsyncStorage
- [x] API de chat com IA do servidor (tRPC + LLM)
- [x] Dados padrão para demonstração

## Qualidade
- [x] Todos os botões funcionais (sem onPress vazio)
- [x] Fluxos completos end-to-end testados
- [x] 14 testes unitários passando
- [x] Zero erros de TypeScript


## Notificações WhatsApp
- [x] Integrar Twilio WhatsApp API
- [x] Enviar notificação ao agendar nova consulta
- [x] Enviar notificação ao cancelar consulta
- [x] Testes para serviço WhatsApp


## Notificações WhatsApp Interativas
- [x] Implementar função de confirmação com instruções interativas
- [x] Enviar confirmação ao WhatsApp do paciente ao agendar
- [x] Implementar serviço webhook para processar respostas
- [x] Parsing de mensagens (CONFIRMAR/CANCELAR)
- [x] 15 testes para notificações interativas (todos passando)


## Configuração Twilio
- [x] Validar credenciais Twilio
- [x] Atualizar configurações da clínica com número WhatsApp
- [x] Testar envio de notificação para clínica
- [x] Testar envio de confirmação para paciente
- [x] Documentar processo de teste


## Correção de Notificações WhatsApp (Problema Resolvido)
- [x] Identificar problema: tRPC não enviava dados corretamente
- [x] Criar rotas HTTP diretas em `/api/whatsapp`
- [x] Atualizar booking.tsx para usar rotas HTTP
- [x] Atualizar appointments.tsx para usar rotas HTTP
- [x] Criar 9 testes para rotas HTTP
- [x] Todos os 47 testes passando
- [x] Documentar correção em WHATSAPP_FIX_SUMMARY.md
