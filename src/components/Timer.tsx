import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface TimerProps {
  duration: number; // in minutes
  onTimeUp: () => void;
  className?: string;
}

export function Timer({ duration, onTimeUp, className = "" }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // convert to seconds
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onTimeUp();
          return 0;
        }
        
        const newTime = prev - 1;
        setIsWarning(newTime <= 300); // Warning when 5 minutes left
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold ${
      isWarning 
        ? 'bg-red-100 text-red-800 border-2 border-red-300' 
        : 'bg-blue-100 text-blue-800 border-2 border-blue-300'
    } ${className}`}>
      {isWarning ? <AlertCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
      <span>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
      {isWarning && <span className="text-sm font-normal ml-2">Time running out!</span>}
    </div>
  );
}