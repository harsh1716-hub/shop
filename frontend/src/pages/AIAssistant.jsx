import { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, TrendingUp, Star, Clock, AlertTriangle, RefreshCw, ChevronRight } from 'lucide-react';

const QUICK_QUESTIONS = [
  { label: '🏆 Best seller?', q: 'Which item sells the most in my bakery?' },
  { label: '💰 Revenue today?', q: 'How much revenue did I make today?' },
  { label: '📅 Busiest day?', q: 'Which day of the week do I get the most orders?' },
  { label: '⚠️ Low stock?', q: 'Which products are running low on stock and need to be restocked?' },
  { label: '📦 Pending orders?', q: 'How many advanced orders are pending?' },
  { label: '📈 Weekly summary?', q: 'Give me a full summary of this week\'s business performance.' },
];

const INSIGHT_ICONS = {
  '📊 Business Health': <TrendingUp size={18} />,
  '🌟 Top Recommendation': <Star size={18} />,
  '📅 Peak Hours': <Clock size={18} />,
  '⚠️ Stock Alert': <AlertTriangle size={18} />,
};

const INSIGHT_COLORS = [
  { border: '#f59e0b', bg: '#fffbeb', icon: '#d97706', text: '#92400e' },
  { border: '#6366f1', bg: '#eef2ff', icon: '#4f46e5', text: '#3730a3' },
  { border: '#10b981', bg: '#ecfdf5', icon: '#059669', text: '#065f46' },
  { border: '#ef4444', bg: '#fef2f2', icon: '#dc2626', text: '#991b1b' },
];

function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '12px 16px' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: '#f59e0b',
          animation: `aiBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          display: 'inline-block'
        }} />
      ))}
    </div>
  );
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "👋 Hello! I'm your **AI Business Assistant**. I have access to your live shop data — sales, inventory, orders, and more. Ask me anything about your bakery! 🥐",
      time: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setInsightsLoading(true);
    setInsightsError(false);
    try {
      const res = await fetch('https://shop-h7pf.onrender.com/api/ai/insights');
      const data = await res.json();
      if (data.insights && Array.isArray(data.insights)) setInsights(data.insights);
      else setInsightsError(true);
    } catch {
      setInsightsError(true);
    } finally {
      setInsightsLoading(false);
    }
  };

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg, time: new Date() }]);
    setLoading(true);

    try {
      const res = await fetch('https://shop-h7pf.onrender.com/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: data.reply || 'Sorry, I could not get a response.',
        time: new Date()
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: '❌ Could not connect to AI. Make sure the backend is running.',
        time: new Date()
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const formatText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i} style={{ color: '#d97706' }}>{part.slice(2, -2)}</strong>
        : <span key={i}>{part}</span>
    );
  };

  const formatTime = (date) =>
    date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes aiBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-7px); opacity: 1; }
        }
        @keyframes aiFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes aiPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.35); }
          50% { box-shadow: 0 0 0 8px rgba(245,158,11,0); }
        }
        .ai-insight-card { transition: transform 0.2s, box-shadow 0.2s; cursor: default; }
        .ai-insight-card:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,0,0,0.1) !important; }
        .ai-chip { transition: all 0.15s; cursor: pointer; border: none; }
        .ai-chip:hover { background: #fef3c7 !important; border-color: #f59e0b !important; color: #92400e !important; transform: translateY(-1px); }
        .ai-send-btn { transition: all 0.15s; }
        .ai-send-btn:hover:not(:disabled) { transform: scale(1.07); filter: brightness(0.9); }
        .ai-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .ai-msg { animation: aiFadeUp 0.3s ease forwards; }
        .ai-textarea:focus { outline: none; border-color: rgba(245,158,11,0.6) !important; box-shadow: 0 0 0 3px rgba(245,158,11,0.1) !important; }
        .ai-textarea::placeholder { color: #94a3b8; }
        .ai-scroll::-webkit-scrollbar { width: 5px; }
        .ai-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(245,158,11,0.35)',
            animation: 'aiPulse 2.5s ease-in-out infinite'
          }}>
            <Bot size={26} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#1e293b', letterSpacing: '-0.5px' }}>
              AI Assistant <span style={{ color: '#f59e0b' }}>✨</span>
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b', fontWeight: 500 }}>
              Powered by Gemini · Works on your live shop data
            </p>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
          background: '#ecfdf5', borderRadius: 20,
          border: '1px solid #a7f3d0'
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
          <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>Live Data Connected</span>
        </div>
      </div>

      {/* ── Auto Insights ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color="#f59e0b" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Auto Business Insights
            </span>
          </div>
          <button
            onClick={fetchInsights}
            disabled={insightsLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
              background: '#fff', border: '1px solid #e2e8f0',
              borderRadius: 8, color: '#64748b', cursor: 'pointer', fontSize: 12,
              fontWeight: 600, transition: 'all 0.15s'
            }}
          >
            <RefreshCw size={13} style={{ animation: insightsLoading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {insightsLoading ? (
            [0,1,2,3].map(i => (
              <div key={i} style={{
                background: '#f8fafc', borderRadius: 16, padding: 18,
                border: '1px solid #e2e8f0', minHeight: 110
              }}>
                <div style={{ width: '60%', height: 11, background: '#e2e8f0', borderRadius: 6, marginBottom: 10 }} />
                <div style={{ width: '90%', height: 9, background: '#f1f5f9', borderRadius: 6, marginBottom: 6 }} />
                <div style={{ width: '75%', height: 9, background: '#f1f5f9', borderRadius: 6 }} />
              </div>
            ))
          ) : insightsError ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#ef4444', padding: 20, fontSize: 14 }}>
              ❌ Could not load insights. Make sure the backend is running.
            </div>
          ) : (
            insights.map((insight, i) => (
              <div key={i} className="ai-insight-card" style={{
                background: INSIGHT_COLORS[i]?.bg || '#f8fafc',
                borderRadius: 16, padding: 18,
                border: `1px solid ${INSIGHT_COLORS[i]?.border || '#e2e8f0'}40`,
                borderLeft: `3px solid ${INSIGHT_COLORS[i]?.border || '#64748b'}`,
                boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                animation: `aiFadeUp 0.4s ease ${i * 0.1}s forwards`,
                opacity: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ color: INSIGHT_COLORS[i]?.icon || '#64748b' }}>
                    {INSIGHT_ICONS[insight.title] || <Sparkles size={18} />}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: INSIGHT_COLORS[i]?.icon || '#64748b', letterSpacing: '0.03em' }}>
                    {insight.title}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                  {typeof insight.text === 'string' ? insight.text : JSON.stringify(insight.text)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Chat + Quick Questions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 16 }}>

        {/* Chat Window */}
        <div style={{
          background: '#fff', borderRadius: 20,
          border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column',
          height: 460, overflow: 'hidden',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)'
        }}>
          {/* Chat header */}
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#fafafa'
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Bot size={17} color="#fff" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Bakery AI</p>
              <p style={{ margin: 0, fontSize: 11, color: '#10b981', fontWeight: 600 }}>● Online · Using live data</p>
            </div>
          </div>

          {/* Messages */}
          <div className="ai-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.map((msg, i) => (
              <div key={i} className="ai-msg" style={{
                display: 'flex',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-end', gap: 10
              }}>
                {msg.role === 'assistant' && (
                  <div style={{
                    width: 30, height: 30, borderRadius: 10, flexShrink: 0,
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Bot size={15} color="#fff" />
                  </div>
                )}
                <div style={{ maxWidth: '75%' }}>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                      : '#f8fafc',
                    border: msg.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
                    color: msg.role === 'user' ? '#fff' : '#334155',
                    fontSize: 14, lineHeight: 1.65,
                    fontWeight: msg.role === 'user' ? 600 : 400,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {msg.role === 'assistant' ? formatText(msg.text) : msg.text}
                  </div>
                  <p style={{
                    margin: '4px 4px 0', fontSize: 10, color: '#94a3b8',
                    textAlign: msg.role === 'user' ? 'right' : 'left'
                  }}>{formatTime(msg.time)}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 10, flexShrink: 0,
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Bot size={15} color="#fff" />
                </div>
                <div style={{
                  background: '#f8fafc', borderRadius: '18px 18px 18px 4px',
                  border: '1px solid #e2e8f0'
                }}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 16px', borderTop: '1px solid #f1f5f9',
            background: '#fafafa', display: 'flex', gap: 10, alignItems: 'flex-end'
          }}>
            <textarea
              ref={inputRef}
              className="ai-textarea"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              placeholder="Ask anything about your bakery… (Enter to send)"
              rows={1}
              style={{
                flex: 1, resize: 'none', background: '#fff',
                border: '1.5px solid #e2e8f0', borderRadius: 14,
                padding: '10px 14px', color: '#1e293b', fontSize: 14,
                fontFamily: 'Inter, sans-serif', lineHeight: 1.5,
                caretColor: '#f59e0b', transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
            />
            <button
              className="ai-send-btn"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(245,158,11,0.3)'
              }}
            >
              <Send size={17} color="#fff" />
            </button>
          </div>
        </div>

        {/* Quick Questions Panel */}
        <div style={{
          background: '#fff', borderRadius: 20,
          border: '1px solid #e2e8f0', padding: 16,
          display: 'flex', flexDirection: 'column', gap: 8,
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Sparkles size={14} color="#f59e0b" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Quick Questions
            </span>
          </div>
          {QUICK_QUESTIONS.map((q, i) => (
            <button
              key={i}
              className="ai-chip"
              onClick={() => sendMessage(q.q)}
              disabled={loading}
              style={{
                width: '100%', textAlign: 'left', padding: '9px 12px',
                background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: 10, color: '#475569', fontSize: 13,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6
              }}
            >
              <span>{q.label}</span>
              <ChevronRight size={13} style={{ opacity: 0.4, flexShrink: 0 }} />
            </button>
          ))}

          <div style={{
            marginTop: 'auto', padding: 12, borderRadius: 12,
            background: '#fffbeb', border: '1px solid #fde68a'
          }}>
            <p style={{ margin: 0, fontSize: 11, color: '#78350f', lineHeight: 1.5 }}>
              💡 <strong style={{ color: '#d97706' }}>Tip:</strong> Ask in plain English — the AI understands your shop data!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
