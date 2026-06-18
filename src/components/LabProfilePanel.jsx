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
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[rgba(20,12,40,0.95)] backdrop-blur-xl shadow-2xl animate-slide-in-right flex flex-col border-l border-[rgba(167,139,250,0.12)]">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#a78bfa]/20 to-[#60a5fa]/20 flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-[#a78bfa]" />
            </div>
            <h2 className="text-base font-semibold text-[#e8e8ef]">脑师画像</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6b6b7b] hover:text-[#e8e8ef] hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#a78bfa]/20 to-[#60a5fa]/20 flex items-center justify-center mb-4">
                <Loader2 className="w-6 h-6 text-[#a78bfa] animate-spin" />
              </div>
              <p className="text-sm text-[#6b6b7b]">正在分析文献，生成脑师画像...</p>
            </div>
          ) : !profile ? (
            <div className="space-y-4">
              <p className="text-sm text-[#6b6b7b] leading-relaxed">
                尚未创建脑师画像。请通过以下方式导入您的文献信息，系统将自动生成画像。
              </p>

              {/* 上传文献清单 */}
              <button
                onClick={() => handleImportClick('.csv,.xlsx,.xls')}
                className="w-full glass-card rounded-xl p-5 text-left hover:border-[rgba(167,139,250,0.3)] transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#a78bfa]/15 to-[#c084fc]/15 flex items-center justify-center shrink-0 border border-[rgba(167,139,250,0.15)]">
                    <FileSpreadsheet className="w-5 h-5 text-[#a78bfa]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[#e8e8ef]">上传文献清单</h3>
                      <ChevronRight className="w-4 h-4 text-[#4a4a5a] group-hover:text-[#a78bfa] transition-colors" />
                    </div>
                    <p className="mt-1 text-xs text-[#6b6b7b] leading-relaxed">
                      支持 CSV 格式。包含标题、作者、摘要等字段的文献列表。
                    </p>
                  </div>
                </div>
              </button>

              {/* 上传典型文献 */}
              <button
                onClick={() => handleImportClick('.pdf')}
                className="w-full glass-card rounded-xl p-5 text-left hover:border-[rgba(96,165,250,0.3)] transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#60a5fa]/15 to-[#22d3ee]/15 flex items-center justify-center shrink-0 border border-[rgba(96,165,250,0.15)]">
                    <FileText className="w-5 h-5 text-[#60a5fa]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[#e8e8ef]">上传典型文献</h3>
                      <ChevronRight className="w-4 h-4 text-[#4a4a5a] group-hover:text-[#60a5fa] transition-colors" />
                    </div>
                    <p className="mt-1 text-xs text-[#6b6b7b] leading-relaxed">
                      支持上传多篇 PDF 文献，系统将深入分析内容。
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
            <div className="space-y-4">
              {/* 研究方向 */}
              {profile.directions?.length > 0 && (
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-[#a78bfa]" />
                    <h3 className="text-sm font-semibold text-[#e8e8ef]">研究方向</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.directions.map((dir, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(167,139,250,0.12)] text-[#a78bfa] border border-[rgba(167,139,250,0.2)]"
                      >
                        {dir}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 文献类型偏好 */}
              {profile.literatureTypes?.length > 0 && (
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-[#60a5fa]" />
                    <h3 className="text-sm font-semibold text-[#e8e8ef]">文献类型偏好</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.literatureTypes.map((type, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(96,165,250,0.12)] text-[#60a5fa] border border-[rgba(96,165,250,0.2)]"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 典型研究问题 */}
              {profile.researchQuestions?.length > 0 && (
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CircleHelp className="w-4 h-4 text-[#22d3ee]" />
                    <h3 className="text-sm font-semibold text-[#e8e8ef]">典型研究问题</h3>
                  </div>
                  <ul className="space-y-2">
                    {profile.researchQuestions.map((q, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-[#a0a0b0] leading-relaxed"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee] mt-1.5 shrink-0" />
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 关键技术手段 */}
              {profile.techniques?.length > 0 && (
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Beaker className="w-4 h-4 text-[#a78bfa]" />
                    <h3 className="text-sm font-semibold text-[#e8e8ef]">关键技术手段</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.techniques.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(255,255,255,0.05)] text-[#a0a0b0] border border-[rgba(255,255,255,0.08)]"
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
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-[rgba(255,255,255,0.1)] text-[#a0a0b0] hover:text-[#e8e8ef] hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                  编辑画像
                </button>
                <button
                  onClick={() => onUpdate?.({ type: 'regenerate' })}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] text-white hover:opacity-90 transition-opacity cursor-pointer"
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
