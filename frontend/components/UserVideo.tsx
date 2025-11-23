'use client';

import React from 'react';
import Webcam from 'react-webcam';
import Image from 'next/image';
import { VideoOff } from 'lucide-react';

interface UserVideoProps {
    isVideoOn: boolean;
}

export default function UserVideo({ isVideoOn }: UserVideoProps) {
    return (
        <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-lg border border-border/50">
            {isVideoOn ? (
                <Webcam
                    audio={false}
                    className="w-full h-full object-cover transform scale-x-[-1]"
                    videoConstraints={{
                        facingMode: "user"
                    }}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-pink-50 dark:from-slate-800 dark:to-slate-900">
                    <div className="w-40 h-40 rounded-full overflow-hidden shadow-2xl">
                        <Image
                            src="/candidate-neutral.png"
                            alt="User"
                            width={160}
                            height={160}
                            className="object-cover"
                            priority
                        />
                    </div>
                </div>
            )}

            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-medium">
                You
            </div>
        </div>
    );
}
