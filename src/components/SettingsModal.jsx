import { useState, useEffect, useCallback } from 'react';
import { X, Save, Zap, Gift, Settings2, Check, Server } from 'lucide-react';
import { getSettings, saveSettings, FREE_MODEL_PROVIDERS } from '../db';

const PRESETS = [
  { name: 'DeepSeek', url: 'https://api.deepseek.com', model: 'deepseek-chat' },
  { name: 'OpenAI', url: 'https://api.openai.com', model: 'gpt-4o' },
  { name: '智谱GLM', url: 'https://open.bigmodel.cn/api/paas', model: 'glm-4' },
  { name: '通义千问', url: 'https://dashscope.aliyuncs.com/compatible-mode', model: 'qwen-turbo' },
];

export default function SettingsModal({ isOpen, onClose }) {
  const [mode, setMode] = useState('free'); // 'free' | 'custom'
  const [freeProviderId, setFreeProviderId] = useState(FREE_MODEL_PROVIDERS[0].id);
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    getSettings()
      .then((settings) => {
        if (settings) {
          if (settings.provider === 'free' || !settings.apiKey) {
            setMode('free');
            setFreeProviderId(settings.freeProviderId || FREE_MODEL_PROVIDERS[0].id);
          } else {
            setMode('custom');
            setApiUrl(settings.apiUrl || '');
            setApiKey(settings.apiKey || '');
            setModelName(settings.modelName || '');
          }
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
      if (mode === 'free') {
        const provider = FREE_MODEL_PROVIDERS.find(p => p.id === freeProviderId);
        await saveSettings({
          provider: 'free',
          freeProviderId: freeProviderId,
          apiUrl: provider.apiUrl,
          modelName: provider.modelName,
          apiKey: '',
        });
      } else {
        if (!apiUrl || !apiKey) {
          alert('请填写完整的 API 地址和 API Key');
          return;
        }
        await saveSettings({
          provider: 'custom',
          apiUrl,
          apiKey,
          modelName: modelName || 'gpt-4o-mini',
        });
      }
      onClose();
    } catch (err) {
      console.error('保存设置失败:', err);
      alert('保存设置失败，请重试。');
    }
  }, [mode, freeProviderId, apiUrl, apiKey, modelName, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="glass-card-strong rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-fade-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.1)] sticky top-0 z-10" style={{ background: 'rgba(45,30,72,0.9)', backdropFilter: 'blur(20px)' }}>
          <h2 className="text-lg font-semibold text-[#f5f0ff]">AI 模型设置</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#a898c4] hover:text-[#f5f0ff] hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 模式切换 */}
        <div className="px-6 pt-5">
          <div className="grid grid-cols-2 gap-3">
            {/* 免费模型 */}
            <button
              onClick={() => setMode('free')}
              className={`relative p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                mode === 'free'
                  ? 'border-[#c49bff] bg-[rgba(196,155,255,0.1)]'
                  : 'border-[rgba(255,255,255,0.1)] hover:border-[rgba(196,155,255,0.3)]'
              }`}
            >
              {mode === 'free' && (
                <div className="absolute top-2 right-2">
                  <Check className="w-4 h-4 text-[#c49bff]" />
                </div>
              )}
              <div className="flex items-center gap-2 mb-1.5">
                <Gift className="w-5 h-5 text-[#c49bff]" />
                <span className="font-semibold text-sm text-[#f5f0ff]">免费模型</span>
              </div>
              <p className="text-xs text-[#a898c4] leading-relaxed">
                内置免费 AI，打开即用，无需配置 API Key
              </p>
            </button>

            {/* 自定义模型 */}
            <button
              onClick={() => setMode('custom')}
              className={`relative p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                mode === 'custom'
                  ? 'border-[#c49bff] bg-[rgba(196,155,255,0.1)]'
                  : 'border-[rgba(255,255,255,0.1)] hover:border-[rgba(196,155,255,0.3)]'
              }`}
            >
              {mode === 'custom' && (
                <div className="absolute top-2 right-2">
                  <Check className="w-4 h-4 text-[#c49bff]" />
                </div>
              )}
              <div className="flex items-center gap-2 mb-1.5">
                <Settings2 className="w-5 h-5 text-[#7ab8ff]" />
                <span className="font-semibold text-sm text-[#f5f0ff]">自定义模型</span>
              </div>
              <p className="text-xs text-[#a898c4] leading-relaxed">
                使用自己的 API Key，支持 DeepSeek、OpenAI 等
              </p>
            </button>
          </div>
        </div>

        {/* 免费模型选择 */}
        {mode === 'free' && (
          <div className="px-6 py-5 space-y-3">
            <p className="text-sm font-medium text-[#d4c8e8] mb-2">选择免费模型提供商</p>
            {FREE_MODEL_PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                onClick={() => setFreeProviderId(provider.id)}
                className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  freeProviderId === provider.id
                    ? 'border-[#c49bff] bg-[rgba(196,155,255,0.1)]'
                    : 'border-[rgba(255,255,255,0.1)] hover:border-[rgba(196,155,255,0.2)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Server className="w-5 h-5 text-[#c49bff]" />
                    <div>
                      <p className="text-sm font-semibold text-[#f5f0ff]">{provider.name}</p>
                      <p className="text-xs text-[#a898c4] mt-0.5">{provider.desc}</p>
                    </div>
                  </div>
                  {freeProviderId === provider.id && (
                    <Check className="w-4 h-4 text-[#c49bff]" />
                  )}
                </div>
                <p className="text-[11px] text-[#7a6a9a] mt-2 font-mono">{provider.modelName}</p>
              </button>
            ))}
          </div>
        )}

        {/* 自定义模型表单 */}
        {mode === 'custom' && (
          <div className="px-6 py-5 space-y-4">
            {/* 预设按钮 */}
            <div>
              <label className="block text-sm font-medium text-[#d4c8e8] mb-2">快速预设</label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handlePreset(preset)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-[rgba(255,255,255,0.1)] text-[#a898c4] hover:border-[#c49bff] hover:text-[#c49bff] hover:bg-[rgba(196,155,255,0.08)] transition-colors cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* API 地址 */}
            <div>
              <label className="block text-sm font-medium text-[#d4c8e8] mb-1.5">API 地址</label>
              <input
                type="url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.deepseek.com"
                className="dark-input rounded-lg w-full px-3 py-2.5 text-sm"
              />
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-[#d4c8e8] mb-1.5">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="dark-input rounded-lg w-full px-3 py-2.5 text-sm"
              />
            </div>

            {/* 模型名称 */}
            <div>
              <label className="block text-sm font-medium text-[#d4c8e8] mb-1.5">模型名称</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="deepseek-chat"
                className="dark-input rounded-lg w-full px-3 py-2.5 text-sm"
              />
            </div>
          </div>
        )}

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[rgba(255,255,255,0.1)] sticky bottom-0" style={{ background: 'rgba(45,30,72,0.9)', backdropFilter: 'blur(20px)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#a898c4] hover:text-[#f5f0ff] hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium btn-primary cursor-pointer"
          >
            <Save className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
