# VitaBot — Design Document

## Brand Identity

**App Name:** VitaBot  
**Tagline:** "Sua recepcionista virtual 24h"  
**Audience:** Pacientes de clínicas médicas e administradores de clínicas  
**Tone:** Profissional, acolhedor, empático — nunca informal ou com humor

---

## Color Palette

| Token       | Light                | Dark                 | Descrição                        |
|-------------|----------------------|----------------------|----------------------------------|
| `primary`   | `#00C8D4` (cyan)     | `#00C8D4` (cyan)     | Cor principal, botões, destaques |
| `background`| `#0B1628` (navy)     | `#0B1628` (navy)     | Fundo principal (sempre escuro)  |
| `surface`   | `#112240` (navy mid) | `#112240` (navy mid) | Cards, inputs, superfícies       |
| `foreground`| `#E8F4F8`            | `#E8F4F8`            | Texto principal                  |
| `muted`     | `#7FA8C0`            | `#7FA8C0`            | Texto secundário                 |
| `border`    | `#1E3A5F`            | `#1E3A5F`            | Bordas e divisores               |
| `success`   | `#22C55E`            | `#4ADE80`            | Confirmações, agendamentos       |
| `warning`   | `#F59E0B`            | `#FBBF24`            | Alertas, lembretes               |
| `error`     | `#EF4444`            | `#F87171`            | Erros, cancelamentos             |
| `accent`    | `#0B4F6C`            | `#0B4F6C`            | Botões secundários               |

---

## Screen List

### Paciente (Patient Flow)
1. **Splash / Loading** — Logo VitaBot animado com tagline
2. **Onboarding** — 3 slides apresentando o app (opcional, apenas 1ª vez)
3. **Chat Principal** — Interface de conversa com VitaBot (tela central)
4. **Agendamento** — Fluxo guiado: tipo → médico → data → hora → confirmação
5. **Minhas Consultas** — Lista de consultas agendadas, passadas e canceladas
6. **Cadastro de Paciente** — Formulário de registro (nome, CPF, nascimento, etc.)
7. **Informações da Clínica** — Endereço, horários, médicos, convênios
8. **Planos** — Apresentação dos planos Free/Pro/Premium

### Administrador (Admin Flow)
9. **Login Admin** — Autenticação do administrador da clínica
10. **Dashboard Admin** — Visão geral: consultas do dia, métricas, alertas
11. **Agenda** — Calendário com todas as consultas agendadas
12. **Pacientes** — Base de pacientes cadastrados
13. **Médicos** — Gestão de médicos e especialidades
14. **Analytics** — Gráficos: consultas/dia, taxa de cancelamento, horários de pico
15. **Configurações da Clínica** — Nome, endereço, horários, médicos, convênios
16. **Planos Admin** — Gerenciamento do plano contratado

---

## Primary Content & Functionality

### Chat Principal
- Bolhas de mensagem (VitaBot à esquerda em navy/cyan, paciente à direita em cyan)
- Botões de ação rápida (chips) para opções frequentes
- Indicador de digitação animado (3 pontos pulsantes)
- Header com nome da clínica e status "online"
- Input de texto com botão de envio

### Agendamento
- Stepper visual mostrando progresso (4 etapas)
- Seletor de especialidade com ícones médicos
- Seletor de médico com foto e nome
- Calendário mensal para seleção de data
- Grade de horários disponíveis (chips clicáveis)
- Tela de confirmação com resumo completo

### Dashboard Admin
- Cards de métricas: consultas hoje, semana, cancelamentos
- Lista de próximas consultas do dia
- Gráfico de barras semanal
- Alertas de lista de espera

---

## Key User Flows

### Fluxo 1: Agendamento de Consulta (Novo Paciente)
1. Tela de Chat → VitaBot saúda → Paciente toca "Agendar consulta"
2. VitaBot pergunta se é paciente novo ou retorno
3. Novo: formulário de cadastro (nome, CPF, nascimento, telefone, email)
4. VitaBot pergunta tipo de consulta / especialidade
5. VitaBot mostra médicos disponíveis
6. Paciente seleciona data e horário
7. VitaBot confirma e envia resumo
8. Tela de confirmação com opção de adicionar ao calendário

### Fluxo 2: Cancelamento / Remarcação
1. Chat → "Cancelar ou remarcar"
2. VitaBot verifica identidade por CPF
3. Mostra consulta atual
4. Paciente escolhe cancelar ou remarcar
5. Se remarcar: seleciona nova data/hora
6. Confirmação da alteração

### Fluxo 3: Admin — Ver Dashboard
1. Login admin (email + senha)
2. Dashboard com métricas do dia
3. Navega para Agenda ou Pacientes
4. Acessa Analytics para relatórios

---

## Navigation Structure

```
(tabs)/
  index.tsx          ← Chat VitaBot (tab principal)
  appointments.tsx   ← Minhas Consultas
  info.tsx           ← Informações da Clínica
  profile.tsx        ← Perfil / Configurações

(admin)/
  _layout.tsx        ← Layout admin (sem tab bar padrão)
  login.tsx          ← Login administrador
  dashboard.tsx      ← Dashboard principal
  schedule.tsx       ← Agenda completa
  patients.tsx       ← Base de pacientes
  doctors.tsx        ← Gestão de médicos
  analytics.tsx      ← Relatórios e gráficos
  settings.tsx       ← Configurações da clínica
  plans.tsx          ← Planos

(modals)/
  booking.tsx        ← Fluxo de agendamento (modal)
  patient-register.tsx ← Cadastro de paciente
  plans.tsx          ← Tela de planos
```

---

## Typography

- **Headings:** System font bold, 24–32px
- **Body:** System font regular, 14–16px
- **Chat bubbles:** 15px, line-height 1.4
- **Labels/Chips:** 12–13px, semibold

---

## Component Design Principles

- Cards com `border-radius: 16px`, sombra sutil
- Botões primários: fundo cyan, texto navy, `border-radius: 12px`
- Inputs: fundo surface, borda border, texto foreground
- Chat bubbles: VitaBot usa surface+borda cyan, paciente usa primary com texto navy
- Ícones: linha fina, estilo médico/profissional
- Animações: sutis, máx 300ms
