import { useState, useCallback, useRef } from 'react';
import { FileUp, FileText, Loader2, ClipboardPaste, X, ScrollText, Trash2 } from 'lucide-react';

export default function PaperViewer({
  paper,
  isLoading,
  onPaperUpload,
  papers,
  currentPaperId,
  onSelectPaper,
  onDeletePaper,
}) {
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
    <div className="flex flex-col h-full bg-transparent">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-[#a78bfa]" />
          <span className="text-sm font-medium text-[#e8e8ef]">文献列表</span>
          {papers.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(167,139,250,0.15)] text-[#a78bfa] border border-[rgba(167,139,250,0.2)]">
              {papers.length}
            </span>
          )}
        </div>
      </div>

      {/* 论文列表 */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {papers.length > 0 ? (
          <div className="space-y-2">
            {papers.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectPaper(p)}
                className={`glass-card rounded-lg p-3 cursor-pointer transition-all duration-200 hover:border-[rgba(167,139,250,0.3)] ${
                  p.id === currentPaperId
                    ? 'bg-[rgba(167,139,250,0.15)] border-[rgba(167,139,250,0.3)]'
                    : 'hover:bg-[rgba(255,255,255,0.02)]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-[#6b6b7b] shrink-0" />
                      <p className="text-sm font-medium text-[#e8e8ef] truncate">{p.title}</p>
                    </div>
                    <p className="text-[10px] text-[#6b6b7b] mt-0.5 truncate">{p.fileName} · {new Date(p.uploadDate).toLocaleDateString('zh-CN')}</p>
                  </div>
                  <button
                    onClick={(e) => onDeletePaper(p.id, e)}
                    className="p-1.5 rounded-md text-[#4a4a5a] hover:text-red-400 hover:bg-[rgba(239,68,68,0.08)] transition-colors shrink-0"
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* 无论文时上传区域 */
          <div className="h-full flex flex-col items-center justify-center">
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
                    className="p-1 rounded hover:bg-[rgba(255,255,255,0.05)] text-[#6b6b7b] hover:text-[#e8e8ef] cursor-pointer"
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
        )}
      </div>

      {/* 当前论文内容预览 */}
      {currentPaperId && paper && (
        <div className="border-t border-[rgba(255,255,255,0.06)] flex-1 overflow-hidden relative min-h-[200px]">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#a78bfa] animate-spin mb-3" />
              <p className="text-sm text-[#6b6b7b]">正在解析文献...</p>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-3">
              <div className="glass-card rounded-xl p-4 animate-fade-in">
                <div className="text-sm text-[#a0a0b0] leading-relaxed whitespace-pre-wrap font-mono text-[13px] max-h-[400px] overflow-y-auto">
                  {paper.textContent.slice(0, 2000)}
                  {paper.textContent.length > 2000 && (
                    <span className="text-[#4a4a5a] text-xs">...（已截取前2000字）</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
