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
  ClipboardPaste,
  Upload,
} from 'lucide-react';
import { saveStudentProfile, updateStudentProfile, deleteStudentProfile } from '../db';
import { parseDocument } from '../services/parser';

export default function LabProfilePanel({ isOpen, onClose, profile, onUpdate, onFilesUpload, isGenerating }) {
  const fileInputRef = useRef(null);
  const studentFileRef = useRef(null);
  const reportFileRefs = useRef({});
  const [activeTab, setActiveTab] = useState('lab'); // 'lab' | 'students'
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [students, setStudents] = useState([]);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [newStudent, setNewStudent] = useState({ name: '', description: '', projectName: '', projectStage: '', methodsOfInterest: '', writingStage: '' });
  const [uploadingStudent, setUploadingStudent] = useState(false);
  const [uploadingReportId, setUploadingReportId] = useState(null);

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
      journalQuality: profile?.journalQuality?.join('\n') || '',
      researchParadigm: profile?.researchParadigm?.join('\n') || '',
      qualityStandards: profile?.qualityStandards?.join('\n') || '',
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
      journalQuality: editData.journalQuality.split('\n').map(s => s.trim()).filter(Boolean),
      researchParadigm: editData.researchParadigm.split('\n').map(s => s.trim()).filter(Boolean),
      qualityStandards: editData.qualityStandards.split('\n').map(s => s.trim()).filter(Boolean),
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
      projectName: newStudent.projectName.trim(),
      projectStage: newStudent.projectStage.trim(),
      methodsOfInterest: newStudent.methodsOfInterest.trim(),
      writingStage: newStudent.writingStage.trim(),
    });
    setNewStudent({ name: '', description: '', projectName: '', projectStage: '', methodsOfInterest: '', writingStage: '' });
    setShowAddStudent(false);
    loadStudents();
  };

  // 开始编辑学生
  const handleStartEditStudent = (student) => {
    setNewStudent({
      name: student.name,
      description: student.description || '',
      projectName: student.projectName || '',
      projectStage: student.projectStage || '',
      methodsOfInterest: student.methodsOfInterest || '',
      writingStage: student.writingStage || '',
    });
    setEditingStudentId(student.id);
    setShowAddStudent(true);
  };

  // 保存编辑学生
  const handleSaveEditStudent = async () => {
    if (!newStudent.name.trim() || !editingStudentId) return;
    await updateStudentProfile(editingStudentId, {
      name: newStudent.name.trim(),
      description: newStudent.description.trim(),
      projectName: newStudent.projectName.trim(),
      projectStage: newStudent.projectStage.trim(),
      methodsOfInterest: newStudent.methodsOfInterest.trim(),
      writingStage: newStudent.writingStage.trim(),
    });
    setNewStudent({ name: '', description: '', projectName: '', projectStage: '', methodsOfInterest: '', writingStage: '' });
    setEditingStudentId(null);
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

  // 上传工作汇报
  const handleReportUpload = async (studentId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReportId(studentId);
    try {
      const content = await parseDocument(file);
      await updateStudentProfile(studentId, {
        reportContent: content.slice(0, 50000),
        reportFileName: file.name,
        reportCreatedAt: new Date().toISOString(),
      });
      loadStudents();
    } catch (err) {
      console.error('解析工作汇报失败:', err);
      alert('工作汇报解析失败，请检查格式。');
    } finally {
      setUploadingReportId(null);
    }
    e.target.value = '';
  };

  // 粘贴工作汇报文本
  const handleReportPaste = async (studentId) => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) return;
      await updateStudentProfile(studentId, {
        reportContent: text.slice(0, 50000),
        reportFileName: '粘贴的工作汇报',
        reportCreatedAt: new Date().toISOString(),
      });
      loadStudents();
    } catch {
      alert('无法读取剪贴板，请手动粘贴。');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-[rgba(20,12,40,0.95)] backdrop-blur-xl shadow-2xl animate-slide-in-right flex flex-col border-l border-[rgba(196,155,255,0.15)]">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.1)] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#a78bfa]/20 to-[#60a5fa]/20 flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-[#c49bff]" />
            </div>
            <h2 className="text-base font-semibold text-[#f5f0ff]">脑师画像</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#a898c4] hover:text-[#f5f0ff] hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer"
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
                : 'text-[#a898c4] hover:text-[#d4c8e8]'
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
                : 'text-[#a898c4] hover:text-[#d4c8e8]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              同门画像
              {students.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgba(196,155,255,0.32)]">{students.length}</span>
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
                    <Loader2 className="w-6 h-6 text-[#c49bff] animate-spin" />
                  </div>
                  <p className="text-sm text-[#a898c4]">正在分析文献，生成脑师画像...</p>
                </div>
              ) : isEditing && editData ? (
                /* 编辑模式 */
                <div className="space-y-4 animate-fade-in">
                  <div className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-4 h-4 text-[#c49bff]" />
                      <h3 className="text-sm font-semibold text-[#f5f0ff]">研究方向</h3>
                      <span className="text-[10px] text-[#a898c4]">每行一个</span>
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
                      <BookOpen className="w-4 h-4 text-[#7ab8ff]" />
                      <h3 className="text-sm font-semibold text-[#f5f0ff]">文献类型偏好</h3>
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
                      <CircleHelp className="w-4 h-4 text-[#5ee4f0]" />
                      <h3 className="text-sm font-semibold text-[#f5f0ff]">典型研究问题</h3>
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
                      <Beaker className="w-4 h-4 text-[#c49bff]" />
                      <h3 className="text-sm font-semibold text-[#f5f0ff]">关键技术手段</h3>
                    </div>
                    <textarea
                      value={editData.techniques}
                      onChange={(e) => setEditData({ ...editData, techniques: e.target.value })}
                      className="dark-input rounded-lg w-full h-16 px-3 py-2 text-sm resize-none"
                      placeholder="如：fMRI&#10;EEG"
                    />
                  </div>

                  <div className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-4 h-4 text-[#f59e0b]" />
                      <h3 className="text-sm font-semibold text-[#f5f0ff]">期刊质量偏好</h3>
                      <span className="text-[10px] text-[#a898c4]">每行一个</span>
                    </div>
                    <textarea
                      value={editData.journalQuality}
                      onChange={(e) => setEditData({ ...editData, journalQuality: e.target.value })}
                      className="dark-input rounded-lg w-full h-16 px-3 py-2 text-sm resize-none"
                      placeholder="如：高影响因子期刊（IF>5）&#10;方法学创新优先&#10;Nature子刊级别"
                    />
                  </div>

                  <div className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-4 h-4 text-[#ec4899]" />
                      <h3 className="text-sm font-semibold text-[#f5f0ff]">研究范式偏好</h3>
                      <span className="text-[10px] text-[#a898c4]">每行一个</span>
                    </div>
                    <textarea
                      value={editData.researchParadigm}
                      onChange={(e) => setEditData({ ...editData, researchParadigm: e.target.value })}
                      className="dark-input rounded-lg w-full h-16 px-3 py-2 text-sm resize-none"
                      placeholder="如：计算建模驱动&#10;大样本行为实验&#10;多模态神经影像"
                    />
                  </div>

                  <div className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CircleHelp className="w-4 h-4 text-[#5ee4f0]" />
                      <h3 className="text-sm font-semibold text-[#f5f0ff]">文献质量标准</h3>
                      <span className="text-[10px] text-[#a898c4]">每行一个</span>
                    </div>
                    <textarea
                      value={editData.qualityStandards}
                      onChange={(e) => setEditData({ ...editData, qualityStandards: e.target.value })}
                      className="dark-input rounded-lg w-full h-16 px-3 py-2 text-sm resize-none"
                      placeholder="如：要求预注册&#10;开放数据与代码&#10;效应量报告&#10;多重比较校正"
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
                      className="px-4 py-2.5 rounded-xl text-sm font-medium border border-[rgba(255,255,255,0.1)] text-[#d4c8e8] hover:text-[#f5f0ff] cursor-pointer"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : !profile ? (
                /* 无画像 - 导入 */
                <div className="space-y-4">
                  <p className="text-sm text-[#a898c4] leading-relaxed">
                    尚未创建课题组画像。请通过以下方式导入文献信息，系统将自动生成画像。
                  </p>

                  <button
                    onClick={() => handleImportClick('.csv,.xlsx,.xls')}
                    className="w-full glass-card rounded-xl p-5 text-left hover:border-[rgba(196,155,255,0.32)] transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#a78bfa]/15 to-[#c084fc]/15 flex items-center justify-center shrink-0 border border-[rgba(196,155,255,0.18)]">
                        <FileSpreadsheet className="w-5 h-5 text-[#c49bff]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-[#f5f0ff]">上传文献清单</h3>
                          <ChevronRight className="w-4 h-4 text-[#7a6a9a] group-hover:text-[#c49bff] transition-colors" />
                        </div>
                        <p className="mt-1 text-xs text-[#a898c4] leading-relaxed">
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
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#60a5fa]/15 to-[#22d3ee]/15 flex items-center justify-center shrink-0 border border-[rgba(122,184,255,0.18)]">
                        <FileText className="w-5 h-5 text-[#7ab8ff]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-[#f5f0ff]">上传典型文献</h3>
                          <ChevronRight className="w-4 h-4 text-[#7a6a9a] group-hover:text-[#7ab8ff] transition-colors" />
                        </div>
                        <p className="mt-1 text-xs text-[#a898c4] leading-relaxed">
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
                        <Tag className="w-4 h-4 text-[#c49bff]" />
                        <h3 className="text-sm font-semibold text-[#f5f0ff]">研究方向</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.directions.map((dir, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(196,155,255,0.15)] text-[#c49bff] border border-[rgba(196,155,255,0.22)]">{dir}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.literatureTypes?.length > 0 && (
                    <div className="glass-card rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-4 h-4 text-[#7ab8ff]" />
                        <h3 className="text-sm font-semibold text-[#f5f0ff]">文献类型偏好</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.literatureTypes.map((type, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(122,184,255,0.15)] text-[#7ab8ff] border border-[rgba(122,184,255,0.22)]">{type}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.researchQuestions?.length > 0 && (
                    <div className="glass-card rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CircleHelp className="w-4 h-4 text-[#5ee4f0]" />
                        <h3 className="text-sm font-semibold text-[#f5f0ff]">典型研究问题</h3>
                      </div>
                      <ul className="space-y-2">
                        {profile.researchQuestions.map((q, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-[#d4c8e8] leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#5ee4f0] mt-1.5 shrink-0" />
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {profile.techniques?.length > 0 && (
                    <div className="glass-card rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Beaker className="w-4 h-4 text-[#c49bff]" />
                        <h3 className="text-sm font-semibold text-[#f5f0ff]">关键技术手段</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.techniques.map((tech, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(255,255,255,0.05)] text-[#d4c8e8] border border-[rgba(255,255,255,0.12)]">{tech}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.journalQuality?.length > 0 && (
                    <div className="glass-card rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-4 h-4 text-[#f59e0b]" />
                        <h3 className="text-sm font-semibold text-[#f5f0ff]">期刊质量偏好</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.journalQuality.map((item, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(245,158,11,0.12)] text-[#f59e0b] border border-[rgba(245,158,11,0.2)]">{item}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.researchParadigm?.length > 0 && (
                    <div className="glass-card rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Tag className="w-4 h-4 text-[#ec4899]" />
                        <h3 className="text-sm font-semibold text-[#f5f0ff]">研究范式偏好</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.researchParadigm.map((item, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(236,72,153,0.12)] text-[#ec4899] border border-[rgba(236,72,153,0.2)]">{item}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.qualityStandards?.length > 0 && (
                    <div className="glass-card rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CircleHelp className="w-4 h-4 text-[#5ee4f0]" />
                        <h3 className="text-sm font-semibold text-[#f5f0ff]">文献质量标准</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.qualityStandards.map((item, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(94,228,240,0.15)] text-[#5ee4f0] border border-[rgba(94,228,240,0.22)]">{item}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleStartEdit}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-[rgba(255,255,255,0.1)] text-[#d4c8e8] hover:text-[#f5f0ff] hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer"
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
              <p className="text-sm text-[#a898c4] leading-relaxed">
                添加同门学生的研究方向或毕业论文，脑师将在对话中参考这些信息，提供更个性化的指导。
              </p>

              {/* 添加学生 */}
              {!showAddStudent ? (
                <button
                  onClick={() => setShowAddStudent(true)}
                  className="w-full glass-card rounded-xl p-4 flex items-center gap-3 hover:border-[rgba(196,155,255,0.32)] transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#22d3ee]/15 to-[#60a5fa]/15 flex items-center justify-center shrink-0 border border-[rgba(94,228,240,0.18)]">
                    <UserPlus className="w-5 h-5 text-[#5ee4f0]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#f5f0ff]">添加同门画像</p>
                    <p className="text-xs text-[#a898c4]">填写研究方向或上传论文文件</p>
                  </div>
                </button>
              ) : (
                <div className="glass-card rounded-xl p-5 animate-fade-in-scale space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#f5f0ff]">{editingStudentId ? '编辑同门' : '添加同门'}</h3>
                    <button onClick={() => { setShowAddStudent(false); setEditingStudentId(null); setNewStudent({ name: '', description: '', projectName: '', projectStage: '', methodsOfInterest: '', writingStage: '' }); }} className="text-[#a898c4] hover:text-[#f5f0ff] cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs text-[#a898c4] mb-1">姓名 *</label>
                    <input
                      type="text"
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                      placeholder="学生姓名"
                      className="dark-input rounded-lg w-full px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#a898c4] mb-1">研究方向描述</label>
                    <textarea
                      value={newStudent.description}
                      onChange={(e) => setNewStudent({ ...newStudent, description: e.target.value })}
                      placeholder="描述该学生的研究方向、关注的问题、常用技术等..."
                      className="dark-input rounded-lg w-full h-20 px-3 py-2 text-sm resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#a898c4] mb-1">当前课题项目</label>
                    <input
                      type="text"
                      value={newStudent.projectName}
                      onChange={(e) => setNewStudent({ ...newStudent, projectName: e.target.value })}
                      placeholder="如：认知控制与决策的神经机制研究"
                      className="dark-input rounded-lg w-full px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[#a898c4] mb-1">课题阶段</label>
                      <select
                        value={newStudent.projectStage}
                        onChange={(e) => setNewStudent({ ...newStudent, projectStage: e.target.value })}
                        className="dark-input rounded-lg w-full px-3 py-2 text-sm appearance-none cursor-pointer"
                      >
                        <option value="">选择阶段</option>
                        <option value="文献调研">文献调研</option>
                        <option value="实验设计">实验设计</option>
                        <option value="数据收集">数据收集</option>
                        <option value="数据分析">数据分析</option>
                        <option value="论文撰写">论文撰写</option>
                        <option value="投稿修改">投稿修改</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-[#a898c4] mb-1">论文撰写阶段</label>
                      <select
                        value={newStudent.writingStage}
                        onChange={(e) => setNewStudent({ ...newStudent, writingStage: e.target.value })}
                        className="dark-input rounded-lg w-full px-3 py-2 text-sm appearance-none cursor-pointer"
                      >
                        <option value="">选择阶段</option>
                        <option value="尚未开始">尚未开始</option>
                        <option value="引言/文献综述">引言/文献综述</option>
                        <option value="方法部分">方法部分</option>
                        <option value="结果部分">结果部分</option>
                        <option value="讨论部分">讨论部分</option>
                        <option value="全文整合">全文整合</option>
                        <option value="导师修改">导师修改</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[#a898c4] mb-1">关注的方法/技术</label>
                    <input
                      type="text"
                      value={newStudent.methodsOfInterest}
                      onChange={(e) => setNewStudent({ ...newStudent, methodsOfInterest: e.target.value })}
                      placeholder="如：fMRI、计算建模、眼动追踪"
                      className="dark-input rounded-lg w-full px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#a898c4] mb-1">或上传论文/文档（可选）</label>
                    <div
                      onClick={() => studentFileRef.current?.click()}
                      className="glass-card rounded-lg p-3 flex items-center gap-2 cursor-pointer hover:border-[rgba(196,155,255,0.32)] transition-all"
                    >
                      <FileUp className="w-4 h-4 text-[#c49bff]" />
                      <span className="text-xs text-[#a898c4]">
                        {uploadingStudent ? '解析中...' : '点击上传 PDF 或 Word 文件'}
                      </span>
                    </div>
                    <input ref={studentFileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleStudentFileUpload} />
                  </div>

                  <button
                    onClick={editingStudentId ? handleSaveEditStudent : handleAddStudent}
                    disabled={!newStudent.name.trim() || uploadingStudent}
                    className="w-full btn-primary py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {uploadingStudent ? '上传解析中...' : (editingStudentId ? '保存修改' : '添加')}
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
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#22d3ee]/15 to-[#60a5fa]/15 flex items-center justify-center shrink-0 border border-[rgba(94,228,240,0.18)]">
                            <GraduationCap className="w-4 h-4 text-[#5ee4f0]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-[#f5f0ff]">{student.name}</h4>
                              {student.projectStage && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgba(94,228,240,0.15)] text-[#5ee4f0] border border-[rgba(94,228,240,0.22)]">{student.projectStage}</span>
                              )}
                            </div>
                            {student.projectName && (
                              <p className="text-[11px] text-[#c49bff] mt-0.5 truncate">{student.projectName}</p>
                            )}
                            {student.description && (
                              <p className="text-xs text-[#d4c8e8] mt-1 leading-relaxed line-clamp-2">{student.description}</p>
                            )}
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {student.methodsOfInterest && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(96,165,250,0.1)] text-[#7ab8ff] border border-[rgba(122,184,255,0.18)]">{student.methodsOfInterest}</span>
                              )}
                              {student.writingStage && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(196,155,255,0.12)] text-[#c49bff] border border-[rgba(196,155,255,0.18)]">撰写：{student.writingStage}</span>
                              )}
                            </div>
                            {student.fileName && (
                              <div className="flex items-center gap-1 mt-1.5">
                                <FileText className="w-3 h-3 text-[#a898c4]" />
                                <span className="text-[10px] text-[#a898c4] truncate">{student.fileName}</span>
                                <CheckCircle className="w-3 h-3 text-emerald-400" />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleStartEditStudent(student)}
                      className="p-1.5 rounded-lg text-[#7a6a9a] hover:text-[#c49bff] hover:bg-[rgba(196,155,255,0.12)] transition-colors cursor-pointer"
                      title="编辑"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteStudent(student.id)}
                      className="p-1.5 rounded-lg text-[#7a6a9a] hover:text-red-400 hover:bg-[rgba(239,68,68,0.1)] transition-colors cursor-pointer"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                      </div>

                      {/* 工作汇报区域 */}
                      <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.1)]">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <ClipboardPaste className="w-3.5 h-3.5 text-[#c49bff]" />
                            <span className="text-xs font-medium text-[#d4c8e8]">工作汇报</span>
                          </div>
                          {student.reportFileName && student.reportCreatedAt && (
                            <span className="text-[10px] text-[#7a6a9a]">
                              {new Date(student.reportCreatedAt).toLocaleDateString('zh-CN')}
                            </span>
                          )}
                        </div>

                        {student.reportContent ? (
                          <div className="rounded-lg bg-[rgba(196,155,255,0.08)] border border-[rgba(196,155,255,0.12)] p-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              <span className="text-[10px] text-emerald-400">{student.reportFileName}</span>
                            </div>
                            <p className="text-[11px] text-[#a898c4] leading-relaxed line-clamp-4">{student.reportContent.slice(0, 300)}</p>
                            {student.reportContent.length > 300 && (
                              <span className="text-[10px] text-[#7a6a9a]">...（共 {student.reportContent.length} 字）</span>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-[#7a6a9a] mb-2">暂无工作汇报，上传后脑师将了解该同门的最新进展</p>
                        )}

                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => reportFileRefs.current[student.id]?.click()}
                            disabled={uploadingReportId === student.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-[rgba(255,255,255,0.12)] text-[#a898c4] hover:text-[#d4c8e8] hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Upload className="w-3 h-3" />
                            {uploadingReportId === student.id ? '解析中...' : '上传文件'}
                          </button>
                          <button
                            onClick={() => handleReportPaste(student.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-[rgba(255,255,255,0.12)] text-[#a898c4] hover:text-[#d4c8e8] hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer"
                          >
                            <ClipboardPaste className="w-3 h-3" />
                            粘贴文本
                          </button>
                          <input
                            ref={(el) => { reportFileRefs.current[student.id] = el; }}
                            type="file"
                            accept=".pdf,.doc,.docx,.txt,.md"
                            className="hidden"
                            onChange={(e) => handleReportUpload(student.id, e)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {students.length === 0 && !showAddStudent && (
                <div className="text-center py-8">
                  <GraduationCap className="w-10 h-10 text-[#7a6a9a] mx-auto mb-3" />
                  <p className="text-sm text-[#a898c4]">还没有添加同门画像</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
