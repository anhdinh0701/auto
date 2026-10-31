import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  Minimize2,
  Maximize2,
  Copy,
  Check,
  ChevronDown,
  RefreshCw,
  Zap
} from 'lucide-react';

export default function ChatbotWidget({ activeListing = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `👋 Xin chào! Tôi là **Trợ lý AI Bất Động Sản** (được tối ưu bởi **Groq AI** siêu tốc).

Tôi có thể hỗ trợ bạn:
- 📝 **Soạn tin đăng BĐS thu hút** cho Facebook, Zalo, Cổng thông tin.
- 🎯 **Sáng tạo tiêu đề viral** kích thích người mua bấm xem.
- 🎬 **Viết kịch bản video TikTok / Reels** review nhà đất 30-60 giây.
- ⚖️ **Giải đáp thủ tục pháp lý**, sổ đỏ/sổ hồng, quy trình đặt cọc và công chứng.

Bạn cần tôi hỗ trợ việc gì hôm nay?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    { label: '📝 Soạn tin Facebook', text: 'Hãy viết cho tôi một bài đăng Facebook hấp dẫn để bán căn hộ cao cấp 2 phòng ngủ, view thoáng, sổ hồng sẵn sàng.' },
    { label: '🎯 Gợi ý 5 tiêu đề viral', text: 'Gợi ý cho tôi 5 tiêu đề tin đăng bất động sản cực kỳ giật tít, thu hút khách hàng nhưng không bịa đặt.' },
    { label: '🎬 Kịch bản TikTok 60s', text: 'Viết kịch bản quay video TikTok 60 giây review căn nhà phố mặt tiền kinh doanh, có lời thoại và góc quay chi tiết.' },
    { label: '⚖️ Thủ tục sang tên sổ hồng', text: 'Tóm tắt các bước và các loại thuế phí khi mua bán công chứng chuyển nhượng quyền sử dụng đất tại Việt Nam.' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const newMessages = [...messages, { role: 'user', content: textToSend.trim() }];
    setMessages(newMessages);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          context: {
            listing: activeListing
          }
        })
      });

      const data = await res.json();
      if (data.success && data.reply) {
        setMessages([...newMessages, { role: 'assistant', content: data.reply, provider: data.provider }]);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: 'Xin lỗi, không nhận được phản hồi từ máy chủ AI. Vui lòng thử lại sau.' }]);
      }
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Lỗi kết nối đến dịch vụ AI: ' + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClear = () => {
    if (window.confirm('Xóa toàn bộ lịch sử cuộc trò chuyện?')) {
      setMessages([
        {
          role: 'assistant',
          content: 'Lịch sử đã được làm mới. Tôi có thể hỗ trợ gì thêm cho bạn?'
        }
      ]);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white font-bold text-sm rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all group"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white animate-bounce" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
          </div>
          <span className="hidden sm:inline">Trợ lý AI BĐS</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 font-bold backdrop-blur-xs flex items-center gap-0.5">
            <Zap className="w-3 h-3 text-amber-300" /> Groq
          </span>
        </button>
      )}

      {/* Chat Window Drawer / Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-[420px] h-[600px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-xs tracking-tight text-white">AI BĐS Consultant</h3>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                    Groq 120B
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  Sẵn sàng phản hồi siêu tốc
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                title="Xóa lịch sử chat"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Thu nhỏ"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.map((m, idx) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  {isAssistant && (
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs mt-1 shadow-xs">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className={`relative group max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    isAssistant
                      ? 'bg-white text-slate-800 border border-slate-200/80 shadow-xs'
                      : 'bg-emerald-600 text-white shadow-xs rounded-br-xs'
                  }`}>
                    {/* Render content */}
                    <div className="whitespace-pre-wrap font-sans">
                      {m.content}
                    </div>

                    {/* Copy Button for Assistant */}
                    {isAssistant && (
                      <button
                        onClick={() => handleCopy(m.content, idx)}
                        className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-all"
                        title="Sao chép nội dung"
                      >
                        {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>

                  {!isAssistant && (
                    <div className="w-6 h-6 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 text-xs mt-1 shadow-xs">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2.5 items-center text-xs text-slate-400">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-slate-500 font-medium ml-1">Groq AI đang phân tích & soạn nội dung...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 py-2 bg-slate-100/70 border-t border-slate-200 overflow-x-auto flex gap-1.5 no-scrollbar">
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(p.text)}
                className="whitespace-nowrap px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-[10px] font-semibold rounded-lg border border-slate-200 transition-all shrink-0"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Nhập yêu cầu (VD: Soạn bài đăng Facebook căn hộ 2PN...)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-emerald-500"
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs disabled:opacity-40 transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
