import Dexie from 'dexie';

/**
 * 脑师好 - IndexedDB 数据库模块
 * 基于 Dexie.js 封装，提供论文、对话、设置、实验室档案的持久化存储
 */

const db = new Dexie('NaoshihaoDB');

db.version(1).stores({
  settings: 'id, provider, apiKey, apiUrl, modelName',
  papers: '++id, fileName, fileData, textContent, uploadDate, title',
  conversations: '++id, paperId, messages, createdAt',
  labProfile: 'id, directions, literatureTypes, researchQuestions, techniques, rawText, createdAt, updatedAt',
});

// 免费模型默认配置（Pollinations.AI，无需 API Key）
export const FREE_MODEL_CONFIG = {
  provider: 'free',
  apiUrl: 'https://text.pollinations.ai/openai',
  modelName: 'openai',
  apiKey: '',
};

export default db;

// ========================
// Settings 相关操作
// ========================

/**
 * 获取应用设置（单条记录，id 固定为 'app'）
 * @returns {Promise<Object|null>}
 */
export async function getSettings() {
  const settings = await db.settings.get('app');
  // 如果没有设置，返回免费模型默认配置
  if (!settings) {
    return { ...FREE_MODEL_CONFIG };
  }
  return settings;
}

/**
 * 保存应用设置，采用 upsert 语义
 * @param {Object} data - 设置数据 { apiKey, apiUrl, modelName }
 * @returns {Promise<void>}
 */
export async function saveSettings(data) {
  await db.settings.put({ id: 'app', ...data });
}

// ========================
// Papers 相关操作
// ========================

/**
 * 保存论文记录
 * @param {Object} paper - 论文数据 { fileName, fileData, textContent, title }
 * @returns {Promise<number>} 新记录的 id
 */
export async function savePaper(paper) {
  return db.papers.add({
    ...paper,
    uploadDate: new Date().toISOString(),
  });
}

/**
 * 根据 id 获取单篇论文
 * @param {number} id
 * @returns {Promise<Object|undefined>}
 */
export async function getPaper(id) {
  return db.papers.get(id);
}

/**
 * 获取所有论文，按上传时间倒序排列
 * @returns {Promise<Array>}
 */
export async function getAllPapers() {
  return db.papers.orderBy('uploadDate').reverse().toArray();
}

/**
 * 删除论文及其关联对话
 * @param {number} id - 论文 id
 * @returns {Promise<void>}
 */
export async function deletePaper(id) {
  await db.transaction('rw', db.papers, db.conversations, async () => {
    await db.conversations.where('paperId').equals(id).delete();
    await db.papers.delete(id);
  });
}

// ========================
// Conversations 相关操作
// ========================

/**
 * 保存对话记录（新建）
 * @param {Object} conversation - 对话数据 { paperId, messages, createdAt }
 * @returns {Promise<number>} 新记录的 id
 */
export async function saveConversation(conversation) {
  return db.conversations.add({
    ...conversation,
    createdAt: new Date().toISOString(),
  });
}

/**
 * 根据论文 id 获取关联对话
 * @param {number} paperId
 * @returns {Promise<Object|undefined>}
 */
export async function getConversationByPaper(paperId) {
  return db.conversations.where('paperId').equals(paperId).first();
}

/**
 * 获取所有对话，按创建时间倒序排列
 * @returns {Promise<Array>}
 */
export async function getAllConversations() {
  return db.conversations.orderBy('createdAt').reverse().toArray();
}

// ========================
// Lab Profile 相关操作
// ========================

/**
 * 保存实验室档案（upsert 语义，id 固定为 'lab'）
 * @param {Object} profile - 档案数据 { directions, literatureTypes, researchQuestions, techniques, rawText }
 * @returns {Promise<void>}
 */
export async function saveLabProfile(profile) {
  const now = new Date().toISOString();
  const existing = await db.labProfile.get('lab');

  if (existing) {
    await db.labProfile.update('lab', { ...profile, updatedAt: now });
  } else {
    await db.labProfile.add({
      id: 'lab',
      ...profile,
      createdAt: now,
      updatedAt: now,
    });
  }
}

/**
 * 获取实验室档案
 * @returns {Promise<Object|undefined>}
 */
export async function getLabProfile() {
  return db.labProfile.get('lab');
}
