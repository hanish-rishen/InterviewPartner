'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface InterviewerVideoProps {
    isSpeaking: boolean;
}

export default function InterviewerVideo({ isSpeaking }: InterviewerVideoProps) {
    return (
        <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl overflow-hidden shadow-lg border border-border/50 flex items-center justify-center">
            {/* Ghibli Avatar */}
            <div className="relative">
                <div className={`w-40 h-40 rounded-full overflow-hidden shadow-2xl z-10 relative ${isSpeaking ? 'ring-4 ring-primary/50' : ''} transition-all`}>
                    <Image
                        src="/interviewer-neutral.png"
                        alt="AI Interviewer"
                        width={160}
                        height={160}
                        className="object-cover"
                        priority
                    />
                </div>

                {/* Speaking Waves */}
                {isSpeaking && (
                    <>
                        <motion.div
                            className="absolute inset-0 rounded-full bg-primary/20"
                            animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <motion.div
                            className="absolute inset-0 rounded-full bg-primary/10"
                            animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                        />
                    </>
                )}
            </div>

            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-medium">
                AI Interviewer
            </div>
        </div>
    );
}
