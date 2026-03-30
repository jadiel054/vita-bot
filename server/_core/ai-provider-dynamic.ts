/**
 * Dynamic AI Provider Service - Reads configuration from database/local storage
 * This allows runtime switching of AI providers without restarting the server
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

export interface AIConfigFromDB {
  provider: AIProvider;
  openaiKey?: string;
  anthropicKey?: string;
  groqKey?: string;
  enabled: boolean;
}

// Global cache for AI config (will be updated by server routes)
let cachedAIConfig: AIConfigFromDB | null = null;

/**
 * Update the cached AI configuration (called from server routes)
 */
export function updateAIConfigCache(config: AIConfigFromDB): void {
  cachedAIConfig = config;
  console.log(`[AI Provider] Config updated: ${config.provider}`);
}

/**
 * Get the current AI configuration (from cache or defaults)
 */
export function getAIConfig(): AIConfigFromDB {
  if (cachedAIConfig) {
    return cachedAIConfig;
  }

  // Default fallback
  return {
    provider: "manus",
    enabled: true,
  };
}

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
 * Main function to invoke AI based on configured provider (dynamic)
 */
export async function invokeAI(messages: AIMessage[]): Promise<AIResponse> {
  const config = getAIConfig();

  if (!config.enabled) {
    throw new Error("AI is disabled in configuration");
  }

  try {
    switch (config.provider) {
      case "openai": {
        const apiKey = config.openaiKey || process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
        return await invokeOpenAI(
          messages,
          apiKey,
          "https://api.openai.com/v1",
          "gpt-4o-mini"
        );
      }

      case "groq": {
        const apiKey = config.groqKey || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("GROQ_API_KEY or OPENAI_API_KEY is not configured");
        return await invokeOpenAI(
          messages,
          apiKey,
          "https://api.groq.com/openai/v1",
          "mixtral-8x7b-32768"
        );
      }

      case "anthropic": {
        const apiKey = config.anthropicKey || process.env.ANTHROPIC_API_KEY;
        if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
        return await invokeAnthropic(messages, apiKey);
      }

      case "manus":
      default:
        return await invokeManus(messages);
    }
  } catch (error) {
    console.error(`[AI Provider] Error with ${config.provider}:`, error);
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
  enabled: boolean;
} {
  const config = getAIConfig();

  const configured = (() => {
    switch (config.provider) {
      case "openai":
        return !!(config.openaiKey || process.env.OPENAI_API_KEY);
      case "groq":
        return !!(config.groqKey || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY);
      case "anthropic":
        return !!(config.anthropicKey || process.env.ANTHROPIC_API_KEY);
      case "manus":
        return !!ENV.forgeApiKey;
      default:
        return false;
    }
  })();

  const model = (() => {
    switch (config.provider) {
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

  return { 
    provider: config.provider, 
    configured, 
    model,
    enabled: config.enabled
  };
}
