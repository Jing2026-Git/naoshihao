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
      // 降级方案
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
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#a78bfa]/20 to-[#60a5fa]/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-[#a78bfa]" />
          </div>
          <span className="text-sm font-medium text-[#e8e8ef]">脑师说</span>
          {hasPaper && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(167,139,250,0.15)] text-[#a78bfa] border border-[rgba(167,139,250,0.2)]">
              已加载文献
            </span>
          )}
        </div>

        {/* 学生选择器 */}
        {students.length > 0 && hasPaper && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowStudentDropdown(!showStudentDropdown)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeStudentId
                  ? 'bg-[rgba(34,211,238,0.12)] text-[#22d3ee] border border-[rgba(34,211,238,0.2)]'
                  : 'bg-[rgba(255,255,255,0.05)] text-[#6b6b7b] border border-[rgba(255,255,255,0.08)] hover:text-[#a0a0b0]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              {activeStudent ? activeStudent.name : '选择同门'}
              <ChevronDown className={`w-3 h-3 transition-transform ${showStudentDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showStudentDropdown && (
              <div className="absolute right-0 top-full mt-1.5 w-48 glass-card-strong rounded-xl overflow-hidden z-50 animate-fade-in-scale">
                <div className="px-3 py-2 border-b border-[rgba(255,255,255,0.06)]">
                  <p className="text-[10px] text-[#6b6b7b] uppercase tracking-wider">关联同门画像</p>
                </div>
                <button
                  onClick={() => { onSelectStudent(null); setShowStudentDropdown(false); }}
                  className={`w-full text-left px-3 py-2.5 text-xs transition-colors cursor-pointer flex items-center gap-2 ${
                    !activeStudentId ? 'bg-[rgba(167,139,250,0.1)] text-[#a78bfa]' : 'text-[#a0a0b0] hover:bg-[rgba(255,255,255,0.03)]'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[10px]">无</span>
                  不关联同门
                </button>
                {students.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => { onSelectStudent(student.id); setShowStudentDropdown(false); }}
                    className={`w-full text-left px-3 py-2.5 text-xs transition-colors cursor-pointer flex items-center gap-2 ${
                      activeStudentId === student.id ? 'bg-[rgba(34,211,238,0.1)] text-[#22d3ee]' : 'text-[#a0a0b0] hover:bg-[rgba(255,255,255,0.03)]'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
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
        <div className="px-5 py-2 bg-[rgba(34,211,238,0.05)] border-b border-[rgba(34,211,238,0.08)] flex items-center gap-2">
          <Users className="w-3 h-3 text-[#22d3ee]" />
          <span className="text-[11px] text-[#22d3ee]">
            当前对话关联同门：<span className="font-medium">{activeStudent.name}</span>
            {activeStudent.description && (
              <span className="text-[#6b6b7b] ml-1">· {activeStudent.description.slice(0, 30)}{activeStudent.description.length > 30 ? '...' : ''}</span>
            )}
          </span>
          <button
            onClick={() => onSelectStudent(null)}
            className="ml-auto p-0.5 rounded hover:bg-[rgba(255,255,255,0.05)] text-[#6b6b7b] hover:text-[#e8e8ef] cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {!hasPaper ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#a78bfa]/10 to-[#60a5fa]/10 flex items-center justify-center mb-5 border border-[rgba(167,139,250,0.15)] animate-glow-pulse">
              <BookOpen className="w-10 h-10 text-[#a78bfa]" />
            </div>
            <h3 className="text-lg font-semibold text-[#e8e8ef] mb-2">欢迎使用脑师好</h3>
            <p className="text-sm text-[#6b6b7b] max-w-xs leading-relaxed">
              在左侧上传一篇学术文献，脑师将基于苏格拉底学习法为您深度解读
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#a78bfa]/10 to-[#60a5fa]/10 flex items-center justify-center mb-4 border border-[rgba(167,139,250,0.15)]">
              <Sparkles className="w-7 h-7 text-[#a78bfa]" />
            </div>
            <p className="text-sm text-[#6b6b7b]">文献已加载，开始提问吧</p>
            {activeStudent && (
              <p className="text-xs text-[#22d3ee] mt-2">已关联同门：{activeStudent.name}，脑师将结合其研究方向作答</p>
            )}
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const isLastAssistant = !isUser && idx === messages.length - 1 && !isTyping;
            return (
              <div
                key={idx}
                className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fade-in group`}
                style={{ animationDelay: `${idx * 0.05}s` }}
                onMouseEnter={() => setHoveredMsgIdx(idx)}
                onMouseLeave={() => setHoveredMsgIdx(null)}
              >
                {/* 头像 */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  isUser
                    ? 'bg-gradient-to-br from-[#60a5fa]/30 to-[#22d3ee]/30'
                    : 'bg-gradient-to-br from-[#a78bfa]/30 to-[#c084fc]/30'
                }`}>
                  {isUser ? (
                    <User className="w-3.5 h-3.5 text-[#60a5fa]" />
                  ) : (
                    <Brain className="w-3.5 h-3.5 text-[#a78bfa]" />
                  )}
                </div>

                {/* 气泡 + 操作栏 */}
                <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed relative ${
                      isUser
                        ? 'bg-[rgba(96,165,250,0.12)] border border-[rgba(96,165,250,0.15)] text-[#e8e8ef]'
                        : 'bg-[rgba(167,139,250,0.08)] border border-[rgba(167,139,250,0.12)] text-[#a0a0b0]'
                    }`}
                  >
                    {isUser ? (
                      msg.content
                    ) : (
                      <div className="markdown-content">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* 操作按钮栏 */}
                  <div className={`flex items-center gap-1 mt-1 px-1 transition-opacity duration-200 ${
                    hoveredMsgIdx === idx ? 'opacity-100' : 'opacity-0'
                  }`}>
                    {/* 复制按钮 */}
                    <button
                      onClick={() => handleCopy(msg.content, idx)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-[#6b6b7b] hover:text-[#a0a0b0] hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer"
                      title="复制"
                    >
                      {copiedIdx === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>复制</span>
                        </>
                      )}
                    </button>

                    {/* 删除按钮 */}
                    <button
                      onClick={() => handleDelete(idx)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-[#6b6b7b] hover:text-red-400 hover:bg-[rgba(239,68,68,0.08)] transition-colors cursor-pointer"
                      title="删除"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>删除</span>
                    </button>

                    {/* 重发按钮（仅对最后一条 AI 消息） */}
                    {!isUser && isLastAssistant && (
                      <button
                        onClick={() => handleRegenerate(idx)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-[#6b6b7b] hover:text-[#a78bfa] hover:bg-[rgba(167,139,250,0.08)] transition-colors cursor-pointer"
                        title="重新生成"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>重试</span>
                      </button>
                    )}
                  </div>

                  {/* 思维模型标签 */}
                  {!isUser && msg.modelLabel && (
                    <div className="flex items-center gap-1.5 mt-1 px-1">
                      <Sparkles className="w-3 h-3 text-[#a78bfa]" />
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${msg.colorClass || 'bg-[rgba(167,139,250,0.1)] text-[#a78bfa] border-[rgba(167,139,250,0.2)]'}`}>
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
          <div className="flex gap-3 animate-fade-in">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#a78bfa]/30 to-[#c084fc]/30 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-[#a78bfa]" />
            </div>
            <div className="bg-[rgba(167,139,250,0.08)] border border-[rgba(167,139,250,0.12)] rounded-2xl px-4 py-3">
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区 */}
      <div className="px-5 py-3 border-t border-[rgba(255,255,255,0.06)]">
        <div className="glass-card rounded-xl flex items-end gap-2 p-2">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasPaper ? "向脑师提问..." : "请先上传文献"}
            disabled={!hasPaper}
            rows={1}
            className="flex-1 bg-transparent border-none text-sm text-[#e8e8ef] placeholder:text-[#4a4a5a] resize-none py-2 px-2 focus:outline-none max-h-32 disabled:opacity-40"
            style={{ minHeight: '36px' }}
          />
          <button
            onClick={handleSend}
            disabled={!hasPaper || !inputText.trim()}
            className="w-9 h-9 rounded-lg btn-primary flex items-center justify-center shrink-0 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-[#4a4a5a] mt-1.5 text-center">
          Enter 发送 · Shift+Enter 换行
        </p>
      </div>
    </div>
  );
}
