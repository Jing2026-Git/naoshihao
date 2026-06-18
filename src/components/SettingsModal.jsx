import { useState, useEffect, useCallback } from 'react';
import { X, Save, Zap } from 'lucide-react';
import { getSettings, saveSettings } from '../db';

const PRESETS = [
  { name: 'DeepSeek', url: 'https://api.deepseek.com', model: 'deepseek-chat' },
  { name: 'OpenAI', url: 'https://api.openai.com', model: 'gpt-4o' },
  { name: '智谱GLM', url: 'https://open.bigmodel.cn/api/paas', model: 'glm-4' },
  { name: '通义千问', url: 'https://dashscope.aliyuncs.com/compatible-mode', model: 'qwen-turbo' },
];

export default function SettingsModal({ isOpen, onClose }) {
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    getSettings()
      .then((settings) => {
        if (settings) {
          setApiUrl(settings.apiUrl || '');
          setApiKey(settings.apiKey || '');
          setModelName(settings.modelName || '');
        }
      })
      .catch((err) => console.error('加载设置失败:', err));
  }, [isOpen]);

  const handlePreset = useCallback((preset) => {
    setApiUrl(preset.url);
    setModelName(preset.model);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await saveSettings({ apiUrl, apiKey, modelName });
      onClose();
    } catch (err) {
      console.error('保存设置失败:', err);
      alert('保存设置失败，请重试。');
    }
  }, [apiUrl, apiKey, modelName, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-lg mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">API 配置</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="px-6 py-5 space-y-4">
          {/* 预设按钮 */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">快速预设</label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePreset(preset)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-border text-text-secondary hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* API 地址 */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">API 地址</label>
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.deepseek.com"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-shadow"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-shadow"
            />
          </div>

          {/* 模型名称 */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">模型名称</label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="deepseek-chat"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-shadow"
            />
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
