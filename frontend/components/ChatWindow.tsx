'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

interface Message {
    role: 'user' | 'agent';
    content: string;
}

interface ChatWindowProps {
    messages: Message[];
    isLoading: boolean;
}

export default function ChatWindow({ messages, isLoading }: ChatWindowProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
            <AnimatePresence initial={false}>
                {messages.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center h-full text-center space-y-4 text-muted-foreground mt-12"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
                            <Bot className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">Ready to practice?</h3>
                        <p className="max-w-sm text-sm">
                            Select a role above or just say "Hello" to start your mock interview session.
                        </p>
                    </motion.div>
                )}

                {messages.map((msg, index) => (
                    <motion.div
                        key={`msg-${index}-${msg.role}-${Date.now()}`}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className={cn(
                            "flex w-full",
                            msg.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                    >
                        <div className={cn(
                            "flex max-w-[85%] md:max-w-[75%] gap-3",
                            msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                        )}>
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                                msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                            )}>
                                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                            </div>

                            <div className={cn(
                                "p-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed",
                                msg.role === 'user'
                                    ? "bg-primary text-primary-foreground rounded-tr-none"
                                    : "bg-card border border-border text-card-foreground rounded-tl-none"
                            )}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start w-full"
                    >
                        <div className="flex max-w-[85%] gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0 mt-1">
                                <Bot size={16} />
                            </div>
                            <div className="bg-card border border-border p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                                <motion.div
                                    className="w-2 h-2 bg-primary/40 rounded-full"
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                                />
                                <motion.div
                                    className="w-2 h-2 bg-primary/40 rounded-full"
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                                />
                                <motion.div
                                    className="w-2 h-2 bg-primary/40 rounded-full"
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
        </div>
    );
}
