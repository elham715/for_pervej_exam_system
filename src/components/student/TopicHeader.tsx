import React from 'react';
import { Film } from 'lucide-react';

interface TopicHeaderProps {
  topicName: string;
  videoUrl?: string;
  onPlayVideo: () => void;
}

export function TopicHeader({ topicName, videoUrl, onPlayVideo }: TopicHeaderProps) {
  return (
    <div className="flex items-center justify-between bg-sky-100 p-4">
      <h3 className="text-xl md:text-2xl font-bold text-gray-800">{topicName}</h3>
      {videoUrl && (
        <button
          onClick={onPlayVideo}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
        >
          <Film className="w-5 h-5" />
          <span>Play Explanation</span>
        </button>
      )}
    </div>
  );
}
