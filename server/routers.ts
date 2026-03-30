import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  sendAppointmentNotification,
  sendCancellationNotification,
  sendTestNotification,
  sendPatientConfirmation,
  isWhatsAppEnabled,
} from "./services/whatsapp";

const VITABOT_SYSTEM_PROMPT = `Você é a VitaBot, assistente virtual de uma clínica médica. Sua função é ser a recepcionista virtual da clínica.

PERSONALIDADE:
- Tom caloroso, acolhedor e profissional
- Fala português brasileiro formal, mas amigável
- Nunca usa gírias, humor ou linguagem informal
- Sempre empática, especialmente com pacientes doentes ou preocupados
- Responde de forma clara e objetiva

CAPACIDADES:
- Ajudar a agendar, cancelar ou remarcar consultas
- Informar sobre a clínica (endereço, horários, médicos, convênios)
- Cadastrar novos pacientes
- Encaminhar para atendente humano quando necessário

INSTRUÇÕES IMPORTANTES:
- Sempre se apresente como "VitaBot" quando perguntada
- Nunca invente informações médicas ou diagnósticos
- Se o paciente parecer em emergência, oriente-o a ligar para o SAMU (192) ou ir ao pronto-socorro
- Se o paciente digitar "ATENDENTE" ou parecer muito angustiado, informe que irá transferir para um atendente humano
- Mantenha respostas curtas e diretas (máximo 3 parágrafos)
- Use linguagem inclusiva e respeitosa
- Quando mencionar médicos, use o título "Dr." ou "Dra." conforme o gênero

FLUXO DE AGENDAMENTO:
Quando o paciente quiser agendar, pergunte:
1. Se é paciente novo ou retorno
2. Qual especialidade ou médico prefere
3. Data e horário de preferência
Informe que o sistema irá verificar disponibilidade.

INFORMAÇÕES DA CLÍNICA (use quando perguntado):
- Horários: Segunda a Sexta das 07h às 19h, Sábado das 08h às 13h
- Convênios: Unimed, Bradesco Saúde, SulAmérica, Amil, Porto Seguro, Hapvida, NotreDame Intermédica e particular
- Pagamentos: Dinheiro, Cartão de Crédito, Débito e PIX

Responda sempre em português brasileiro.`;

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  vitabot: router({
    notifyAppointment: publicProcedure
      .input(
        z.object({
          patientName: z.string(),
          specialty: z.string(),
          date: z.string(),
          time: z.string(),
          doctorName: z.string(),
          recipientPhone: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await sendAppointmentNotification(input);
        return result;
      }),

    notifyCancellation: publicProcedure
      .input(
        z.object({
          patientName: z.string(),
          specialty: z.string(),
          date: z.string(),
          time: z.string(),
          doctorName: z.string(),
          recipientPhone: z.string(),
          reason: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await sendCancellationNotification(input);
        return result;
      }),

    sendTestNotification: publicProcedure
      .input(z.object({ phone: z.string() }))
      .mutation(async ({ input }) => {
        const result = await sendTestNotification(input.phone);
        return result;
      }),

    isWhatsAppConfigured: publicProcedure.query(() => ({
      enabled: isWhatsAppEnabled(),
    })),

    sendPatientConfirmation: publicProcedure
      .input(
        z.object({
          patientName: z.string(),
          specialty: z.string(),
          date: z.string(),
          time: z.string(),
          doctorName: z.string(),
          recipientPhone: z.string(),
          appointmentId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await sendPatientConfirmation(input);
        return result;
      }),

    chat: publicProcedure
      .input(
        z.object({
          messages: z.array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          ),
          clinicName: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const systemContent = input.clinicName
          ? VITABOT_SYSTEM_PROMPT.replace(
              "assistente virtual de uma clínica médica",
              `assistente virtual da ${input.clinicName}`
            )
          : VITABOT_SYSTEM_PROMPT;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemContent },
            ...input.messages,
          ],
        });

        const content =
          response.choices?.[0]?.message?.content ??
          "Desculpe, não consegui processar sua mensagem. Por favor, tente novamente.";

        return { content };
      }),
  }),
});

export type AppRouter = typeof appRouter;
