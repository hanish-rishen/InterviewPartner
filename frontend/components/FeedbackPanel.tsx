'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { X, CheckCircle2, Loader2 } from 'lucide-react';

interface FeedbackPanelProps {
    feedback: string | null;
    isLoading?: boolean;
    onClose: () => void;
}

export default function FeedbackPanel({ feedback, isLoading = false, onClose }: FeedbackPanelProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl md:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] md:max-h-[85vh] overflow-hidden flex flex-col"
            >
                <div className="p-4 md:p-6 border-b border-border flex justify-between items-center bg-primary/5 dark:bg-primary/10">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="p-1.5 md:p-2 bg-primary/20 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-foreground">Session Analysis</h2>
                            <p className="text-xs text-muted-foreground hidden sm:block">
                                {isLoading ? 'Analyzing your performance...' : 'AI-generated performance review'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X size={18} className="md:w-5 md:h-5" />
                    </button>
                </div>

                <div className="p-4 md:p-6 overflow-y-auto flex-1 min-h-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center gap-3 md:gap-4 py-8 md:py-12">
                            <Loader2 className="w-10 h-10 md:w-12 md:h-12 text-primary animate-spin" />
                            <div className="text-center space-y-1.5 md:space-y-2 px-4">
                                <p className="text-base md:text-lg font-medium">Analyzing Your Interview...</p>
                                <p className="text-xs md:text-sm text-muted-foreground max-w-md">
                                    Our AI is carefully reviewing your responses, evaluating your communication skills,
                                    technical knowledge, and overall performance. This may take a moment.
                                </p>
                            </div>
                        </div>
                    ) : feedback ? (
                        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-black dark:prose-headings:text-black prose-h2:text-base md:prose-h2:text-lg prose-h3:text-sm md:prose-h3:text-base prose-p:text-sm md:prose-p:text-base prose-p:text-foreground/90 prose-li:text-sm md:prose-li:text-base prose-li:text-foreground/90 prose-strong:text-foreground prose-code:text-black dark:prose-code:text-black prose-code:bg-gray-100 dark:prose-code:bg-gray-200 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-100 dark:prose-pre:bg-gray-200 prose-pre:text-black dark:prose-pre:text-black">
                            <ReactMarkdown>{feedback}</ReactMarkdown>
                        </div>
                    ) : null}
                </div>

                {!isLoading && (
                    <div className="p-4 md:p-6 border-t border-border bg-muted/30">
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 md:py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm md:text-base rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.99]"
                        >
                            Start New Session
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
