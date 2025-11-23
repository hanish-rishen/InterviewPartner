'use client';

import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
    code: string;
    onChange: (value: string | undefined) => void;
    language?: string;
    onLanguageChange?: (lang: string) => void;
}

export default function CodeEditor({ code, onChange, language = 'javascript', onLanguageChange }: CodeEditorProps) {
    const languages = [
        { value: 'javascript', label: 'JavaScript' },
        { value: 'typescript', label: 'TypeScript' },
        { value: 'python', label: 'Python' },
        { value: 'java', label: 'Java' },
        { value: 'cpp', label: 'C++' },
        { value: 'csharp', label: 'C#' },
        { value: 'go', label: 'Go' },
        { value: 'rust', label: 'Rust' },
    ];

    return (
        <div className="h-full w-full rounded-xl overflow-hidden border border-border shadow-sm flex flex-col">
            <div className="bg-muted px-4 py-2 border-b border-border flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Code Editor</span>
                {onLanguageChange && (
                    <select
                        value={language}
                        onChange={(e) => onLanguageChange(e.target.value)}
                        className="text-xs bg-background border border-border rounded-lg px-3 py-1 cursor-pointer hover:bg-muted/50 transition-colors outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        {languages.map((lang) => (
                            <option key={lang.value} value={lang.value}>
                                {lang.label}
                            </option>
                        ))}
                    </select>
                )}
            </div>
            <div className="flex-1 min-h-0">
                <Editor
                    height="100%"
                    language={language}
                    defaultValue="// Write your solution here..."
                    value={code}
                    onChange={onChange}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                    }}
                />
            </div>
        </div>
    );
}
