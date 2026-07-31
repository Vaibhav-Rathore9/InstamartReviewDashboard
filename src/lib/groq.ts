import Groq from "groq-sdk";

export const GROQ_MODEL = "openai/gpt-oss-120b";
export const GROQ_MODEL_FAST = "openai/gpt-oss-20b";

export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set");
  }
  return new Groq({ apiKey });
}

export async function chatJson<T>(
  system: string,
  user: string,
  opts?: { model?: string; temperature?: number }
): Promise<T> {
  const client = getGroqClient();
  const model = opts?.model ?? GROQ_MODEL;
  const completion = await client.chat.completions.create({
    model,
    temperature: opts?.temperature ?? 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const content = completion.choices[0]?.message?.content ?? "{}";
  return JSON.parse(content) as T;
}

export async function chatText(
  system: string,
  user: string,
  opts?: { model?: string; temperature?: number }
): Promise<string> {
  const client = getGroqClient();
  const model = opts?.model ?? GROQ_MODEL;
  const completion = await client.chat.completions.create({
    model,
    temperature: opts?.temperature ?? 0.4,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return completion.choices[0]?.message?.content ?? "";
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 4,
  baseMs = 1200
): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      const wait = baseMs * Math.pow(2, i);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw last;
}
