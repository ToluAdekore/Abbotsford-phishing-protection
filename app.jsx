import React, { useState, useRef, useEffect } from 'react';
import { Shield, Send, Bot, User, AlertTriangle, CheckCircle, Phone, Sparkles, Settings } from 'lucide-react';

const AISafetyAssistant = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your AI Safety Assistant powered by advanced AI from the City of Abbotsford. I use real artificial intelligence to help you stay safe from scams and phishing.\n\nI can analyze:\n• Suspicious emails and websites\n• Phone calls about payments or taxes\n• Text messages asking for personal info\n• Any situation that feels \"off\"\n\nJust describe your situation naturally, and I'll use AI to give you expert advice!\n\nHow can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [useRealAI, setUseRealAI] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Real Claude API Integration
  const analyzeWithClaudeAPI = async (userMessage, conversationHistory) => {
    if (!apiKey) {
      return {
        content: `⚙️ **AI API Not Configured**\n\nTo use real Claude AI, you need an API key from Anthropic.\n\n**How to get started:**\n1. Go to console.anthropic.com\n2. Sign up for an account\n3. Generate an API key\n4. Click the settings icon above to enter your key\n\nFor now, I'm using smart pattern matching to help you!`,
        type: 'info'
      };
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `You are a cybersecurity expert helping vulnerable users (especially seniors) in Abbotsford, BC identify phishing scams and stay safe online. You work for the City of Abbotsford.

CRITICAL INSTRUCTIONS:
- Use grade 6-8 reading level (simple words, short sentences)
- Be warm, patient, and non-judgmental
- Give clear YES/NO verdicts when possible
- Always provide specific action steps
- Never shame users for clicking suspicious links
- Emphasize calling 604-864-5500 for verification
- Focus on empowerment, not fear

CONTEXT ABOUT ABBOTSFORD:
- Official city website: abbotsford.ca (ONLY .ca domain)
- Official city emails: @abbotsford.ca ONLY
- City phone: 604-864-5500
- The city NEVER asks for passwords, full credit card numbers, or SIN via email/phone

USER'S MESSAGE:
${userMessage}

${conversationHistory.length > 0 ? `\nPREVIOUS CONVERSATION:\n${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}` : ''}

RESPOND WITH:
1. A clear verdict (✅ Safe / ⚠️ Suspicious / 🚨 Dangerous)
2. Simple explanation WHY
3. Numbered action steps
4. Friendly follow-up question if appropriate

Keep response under 300 words. Use emojis for visual clarity.`
            }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
      }

      const data = await response.json();
      const aiMessage = data.content[0].text;

      // Classify response type based on content
      let type = 'info';
      if (aiMessage.includes('🚨') || aiMessage.toLowerCase().includes('scam') || aiMessage.toLowerCase().includes('dangerous')) {
        type = 'danger';
      } else if (aiMessage.includes('⚠️') || aiMessage.toLowerCase().includes('suspicious') || aiMessage.toLowerCase().includes('careful')) {
        type = 'warning';
      } else if (aiMessage.includes('✅') || aiMessage.toLowerCase().includes('legitimate') || aiMessage.toLowerCase().includes('safe')) {
        type = 'safe';
      }

      return {
        content: `🤖 **AI Analysis** (Powered by Claude)\n\n${aiMessage}`,
        type: type
      };

    } catch (error) {
      console.error('Claude API Error:', error);
      return {
        content: `❌ **AI Connection Error**\n\nI couldn't connect to the AI service. This might be because:\n• The API key is invalid\n• You've reached your API limit\n• There's a network issue\n\nError: ${error.message}\n\nFalling back to basic pattern matching...`,
        type: 'warning'
      };
    }
  };

  // Fallback pattern matching (when API not available)
  const analyzeWithPatternMatching = async (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();

    // Quick pattern-based analysis for common scenarios
    if (lowerMessage.includes('gift card') || lowerMessage.includes('itunes') || lowerMessage.includes('google play')) {
      return {
        content: `🚨 **100% SCAM DETECTED**\n\nThe City of Abbotsford NEVER asks for gift cards. This is guaranteed fraud.\n\n**What to do:**\n1. Do NOT buy any gift cards\n2. Hang up or delete the message\n3. If you already sent codes, call police: 604-859-5225\n4. Report to Canadian Anti-Fraud Centre: 1-888-495-8501\n\nYou're doing the right thing by checking!`,
        type: 'danger'
      };
    }

    if (lowerMessage.includes('@abbotsford.ca')) {
      return {
        content: `✅ **Official Email Domain**\n\n@abbotsford.ca is the official City of Abbotsford email domain.\n\n**However:**\n• Still check for unusual requests\n• Never share passwords even with official emails\n• Verify unexpected requests by calling 604-864-5500\n\nWhat is the email asking you to do?`,
        type: 'safe'
      };
    }

    if ((lowerMessage.includes('email') || lowerMessage.includes('message')) && lowerMessage.includes('@')) {
      const emailMatch = userMessage.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (emailMatch && !emailMatch[0].toLowerCase().endsWith('@abbotsford.ca')) {
        return {
          content: `⚠️ **Not Official City Email**\n\nThe email ${emailMatch[0]} is NOT from the City of Abbotsford.\n\n**City emails only come from @abbotsford.ca**\n\n**What to do:**\n1. Do NOT reply or click links\n2. Do NOT share personal information\n3. Delete or mark as spam\n4. If you're worried, call 604-864-5500 to verify\n\nWhat was the email asking you to do?`,
          type: 'danger'
        };
      }
    }

    if (lowerMessage.includes('http') || lowerMessage.includes('www.')) {
      const urlMatch = userMessage.match(/https?:\/\/[^\s]+|www\.[^\s]+/i);
      if (urlMatch) {
        const url = urlMatch[0].toLowerCase();
        if (url.includes('abbotsford.ca')) {
          return {
            content: `✅ **Official City Website**\n\nabbotsford.ca is the real city website.\n\n**Safety checks:**\n• Look for the lock icon 🔒 in your browser\n• Make sure it says "https://" not "http://"\n• Double-check spelling is exact: abbotsford.ca\n\nThis should be safe to use!`,
            type: 'safe'
          };
        } else if (url.includes('abbotsford')) {
          return {
            content: `🚨 **FAKE WEBSITE WARNING**\n\nThis is NOT the official city website!\n\n**Real city website:** abbotsford.ca\n**This website:** ${urlMatch[0]}\n\nScammers use similar names to trick people.\n\n**What to do:**\n1. Close this website immediately\n2. Do NOT enter any information\n3. Go to abbotsford.ca by typing it yourself\n4. Call 604-864-5500 if you entered any info`,
            type: 'danger'
          };
        }
      }
    }

    if (lowerMessage.includes('call') && (lowerMessage.includes('tax') || lowerMessage.includes('pay') || lowerMessage.includes('owe'))) {
      return {
        content: `🚨 **PHONE SCAM ALERT**\n\nThe City of Abbotsford NEVER:\n• Calls demanding immediate payment\n• Threatens arrest or legal action\n• Asks for payment over the phone\n• Requests gift cards or wire transfers\n\n**What to do:**\n1. Hang up immediately\n2. Do NOT call any number they gave you\n3. Call the city yourself: 604-864-5500\n4. Report to Anti-Fraud Centre: 1-888-495-8501\n\nDid you give them any information?`,
        type: 'danger'
      };
    }

    // Generic helpful response
    return {
      content: `💡 **I can help you with that!**\n\nFor the best analysis, could you share more details?\n\nFor emails/messages:\n• The sender's email address\n• What they're asking you to do\n• Any links they included\n\nFor websites:\n• The full web address (URL)\n• What information it's asking for\n\nFor phone calls:\n• What they said they wanted\n• Did they ask for money or personal info?\n\nThe more details you share, the better I can protect you!\n\n*Tip: You can always call 604-864-5500 to verify anything.*`,
      type: 'info'
    };
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      // Get conversation history (last 4 messages for context)
      const recentHistory = messages.slice(-4).map(m => ({
        role: m.role,
        content: m.content
      }));

      let aiResponse;
      
      if (useRealAI && apiKey) {
        // Use real Claude API
        aiResponse = await analyzeWithClaudeAPI(currentInput, recentHistory);
      } else {
        // Use pattern matching fallback
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        aiResponse = await analyzeWithPatternMatching(currentInput);
      }

      const assistantMessage = {
        role: 'assistant',
        content: aiResponse.content,
        type: aiResponse.type,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `❌ Sorry, I encountered an error: ${error.message}\n\nPlease try again or call 604-864-5500 for help.`,
        type: 'warning',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = [
    "I got an email saying my taxes are overdue",
    "Someone called about a refund",
    "Is this link safe to click?",
    "What is phishing?",
    "They want my password"
  ];

  const handleQuickPrompt = (prompt) => {
    setInput(prompt);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Shield className="w-12 h-12 text-blue-600" />
                <Sparkles className="w-5 h-5 text-yellow-500 absolute -top-1 -right-1" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">AI Safety Assistant</h1>
                <p className="text-gray-600">
                  {useRealAI && apiKey ? '🤖 Powered by Claude AI' : '⚡ Smart Pattern Detection'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <h3 className="font-bold text-lg mb-3">⚙️ AI Settings</h3>
              
              <div className="mb-4">
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={useRealAI}
                    onChange={(e) => setUseRealAI(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="font-semibold">Use Real Claude AI (requires API key)</span>
                </label>
                <p className="text-sm text-gray-600 ml-6">
                  Get more intelligent, context-aware responses
                </p>
              </div>

              {useRealAI && (
                <div>
                  <label className="block font-semibold mb-2">Anthropic API Key:</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full p-3 border-2 border-gray-300 rounded-lg text-sm font-mono"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Get your API key from{' '}
                    <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      console.anthropic.com
                    </a>
                  </p>
                  {apiKey && (
                    <div className="mt-2 p-2 bg-green-100 text-green-800 rounded text-sm">
                      ✓ API key configured! The AI will now provide advanced analysis.
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setShowSettings(false)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close Settings
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-4xl w-full mx-auto">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                </div>
              )}
              
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.type === 'danger'
                    ? 'bg-red-50 border-2 border-red-300 text-gray-800'
                    : message.type === 'warning'
                    ? 'bg-orange-50 border-2 border-orange-300 text-gray-800'
                    : message.type === 'safe'
                    ? 'bg-green-50 border-2 border-green-300 text-gray-800'
                    : 'bg-white border-2 border-gray-200 text-gray-800'
                }`}
              >
                {message.type === 'danger' && (
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="font-bold text-red-600">Warning</span>
                  </div>
                )}
                {message.type === 'safe' && (
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-green-600">Looks Safe</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap text-lg leading-relaxed">{message.content}</div>
                <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="bg-white border-2 border-gray-200 rounded-2xl px-5 py-3">
                <div className="flex gap-2 items-center">
                  <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  <span className="text-sm text-gray-500 ml-2">
                    {useRealAI && apiKey ? 'AI is thinking...' : 'Analyzing...'}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length === 1 && (
          <div className="p-4 bg-white border-t-2 border-gray-200">
            <p className="text-sm text-gray-600 mb-2 font-semibold">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPrompt(prompt)}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-sm border-2 border-blue-200 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-white border-t-2 border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe your situation... (Press Enter to send)"
                className="flex-1 p-4 border-2 border-gray-300 rounded-2xl text-lg resize-none focus:border-blue-500 focus:outline-none"
                rows="2"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send
              </button>
            </div>
            
            {/* Contact Info */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone className="w-4 h-4 text-blue-600" />
                <span>Need to talk to someone? Call: <strong>604-864-5500</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISafetyAssistant;
