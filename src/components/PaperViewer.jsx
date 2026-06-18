import { useState, useCallback, useRef } from 'react';
import { FileUp, FileText, Loader2, ClipboardPaste, X, ScrollText } from 'lucide-react';

export default function PaperViewer({ paper, onPaperUpload, isLoading }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onPaperUpload(files[0]);
    }
  }, [onPaperUpload]);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      onPaperUpload(file);
    }
    e.target.value = '';
  }, [onPaperUpload]);

  const handlePasteSubmit = useCallback(() => {
    if (!pasteText.trim()) return;
    // 创建虚拟文件对象
    const blob = new Blob([pasteText], { type: 'text/plain' });
    const file = new File([blob], '粘贴的文本.txt', { type: 'text/plain' });
    onPaperUpload(file);
    setPasteText('');
    setShowPaste(false);
  }, [pasteText, onPaperUpload]);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-[#a78bfa]" />
          <span className="text-sm font-medium text-[#e8e8ef]">文献内容</span>
        </div>
        {paper && (
          <span className="text-xs text-[#6b6b7b] truncate max-w-[200px]">{paper.title}</span>
        )}
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-hidden relative">
        {!paper ? (
          <div className="h-full flex flex-col items-center justify-center p-6">
            {/* 拖拽上传区 */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full max-w-md glass-card rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                isDragOver ? 'drop-zone-active scale-[1.02]' : 'hover:border-[rgba(167,139,250,0.3)]'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#a78bfa]/20 to-[#60a5fa]/20 flex items-center justify-center mx-auto mb-4 border border-[rgba(167,139,250,0.2)]">
                <FileUp className="w-8 h-8 text-[#a78bfa]" />
              </div>
              <p className="text-[#e8e8ef] font-medium mb-1.5">拖拽文献到这里</p>
              <p className="text-[#6b6b7b] text-sm mb-4">支持 PDF、Word 文档格式</p>
              <button className="btn-secondary px-4 py-2 rounded-lg text-sm">
                选择文件
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* 或 */}
            <div className="flex items-center gap-3 my-5 w-full max-w-md">
              <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
              <span className="text-xs text-[#4a4a5a]">或</span>
              <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
            </div>

            {/* 粘贴文本 */}
            {!showPaste ? (
              <button
                onClick={(e) => { e.stopPropagation(); setShowPaste(true); }}
                className="w-full max-w-md glass-card rounded-xl p-4 flex items-center gap-3 text-left hover:border-[rgba(167,139,250,0.3)] transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-[rgba(34,211,238,0.1)] flex items-center justify-center">
                  <ClipboardPaste className="w-5 h-5 text-[#22d3ee]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#e8e8ef]">粘贴文本</p>
                  <p className="text-xs text-[#6b6b7b]">直接粘贴论文内容</p>
                </div>
              </button>
            ) : (
              <div className="w-full max-w-md glass-card rounded-xl p-4 animate-fade-in-scale">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[#e8e8ef]">粘贴论文内容</span>
                  <button
                    onClick={() => setShowPaste(false)}
                    className="p-1 rounded hover:bg-[rgba(255,255,255,0.05)] text-[#6b6b7b] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="在此粘贴论文文本内容..."
                  className="dark-input rounded-lg w-full h-32 px-3 py-2 text-sm resize-none mb-3"
                />
                <button
                  onClick={handlePasteSubmit}
                  disabled={!pasteText.trim()}
                  className="btn-primary w-full py-2 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  开始分析
                </button>
              </div>
            )}
          </div>
        ) : isLoading ? (
          <div className="h-full flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#a78bfa] animate-spin mb-3" />
            <p className="text-sm text-[#6b6b7b]">正在解析文献...</p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-5">
            <div className="glass-card rounded-xl p-5 animate-fade-in">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[rgba(167,139,250,0.15)] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-[#a78bfa]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#e8e8ef]">{paper.title}</h3>
                  <p className="text-xs text-[#6b6b7b] mt-0.5">{paper.fileName || '粘贴的文本'}</p>
                </div>
              </div>
              <div className="text-sm text-[#a0a0b0] leading-relaxed whitespace-pre-wrap font-mono text-[13px]">
                {paper.textContent}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
