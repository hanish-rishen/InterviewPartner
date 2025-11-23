'use client';

import React, { useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoiceInputProps {
    onTranscript: (text: string) => void;
    isListening: boolean;
    setIsListening: (listening: boolean) => void;
    lastActivityTime?: number;
    onSpeechStart?: () => void;
    setIsUserSpeaking?: (isSpeaking: boolean) => void;
    isAISpeaking?: boolean;
    role?: string;
}

export default function VoiceInput(props: VoiceInputProps) {
    const { onTranscript, isListening, setIsListening, lastActivityTime, onSpeechStart, setIsUserSpeaking, isAISpeaking, role } = props;
    const recognitionRef = useRef<any>(null);
    const isListeningRef = useRef(isListening);
    const isAISpeakingRef = useRef(isAISpeaking);
    const [showIdleTooltip, setShowIdleTooltip] = React.useState(false);
    const transcriptBufferRef = useRef<string>('');
    const continuousModeRef = useRef(false);
    const hasAISpokenRef = useRef(false); // Track if AI has ever spoken
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastSpeechTimeRef = useRef<number>(0);
    const maxSpeechTimerRef = useRef<NodeJS.Timeout | null>(null);
    const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isStartingRef = useRef<boolean>(false);
    const userSpeakingSetRef = useRef<boolean>(false);

    useEffect(() => {
        isListeningRef.current = isListening;
    }, [isListening]);

    useEffect(() => {
        isAISpeakingRef.current = isAISpeaking;

        // If AI starts speaking, stop recognition to prevent echo
        if (isAISpeaking && recognitionRef.current) {
            hasAISpokenRef.current = true;
            try {
                recognitionRef.current.abort();
            } catch (e) { }
            if (setIsUserSpeaking) setIsUserSpeaking(false);
        }

        // If AI stops speaking and we're set to listen, restart mic
        if (!isAISpeaking && isListening && recognitionRef.current) {
            if (isStartingRef.current) {
                return;
            }

            hasAISpokenRef.current = true;
            continuousModeRef.current = true;
            isStartingRef.current = true;

            setTimeout(() => {
                try {
                    if (recognitionRef.current && isListeningRef.current && !isAISpeakingRef.current) {
                        recognitionRef.current.continuous = false;
                        recognitionRef.current.interimResults = true;
                        recognitionRef.current.start();
                    } else {
                        isStartingRef.current = false;
                    }
                } catch (e) {
                    isStartingRef.current = false;
                }
            }, 300);
        }
    }, [isAISpeaking, isListening, setIsUserSpeaking]);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false; // Will be set dynamically
            recognitionRef.current.interimResults = true; // Enable interim results for better silence detection
            recognitionRef.current.lang = 'en-US';
            recognitionRef.current.maxAlternatives = 1; // Focus on best match only

            // Try to set higher sensitivity (browser-specific, may not work everywhere)
            try {
                if ('audioContext' in recognitionRef.current) {
                    recognitionRef.current.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                }
            } catch (e) {
                // Ignore if not supported
            }

            recognitionRef.current.onstart = () => {
                isStartingRef.current = false;
                if (onSpeechStart) onSpeechStart();

                // Set a max speech duration timer (30 seconds) as a safety net
                maxSpeechTimerRef.current = setTimeout(() => {
                    if (recognitionRef.current && transcriptBufferRef.current) {
                        try {
                            recognitionRef.current.stop();
                        } catch (e) { }
                    }
                }, 30000);

                // Set a watchdog timer that checks every 3 seconds if we're stuck
                const checkStuckRecognition = () => {
                    const now = Date.now();
                    const timeSinceLastSpeech = now - lastSpeechTimeRef.current;

                    if (transcriptBufferRef.current && timeSinceLastSpeech > 3000) {
                        try {
                            recognitionRef.current?.stop();
                        } catch (e) { }
                        return;
                    }

                    watchdogTimerRef.current = setTimeout(checkStuckRecognition, 3000);
                };

                watchdogTimerRef.current = setTimeout(checkStuckRecognition, 3000);
            };

            recognitionRef.current.onresult = (event: any) => {
                if (isAISpeakingRef.current) {
                    return;
                }

                const result = event.results[event.results.length - 1];
                const transcript = result[0].transcript.trim();

                if (setIsUserSpeaking && !userSpeakingSetRef.current) {
                    setIsUserSpeaking(true);
                    userSpeakingSetRef.current = true;
                }

                lastSpeechTimeRef.current = Date.now();

                if (silenceTimerRef.current) {
                    clearTimeout(silenceTimerRef.current);
                    silenceTimerRef.current = null;
                }

                if (result.isFinal && transcript) {
                    transcriptBufferRef.current = transcript;

                    setTimeout(() => {
                        if (recognitionRef.current) {
                            try {
                                recognitionRef.current.stop();
                            } catch (e) { }
                        }
                    }, 400);
                } else {
                    if (transcript && !transcriptBufferRef.current) {
                        transcriptBufferRef.current = transcript;
                    }

                    silenceTimerRef.current = setTimeout(() => {
                        if (recognitionRef.current) {
                            try {
                                recognitionRef.current.stop();
                            } catch (e) { }
                        }
                    }, transcript ? 1200 : 800);
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                // Ignore "aborted" errors - they're expected when we stop the mic
                if (event.error === 'aborted') {
                    console.log('🎤 Speech recognition aborted (expected)');
                    return;
                }

                if (event.error === 'no-speech') {
                    if (role === 'Software Engineer') {
                        toast.info('Listening...', {
                            description: 'Speak clearly into your mic, or enable Focus Mode if coding.',
                            duration: 3000,
                        });
                    } else {
                        toast.info('Ready when you are', {
                            description: 'Please speak clearly. Check your microphone if needed.',
                            duration: 3000,
                        });
                    }
                    return;
                }

                if (event.error === 'audio-capture' || event.error === 'not-allowed') {
                    toast.error('Microphone Access Required', {
                        description: 'Please allow microphone access in your browser settings.',
                        duration: 5000,
                    });
                    isStartingRef.current = false;
                    setIsListening(false);
                    return;
                }

                isStartingRef.current = false;
                setIsListening(false);
                if (setIsUserSpeaking) setIsUserSpeaking(false);
            };

            recognitionRef.current.onend = () => {
                if (setIsUserSpeaking) setIsUserSpeaking(false);
                userSpeakingSetRef.current = false;

                if (silenceTimerRef.current) {
                    clearTimeout(silenceTimerRef.current);
                    silenceTimerRef.current = null;
                }
                if (maxSpeechTimerRef.current) {
                    clearTimeout(maxSpeechTimerRef.current);
                    maxSpeechTimerRef.current = null;
                }
                if (watchdogTimerRef.current) {
                    clearTimeout(watchdogTimerRef.current);
                    watchdogTimerRef.current = null;
                }

                const text = transcriptBufferRef.current.trim();
                if (text && !isAISpeakingRef.current) {
                    onTranscript(text);
                    transcriptBufferRef.current = '';
                } else if (!isAISpeakingRef.current && isListeningRef.current) {
                    setTimeout(() => {
                        if (recognitionRef.current && isListeningRef.current && !isAISpeakingRef.current && !isStartingRef.current) {
                            try {
                                isStartingRef.current = true;
                                recognitionRef.current.start();
                            } catch (e) {
                                isStartingRef.current = false;
                            }
                        }
                    }, 1000);
                }
            };
        }

        // Cleanup function - only run on unmount
        return () => {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            if (maxSpeechTimerRef.current) clearTimeout(maxSpeechTimerRef.current);
            if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (e) { }
            }
        };
    }, []); // Empty deps - only run on mount/unmount

    // Start/stop control - ONLY for user manual control or disabling
    useEffect(() => {
        if (!isListening) {
            // Disable listening - user explicitly turned it off
            continuousModeRef.current = false;
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (e) { }
            }
            if (setIsUserSpeaking) setIsUserSpeaking(false);
        }
        // Note: When isListening becomes true, we DON'T start here
        // The mic will ONLY start after AI finishes speaking (handled in isAISpeaking effect)
    }, [isListening, setIsUserSpeaking]);

    const getTooltipText = () => {
        if (isListening) return 'Stop Listening';
        const inactiveSeconds = (Date.now() - (lastActivityTime || Date.now())) / 1000;
        if (inactiveSeconds > 10) {
            return '🎤 Click to turn on your microphone and speak to the interviewer';
        }
        return 'Start Listening';
    };

    return (
        <div className="relative">
            {showIdleTooltip && (
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 p-2 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg text-center z-50 animate-in fade-in slide-in-from-bottom-2 border border-border">
                    Microphone turned off due to inactivity. Click to resume.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover" />
                </div>
            )}
            <button
                onClick={() => {
                    setIsListening(!isListening);
                    setShowIdleTooltip(false);
                }}
                className={cn(
                    "relative p-4 rounded-xl transition-all duration-300 flex items-center justify-center",
                    isListening
                        ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20"
                        : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                )}
                title={getTooltipText()}
            >
                {isListening && (
                    <span className="absolute inset-0 rounded-xl animate-ping bg-destructive/20" />
                )}
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
        </div>
    );
}
