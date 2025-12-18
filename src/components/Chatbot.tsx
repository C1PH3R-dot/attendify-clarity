import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, RotateCcw, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const STORAGE_KEY = "attendify_chat_history";
const INACTIVITY_TIMEOUT = 15000; // 15 seconds

// Common typo/slang corrections
const typoCorrections: Record<string, string> = {
  "wrkng": "working",
  "hrs": "hours",
  "abt": "about",
  "mins": "minutes",
  "pls": "please",
  "plz": "please",
  "thx": "thanks",
  "thnx": "thanks",
  "atndnce": "attendance",
  "attndnce": "attendance",
  "calc": "calculate",
  "prcntg": "percentage",
  "clsses": "classes",
  "rcvry": "recovery",
};

// Intent clarification patterns
const clarificationPatterns = [
  { pattern: /attendance\s*(issue|problem|help)/i, response: "I'd be happy to help with your attendance! Could you tell me more specifically what you need:\n• Calculate your current attendance percentage?\n• Plan how to recover from low attendance?\n• Understand the minimum requirement?" },
  { pattern: /^(help|hi|hello|hey)$/i, response: "Hello! I'm the Attendify Assistant. I can help you with:\n• Calculating your attendance percentage\n• Understanding if you're at risk\n• Planning attendance recovery\n• Calculating your overall marks percentage\n\nWhat would you like to know?" },
];

// Response patterns
const responsePatterns: Array<{ pattern: RegExp; response: string }> = [
  { pattern: /how.*(calculate|check).*(attendance|percentage)/i, response: "To calculate your attendance percentage:\n1. Go to the **Attendance Calculator** tab\n2. Enter the total number of classes conducted\n3. Enter the number of classes you attended\n4. Set your minimum required percentage (usually 75%)\n\nThe calculator will instantly show your current percentage and whether you're safe or at risk." },
  { pattern: /(what|how much).*(minimum|required).*(attendance|percentage)/i, response: "The minimum required attendance varies by institution, but most commonly it's **75%**. This means you need to attend at least 75 out of every 100 classes to be eligible for exams.\n\nYou can adjust this value in any of our calculators if your institution has different requirements." },
  { pattern: /(how|can).*(recover|improve).*(attendance)/i, response: "To plan your attendance recovery:\n1. Go to the **Attendance Planner** tab\n2. Enter your current attendance details\n3. The tool will calculate exactly how many consecutive classes you need to attend to reach the required percentage\n\nRemember: Recovery is only possible if you haven't fallen too far behind. The planner will tell you honestly if recovery is mathematically possible." },
  { pattern: /(safe|at risk|eligible|shortage)/i, response: "Your attendance status depends on your current percentage compared to the requirement:\n\n• **Safe**: Your percentage is above the requirement. You may be able to skip some classes.\n• **Warning**: You're close to the minimum. Be careful!\n• **Critical**: You're below the requirement and need to attend classes consecutively to recover.\n\nUse the Attendance Calculator to check your exact status." },
  { pattern: /(skip|miss|absent|leave)/i, response: "The number of classes you can safely skip depends on your current attendance.\n\nUse the **Attendance Calculator** - if you're 'Safe', it will show exactly how many more classes you can skip while staying above the minimum requirement.\n\nIf you're already at risk, I'd recommend attending all remaining classes!" },
  { pattern: /(marks|percentage|grade|score|cgpa)/i, response: "To calculate your overall percentage:\n1. Go to the **Marks Calculator** tab\n2. Add each subject with its total marks and obtained marks\n3. The calculator shows your overall percentage instantly\n\nFormula: (Total Obtained / Total Maximum) × 100" },
  { pattern: /(week|time|duration|hours|minutes)/i, response: "In the **Attendance Planner**, you can enter your weekly class duration in both hours and minutes for accurate recovery time estimation.\n\nFor example, if you have 3 hours and 30 minutes of classes per week, enter:\n• Hours/Week: 3\n• Minutes/Week: 30\n\nThis helps calculate how many weeks it will take to recover your attendance." },
  { pattern: /(thank|thanks|thx|thnx)/i, response: "You're welcome! Feel free to ask if you have any more questions about attendance or marks calculation. Good luck with your studies! 📚" },
];

const defaultResponse = "I'm here to help with attendance calculations, recovery planning, and marks percentage. Could you please be more specific about what you'd like to know?\n\nYou can ask me about:\n• How to calculate attendance\n• Understanding risk levels\n• Planning recovery\n• Calculating marks percentage";

const correctTypos = (text: string): string => {
  let corrected = text.toLowerCase();
  Object.entries(typoCorrections).forEach(([typo, correction]) => {
    const regex = new RegExp(`\\b${typo}\\b`, 'gi');
    corrected = corrected.replace(regex, correction);
  });
  return corrected;
};

const getResponse = (userMessage: string): string => {
  const correctedMessage = correctTypos(userMessage);
  
  // Check clarification patterns first
  for (const { pattern, response } of clarificationPatterns) {
    if (pattern.test(correctedMessage)) {
      return response;
    }
  }
  
  // Check response patterns
  for (const { pattern, response } of responsePatterns) {
    if (pattern.test(correctedMessage)) {
      return response;
    }
  }
  
  // Check for frustrated language
  if (/(\!{2,}|angry|frustrated|annoyed|confused|dont understand|don't understand)/i.test(userMessage)) {
    return "I understand this can be confusing. Let me help simplify things.\n\nPlease tell me what you're trying to do:\n1. Check your current attendance status?\n2. Plan how to recover from low attendance?\n3. Calculate your marks percentage?\n\nI'll guide you step by step.";
  }
  
  return defaultResponse;
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed);
        if (parsed.length > 0) {
          setShowWelcomeBack(true);
        }
      } catch (e) {
        console.error("Failed to parse chat history");
      }
    }
  }, []);

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Inactivity handler
  useEffect(() => {
    if (!isOpen || messages.length === 0) return;

    const resetTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === "user") {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: "assistant",
            content: "Still there? Here are some things I can help with:\n• Calculate attendance percentage\n• Check recovery options\n• Calculate marks percentage\n\nJust type your question!",
            timestamp: Date.now(),
          }]);
        }
      }, INACTIVITY_TIMEOUT);
    };

    resetTimer();

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isOpen, messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    setShowWelcomeBack(false);

    // Simulate typing delay
    setTimeout(() => {
      const response = getResponse(input.trim());
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 800 + Math.random() * 500);
  };

  const handleNewChat = () => {
    setMessages([]);
    setShowWelcomeBack(false);
    localStorage.removeItem(STORAGE_KEY);
    
    // Add initial greeting
    setTimeout(() => {
      setMessages([{
        id: Date.now().toString(),
        role: "assistant",
        content: "Hi! I'm the Attendify Assistant. I can help you with attendance calculations, recovery planning, and marks percentage.\n\nWhat would you like to know?",
        timestamp: Date.now(),
      }]);
    }, 300);
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      setMessages([{
        id: Date.now().toString(),
        role: "assistant",
        content: "Hi! I'm the Attendify Assistant. I can help you with attendance calculations, recovery planning, and marks percentage.\n\nWhat would you like to know?",
        timestamp: Date.now(),
      }]);
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => isOpen ? setIsOpen(false) : handleOpen()}
        className={`
          fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full 
          bg-primary text-primary-foreground shadow-lg
          flex items-center justify-center
          hover:scale-105 transition-all duration-300
          ${isOpen ? 'rotate-0' : 'animate-pulse'}
        `}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[350px] max-w-[calc(100vw-3rem)] animate-slide-in">
          <div className="glass-strong rounded-2xl overflow-hidden shadow-2xl border border-border/50 backdrop-blur-xl bg-background/80">
            {/* Header */}
            <div className="bg-primary/10 backdrop-blur-sm px-4 py-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">Attendify Assistant</h3>
                    <p className="text-xs text-muted-foreground">Ask about attendance & marks</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewChat}
                  className="h-8 px-2 text-xs"
                  title="Start New Chat"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  New
                </Button>
              </div>
            </div>

            {/* Welcome back banner */}
            {showWelcomeBack && messages.length > 1 && (
              <div className="px-4 py-2 bg-primary/5 border-b border-border/50">
                <p className="text-xs text-primary">Welcome back! Your previous conversation is restored.</p>
              </div>
            )}

            {/* Messages */}
            <div className="h-[320px] overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`
                      max-w-[85%] rounded-2xl px-4 py-2.5 text-sm
                      ${message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted/80 text-foreground rounded-bl-md"
                      }
                    `}
                  >
                    <p className="whitespace-pre-line leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted/80 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Attendify Assistant is responding…</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border/50 bg-background/50">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your question..."
                  className="flex-1 bg-background/50 border-border/50 text-sm"
                  disabled={isTyping}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isTyping}
                  className="shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
