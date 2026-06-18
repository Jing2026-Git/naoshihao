import { useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  BookOpen,
  Beaker,
  Tag,
  CircleHelp,
  Wrench,
  RefreshCw,
  Pencil,
  ChevronRight,
  Loader2,
} from 'lucide-react';

export default function LabProfilePanel({ isOpen, onClose, profile, onUpdate, onFilesUpload, isGenerating }) {
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    onFilesUpload?.(Array.from(files));
    e.target.value = '';
  };

  const handleImportClick = (accept) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 transition-opacity" onClick={onClose} />

      <div className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-surface shadow-2xl animate-slide-in-right flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-text-primary">脑师画像</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-4" />
              <p className="text-sm text-text-secondary">正在分析文献，生成脑师画像...</p>
            </div>
          ) : !profile ? (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary leading-relaxed">
                尚未创建脑师画像。请通过以下方式导入您的文献信息，系统将自动生成画像。
              </p>

              {/* 上传文献清单 */}
              <button
                onClick={() => handleImportClick('.csv,.xlsx,.xls')}
                className="w-full p-5 rounded-xl border border-border hover:border-primary-300 hover:bg-primary-50/50 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent-50 text-accent-600 group-hover:bg-accent-100 transition-colors shrink-0">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-text-primary">上传文献清单</h3>
                      <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-primary-500 transition-colors" />
                    </div>
                    <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                      支持 CSV 格式。包含标题、作者、摘要等字段的文献列表，用于分析研究方向和偏好。
                    </p>
                  </div>
                </div>
              </button>

              {/* 上传典型文献 */}
              <button
                onClick={() => handleImportClick('.pdf')}
                className="w-full p-5 rounded-xl border border-border hover:border-primary-300 hover:bg-primary-50/50 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-50 text-primary-600 group-hover:bg-primary-100 transition-colors shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-text-primary">上传典型文献</h3>
                      <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-primary-500 transition-colors" />
                    </div>
                    <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                      支持上传多篇 PDF 文献。系统将深入分析内容，提取研究方向、方法和技术特征。
                    </p>
                  </div>
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={handleFileUpload}
              />
            </div>
          ) : (
            <div className="space-y-5">
              {/* 研究方向 */}
              {profile.directions?.length > 0 && (
                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-primary-500" />
                    <h3 className="text-sm font-semibold text-text-primary">研究方向</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.directions.map((dir, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200"
                      >
                        {dir}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 文献类型偏好 */}
              {profile.literatureTypes?.length > 0 && (
                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-accent-500" />
                    <h3 className="text-sm font-semibold text-text-primary">文献类型偏好</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.literatureTypes.map((type, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-accent-50 text-accent-700 border border-accent-200"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 典型研究问题 */}
              {profile.researchQuestions?.length > 0 && (
                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CircleHelp className="w-4 h-4 text-primary-500" />
                    <h3 className="text-sm font-semibold text-text-primary">典型研究问题</h3>
                  </div>
                  <ul className="space-y-2">
                    {profile.researchQuestions.map((q, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-text-secondary leading-relaxed"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 shrink-0" />
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 关键技术手段 */}
              {profile.techniques?.length > 0 && (
                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Beaker className="w-4 h-4 text-accent-500" />
                    <h3 className="text-sm font-semibold text-text-primary">关键技术手段</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.techniques.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-surface-secondary text-text-secondary border border-border"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => onUpdate?.({ type: 'edit' })}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium border border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                  编辑画像
                </button>
                <button
                  onClick={() => onUpdate?.({ type: 'regenerate' })}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  重新生成
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
