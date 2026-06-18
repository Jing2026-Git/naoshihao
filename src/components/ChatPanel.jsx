import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Brain, Sparkles, User, BookOpen } from 'lucide-react';
import TypingIndicator from './TypingIndicator';

export default function ChatPanel({ messages, isTyping, onSendMessage, hasPaper }) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      {/* 标题栏 */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-[rgba(255,255,255,0.06)]">
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
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}
                style={{ animationDelay: `${idx * 0.05}s` }}
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

                {/* 气泡 */}
                <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
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

                  {/* 思维模型标签 */}
                  {!isUser && msg.modelLabel && (
                    <div className="flex items-center gap-1.5 mt-1.5 px-1">
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
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#a78bfa]/30 to-[#c084fc]/30 flex items-center justify-center shrink-0">
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
