import { getSettings, FREE_MODEL_CONFIG } from '../db.js';

/**
 * 脑师好 - AI API 服务模块
 * 支持两种模式：
 * 1. 免费模型（Pollinations.AI，无需 API Key）
 * 2. 自定义 API（OpenAI 兼容格式，用户自带 Key）
 */

/**
 * 判断是否为免费模型
 */
function isFreeModel(settings) {
  return settings?.provider === 'free' || !settings?.apiKey;
}

/**
 * 构建请求参数
 */
function buildRequestConfig(messages, options, settings, stream) {
  const isFree = isFreeModel(settings);

  if (isFree) {
    // 免费模型：Pollinations.AI OpenAI 兼容端点
    const url = FREE_MODEL_CONFIG.apiUrl;
    const body = {
      model: options.modelName || FREE_MODEL_CONFIG.modelName,
      messages,
      stream,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
    };
    return {
      url,
      headers: { 'Content-Type': 'application/json' },
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
 * 流式调用 AI 接口
 * 返回一个异步生成器，逐步产出文本片段
 *
 * @param {Array<{role: string, content: string}>} messages - 消息列表
 * @param {Object} [options] - 可选参数
 * @param {string} [options.modelName] - 覆盖设置中的模型名称
 * @param {number} [options.temperature] - 温度参数
 * @param {number} [options.maxTokens] - 最大 token 数
 * @yields {string} 文本片段
 * @returns {AsyncGenerator<string>}
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

  let response;
  try {
    response = await fetch(config.url, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify(config.body),
    });
  } catch (networkError) {
    throw new Error(`网络请求失败，请检查网络连接：${networkError.message}`);
  }

  if (!response.ok) {
    await handleErrorResponse(response);
  }

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
 * 非流式调用 AI 接口
 * 等待完整响应后一次性返回
 *
 * @param {Array<{role: string, content: string}>} messages - 消息列表
 * @param {Object} [options] - 可选参数
 * @param {string} [options.modelName] - 覆盖设置中的模型名称
 * @param {number} [options.temperature] - 温度参数
 * @param {number} [options.maxTokens] - 最大 token 数
 * @returns {Promise<string>} 完整的回复文本
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

  let response;
  try {
    response = await fetch(config.url, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify(config.body),
    });
  } catch (networkError) {
    throw new Error(`网络请求失败，请检查网络连接：${networkError.message}`);
  }

  if (!response.ok) {
    await handleErrorResponse(response);
  }

  try {
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch {
    throw new Error('AI 响应解析失败，请检查 API 返回格式');
  }
}
