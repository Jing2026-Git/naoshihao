import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Brain, Send, Sparkles } from 'lucide-react';
import TypingIndicator from './TypingIndicator';

export default function ChatPanel({ messages, onSendMessage, isTyping, hasPaper }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // 自动调整 textarea 高度
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;
    onSendMessage?.(trimmed);
    setInput('');
    // 重置 textarea 高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isTyping, onSendMessage]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* 标题栏 */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <Brain className="w-4 h-4 text-primary-600" />
        <h2 className="text-sm font-semibold text-text-primary">脑师说</h2>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!hasPaper && messages.length === 0 ? (
          /* 欢迎消息 */
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-50 text-primary-500 mb-4">
              <Brain className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-text-primary mb-2">
              欢迎使用脑师好
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed max-w-sm">
              上传一篇学术文献，脑师将基于您的画像为您解读文献内容、分析研究方法、提炼核心观点，并提供个性化的学术见解。
            </p>
          </div>
        ) : (
          /* 消息列表 */
          <div className="space-y-4">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[80%] ${
                      isUser ? 'order-1' : ''
                    }`}
                  >
                    {/* 消息气泡 */}
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? 'bg-primary-600 text-white rounded-br-md'
                          : 'bg-surface-secondary text-text-primary rounded-bl-md'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="markdown-content">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {/* AI 消息标签 */}
                    {!isUser && msg.modelLabel && (
                      <div className="flex items-center gap-1.5 mt-1.5 px-1">
                        <Sparkles className="w-3 h-3 text-text-tertiary" />
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${msg.colorClass || 'bg-surface-secondary text-text-tertiary border-border'}`}>
                          {msg.modelLabel}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 输入中指示器 */}
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-surface-secondary rounded-2xl rounded-bl-md px-4 py-3">
                  <TypingIndicator />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="px-4 py-3 border-t border-border shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasPaper ? '输入您的问题...' : '请先上传文献...'}
            disabled={!hasPaper}
            rows={1}
            className="flex-1 resize-none px-3 py-2 rounded-xl border border-border bg-surface text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping || !hasPaper}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
