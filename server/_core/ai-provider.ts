/**
 * AI Provider Service - Supports multiple LLM providers
 * Configure via environment variables:
 * - AI_PROVIDER: "openai" | "anthropic" | "groq" | "manus" (default)
 * - OPENAI_API_KEY: for OpenAI/Groq
 * - ANTHROPIC_API_KEY: for Claude
 * - GROQ_API_KEY: for Groq (alternative to OPENAI_API_KEY)
 */

import { ENV } from "./env";

export type AIProvider = "openai" | "anthropic" | "groq" | "manus";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  provider: AIProvider;
}

const getProvider = (): AIProvider => {
  const provider = (process.env.AI_PROVIDER || "manus").toLowerCase();
  return provider as AIProvider;
};

/**
 * Invoke OpenAI-compatible API (OpenAI, Groq, etc.)
 */
async function invokeOpenAI(
  messages: AIMessage[],
  apiKey: string,
  baseUrl: string,
  model: string
): Promise<AIResponse> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const data = (await response.json()) as any;
  return {
    content: data.choices?.[0]?.message?.content || "No response",
    model: data.model,
    provider: "openai",
  };
}

/**
 * Invoke Anthropic Claude API
 */
async function invokeAnthropic(
  messages: AIMessage[],
  apiKey: string
): Promise<AIResponse> {
  // Convert system message format for Anthropic
  const systemMessage = messages.find((m) => m.role === "system")?.content || "";
  const otherMessages = messages.filter((m) => m.role !== "system");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: systemMessage,
      messages: otherMessages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${error}`);
  }

  const data = (await response.json()) as any;
  return {
    content: data.content?.[0]?.text || "No response",
    model: data.model,
    provider: "anthropic",
  };
}

/**
 * Invoke Manus Forge API (default)
 */
async function invokeManus(messages: AIMessage[]): Promise<AIResponse> {
  if (!ENV.forgeApiKey) {
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  }

  const apiUrl =
    ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
      ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
      : "https://forge.manus.im/v1/chat/completions";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify({
      model: "gemini-2.5-flash",
      messages,
      max_tokens: 32768,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Manus API error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as any;
  return {
    content:
      data.choices?.[0]?.message?.content ||
      "Desculpe, não consegui processar sua mensagem.",
    model: data.model,
    provider: "manus",
  };
}

/**
 * Main function to invoke AI based on configured provider
 */
export async function invokeAI(messages: AIMessage[]): Promise<AIResponse> {
  const provider = getProvider();

  try {
    switch (provider) {
      case "openai": {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
        return await invokeOpenAI(
          messages,
          apiKey,
          "https://api.openai.com/v1",
          "gpt-4o-mini"
        );
      }

      case "groq": {
        const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("GROQ_API_KEY or OPENAI_API_KEY is not configured");
        return await invokeOpenAI(
          messages,
          apiKey,
          "https://api.groq.com/openai/v1",
          "mixtral-8x7b-32768"
        );
      }

      case "anthropic": {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
        return await invokeAnthropic(messages, apiKey);
      }

      case "manus":
      default:
        return await invokeManus(messages);
    }
  } catch (error) {
    console.error(`[AI Provider] Error with ${provider}:`, error);
    throw error;
  }
}

/**
 * Get current provider info for debugging
 */
export function getAIProviderInfo(): {
  provider: AIProvider;
  configured: boolean;
  model: string;
} {
  const provider = getProvider();

  const configured = (() => {
    switch (provider) {
      case "openai":
        return !!process.env.OPENAI_API_KEY;
      case "groq":
        return !!(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY);
      case "anthropic":
        return !!process.env.ANTHROPIC_API_KEY;
      case "manus":
        return !!ENV.forgeApiKey;
      default:
        return false;
    }
  })();

  const model = (() => {
    switch (provider) {
      case "openai":
        return "gpt-4o-mini";
      case "groq":
        return "mixtral-8x7b-32768";
      case "anthropic":
        return "claude-3-5-sonnet-20241022";
      case "manus":
        return "gemini-2.5-flash";
      default:
        return "unknown";
    }
  })();

  return { provider, configured, model };
}
