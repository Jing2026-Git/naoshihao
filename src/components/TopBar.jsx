import { useState, useEffect, useCallback } from 'react';
import { Brain, FlaskConical, Save, Check, Sparkles, KeyRound, Globe } from 'lucide-react';
import { getSettings, saveSettings, FREE_MODEL_CONFIG } from '../db';

export default function TopBar({ onOpenLabProfile, hasLabProfile }) {
  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [modelName, setModelName] = useState('openai');
  const [saved, setSaved] = useState(false);
  const [mode, setMode] = useState('free'); // 'free' | 'custom'

  useEffect(() => {
    getSettings().then((settings) => {
      if (settings) {
        setApiKey(settings.apiKey || '');
        setApiUrl(settings.apiUrl || '');
        setModelName(settings.modelName || 'openai');
        setMode(settings.provider === 'custom' ? 'custom' : 'free');
      }
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (mode === 'free') {
      await saveSettings({ ...FREE_MODEL_CONFIG, modelName });
    } else {
      if (!apiUrl || !apiKey) {
        alert('请填写 API 地址和 API Key');
        return;
      }
      await saveSettings({
        provider: 'custom',
        apiKey,
        apiUrl,
        modelName,
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [mode, apiKey, apiUrl, modelName]);

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
            <p className="text-[10px] text-[#a898c4] -mt-0.5">认知神经科学文献阅读助手</p>
          </div>
        </div>

        {/* 配置栏 */}
        <div className="flex items-center gap-3 flex-1 mx-6">
          {/* 模式切换 */}
          <div className="flex items-center bg-[#1a1a24] rounded-lg p-0.5 border border-[rgba(255,255,255,0.1)] shrink-0">
            <button
              onClick={() => setMode('free')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                mode === 'free'
                  ? 'bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] text-white'
                  : 'text-[#a898c4] hover:text-[#d4c8e8]'
              }`}
            >
              免费模型
            </button>
            <button
              onClick={() => setMode('custom')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                mode === 'custom'
                  ? 'bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] text-white'
                  : 'text-[#a898c4] hover:text-[#d4c8e8]'
              }`}
            >
              自定义模型
            </button>
          </div>

          {mode === 'free' ? (
            /* 免费模型选择 */
            <div className="relative shrink-0">
              <select
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="dark-input rounded-lg px-3 py-2 text-sm pr-8 appearance-none cursor-pointer min-w-[160px]"
              >
                <option value="openai">Pollinations GPT-4o</option>
                <option value="mistral">Pollinations Mistral</option>
                <option value="claude-hybridspace">Pollinations Claude</option>
                <option value="gemini">Pollinations Gemini</option>
                <option value="deepseek">Pollinations DeepSeek</option>
              </select>
              <Sparkles className="w-3.5 h-3.5 text-[#c49bff] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : (
            /* 自定义模型输入 */
            <>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Globe className="w-4 h-4 text-[#a898c4] shrink-0" />
                <input
                  type="url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="API 地址，如 https://api.deepseek.com"
                  className="dark-input rounded-lg px-3 py-2 text-sm flex-1 min-w-[120px]"
                />
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <KeyRound className="w-4 h-4 text-[#a898c4] shrink-0" />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="API Key"
                  className="dark-input rounded-lg px-3 py-2 text-sm flex-1 min-w-[120px]"
                />
              </div>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="模型名称"
                className="dark-input rounded-lg px-3 py-2 text-sm w-32 shrink-0"
              />
            </>
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
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#d4c8e8] hover:text-[#f5f0ff] hover:bg-[rgba(255,255,255,0.05)] transition-all cursor-pointer relative"
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
