import { useState, useEffect, useCallback } from 'react';
import { Brain, FlaskConical, Save, Check, Sparkles } from 'lucide-react';
import { getSettings, saveSettings, FREE_MODEL_CONFIG } from '../db';

const MODEL_OPTIONS = [
  { value: 'openai', label: 'GPT-4o (免费)' },
  { value: 'mistral', label: 'Mistral (免费)' },
  { value: 'deepseek-chat', label: 'DeepSeek' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'glm-4', label: '智谱GLM-4' },
  { value: 'qwen-turbo', label: '通义千问' },
];

export default function TopBar({ onOpenLabProfile, hasLabProfile }) {
  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [modelName, setModelName] = useState('openai');
  const [saved, setSaved] = useState(false);
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    getSettings().then((settings) => {
      if (settings) {
        setApiKey(settings.apiKey || '');
        setApiUrl(settings.apiUrl || '');
        setModelName(settings.modelName || 'openai');
        setIsCustom(settings.provider === 'custom');
      }
    });
  }, []);

  const handleSave = useCallback(async () => {
    const isFreeModel = !apiKey && !apiUrl;
    if (isFreeModel) {
      await saveSettings({ ...FREE_MODEL_CONFIG, modelName });
    } else {
      await saveSettings({
        provider: 'custom',
        apiKey,
        apiUrl,
        modelName,
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [apiKey, apiUrl, modelName]);

  const handleModelChange = (e) => {
    const val = e.target.value;
    setModelName(val);
    const freeModels = ['openai', 'mistral'];
    if (freeModels.includes(val)) {
      setApiKey('');
      setApiUrl('');
      setIsCustom(false);
    } else {
      setIsCustom(true);
    }
  };

  return (
    <header className="glass-card-strong shrink-0 z-50 relative">
      <div className="flex items-center justify-between px-5 py-3">
        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#60a5fa] flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold gradient-text tracking-tight">脑师好</h1>
            <p className="text-[10px] text-[#6b6b7b] -mt-0.5">认知神经科学文献阅读助手</p>
          </div>
        </div>

        {/* 配置栏 */}
        <div className="flex items-center gap-3 flex-1 mx-6 max-w-2xl">
          {/* 模型选择 */}
          <div className="relative shrink-0">
            <select
              value={modelName}
              onChange={handleModelChange}
              className="dark-input rounded-lg px-3 py-2 text-sm pr-8 appearance-none cursor-pointer min-w-[140px]"
            >
              <optgroup label="免费模型">
                <option value="openai">GPT-4o (免费)</option>
                <option value="mistral">Mistral (免费)</option>
              </optgroup>
              <optgroup label="自定义模型">
                <option value="deepseek-chat">DeepSeek</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="glm-4">智谱GLM-4</option>
                <option value="qwen-turbo">通义千问</option>
              </optgroup>
            </select>
            <Sparkles className="w-3.5 h-3.5 text-[#a78bfa] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* API URL */}
          {isCustom && (
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="API 地址"
              className="dark-input rounded-lg px-3 py-2 text-sm flex-1 min-w-[120px]"
            />
          )}

          {/* API Key */}
          {isCustom && (
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="API Key"
              className="dark-input rounded-lg px-3 py-2 text-sm flex-1 min-w-[120px]"
            />
          )}

          {/* 保存按钮 */}
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer shrink-0 ${
              saved
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'btn-primary'
            }`}
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                已保存
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                保存配置
              </>
            )}
          </button>
        </div>

        {/* 右侧操作 */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenLabProfile}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#a0a0b0] hover:text-[#e8e8ef] hover:bg-[rgba(255,255,255,0.05)] transition-all cursor-pointer relative"
          >
            <FlaskConical className="w-4 h-4" />
            <span>脑师画像</span>
            {hasLabProfile && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#a78bfa] animate-pulse" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
