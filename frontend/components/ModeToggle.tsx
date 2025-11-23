'use client';

import React from 'react';
import { MessageSquare, Mic } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ModeToggleProps {
    mode: 'chat' | 'voice';
    onModeChange: (mode: 'chat' | 'voice') => void;
}

export default function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
    return (
        <div className="bg-secondary/50 p-1 rounded-xl flex items-center gap-1 border border-border/50">
            <button
                onClick={() => onModeChange('chat')}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all relative z-10",
                    mode === 'chat' ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
            >
                <MessageSquare size={16} />
                <span>Chat</span>
                {mode === 'chat' && (
                    <motion.div
                        layoutId="activeMode"
                        className="absolute inset-0 bg-primary rounded-lg -z-10 shadow-sm"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                )}
            </button>
            <button
                onClick={() => onModeChange('voice')}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all relative z-10",
                    mode === 'voice' ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
            >
                <Mic size={16} />
                <span>Voice</span>
                {mode === 'voice' && (
                    <motion.div
                        layoutId="activeMode"
                        className="absolute inset-0 bg-primary rounded-lg -z-10 shadow-sm"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                )}
            </button>
        </div>
    );
}
