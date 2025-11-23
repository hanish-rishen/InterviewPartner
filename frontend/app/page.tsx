'use client';

import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Sparkles, StopCircle, Mic, Video, VideoOff } from 'lucide-react';
import VoiceInput from '@/components/VoiceInput';
import FeedbackPanel from '@/components/FeedbackPanel';
import UserVideo from '@/components/UserVideo';
import InterviewerVideo from '@/components/InterviewerVideo';
import CodeEditor from '@/components/CodeEditor';
import InstructionsDialog from '@/components/InstructionsDialog';
import { sendChatMessage, getFeedback, ChatResponse } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'agent';
  content: string;
}

export default function Home() {
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [role, setRole] = useState<string>('');
  const [preferredLanguage, setPreferredLanguage] = useState<string>('Python');
  const [code, setCode] = useState<string>('');
  const [codeLanguage, setCodeLanguage] = useState<string>('javascript');
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState<number>(30);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());
  const [showInstructions, setShowInstructions] = useState(false);

  const isInterviewActiveRef = useRef(false);
  const codeRef = useRef<string>(''); // Keep latest code value in ref for reliable access
  const codeLanguageRef = useRef<string>('javascript');

  const [isInterviewActive, setIsInterviewActive] = useState(false);

  useEffect(() => {
    setSessionId(uuidv4());
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || !isInterviewActive) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          handleEndInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, isInterviewActive]);

  // Track activity for mic tooltip
  useEffect(() => {
    if (isListening || isLoading) {
      setLastActivityTime(Date.now());
    }
  }, [isListening, isLoading]);

  const lastActivityTimeRef = useRef<number>(Date.now());
  const lastCodeChangeTime = useRef<number>(Date.now());
  const lastUserSpeechTime = useRef<number>(Date.now());

  // Proactive AI Check-in
  useEffect(() => {
    if (!isInterviewActive || role !== 'Software Engineer') return;

    const checkInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceCode = now - lastCodeChangeTime.current;
      const timeSinceSpeech = now - lastUserSpeechTime.current;

      // If user has been coding recently (< 1 min ago) but hasn't spoken for > 2 mins
      // And AI is not currently speaking or loading
      // AND Focus Mode is NOT active (user wants to code without interruptions)
      if (timeSinceCode < 60000 && timeSinceSpeech > 120000 && !isSpeaking && !isLoading && !isListening && !isFocusMode) {
        lastUserSpeechTime.current = now;
        const systemMessage = `[SYSTEM: User has been coding silently for 2 minutes. Current code:\n\`\`\`${codeLanguageRef.current}\n${codeRef.current}\n\`\`\`\nAsk a brief, specific question about their implementation progress.]`;
        handleSendMessage(systemMessage, true);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkInterval);
  }, [isInterviewActive, role, isSpeaking, isLoading, isListening, code, codeLanguage, isFocusMode]);

  useEffect(() => {
    isInterviewActiveRef.current = isInterviewActive;
  }, [isInterviewActive]);

  // Keep code ref in sync with state
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    codeLanguageRef.current = codeLanguage;
  }, [codeLanguage]);

  // Auto-end session after 3 minutes of inactivity
  useEffect(() => {
    if (!isInterviewActive || isFocusMode) return;

    const checkInactivity = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityTime;
      const threeMinutes = 3 * 60 * 1000; // 180000ms

      // Auto-end session at 3 minutes of inactivity
      if (timeSinceActivity >= threeMinutes) {
        handleEndInterview();
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkInactivity);
  }, [isInterviewActive, lastActivityTime, isFocusMode]);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const handleUserSpeechStart = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const speakResponse = (text: string) => {
    // Filter out code blocks and special markers to prevent reading code
    let textToSpeak = text.replace(/\[CODING_QUESTION_START\][\s\S]*?\[CODING_QUESTION_END\]/g, '');
    // Also remove any standalone code blocks if they exist outside the markers
    textToSpeak = textToSpeak.replace(/```[\s\S]*?```/g, '');
    textToSpeak = textToSpeak.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove bold markers

    // If text is empty after filtering (e.g. just code), say something generic
    if (!textToSpeak.trim()) {
      textToSpeak = "I've updated the code editor. Please take a look.";
    }

    const speak = () => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utteranceRef.current = utterance; // Prevent garbage collection

      // Try to select a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha') || v.lang === 'en-US');
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => setIsSpeaking(true);

      const handleEnd = () => {
        setIsSpeaking(false);
        // Auto-enable listening after AI finishes speaking (if interview is active)
        if (isInterviewActiveRef.current) {
          setIsListening(true);
        }
      };

      utterance.onend = handleEnd;

      utterance.onerror = (event) => {
        // Ignore interruption errors which happen frequently when cancelling
        if (event.error === 'interrupted' || event.error === 'canceled') {
          setIsSpeaking(false);
          return;
        }
        console.error('Speech synthesis error:', event);
        handleEnd();
      };

      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = speak;
    } else {
      speak();
    }
  };

  const handleSendMessage = async (text: string, isHidden: boolean = false) => {
    if (!text.trim()) return;

    // Use refs for latest values (state might be stale in async callbacks)
    const currentCode = codeRef.current;
    const currentLanguage = codeLanguageRef.current;

    if (!isHidden) {
      lastUserSpeechTime.current = Date.now();
    }

    // For Software Engineer, append code context to the message
    let messageWithContext = text;
    if (role === 'Software Engineer' && currentCode.trim() && !isHidden) {
      messageWithContext = `${text}\n\n[Current Code in Editor]:\n\`\`\`${currentLanguage}\n${currentCode}\n\`\`\``;
    }

    const newMessages: Message[] = isHidden ? messages : [...messages, { role: 'user', content: text }];
    if (!isHidden) {
      setMessages(newMessages);
    }
    setInput('');
    setIsLoading(true);

    try {
      const data = await sendChatMessage(messageWithContext, sessionId, role || undefined);
      setMessages([...newMessages, { role: 'agent', content: data.response }]);

      // For Software Engineer: Extract and paste coding question into editor
      if (role === 'Software Engineer') {
        const codingQuestionMatch = data.response.match(/\[CODING_QUESTION_START\]([\s\S]*?)\[CODING_QUESTION_END\]/);
        if (codingQuestionMatch) {
          const questionContent = codingQuestionMatch[1];

          const codeMatch = questionContent.match(/```(\w+)?\s*([\s\S]*?)```/);
          if (codeMatch) {
            const extractedCode = codeMatch[2].trim();
            const language = codeMatch[1]?.toLowerCase() || preferredLanguage.toLowerCase();

            // Extract question details to prepopulate as comments
            const titleMatch = questionContent.match(/\*\*Problem Title:\*\*\s*(.+)/);
            const descMatch = questionContent.match(/\*\*Description:\*\*\s*([\s\S]*?)(?=\*\*Example:|```)/);
            const exampleMatch = questionContent.match(/\*\*Example:\*\*\s*([\s\S]*?)(?=\*\*Constraints:|```)/);
            const constraintsMatch = questionContent.match(/\*\*Constraints:\*\*\s*([\s\S]*?)(?=\*\*Starter Code:|```)/);

            // Normalize language for Monaco Editor
            let normalizedLang = language;
            if (language === 'c++' || language === 'cpp') normalizedLang = 'cpp';
            else if (language === 'c#' || language === 'csharp') normalizedLang = 'csharp';
            else if (language === 'js' || language === 'javascript') normalizedLang = 'javascript';
            else if (language === 'ts' || language === 'typescript') normalizedLang = 'typescript';
            else if (language === 'py' || language === 'python') normalizedLang = 'python';

            // Determine comment prefix
            const commentPrefix = (normalizedLang === 'python' || normalizedLang === 'ruby' || normalizedLang === 'perl') ? '#' : '//';

            // Build the full code with question as comments
            let fullCode = '';
            if (titleMatch) fullCode += `${commentPrefix} ${titleMatch[1].trim()}\n${commentPrefix}\n`;
            if (descMatch) {
              const desc = descMatch[1].trim().replace(/\n/g, `\n${commentPrefix} `);
              fullCode += `${commentPrefix} ${desc}\n${commentPrefix}\n`;
            }
            if (exampleMatch) {
              const example = exampleMatch[1].trim().replace(/\n/g, `\n${commentPrefix} `);
              fullCode += `${commentPrefix} Example:\n${commentPrefix} ${example}\n${commentPrefix}\n`;
            }
            if (constraintsMatch) {
              const constraints = constraintsMatch[1].trim().replace(/\n/g, `\n${commentPrefix} `);
              fullCode += `${commentPrefix} Constraints:\n${commentPrefix} ${constraints}\n\n`;
            }
            fullCode += extractedCode;

            setCode(fullCode);
            setCodeLanguage(normalizedLang);
          }
        }
      }

      speakResponse(data.response);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages([...newMessages, { role: 'agent', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartInterview = async () => {
    setIsInterviewActive(true);
    setIsLoading(true);
    setIsSpeaking(false);
    if (timerMinutes > 0) {
      setTimeRemaining(timerMinutes * 60);
    }

    // Set initial code language
    if (role === 'Software Engineer') {
      let normalizedLang = preferredLanguage.toLowerCase();
      if (normalizedLang === 'c++' || normalizedLang === 'cpp') normalizedLang = 'cpp';
      else if (normalizedLang === 'c#' || normalizedLang === 'csharp') normalizedLang = 'csharp';
      else if (normalizedLang === 'js' || normalizedLang === 'javascript') normalizedLang = 'javascript';
      else if (normalizedLang === 'ts' || normalizedLang === 'typescript') normalizedLang = 'typescript';
      else if (normalizedLang === 'py' || normalizedLang === 'python') normalizedLang = 'python';
      setCodeLanguage(normalizedLang);
    }

    try {
      const initialMessage = role === 'Software Engineer'
        ? `Hi, I'm here for the ${role} interview. I'll be coding in ${preferredLanguage}.`
        : `Hi, I'm here for the ${role} interview.`;

      const data = await sendChatMessage(
        initialMessage,
        sessionId,
        role || undefined
      );

      setMessages([{ role: 'agent', content: data.response }]);

      // Show instructions dialog only for Software Engineer role
      if (role === 'Software Engineer') {
        setShowInstructions(true);
      } else {
        // For other roles, start speaking immediately
        setIsListening(true);
        speakResponse(data.response);
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      setMessages([{ role: 'agent', content: 'Hello! Welcome to the interview. Please tell me about yourself.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndInterview = async () => {
    window.speechSynthesis.cancel();
    setIsListening(false);
    setIsInterviewActive(false);
    setIsSpeaking(false);
    setTimeRemaining(null);

    setFeedback('');
    setIsLoading(true);

    try {
      const data = await getFeedback(sessionId);
      if (data.feedback) {
        setFeedback(data.feedback);
      }
    } catch (error) {
      console.error('Error getting feedback:', error);
      setFeedback('Unable to generate feedback at this time. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetInterview = () => {
    setFeedback(null);
    setMessages([]);
    setInput('');
    setCode('');
    setSessionId(uuidv4());
    setIsInterviewActive(false);
    setIsSpeaking(false);
    setTimeRemaining(null);
  };

  const resetSession = () => {
    setSessionId(uuidv4());
    setMessages([]);
    setFeedback(null);
    setRole('');
    setIsListening(false);
    setIsInterviewActive(false);
    setCode('');
  };

  const handleInstructionsClose = () => {
    setShowInstructions(false);

    // After closing instructions, start the AI speaking
    if (isInterviewActive && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'agent') {
        speakResponse(lastMessage.content);
        // Don't set listening yet - let it auto-enable after AI finishes speaking
      }
    }
  };  return (
    <main className="min-h-screen flex flex-col items-center p-4 md:p-6 max-w-[1600px] mx-auto h-screen">
      {/* Instructions Dialog */}
      <InstructionsDialog
        isOpen={showInstructions}
        onClose={handleInstructionsClose}
        mode="voice"
      />

      {/* Header */}
      <header className="w-full mb-2 md:mb-4 flex flex-col md:flex-row justify-between items-center gap-2 md:gap-4 shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="text-primary-foreground w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Interview<span className="text-primary/60">Partner</span></h1>
          </div>
        </div>

        {/* Status Indicator - Center of header */}
        {isInterviewActive && (
          <div className="flex items-center gap-2 md:gap-3 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 backdrop-blur-md px-3 py-2 md:px-6 md:py-3 rounded-full border-2 border-primary/20 shadow-lg">
            <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${isSpeaking ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50' :
              isListening ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50' :
                isFocusMode ? 'bg-amber-500 animate-pulse shadow-lg shadow-amber-500/50' :
                  'bg-muted-foreground'
              }`} />
            <span className="text-xs md:text-base font-bold">
              {isSpeaking ? '🤖 AI Speaking...' :
                isListening ? '🎤 Listening...' :
                  isFocusMode ? '🎯 Focus Mode' :
                    '💬 Your turn'}
            </span>
          </div>
        )}

        {/* Right side - Focus Mode, Timer and End Session */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 justify-center md:justify-end w-full md:w-auto">
          {isInterviewActive && (
            <>
              {/* Focus Mode Button (for Software Engineer) */}
              {role === 'Software Engineer' && (
                <button
                  onClick={() => {
                    const newFocusMode = !isFocusMode;
                    setIsFocusMode(newFocusMode);
                    if (newFocusMode) {
                      // Entering focus mode
                      setIsListening(false);
                      window.speechSynthesis.cancel();
                    } else {
                      // Exiting focus mode - resume listening
                      if (isInterviewActive) {
                        setTimeout(() => {
                          setIsListening(true);
                        }, 500);
                      }
                    }
                  }}
                  className={cn(
                    "px-3 py-2 md:px-5 md:py-2.5 rounded-full flex items-center gap-1.5 md:gap-2 transition-all font-semibold text-xs md:text-sm ring-2",
                    isFocusMode
                      ? "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/50 ring-amber-400/50 animate-pulse"
                      : "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-foreground hover:from-amber-500/30 hover:to-orange-500/30 shadow-md ring-amber-500/30 border border-amber-500/40"
                  )}
                  title="Focus Mode: Pause AI interruptions while you code. You won't be disturbed until you turn this off."
                >
                  <span className="text-sm md:text-base">🎯</span>
                  <span className="hidden sm:inline">{isFocusMode ? 'Exit Focus' : 'Focus Mode'}</span>
                  <span className="sm:hidden">{isFocusMode ? 'Exit' : 'Focus'}</span>
                </button>
              )}
              {/* Timer Display */}
              {timeRemaining !== null && (
                <div className="flex items-center gap-1.5 md:gap-2 bg-background/95 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-border shadow-sm">
                  <span className="text-xs md:text-sm font-semibold">
                    ⏱️ {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
              <button
                onClick={handleEndInterview}
                className="flex items-center gap-1.5 md:gap-2 px-3 py-2 md:px-5 md:py-2.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-semibold text-xs md:text-sm transition-all shadow-lg hover:shadow-xl ring-2 ring-destructive/20"
                title="Click to end the interview session"
              >
                <StopCircle size={16} className="md:w-5 md:h-5" />
                <span className="hidden sm:inline">End Session</span>
                <span className="sm:hidden">End</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="w-full flex-1 min-h-0 flex flex-col bg-card rounded-3xl shadow-xl border border-border/50 overflow-hidden relative">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))] pointer-events-none" />

        {/* --- VOICE MODE LAYOUT --- */}
        <div className="relative flex-1 flex flex-col min-h-0 z-10 bg-background/95">
            {!isInterviewActive ? (
              /* Start Screen */
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse shrink-0">
                  <Mic size={36} className="text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-center">Ready for your interview?</h2>
                <p className="text-muted-foreground max-w-md text-center text-sm">
                  Ensure your microphone is working. You will be speaking directly with the AI interviewer.
                </p>

                <div className="flex flex-col items-center gap-4 w-full max-w-lg">
                  {/* Role Selector */}
                  <div className="space-y-2 flex flex-col items-center w-full">
                    <label className="text-sm font-medium text-muted-foreground">Select Your Role</label>
                    <div className="relative w-full max-w-xs">
                      <select
                        className="w-full p-3 pl-4 pr-10 rounded-xl border border-border bg-card text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none transition-all cursor-pointer hover:bg-muted/50"
                        onChange={(e) => setRole(e.target.value)}
                        value={role}
                      >
                        <option value="">Select Role</option>
                        <option value="Sales Representative">Sales Representative</option>
                        <option value="Software Engineer">Software Engineer</option>
                        <option value="Product Manager">Product Manager</option>
                        <option value="Retail Associate">Retail Associate</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Duration and Language Controls */}
                  <div className="flex flex-wrap items-center justify-center gap-4 w-full">
                    <div className="space-y-1.5 flex flex-col items-center">
                      <label className="text-xs font-medium text-muted-foreground">Duration (min)</label>
                      <input
                        type="number"
                        min="5"
                        max="120"
                        value={timerMinutes}
                        onChange={(e) => setTimerMinutes(parseInt(e.target.value) || 30)}
                        className="w-20 p-2 rounded-lg border border-border bg-background text-center text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>

                    {role === 'Software Engineer' && (
                      <div className="space-y-1.5 flex flex-col items-center">
                        <label className="text-xs font-medium text-muted-foreground">Language</label>
                        <select
                          value={preferredLanguage}
                          onChange={(e) => setPreferredLanguage(e.target.value)}
                          className="w-28 p-2 rounded-lg border border-border bg-background text-center text-sm focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                        >
                          <option value="Python">Python</option>
                          <option value="JavaScript">JavaScript</option>
                          <option value="Java">Java</option>
                          <option value="C++">C++</option>
                          <option value="C#">C#</option>
                          <option value="Go">Go</option>
                          <option value="TypeScript">TypeScript</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleStartInterview}
                  disabled={!role}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-medium shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {role ? "Start Interview" : "Select a Role First"}
                </button>
              </div>
            ) : (
              /* Active Call Layout */
              <div className="flex-1 flex flex-col p-2 md:p-4 gap-2 md:gap-4 min-h-0">
                <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2 md:gap-4">
                  {role === 'Software Engineer' ? (
                    /* Software Engineer Layout: Code Left, Videos Right */
                    <>
                      <div className="flex-1 lg:flex-[3] rounded-xl md:rounded-2xl overflow-hidden border border-border shadow-sm bg-card relative min-h-[300px] lg:min-h-0">
                        <div className="h-full">
                          <CodeEditor
                            code={code}
                            onChange={(val) => {
                              setCode(val || '');
                              lastCodeChangeTime.current = Date.now();
                            }}
                            language={codeLanguage}
                            onLanguageChange={setCodeLanguage}
                          />
                        </div>
                      </div>
                      <div className="flex lg:flex-1 flex-row lg:flex-col gap-2 md:gap-4 lg:min-w-[280px] lg:max-w-[400px]">
                        <div className={`flex-1 lg:aspect-square relative rounded-xl md:rounded-2xl overflow-hidden shadow-lg transition-all ${isSpeaking ? 'ring-2 md:ring-4 ring-green-500 ring-offset-2 md:ring-offset-4 ring-offset-background' : 'border border-border/50'
                          } bg-black/5`}>
                          <InterviewerVideo isSpeaking={isSpeaking} />
                        </div>
                        <div className={`flex-1 lg:aspect-square relative rounded-xl md:rounded-2xl overflow-hidden shadow-lg transition-all ${isUserSpeaking ? 'ring-2 md:ring-4 ring-green-500 ring-offset-1 md:ring-offset-2 ring-offset-background' : 'border border-border/50'
                          } bg-black/5`}>
                          <UserVideo isVideoOn={isVideoOn} />
                          {/* Video Toggle Button on User Video */}
                          <button
                            onClick={() => setIsVideoOn(!isVideoOn)}
                            className={cn(
                              "absolute bottom-2 right-2 md:bottom-3 md:right-3 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all shadow-lg z-10",
                              isVideoOn
                                ? "bg-muted/90 backdrop-blur-sm text-foreground hover:bg-muted"
                                : "bg-destructive/90 backdrop-blur-sm text-destructive-foreground hover:bg-destructive"
                            )}
                            title={isVideoOn ? "Turn off camera" : "Turn on camera"}
                          >
                            {isVideoOn ? <Video size={16} className="md:w-5 md:h-5" /> : <VideoOff size={16} className="md:w-5 md:h-5" />}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Standard Layout: AI Left, User Right */
                    <div className="flex flex-col md:flex-row gap-3 md:gap-6 items-center justify-center h-full w-full p-2 md:p-4">
                      <div className={`w-full md:flex-1 md:max-w-xl aspect-video relative rounded-xl md:rounded-2xl overflow-hidden shadow-lg transition-all ${isSpeaking ? 'ring-2 md:ring-4 ring-green-500 ring-offset-1 md:ring-offset-2 ring-offset-background' : 'border border-border/50'
                        } bg-black/5`}>
                        <InterviewerVideo isSpeaking={isSpeaking} />
                      </div>
                      <div className={`w-full md:flex-1 md:max-w-xl aspect-video relative rounded-xl md:rounded-2xl overflow-hidden shadow-lg transition-all ${isUserSpeaking ? 'ring-2 md:ring-4 ring-green-500 ring-offset-2 md:ring-offset-4 ring-offset-background' : 'border border-border/50'
                        } bg-black/5`}>
                        <UserVideo isVideoOn={isVideoOn} />
                        {/* Video Toggle Button on User Video */}
                        <button
                          onClick={() => setIsVideoOn(!isVideoOn)}
                          className={cn(
                            "absolute bottom-3 right-3 md:bottom-4 md:right-4 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all shadow-lg z-10",
                            isVideoOn
                              ? "bg-muted/90 backdrop-blur-sm text-foreground hover:bg-muted"
                              : "bg-destructive/90 backdrop-blur-sm text-destructive-foreground hover:bg-destructive"
                          )}
                          title={isVideoOn ? "Turn off camera" : "Turn on camera"}
                        >
                          {isVideoOn ? <Video size={20} className="md:w-6 md:h-6" /> : <VideoOff size={20} className="md:w-6 md:h-6" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Hidden VoiceInput to handle the logic */}
                <div className="hidden">
                  <VoiceInput
                    onTranscript={handleSendMessage}
                    isListening={isListening}
                    setIsListening={setIsListening}
                    lastActivityTime={lastActivityTime}
                    onSpeechStart={handleUserSpeechStart}
                    setIsUserSpeaking={setIsUserSpeaking}
                    isAISpeaking={isSpeaking}
                    role={role}
                  />
                </div>
              </div>
            )}
          </div>
      </div>

      {feedback !== null && (
        <FeedbackPanel feedback={feedback} isLoading={isLoading} onClose={resetSession} />
      )}
    </main>
  );
}
