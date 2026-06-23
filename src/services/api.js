import { getSettings, FREE_MODEL_PROVIDERS } from '../db.js';

/**
 * 脑师好 - AI API 服务模块
 * 支持三种模式：
 * 1. 免费模型（SiliconFlow / Pollinations.AI）
 * 2. 自定义 API（OpenAI 兼容格式，用户自带 Key）
 */

/**
 * 判断是否为免费模型
 */
function isFreeModel(settings) {
  return settings?.provider === 'free' || !settings?.apiKey;
}

/**
 * 获取当前免费模型配置
 */
function getFreeProvider(settings) {
  const providerId = settings?.freeProviderId;
  if (providerId) {
    const found = FREE_MODEL_PROVIDERS.find(p => p.id === providerId);
    if (found) return found;
  }
  return FREE_MODEL_PROVIDERS[0];
}

/**
 * 构建请求参数
 */
function buildRequestConfig(messages, options, settings, stream) {
  const isFree = isFreeModel(settings);

  if (isFree) {
    const provider = getFreeProvider(settings);
    const baseUrl = provider.apiUrl.replace(/\/+$/, '');
    const url = `${baseUrl}/chat/completions`;
    const body = {
      model: options.modelName || provider.modelName,
      messages,
      stream,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
    };
    return {
      url,
      headers: {
        'Content-Type': 'application/json',
        // SiliconFlow 需要 Authorization header，但不需要 key（免费模型）
        ...(provider.id === 'siliconflow' ? { 'Authorization': 'Bearer free' } : {}),
      },
      body,
    };
  }

  // 自定义 API：OpenAI 兼容格式
  const modelName = options.modelName || settings.modelName || 'gpt-4o-mini';
  const baseUrl = (settings.apiUrl || '').replace(/\/+$/, '');
  const url = `${baseUrl}/chat/completions`;
  const body = {
    model: modelName,
    messages,
    stream,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 4096,
  };
  return {
    url,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body,
  };
}

/**
 * 处理 API 错误响应
 */
async function handleErrorResponse(response) {
  const errorBody = await response.text().catch(() => '未知错误');
  let errorMessage = `API 请求失败（${response.status}）`;

  try {
    const parsed = JSON.parse(errorBody);
    if (parsed.error?.message) {
      errorMessage += `：${parsed.error.message}`;
    }
  } catch {
    errorMessage += `：${errorBody.slice(0, 200)}`;
  }

  switch (response.status) {
    case 401:
      errorMessage = 'API Key 无效或已过期，请检查设置';
      break;
    case 403:
      errorMessage = 'API 访问被拒绝，请检查权限';
      break;
    case 429:
      errorMessage = '请求过于频繁，请稍后再试';
      break;
    case 500:
    case 502:
    case 503:
      errorMessage = 'AI 服务暂时不可用，请稍后再试';
      break;
  }

  throw new Error(errorMessage);
}

/**
 * 带重试的 fetch
 */
async function fetchWithRetry(url, options, maxRetries = 2) {
  let lastError;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      // 4xx 错误不重试
      if (response.status >= 400 && response.status < 500) {
        await handleErrorResponse(response);
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (err) {
      lastError = err;
    }
    if (i < maxRetries) {
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw lastError;
}

/**
 * 流式调用 AI 接口（带自动重试）
 */
export async function* callAI(messages, options = {}) {
  const settings = await getSettings();

  if (!isFreeModel(settings)) {
    if (!settings?.apiKey) {
      throw new Error('请先在设置中配置 API Key');
    }
    if (!settings?.apiUrl) {
      throw new Error('请先在设置中配置 API 地址');
    }
  }

  const config = buildRequestConfig(messages, options, settings, true);

  const response = await fetchWithRetry(config.url, {
    method: 'POST',
    headers: config.headers,
    body: JSON.stringify(config.body),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch {
          // 忽略无法解析的行
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * 非流式调用 AI 接口（带自动重试）
 */
export async function callAINonStream(messages, options = {}) {
  const settings = await getSettings();

  if (!isFreeModel(settings)) {
    if (!settings?.apiKey) {
      throw new Error('请先在设置中配置 API Key');
    }
    if (!settings?.apiUrl) {
      throw new Error('请先在设置中配置 API 地址');
    }
  }

  const config = buildRequestConfig(messages, options, settings, false);

  const response = await fetchWithRetry(config.url, {
    method: 'POST',
    headers: config.headers,
    body: JSON.stringify(config.body),
  });

  try {
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch {
    throw new Error('AI 响应解析失败，请检查 API 返回格式');
  }
}
