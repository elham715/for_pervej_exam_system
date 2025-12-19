import { useState, useEffect, useRef } from 'react';
import { Clock, AlertCircle, AlertTriangle } from 'lucide-react';

interface ExamTimerProps {
  totalTimeSeconds: number; // Total duration in seconds (from backend)
  attemptId: string; // Used as key for localStorage
  onTimeUp: () => void;
  className?: string;
  showWarnings?: boolean; // Show warnings at 5 min and 1 min
}

/**
 * Exam Timer Component
 * 
 * This component implements the frontend timer logic as per the new backend requirements:
 * - Backend provides total_time_seconds as the total duration (not remaining time)
 * - Frontend tracks when timer started in localStorage
 * - Calculates remaining time: total_time_seconds - elapsed_time
 * - Persists across tab switches, browser close/reopen
 * - Automatically calls onTimeUp when countdown reaches 00:00:00
 * - Provides visual warnings at critical time thresholds (5 min, 1 min)
 */
export function ExamTimer({ 
  totalTimeSeconds,
  attemptId,
  onTimeUp, 
  className = "",
  showWarnings = true 
}: ExamTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(totalTimeSeconds);
  const [isExpired, setIsExpired] = useState(false);
  const hasCalledTimeUp = useRef(false);
  const timerStartKey = `exam_timer_start_${attemptId}`;

  // Initialize timer - get or set start time in localStorage
  useEffect(() => {
    const timerStartKey = `exam_timer_start_${attemptId}`;
    let startTime = localStorage.getItem(timerStartKey);
    
    if (!startTime) {
      // First time starting this exam - record start time
      // Backend sends total_time_seconds as the full duration
      // We store when we FIRST started the timer
      startTime = Date.now().toString();
      localStorage.setItem(timerStartKey, startTime);
      console.log('✅ Timer started for NEW attempt:', attemptId, 'Duration:', totalTimeSeconds, 'seconds');
    } else {
      console.log('🔄 Timer RESUMED for existing attempt:', attemptId);
    }
    
    // Calculate remaining time based on how long ago we started
    const elapsed = Math.floor((Date.now() - parseInt(startTime)) / 1000);
    const remaining = Math.max(0, totalTimeSeconds - elapsed);
    
    console.log('⏱️ Timer calculation:', { 
      totalTimeSeconds, 
      elapsed: `${elapsed}s`, 
      remaining: `${remaining}s`,
      startedAt: new Date(parseInt(startTime)).toLocaleTimeString()
    });
    
    setTimeRemaining(remaining);
    
    // If time already expired when component mounts, trigger immediately
    if (remaining === 0 && !hasCalledTimeUp.current) {
      console.log('❌ Time already expired on mount, triggering auto-submit');
      console.log('❌ Debug info:', {
        totalTimeSeconds,
        elapsed,
        remaining,
        startTime: parseInt(startTime),
        now: Date.now()
      });
      hasCalledTimeUp.current = true;
      setIsExpired(true);
      onTimeUp();
    }
  }, [totalTimeSeconds, attemptId, onTimeUp]);

  // Handle tab visibility changes - recalculate time from localStorage
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible, recalculate from stored start time
        const startTime = localStorage.getItem(timerStartKey);
        if (!startTime) return;
        
        const elapsed = Math.floor((Date.now() - parseInt(startTime)) / 1000);
        const remaining = Math.max(0, totalTimeSeconds - elapsed);
        
        console.log('Tab visible again, recalculating time:', { 
          elapsed, 
          remaining, 
          totalTimeSeconds 
        });
        
        setTimeRemaining(remaining);
        
        // Check if time expired while tab was hidden/closed
        if (remaining === 0 && !hasCalledTimeUp.current && !isExpired) {
          console.log('Time expired while tab was hidden, triggering auto-submit');
          hasCalledTimeUp.current = true;
          setIsExpired(true);
          onTimeUp();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isExpired, onTimeUp, totalTimeSeconds, timerStartKey]);

  // Countdown timer
  useEffect(() => {
    if (isExpired || timeRemaining === 0) {
      if (!hasCalledTimeUp.current) {
        hasCalledTimeUp.current = true;
        setIsExpired(true);
        onTimeUp();
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = Math.max(0, prev - 1);
        
        // Time's up!
        if (newTime === 0 && !hasCalledTimeUp.current) {
          hasCalledTimeUp.current = true;
          setIsExpired(true);
          onTimeUp();
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, isExpired, onTimeUp]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine warning level
  const getWarningLevel = () => {
    if (isExpired || timeRemaining === 0) return 'expired';
    if (timeRemaining <= 60) return 'critical'; // 1 minute
    if (timeRemaining <= 300) return 'warning'; // 5 minutes
    return 'normal';
  };

  const warningLevel = getWarningLevel();

  // Style based on warning level
  const getTimerStyles = () => {
    switch (warningLevel) {
      case 'expired':
        return 'bg-red-600 text-white border-red-700 animate-pulse';
      case 'critical':
        return 'bg-red-100 text-red-900 border-red-500 animate-pulse';
      case 'warning':
        return 'bg-yellow-100 text-yellow-900 border-yellow-500';
      default:
        return 'bg-blue-100 text-blue-900 border-blue-500';
    }
  };

  const getIcon = () => {
    switch (warningLevel) {
      case 'expired':
        return <AlertCircle className="w-5 h-5 animate-pulse" />;
      case 'critical':
        return <AlertTriangle className="w-5 h-5 animate-bounce" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className={`${className}`}>
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-mono text-lg font-bold transition-all duration-300 ${getTimerStyles()}`}>
        {getIcon()}
        <span className="min-w-[100px] text-center">
          {isExpired ? '00:00:00' : formatTime(timeRemaining)}
        </span>
      </div>
      
      {/* Warning messages */}
      {showWarnings && warningLevel === 'critical' && !isExpired && (
        <div className="mt-2 text-xs text-red-600 font-semibold text-center animate-pulse">
          ⚠️ Less than 1 minute remaining!
        </div>
      )}
      {showWarnings && warningLevel === 'warning' && (
        <div className="mt-2 text-xs text-yellow-700 font-medium text-center">
          ⏰ Less than 5 minutes remaining
        </div>
      )}
      {isExpired && (
        <div className="mt-2 text-xs text-red-600 font-bold text-center">
          ⏱️ TIME'S UP!
        </div>
      )}
    </div>
  );
}
