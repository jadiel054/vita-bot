import { invokeAI, getAIProviderInfo } from "./_core/ai-provider";

async function testAI() {
  const info = getAIProviderInfo();
  console.log(`🧪 Testando Provedor de IA: ${info.provider}`);
  console.log(`🤖 Modelo Configurado: ${info.model}`);
  console.log(`🔑 Configurado: ${info.configured ? "Sim" : "Não (Usando Manus/Fallback)"}`);

  try {
    const response = await invokeAI([
      { role: "system", content: "Você é um assistente de teste." },
      { role: "user", content: "Olá, responda com a palavra 'OK' se estiver funcionando." }
    ]);
    console.log("✅ Resposta da IA:", response.content);
    console.log("📦 Provedor Utilizado:", response.provider);
  } catch (error) {
    console.error("❌ Erro no teste de IA:", error instanceof Error ? error.message : error);
  }
}

testAI();
