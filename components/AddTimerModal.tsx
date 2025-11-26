
import React, { useState } from 'react';
import { X, Sparkles, Hourglass, Timer as TimerIcon, Brain, Zap, Lightbulb, BookOpen, Coffee, ClipboardList, BatteryLow, CloudRain } from 'lucide-react';
import { COLORS, TimerFormData, MOOD_OPTIONS } from '../types';
import { analyzeTimerRequest } from '../services/geminiService';

interface AddTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: TimerFormData, type: 'COUNTDOWN' | 'STOPWATCH') => void;
}

// Icon mapping helper
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

const AddTimerModal: React.FC<AddTimerModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [mode, setMode] = useState<'MANUAL' | 'AI'>('MANUAL');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');
  
  const [formData, setFormData] = useState<TimerFormData>({
    title: '',
    hours: 0,
    minutes: 25,
    seconds: 0,
    color: COLORS[0].value,
    mood: MOOD_OPTIONS[0].id
  });

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'title') {
      setFormData(prev => ({ ...prev, title: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData, 'COUNTDOWN');
    onClose();
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    setIsAiLoading(true);
    const result = await analyzeTimerRequest(aiInput);
    setIsAiLoading(false);

    if (result) {
      const h = Math.floor(result.durationSeconds / 3600);
      const m = Math.floor((result.durationSeconds % 3600) / 60);
      const s = result.durationSeconds % 60;
      
      onAdd({
        title: result.title,
        hours: h,
        minutes: m,
        seconds: s,
        color: COLORS[result.suggestedColorIndex % COLORS.length].value,
        mood: 'focus' // Default to focus for AI generated
      }, result.durationSeconds === 0 ? 'STOPWATCH' : 'COUNTDOWN');
      
      onClose();
      setAiInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 border border-white/40 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <div>
              <h2 className="text-xl font-bold text-gray-800">新建专注任务</h2>
              <p className="text-gray-500 text-xs mt-0.5">规划你的时间，记录当前状态</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-4 flex-shrink-0">
            <div className="flex p-1 bg-gray-100 rounded-xl">
            <button
                onClick={() => setMode('MANUAL')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'MANUAL' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <Hourglass size={16} /> 手动设定
            </button>
            <button
                onClick={() => setMode('AI')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'AI' ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <Sparkles size={16} /> AI 助手
            </button>
            </div>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar">
          {mode === 'MANUAL' ? (
            <form onSubmit={handleManualSubmit} className="space-y-5">
              
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">任务标题</label>
                <input
                type="text"
                name="title"
                placeholder="例如：阅读、写代码、冥想..."
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                autoFocus
                />
              </div>

              {/* Mood Selection - Updated UI */}
              <div>
                 <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">当前状态</label>
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {MOOD_OPTIONS.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => setFormData({...formData, mood: option.id})}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                                formData.mood === option.id 
                                ? `${option.style} border-current ring-1 ring-offset-1 ring-offset-white ring-gray-200` 
                                : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            <div className="mb-1">
                                <MoodIcon iconName={option.icon} size={20} />
                            </div>
                            <span className="text-[10px] font-medium">{option.label}</span>
                        </button>
                    ))}
                 </div>
              </div>

              {/* Time */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">持续时长</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      name="hours"
                      min="0"
                      value={formData.hours}
                      onChange={handleInputChange}
                      className="w-full text-center px-2 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none text-lg font-mono"
                    />
                    <span className="absolute right-2 bottom-3 text-xs text-gray-400">时</span>
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      name="minutes"
                      min="0"
                      max="59"
                      value={formData.minutes}
                      onChange={handleInputChange}
                      className="w-full text-center px-2 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none text-lg font-mono"
                    />
                     <span className="absolute right-2 bottom-3 text-xs text-gray-400">分</span>
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      name="seconds"
                      min="0"
                      max="59"
                      value={formData.seconds}
                      onChange={handleInputChange}
                      className="w-full text-center px-2 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none text-lg font-mono"
                    />
                     <span className="absolute right-2 bottom-3 text-xs text-gray-400">秒</span>
                  </div>
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">任务色标</label>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color: c.value }))}
                      className={`w-9 h-9 rounded-full ${c.value} transition-all hover:scale-110 flex-shrink-0 ring-2 ${formData.color === c.value ? 'ring-offset-2 ring-gray-400 scale-110 shadow-md' : 'ring-transparent opacity-70 hover:opacity-100'}`}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-3 border-t border-gray-100 mt-2">
                 <button
                    type="button"
                    onClick={() => {
                        onAdd({ ...formData, seconds: 0, minutes: 0, hours: 0 }, 'STOPWATCH');
                        onClose();
                    }}
                     className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                 >
                    <TimerIcon size={18} />
                    开启秒表
                 </button>
                <button
                  type="submit"
                  className="flex-[2] py-3.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                >
                  <Hourglass size={18} />
                  开始倒计时
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 py-2">
               <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 p-4 rounded-xl border border-violet-100">
                  <p className="text-sm text-violet-800 leading-relaxed">
                     <Sparkles size={16} className="inline mr-1 -mt-1 text-fuchsia-500" /> 
                     告诉我你想做什么？例如“<strong>番茄工作法</strong>”或“<strong>煮个半熟蛋</strong>”，Gemini AI 将自动为你设置标题、时长和氛围颜色。
                  </p>
               </div>
               
               <form onSubmit={handleAiSubmit}>
                  <textarea
                     value={aiInput}
                     onChange={(e) => setAiInput(e.target.value)}
                     placeholder="输入你的需求..."
                     className="w-full h-32 p-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none resize-none mb-4 transition-colors"
                     autoFocus
                  />
                  <button
                     type="submit"
                     disabled={isAiLoading || !aiInput.trim()}
                     className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold hover:opacity-90 transition-all shadow-lg shadow-violet-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                  >
                     {isAiLoading ? (
                        <>
                           <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                           智能生成中...
                        </>
                     ) : (
                        <>
                           <Sparkles size={18} />
                           一键生成配置
                        </>
                     )}
                  </button>
               </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddTimerModal;
