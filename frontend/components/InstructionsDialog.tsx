'use client';

import React from 'react';
import { X, Video, Timer, Sparkles, Target, Code } from 'lucide-react';

interface InstructionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'voice' | 'chat'; // Optional for backwards compatibility
}

export default function InstructionsDialog({ isOpen, onClose }: InstructionsDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
      <div className="bg-card border border-border rounded-xl md:rounded-2xl max-w-2xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 md:p-6 flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Interface Guide 🎯</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            title="Close"
          >
            <X size={18} className="md:w-5 md:h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="space-y-3 md:space-y-4">
            <h3 className="font-semibold text-base md:text-lg mb-2 md:mb-3 flex items-center gap-2">
              <Sparkles className="text-primary w-[18px] h-[18px] md:w-5 md:h-5" />
              What You'll See
            </h3>

            <div className="flex items-start gap-2 md:gap-3 p-3 md:p-4 bg-secondary/30 rounded-lg">
              <Video className="text-foreground mt-1 flex-shrink-0 w-5 h-5 md:w-[22px] md:h-[22px]" />
              <div className="flex-1">
                <p className="font-semibold text-xs md:text-sm mb-1">Video Avatars (Right Side)</p>
                <p className="text-[11px] md:text-xs text-muted-foreground">
                  • <strong>Top:</strong> AI Interviewer avatar<br/>
                  • <strong>Bottom:</strong> Your avatar with video toggle button (green border when you speak)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 md:gap-3 p-3 md:p-4 bg-secondary/30 rounded-lg">
              <Code className="text-foreground mt-1 flex-shrink-0 w-5 h-5 md:w-[22px] md:h-[22px]" />
              <div className="flex-1">
                <p className="font-semibold text-xs md:text-sm mb-1">Code Editor (Left Side)</p>
                <p className="text-[11px] md:text-xs text-muted-foreground">For coding interviews, write your solution here. The AI can see and review your code.</p>
              </div>
            </div>

            <div className="flex items-start gap-2 md:gap-3 p-3 md:p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-lg">
              <Target className="text-amber-600 dark:text-amber-400 mt-1 flex-shrink-0 w-5 h-5 md:w-[22px] md:h-[22px]" />
              <div className="flex-1">
                <p className="font-semibold text-xs md:text-sm mb-1 text-amber-700 dark:text-amber-300">🎯 Focus Mode (Top-Right Header)</p>
                <p className="text-[11px] md:text-xs text-muted-foreground">
                  <strong className="text-amber-600 dark:text-amber-400">Click this when coding!</strong> Pauses AI interruptions so you can focus.
                  The interview resumes when you exit focus mode.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 md:gap-3 p-3 md:p-4 bg-secondary/30 rounded-lg">
              <Timer className="text-foreground mt-1 flex-shrink-0 w-5 h-5 md:w-[22px] md:h-[22px]" />
              <div className="flex-1">
                <p className="font-semibold text-xs md:text-sm mb-1">Controls (Top-Right)</p>
                <p className="text-[11px] md:text-xs text-muted-foreground">Focus Mode • Timer • End Session button</p>
              </div>
            </div>

            <div className="p-3 md:p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-xs md:text-sm font-medium text-foreground mb-1.5 md:mb-2">💡 How Voice Mode Works:</p>
              <ul className="text-[11px] md:text-xs text-muted-foreground space-y-1 md:space-y-1.5">
                <li>• The AI speaks automatically and waits for your response</li>
                <li>• Speak naturally - the system detects when you're done (after ~1 second of silence)</li>
                <li>• Your avatar gets a <strong className="text-green-500">green border</strong> when you're speaking</li>
                <li>• Stay active - long silence may end the session</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border p-4 md:p-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 md:py-3 px-4 md:px-6 bg-primary text-primary-foreground rounded-lg text-sm md:text-base font-semibold hover:bg-primary/90 transition-colors"
          >
            Got it! Let's Start 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
