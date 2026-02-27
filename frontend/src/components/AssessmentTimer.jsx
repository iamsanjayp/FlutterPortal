import { useState, useEffect, useRef } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

export default function AssessmentTimer({
    durationMinutes = 90,
    onExpire,
    onWarning,
    storageKey = 'assessment_timer',
    autoStart = true,
    minimal = false,
    className = ''
}) {
    const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60);
    const [isRunning, setIsRunning] = useState(autoStart);
    const [showWarning, setShowWarning] = useState(false);
    const warningShownRef = useRef(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        const savedState = localStorage.getItem(storageKey);
        if (savedState) {
            try {
                const { timeRemaining: savedTime, startTime } = JSON.parse(savedState);
                const now = Date.now();
                const elapsed = Math.floor((now - startTime) / 1000);
                const remaining = Math.max(0, savedTime - elapsed);
                setTimeRemaining(remaining);
            } catch (e) {
                console.error('Failed to load timer state:', e);
            }
        }
    }, [storageKey]);

    useEffect(() => {
        if (isRunning) {
            const state = {
                timeRemaining,
                startTime: Date.now(),
            };
            localStorage.setItem(storageKey, JSON.stringify(state));
        }
    }, [timeRemaining, isRunning, storageKey]);

    useEffect(() => {
        if (isRunning && timeRemaining > 0) {
            intervalRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    const newTime = prev - 1;

                    if (newTime === 600 && !warningShownRef.current) {
                        warningShownRef.current = true;
                        setShowWarning(true);
                        if (onWarning) onWarning(newTime);
                    }

                    if (newTime <= 0) {
                        setIsRunning(false);
                        if (onExpire) onExpire();
                        return 0;
                    }

                    return newTime;
                });
            }, 1000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning, timeRemaining, onExpire, onWarning]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const getTimerState = () => {
        const minutes = timeRemaining / 60;
        if (minutes <= 5) return 'critical';
        if (minutes <= 10) return 'warning';
        return 'normal';
    };

    const timerState = getTimerState();

    if (minimal) {
        return (
            <span className={`font-mono tabular-nums ${timerState === 'critical' ? 'text-red-500 animate-pulse' :
                timerState === 'warning' ? 'text-yellow-500' : ''} ${className}`}>
                {formatTime(timeRemaining)}
            </span>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {/* Minimal timer display */}
            <div className={`
        flex items-center gap-3 px-4 py-2 border rounded-lg transition-colors
        ${timerState === 'critical' ? 'border-red-200 bg-red-50' :
                    timerState === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                        'border-gray-200 bg-white'}
      `}>
                <Clock className={`w-4 h-4 ${timerState === 'critical' ? 'text-red-600' :
                    timerState === 'warning' ? 'text-yellow-600' :
                        'text-gray-600'
                    }`} />
                <div className="text-right">
                    <div className={`text-xs text-gray-500 mb-0.5`}>
                        Time Left
                    </div>
                    <div className={`text-lg font-mono font-semibold tabular-nums ${timerState === 'critical' ? 'text-red-900' :
                        timerState === 'warning' ? 'text-yellow-900' :
                            'text-gray-900'
                        }`}>
                        {formatTime(timeRemaining)}
                    </div>
                </div>
            </div>

            {/* Warning message */}
            {showWarning && timeRemaining > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-sm z-50">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-xs text-yellow-900">
                                {Math.floor(timeRemaining / 60)} minutes remaining
                            </p>
                        </div>
                        <button
                            onClick={() => setShowWarning(false)}
                            className="text-yellow-600 hover:text-yellow-800"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Expired state */}
            {timeRemaining === 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-red-50 border border-red-200 rounded-lg p-3 shadow-sm z-50">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-900 flex-1">
                            Time expired. Please submit your solution.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
