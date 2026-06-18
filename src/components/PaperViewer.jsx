import { useState, useRef, useCallback } from 'react';
import { FileUp, FileText, Loader2 } from 'lucide-react';

export default function PaperViewer({ paper, onPaperUpload, isLoading }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        onPaperUpload?.(files[0]);
      }
    },
    [onPaperUpload]
  );

  const handleFileSelect = useCallback(
    (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onPaperUpload?.(files[0]);
      }
      e.target.value = '';
    },
    [onPaperUpload]
  );

  const handleDropZoneClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* 无文献时 - 拖拽上传区域 */}
      {!paper && !isLoading && (
        <div
          className={`flex-1 flex flex-col items-center justify-center p-8 m-4 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
            isDragOver
              ? 'border-primary-500 bg-primary-50'
              : 'border-border hover:border-primary-300 hover:bg-surface-secondary'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleDropZoneClick}
        >
          <div
            className={`flex items-center justify-center w-16 h-16 rounded-2xl mb-4 transition-colors ${
              isDragOver ? 'bg-primary-100 text-primary-600' : 'bg-surface-secondary text-text-tertiary'
            }`}
          >
            <FileUp className="w-8 h-8" />
          </div>
          <p className="text-sm font-medium text-text-secondary mb-1">
            拖拽文献到这里
          </p>
          <p className="text-xs text-text-tertiary mb-4">
            支持 PDF、Word 文档格式
          </p>
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            选择文件
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      )}

      {/* 加载中 */}
      {isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-4" />
          <p className="text-sm text-text-secondary">正在解析文献...</p>
        </div>
      )}

      {/* 有文献时 - 显示内容 */}
      {paper && !isLoading && (
        <div className="flex flex-col h-full">
          {/* 文献标题 */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
            <FileText className="w-4 h-4 text-primary-500 shrink-0" />
            <h2 className="text-sm font-semibold text-text-primary truncate">
              {paper.title || '未命名文献'}
            </h2>
          </div>

          {/* 文献内容 */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap break-words">
              {paper.textContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
