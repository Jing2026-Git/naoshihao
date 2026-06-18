import { useState, useRef, useEffect } from 'react';
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
  Plus,
  Trash2,
  UserPlus,
  Save,
  GraduationCap,
  FileUp,
  CheckCircle,
} from 'lucide-react';
import { saveStudentProfile, deleteStudentProfile } from '../db';
import { parseDocument } from '../services/parser';

export default function LabProfilePanel({ isOpen, onClose, profile, onUpdate, onFilesUpload, isGenerating }) {
  const fileInputRef = useRef(null);
  const studentFileRef = useRef(null);
  const [activeTab, setActiveTab] = useState('lab'); // 'lab' | 'students'
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [students, setStudents] = useState([]);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', description: '' });
  const [uploadingStudent, setUploadingStudent] = useState(false);

  // 加载学生画像列表
  useEffect(() => {
    if (isOpen && activeTab === 'students') {
      loadStudents();
    }
  }, [isOpen, activeTab]);

  const loadStudents = async () => {
    const { getAllStudentProfiles } = await import('../db');
    const list = await getAllStudentProfiles();
    setStudents(list);
  };

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

  // 进入编辑模式
  const handleStartEdit = () => {
    setEditData({
      directions: profile?.directions?.join('\n') || '',
      literatureTypes: profile?.literatureTypes?.join('\n') || '',
      researchQuestions: profile?.researchQuestions?.join('\n') || '',
      techniques: profile?.techniques?.join('\n') || '',
    });
    setIsEditing(true);
  };

  // 保存编辑
  const handleSaveEdit = () => {
    if (!editData) return;
    const updated = {
      directions: editData.directions.split('\n').map(s => s.trim()).filter(Boolean),
      literatureTypes: editData.literatureTypes.split('\n').map(s => s.trim()).filter(Boolean),
      researchQuestions: editData.researchQuestions.split('\n').map(s => s.trim()).filter(Boolean),
      techniques: editData.techniques.split('\n').map(s => s.trim()).filter(Boolean),
    };
    onUpdate?.({ type: 'edit', data: updated });
    setIsEditing(false);
    setEditData(null);
  };

  // 添加学生
  const handleAddStudent = async () => {
    if (!newStudent.name.trim()) return;
    await saveStudentProfile({
      name: newStudent.name.trim(),
      description: newStudent.description.trim(),
    });
    setNewStudent({ name: '', description: '' });
    setShowAddStudent(false);
    loadStudents();
  };

  // 上传学生文件（论文/文档）
  const handleStudentFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !newStudent.name.trim()) return;

    setUploadingStudent(true);
    try {
      const fileContent = await parseDocument(file);
      await saveStudentProfile({
        name: newStudent.name.trim(),
        description: newStudent.description.trim(),
        fileName: file.name,
        fileContent: fileContent.slice(0, 50000), // 限制长度
      });
      setNewStudent({ name: '', description: '' });
      setShowAddStudent(false);
      loadStudents();
    } catch (err) {
      console.error('解析学生文件失败:', err);
      alert('文件解析失败，请检查格式。');
    } finally {
      setUploadingStudent(false);
    }
    e.target.value = '';
  };

  // 删除学生
  const handleDeleteStudent = async (id) => {
    await deleteStudentProfile(id);
    loadStudents();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-[rgba(20,12,40,0.95)] backdrop-blur-xl shadow-2xl animate-slide-in-right flex flex-col border-l border-[rgba(167,139,250,0.12)]">
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

        {/* Tab 切换 */}
        <div className="flex items-center px-5 pt-3 gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('lab')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'lab'
                ? 'bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] text-white'
                : 'text-[#6b6b7b] hover:text-[#a0a0b0]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5" />
              课题组画像
            </span>
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'students'
                ? 'bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] text-white'
                : 'text-[#6b6b7b] hover:text-[#a0a0b0]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              同门画像
              {students.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgba(167,139,250,0.3)]">{students.length}</span>
              )}
            </span>
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* ========== 课题组画像 Tab ========== */}
          {activeTab === 'lab' && (
            <>
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#a78bfa]/20 to-[#60a5fa]/20 flex items-center justify-center mb-4">
                    <Loader2 className="w-6 h-6 text-[#a78bfa] animate-spin" />
                  </div>
                  <p className="text-sm text-[#6b6b7b]">正在分析文献，生成脑师画像...</p>
                </div>
              ) : isEditing && editData ? (
                /* 编辑模式 */
                <div className="space-y-4 animate-fade-in">
                  <div className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-4 h-4 text-[#a78bfa]" />
                      <h3 className="text-sm font-semibold text-[#e8e8ef]">研究方向</h3>
                      <span className="text-[10px] text-[#6b6b7b]">每行一个</span>
                    </div>
                    <textarea
                      value={editData.directions}
                      onChange={(e) => setEditData({ ...editData, directions: e.target.value })}
                      className="dark-input rounded-lg w-full h-20 px-3 py-2 text-sm resize-none"
                      placeholder="如：认知控制&#10;决策神经科学"
                    />
                  </div>

                  <div className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-4 h-4 text-[#60a5fa]" />
                      <h3 className="text-sm font-semibold text-[#e8e8ef]">文献类型偏好</h3>
                    </div>
                    <textarea
                      value={editData.literatureTypes}
                      onChange={(e) => setEditData({ ...editData, literatureTypes: e.target.value })}
                      className="dark-input rounded-lg w-full h-16 px-3 py-2 text-sm resize-none"
                      placeholder="如：fMRI研究&#10;行为实验"
                    />
                  </div>

                  <div className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CircleHelp className="w-4 h-4 text-[#22d3ee]" />
                      <h3 className="text-sm font-semibold text-[#e8e8ef]">典型研究问题</h3>
                    </div>
                    <textarea
                      value={editData.researchQuestions}
                      onChange={(e) => setEditData({ ...editData, researchQuestions: e.target.value })}
                      className="dark-input rounded-lg w-full h-20 px-3 py-2 text-sm resize-none"
                      placeholder="如：认知控制如何影响决策？"
                    />
                  </div>

                  <div className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Beaker className="w-4 h-4 text-[#a78bfa]" />
                      <h3 className="text-sm font-semibold text-[#e8e8ef]">关键技术手段</h3>
                    </div>
                    <textarea
                      value={editData.techniques}
                      onChange={(e) => setEditData({ ...editData, techniques: e.target.value })}
                      className="dark-input rounded-lg w-full h-16 px-3 py-2 text-sm resize-none"
                      placeholder="如：fMRI&#10;EEG"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] text-white cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      保存修改
                    </button>
                    <button
                      onClick={() => { setIsEditing(false); setEditData(null); }}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium border border-[rgba(255,255,255,0.1)] text-[#a0a0b0] hover:text-[#e8e8ef] cursor-pointer"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : !profile ? (
                /* 无画像 - 导入 */
                <div className="space-y-4">
                  <p className="text-sm text-[#6b6b7b] leading-relaxed">
                    尚未创建课题组画像。请通过以下方式导入文献信息，系统将自动生成画像。
                  </p>

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
                          支持 CSV 格式，包含标题、作者、摘要等字段。
                        </p>
                      </div>
                    </div>
                  </button>

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
                          支持多篇 PDF，系统将深入分析内容。
                        </p>
                      </div>
                    </div>
                  </button>

                  <input ref={fileInputRef} type="file" className="hidden" multiple onChange={handleFileUpload} />
                </div>
              ) : (
                /* 展示画像 */
                <div className="space-y-4">
                  {profile.directions?.length > 0 && (
                    <div className="glass-card rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Tag className="w-4 h-4 text-[#a78bfa]" />
                        <h3 className="text-sm font-semibold text-[#e8e8ef]">研究方向</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.directions.map((dir, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(167,139,250,0.12)] text-[#a78bfa] border border-[rgba(167,139,250,0.2)]">{dir}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.literatureTypes?.length > 0 && (
                    <div className="glass-card rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-4 h-4 text-[#60a5fa]" />
                        <h3 className="text-sm font-semibold text-[#e8e8ef]">文献类型偏好</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.literatureTypes.map((type, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(96,165,250,0.12)] text-[#60a5fa] border border-[rgba(96,165,250,0.2)]">{type}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.researchQuestions?.length > 0 && (
                    <div className="glass-card rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CircleHelp className="w-4 h-4 text-[#22d3ee]" />
                        <h3 className="text-sm font-semibold text-[#e8e8ef]">典型研究问题</h3>
                      </div>
                      <ul className="space-y-2">
                        {profile.researchQuestions.map((q, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-[#a0a0b0] leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee] mt-1.5 shrink-0" />
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {profile.techniques?.length > 0 && (
                    <div className="glass-card rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Beaker className="w-4 h-4 text-[#a78bfa]" />
                        <h3 className="text-sm font-semibold text-[#e8e8ef]">关键技术手段</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.techniques.map((tech, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(255,255,255,0.05)] text-[#a0a0b0] border border-[rgba(255,255,255,0.08)]">{tech}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleStartEdit}
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
            </>
          )}

          {/* ========== 同门画像 Tab ========== */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              <p className="text-sm text-[#6b6b7b] leading-relaxed">
                添加同门学生的研究方向或毕业论文，脑师将在对话中参考这些信息，提供更个性化的指导。
              </p>

              {/* 添加学生 */}
              {!showAddStudent ? (
                <button
                  onClick={() => setShowAddStudent(true)}
                  className="w-full glass-card rounded-xl p-4 flex items-center gap-3 hover:border-[rgba(167,139,250,0.3)] transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#22d3ee]/15 to-[#60a5fa]/15 flex items-center justify-center shrink-0 border border-[rgba(34,211,238,0.15)]">
                    <UserPlus className="w-5 h-5 text-[#22d3ee]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#e8e8ef]">添加同门画像</p>
                    <p className="text-xs text-[#6b6b7b]">填写研究方向或上传论文文件</p>
                  </div>
                </button>
              ) : (
                <div className="glass-card rounded-xl p-5 animate-fade-in-scale space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#e8e8ef]">添加同门</h3>
                    <button onClick={() => setShowAddStudent(false)} className="text-[#6b6b7b] hover:text-[#e8e8ef] cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs text-[#6b6b7b] mb-1">姓名 *</label>
                    <input
                      type="text"
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                      placeholder="学生姓名"
                      className="dark-input rounded-lg w-full px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#6b6b7b] mb-1">研究方向描述</label>
                    <textarea
                      value={newStudent.description}
                      onChange={(e) => setNewStudent({ ...newStudent, description: e.target.value })}
                      placeholder="描述该学生的研究方向、关注的问题、常用技术等..."
                      className="dark-input rounded-lg w-full h-24 px-3 py-2 text-sm resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#6b6b7b] mb-1">或上传论文/文档（可选）</label>
                    <div
                      onClick={() => studentFileRef.current?.click()}
                      className="glass-card rounded-lg p-3 flex items-center gap-2 cursor-pointer hover:border-[rgba(167,139,250,0.3)] transition-all"
                    >
                      <FileUp className="w-4 h-4 text-[#a78bfa]" />
                      <span className="text-xs text-[#6b6b7b]">
                        {uploadingStudent ? '解析中...' : '点击上传 PDF 或 Word 文件'}
                      </span>
                    </div>
                    <input ref={studentFileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleStudentFileUpload} />
                  </div>

                  <button
                    onClick={handleAddStudent}
                    disabled={!newStudent.name.trim() || uploadingStudent}
                    className="w-full btn-primary py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {uploadingStudent ? '上传解析中...' : '添加'}
                  </button>
                </div>
              )}

              {/* 学生列表 */}
              {students.length > 0 && (
                <div className="space-y-3 mt-2">
                  {students.map((student) => (
                    <div key={student.id} className="glass-card rounded-xl p-4 animate-fade-in">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#22d3ee]/15 to-[#60a5fa]/15 flex items-center justify-center shrink-0 border border-[rgba(34,211,238,0.15)]">
                            <GraduationCap className="w-4 h-4 text-[#22d3ee]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-[#e8e8ef]">{student.name}</h4>
                            {student.description && (
                              <p className="text-xs text-[#a0a0b0] mt-1 leading-relaxed line-clamp-3">{student.description}</p>
                            )}
                            {student.fileName && (
                              <div className="flex items-center gap-1 mt-1.5">
                                <FileText className="w-3 h-3 text-[#6b6b7b]" />
                                <span className="text-[10px] text-[#6b6b7b] truncate">{student.fileName}</span>
                                <CheckCircle className="w-3 h-3 text-emerald-400" />
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteStudent(student.id)}
                          className="p-1.5 rounded-lg text-[#4a4a5a] hover:text-red-400 hover:bg-[rgba(239,68,68,0.1)] transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {students.length === 0 && !showAddStudent && (
                <div className="text-center py-8">
                  <GraduationCap className="w-10 h-10 text-[#4a4a5a] mx-auto mb-3" />
                  <p className="text-sm text-[#6b6b7b]">还没有添加同门画像</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
