
import React from 'react';
import { Play, Pause, RotateCcw, X, CheckCircle, Clock, Brain, Zap, Lightbulb, BookOpen, Coffee, ClipboardList, BatteryLow, CloudRain, Sparkles } from 'lucide-react';
import { Timer, TimerStatus, TimerType, COLORS, MOOD_OPTIONS } from '../types';

interface TimerCardProps {
  timer: Timer;
  onToggle: (id: string) => void;
  onReset: (id: string) => void;
  onDelete: (id: string) => void;
}

// Icon mapping helper (Duplicated for simplicity in this file structure, normally would be in utils)
const MoodIcon = ({ iconName, size = 16 }: { iconName: string, size?: number }) => {
  switch (iconName) {
    case 'Brain': return <Brain size={size} />;
    case 'Zap': return <Zap size={size} />;
    case 'Lightbulb': return <Lightbulb size={size} />;
    case 'BookOpen': return <BookOpen size={size} />;
    case 'Coffee': return <Coffee size={size} />;
    case 'ClipboardList': return <ClipboardList size={size} />;
    case 'BatteryLow': return <BatteryLow size={size} />;
    case 'CloudRain': return <CloudRain size={size} />;
    default: return <Sparkles size={size} />;
  }
};

const formatTime = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const TimerCard: React.FC<TimerCardProps> = ({ timer, onToggle, onReset, onDelete }) => {
  const isCompleted = timer.status === TimerStatus.COMPLETED;
  const isRunning = timer.status === TimerStatus.RUNNING;
  
  // Choose color based on timer.color
  const colorObj = COLORS.find(c => c.value === timer.color) || COLORS[0];
  
  // Find Mood Object
  const moodObj = MOOD_OPTIONS.find(m => m.id === timer.mood);

  return (
    <div className={`relative overflow-hidden bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isCompleted ? 'ring-2 ring-red-400 bg-red-50/90' : ''}`}>
      
      {/* Background Progress Bar */}
      <div 
        className={`absolute bottom-0 left-0 h-1.5 transition-all duration-1000 ease-linear ${colorObj.value}`} 
        style={{ width: `${timer.type === TimerType.COUNTDOWN ? (100 - (timer.remainingTime / timer.totalDuration) * 100) : 100}%` }}
      />

      <div className="p-5 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {moodObj && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${moodObj.style}`}>
                    <MoodIcon iconName={moodObj.icon} size={10} />
                    {moodObj.label}
                </span>
            )}
            {timer.type === TimerType.STOPWATCH && <Clock size={14} className="text-gray-500" />}
          </div>
          
          <h3 className="text-base font-bold text-gray-700 truncate mb-1" title={timer.title}>
              {timer.title}
          </h3>

          <div className={`text-4xl font-bold font-mono tracking-tight ${isCompleted ? 'text-red-500 animate-pulse' : 'text-gray-800'}`}>
            {formatTime(timer.remainingTime)}
          </div>
          {timer.type === TimerType.COUNTDOWN && (
            <div className="text-xs text-gray-500 mt-1">
              {isCompleted ? '时间到！' : `总时长: ${formatTime(timer.totalDuration)}`}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isCompleted && (
            <button
              onClick={() => onToggle(timer.id)}
              className={`p-3 rounded-full transition-colors flex items-center justify-center shadow-sm ${
                isRunning 
                  ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
                  : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
              }`}
              title={isRunning ? "暂停" : "开始"}
            >
              {isRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>
          )}

          <button
            onClick={() => onReset(timer.id)}
            className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors shadow-sm"
            title="重置"
          >
            <RotateCcw size={20} />
          </button>

          <button
            onClick={() => onDelete(timer.id)}
            className="p-3 rounded-full bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors shadow-sm"
            title="删除"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      {isCompleted && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 animate-in fade-in">
          <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-xl shadow-xl border border-gray-200 w-3/4">
            <CheckCircle size={40} className="text-green-500" />
            <div className="text-center">
              <h4 className="text-lg font-bold text-gray-800">完成!</h4>
            </div>
            <div className="flex gap-2 w-full">
              <button 
                onClick={() => onReset(timer.id)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                重置
              </button>
              <button 
                onClick={() => onDelete(timer.id)}
                className="flex-1 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-sm font-medium transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimerCard;
