import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Brain, Sparkles, User, BookOpen, Users, ChevronDown, X, Copy, Check, Trash2, RotateCcw } from 'lucide-react';
import TypingIndicator from './TypingIndicator';

export default function ChatPanel({ messages, isTyping, onSendMessage, hasPaper, students, activeStudentId, onSelectStudent, onDeleteMessage, onRegenerate }) {
  const [inputText, setInputText] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [hoveredMsgIdx, setHoveredMsgIdx] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowStudentDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = async (content, idx) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    }
  };

  const handleDelete = (idx) => {
    if (window.confirm('确定要删除这条消息吗？')) {
      onDeleteMessage?.(idx);
    }
  };

  const handleRegenerate = (idx) => {
    onRegenerate?.(idx);
  };

  const activeStudent = students.find(s => s.id === activeStudentId);

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* 标题栏 - 更简洁 */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-[rgba(255,255,255,0.1)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#c49bff]/25 to-[#7ab8ff]/25 flex items-center justify-center border border-[rgba(196,155,255,0.2)]">
            <Brain className="w-4.5 h-4.5 text-[#c49bff]" />
          </div>
          <div>
            <span className="text-[15px] font-semibold text-[#f5f0ff]">脑师说</span>
            {hasPaper && (
              <span className="text-[11px] ml-2 px-2 py-0.5 rounded-full bg-[rgba(196,155,255,0.15)] text-[#c49bff] border border-[rgba(196,155,255,0.2)]">
                已加载文献
              </span>
            )}
          </div>
        </div>

        {/* 学生选择器 */}
        {students.length > 0 && hasPaper && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowStudentDropdown(!showStudentDropdown)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                activeStudentId
                  ? 'bg-[rgba(94,228,240,0.15)] text-[#5ee4f0] border border-[rgba(94,228,240,0.22)]'
                  : 'bg-[rgba(255,255,255,0.06)] text-[#a898c4] border border-[rgba(255,255,255,0.12)] hover:text-[#d4c8e8]'
              }`}
            >
              <Users className="w-4 h-4" />
              {activeStudent ? activeStudent.name : '选择同门'}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showStudentDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showStudentDropdown && (
              <div className="absolute right-0 top-full mt-2 w-52 glass-card-strong rounded-xl overflow-hidden z-50 animate-fade-in-scale shadow-2xl">
                <div className="px-3 py-2.5 border-b border-[rgba(255,255,255,0.1)]">
                  <p className="text-[11px] text-[#a898c4] uppercase tracking-wider font-medium">关联同门画像</p>
                </div>
                <button
                  onClick={() => { onSelectStudent(null); setShowStudentDropdown(false); }}
                  className={`w-full text-left px-3.5 py-3 text-[13px] transition-colors cursor-pointer flex items-center gap-2 ${
                    !activeStudentId ? 'bg-[rgba(196,155,255,0.12)] text-[#c49bff]' : 'text-[#d4c8e8] hover:bg-[rgba(255,255,255,0.04)]'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-[rgba(255,255,255,0.06)] flex items-center justify-center text-[11px]">无</span>
                  不关联同门
                </button>
                {students.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => { onSelectStudent(student.id); setShowStudentDropdown(false); }}
                    className={`w-full text-left px-3.5 py-3 text-[13px] transition-colors cursor-pointer flex items-center gap-2 ${
                      activeStudentId === student.id ? 'bg-[rgba(94,228,240,0.12)] text-[#5ee4f0]' : 'text-[#d4c8e8] hover:bg-[rgba(255,255,255,0.04)]'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span className="truncate">{student.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 关联提示条 */}
      {activeStudent && hasPaper && (
        <div className="px-6 py-2.5 bg-[rgba(94,228,240,0.06)] border-b border-[rgba(94,228,240,0.12)] flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-[#5ee4f0]" />
          <span className="text-[12px] text-[#5ee4f0]">
            当前对话关联同门：<span className="font-semibold">{activeStudent.name}</span>
            {activeStudent.description && (
              <span className="text-[#a898c4] ml-1.5">· {activeStudent.description.slice(0, 30)}{activeStudent.description.length > 30 ? '...' : ''}</span>
            )}
          </span>
          <button
            onClick={() => onSelectStudent(null)}
            className="ml-auto p-1 rounded hover:bg-[rgba(255,255,255,0.06)] text-[#a898c4] hover:text-[#f5f0ff] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 消息列表 - 更宽的气泡和更大的字体 */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {!hasPaper ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#c49bff]/15 to-[#7ab8ff]/15 flex items-center justify-center mb-6 border border-[rgba(196,155,255,0.2)] animate-glow-pulse">
              <BookOpen className="w-12 h-12 text-[#c49bff]" />
            </div>
            <h3 className="text-xl font-bold text-[#f5f0ff] mb-3">欢迎使用脑师好</h3>
            <p className="text-[15px] text-[#a898c4] max-w-sm leading-relaxed">
              在左侧上传一篇学术文献，脑师将基于苏格拉底学习法为您深度解读
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#c49bff]/15 to-[#7ab8ff]/15 flex items-center justify-center mb-5 border border-[rgba(196,155,255,0.2)]">
              <Sparkles className="w-9 h-9 text-[#c49bff]" />
            </div>
            <p className="text-[15px] text-[#a898c4] font-medium">文献已加载，开始提问吧</p>
            {activeStudent && (
              <p className="text-[13px] text-[#5ee4f0] mt-3">已关联同门：{activeStudent.name}，脑师将结合其研究方向作答</p>
            )}
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const isLastAssistant = !isUser && idx === messages.length - 1 && !isTyping;
            return (
              <div
                key={idx}
                className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fade-in group`}
                style={{ animationDelay: `${idx * 0.05}s` }}
                onMouseEnter={() => setHoveredMsgIdx(idx)}
                onMouseLeave={() => setHoveredMsgIdx(null)}
              >
                {/* 头像 - 更大 */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-1 ${
                  isUser
                    ? 'bg-gradient-to-br from-[#7ab8ff]/30 to-[#5ee4f0]/30 border border-[rgba(122,184,255,0.2)]'
                    : 'bg-gradient-to-br from-[#c49bff]/30 to-[#d4a8ff]/30 border border-[rgba(196,155,255,0.2)]'
                }`}>
                  {isUser ? (
                    <User className="w-4.5 h-4.5 text-[#7ab8ff]" />
                  ) : (
                    <Brain className="w-4.5 h-4.5 text-[#c49bff]" />
                  )}
                </div>

                {/* 气泡 + 操作栏 - 更宽 */}
                <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-5 py-4 text-[15px] leading-relaxed relative ${
                      isUser
                        ? 'bg-[rgba(122,184,255,0.18)] border border-[rgba(122,184,255,0.22)] text-[#f5f0ff]'
                        : 'bg-[rgba(196,155,255,0.1)] border border-[rgba(196,155,255,0.18)] text-[#e8ddf8]'
                    }`}
                  >
                    {isUser ? (
                      <span className="font-medium">{msg.content}</span>
                    ) : (
                      <div className="markdown-content">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* 操作按钮栏 */}
                  <div className={`flex items-center gap-1.5 mt-1.5 px-1 transition-opacity duration-200 ${
                    hoveredMsgIdx === idx ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <button
                      onClick={() => handleCopy(msg.content, idx)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-[#a898c4] hover:text-[#d4c8e8] hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
                      title="复制"
                    >
                      {copiedIdx === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>复制</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(idx)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-[#a898c4] hover:text-red-400 hover:bg-[rgba(239,68,68,0.08)] transition-colors cursor-pointer"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>删除</span>
                    </button>

                    {!isUser && isLastAssistant && (
                      <button
                        onClick={() => handleRegenerate(idx)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-[#a898c4] hover:text-[#c49bff] hover:bg-[rgba(196,155,255,0.1)] transition-colors cursor-pointer"
                        title="重新生成"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>重试</span>
                      </button>
                    )}
                  </div>

                  {/* 思维模型标签 */}
                  {!isUser && msg.modelLabel && (
                    <div className="flex items-center gap-2 mt-2 px-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#c49bff]" />
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${msg.colorClass || 'bg-[rgba(196,155,255,0.12)] text-[#c49bff] border-[rgba(196,155,255,0.22)]'}`}>
                        {msg.modelLabel}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isTyping && (
          <div className="flex gap-4 animate-fade-in">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c49bff]/30 to-[#d4a8ff]/30 flex items-center justify-center border border-[rgba(196,155,255,0.2)]">
              <Brain className="w-4.5 h-4.5 text-[#c49bff]" />
            </div>
            <div className="bg-[rgba(196,155,255,0.1)] border border-[rgba(196,155,255,0.18)] rounded-2xl px-5 py-4">
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区 - 更大更醒目 */}
      <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.1)]">
        <div className="glass-card rounded-2xl flex items-end gap-3 p-3">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasPaper ? "向脑师提问..." : "请先上传文献"}
            disabled={!hasPaper}
            rows={1}
            className="flex-1 bg-transparent border-none text-[15px] text-[#f5f0ff] placeholder:text-[#7a6a9a] resize-none py-2.5 px-3 focus:outline-none max-h-32 disabled:opacity-40 leading-relaxed"
            style={{ minHeight: '44px' }}
          />
          <button
            onClick={handleSend}
            disabled={!hasPaper || !inputText.trim()}
            className="w-11 h-11 rounded-xl btn-primary flex items-center justify-center shrink-0 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[11px] text-[#7a6a9a] mt-2 text-center">
          Enter 发送 · Shift+Enter 换行
        </p>
      </div>
    </div>
  );
}
