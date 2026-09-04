#!/usr/bin/env node

const fs = require("fs");

const ENV_FILES = [".env", ".env.local"];

function parseEnvFile(path) {
  if (!fs.existsSync(path)) {
    return {};
  }

  return fs
    .readFileSync(path, "utf8")
    .split(/\r?\n/)
    .reduce((env, line) => {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match) {
        return env;
      }

      const [, key, rawValue] = match;
      env[key] = rawValue.trim().replace(/^['"]|['"]$/g, "");
      return env;
    }, {});
}

function loadEnv() {
  return ENV_FILES.reduce(
    (env, file) => ({ ...env, ...parseEnvFile(file) }),
    { ...process.env },
  );
}

function isRealKey(value, placeholder) {
  return Boolean(value && value.trim() && value.trim() !== placeholder);
}

function describeKey(value, placeholder) {
  if (!value) {
    return "MISSING";
  }

  if (value === placeholder) {
    return "PLACEHOLDER";
  }

  return `SET length=${value.length} suffix=${value.slice(-4)}`;
}

function parseModelList(value) {
  return String(value || "")
    .split(/[,\n]/)
    .map((model) => model.trim())
    .filter(Boolean);
}

function getOpenRouterModels(env) {
  const fallbackModels = [
    "openrouter/free",
    "openai/gpt-oss-120b:free",
    "qwen/qwen3-coder:free",
  ];
  const modelIds = [
    ...parseModelList(env.EXPO_PUBLIC_AI_MODELS),
    ...parseModelList(env.EXPO_PUBLIC_AI_MODEL),
    ...fallbackModels,
  ].filter((model) => model !== "your_model_here");

  return [...new Set(modelIds)].slice(0, 5);
}

async function postJson(url, body, headers) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    let json = null;

    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }

    return { ok: response.ok, status: response.status, json, text };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkOpenRouter(env) {
  const key = env.EXPO_PUBLIC_OPENROUTER_API_KEY;
  const endpoint =
    env.EXPO_PUBLIC_OPENROUTER_API_URL ||
    "https://openrouter.ai/api/v1/chat/completions";
  const models = getOpenRouterModels(env);

  console.log(`OpenRouter key: ${describeKey(key, "your_api_key_here")}`);

  if (!isRealKey(key, "your_api_key_here")) {
    return false;
  }

  const checks = await Promise.all(
    models.map(async (model) => {
      const result = await postJson(
        endpoint,
        {
          model,
          max_tokens: 30,
          temperature: 0,
          messages: [
            {
              role: "user",
              content: "Balas satu kata: READY",
            },
          ],
        },
        {
          Authorization: `Bearer ${key}`,
          "HTTP-Referer": "https://logic-block-design.local",
          "X-Title": "Logic Block Design",
        },
      );

      const content = result.json?.choices?.[0]?.message?.content;
      const ready = result.ok && typeof content === "string" && content.trim();
      if (ready) {
        console.log(`OpenRouter READY model=${model} status=${result.status}`);
      } else {
        console.log(
          `OpenRouter NOT READY model=${model} status=${result.status} error=${
            result.json?.error?.message || result.text.slice(0, 120)
          }`,
        );
      }

      return Boolean(ready);
    }),
  );

  return checks.some(Boolean);
}

async function checkOpenAI(env) {
  const key = env.EXPO_PUBLIC_OPENAI_API_KEY;
  const endpoint =
    env.EXPO_PUBLIC_OPENAI_API_URL || "https://api.openai.com/v1/responses";
  const model = env.EXPO_PUBLIC_OPENAI_MODEL || "gpt-5.5";

  console.log(`OpenAI key: ${describeKey(key, "your_openai_api_key_here")}`);

  if (!isRealKey(key, "your_openai_api_key_here")) {
    return false;
  }

  const result = await postJson(
    endpoint,
    {
      model,
      input: "Balas satu kata: READY",
      store: false,
      text: {
        verbosity: "low",
      },
      reasoning: {
        effort: "low",
      },
    },
    {
      Authorization: `Bearer ${key}`,
    },
  );

  const content =
    result.json?.output_text ||
    result.json?.output?.flatMap((item) => item?.content || [])?.[0]?.text;

  if (result.ok && typeof content === "string" && content.trim()) {
    console.log(`OpenAI READY model=${model} status=${result.status}`);
    return true;
  }

  console.log(
    `OpenAI NOT READY status=${result.status} error=${
      result.json?.error?.message || result.text.slice(0, 120)
    }`,
  );
  return false;
}

async function main() {
  const env = loadEnv();
  const openRouterReady = await checkOpenRouter(env);
  const openAIReady = await checkOpenAI(env);

  if (!openRouterReady && !openAIReady) {
    console.log("");
    console.log("AI API belum ready. Isi .env dengan salah satu API key asli.");
    process.exit(1);
  }

  console.log("");
  console.log("Minimal satu AI provider ready.");
}

main().catch((error) => {
  console.error("AI API check failed:", error.message);
  process.exit(1);
});
