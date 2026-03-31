import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { systemRouter } from "./_core/systemRouter.js";
import { publicProcedure, router } from "./_core/trpc.js";
import { invokeAI, getAIProviderInfo, updateAIConfigCache } from "./_core/ai-provider-dynamic.js";
import { generateSystemPrompt } from "./_core/vitabot-system-prompt.js";
import {
  sendAppointmentNotification,
  sendCancellationNotification,
  sendTestNotification,
  sendPatientConfirmation,
  isWhatsAppEnabled,
} from "./services/whatsapp.js";

export const appRouter = router({
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

    getAIStatus: publicProcedure.query(() => {
      return getAIProviderInfo();
    }),

    syncAIConfig: publicProcedure
      .input(
        z.object({
          provider: z.enum(["manus", "openai", "anthropic", "groq"]),
          openaiKey: z.string().optional(),
          anthropicKey: z.string().optional(),
          groqKey: z.string().optional(),
          enabled: z.boolean(),
        })
      )
      .mutation(({ input }) => {
        // Update the server-side cache with client configuration
        updateAIConfigCache(input);
        return { success: true, message: "AI configuration synchronized" };
      }),

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
        const systemContent = generateSystemPrompt(input.clinicName);

        try {
          const response = await invokeAI([
            { role: "system", content: systemContent },
            ...input.messages,
          ]);

          return { 
            content: response.content,
            provider: response.provider,
            model: response.model 
          };
        } catch (error) {
          console.error("[Chat] AI Provider Error:", error);
          return { 
            content: "Olá! No momento estou operando em modo offline para manutenções rápidas. Se precisar agendar uma consulta, clique no botão 'Agendar consulta' abaixo!",
            provider: "fallback",
            model: "offline"
          };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
