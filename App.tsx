
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, BellOff, Trash2, LayoutGrid, ListTodo, Bot, Settings, Image as ImageIcon, Zap, Send, User as UserIcon, Sparkles, Plus, LogOut, Brain, Lightbulb, BookOpen, Coffee, ClipboardList, BatteryLow, CloudRain } from 'lucide-react';
import TimerCard from './components/TimerCard';
import AddTimerModal from './components/AddTimerModal';
import LoginModal from './components/LoginModal';
import { Timer, TimerFormData, TimerStatus, TimerType, COLORS, MOOD_OPTIONS, User } from './types';
import { chatWithGeminiStream } from './services/geminiService';
import { storage } from './services/storage';

// Helper to get consistent UUIDs
const generateId = () => Math.random().toString(36).substr(2, 9);

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
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

function App() {
  // Initialize state from Storage Service
  const [timers, setTimers] = useState<Timer[]>(() => storage.getTimers());
  const [currentUser, setCurrentUser] = useState<User | null>(() => storage.getUser());
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'ai'>('dashboard');
  const [permission, setPermission] = useState(Notification.permission);
  const [bgImage, setBgImage] = useState('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80');
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'model', text: '你好！我是你的 AI 助手。无论是生活琐事、时间管理建议，还是单纯想聊聊天，我都在这里。今天有什么可以帮你的吗？' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false); // Thinking state
  const [isTyping, setIsTyping] = useState(false); // Typing effect state
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Typewriter Refs
  const streamingQueue = useRef<string[]>([]);
  const isProcessingQueue = useRef(false);

  // Ref to track interval
  const intervalRef = useRef<number | null>(null);

  // Persistence Effects:
  // Whenever timers change, save to storage
  useEffect(() => {
    storage.saveTimers(timers);
  }, [timers]);

  // Whenever user changes, save to storage
  useEffect(() => {
    storage.saveUser(currentUser);
  }, [currentUser]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, activeTab, isChatLoading, isTyping]);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  };

  // Sound effect
  const playAlarm = useCallback(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); 
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio play failed interaction required", e));
  }, []);

  const sendNotification = useCallback((title: string) => {
    if (permission === 'granted') {
      new Notification("TimeFlow 提醒", {
        body: `${title} 任务已结束！`,
        icon: '/favicon.ico'
      });
    }
    playAlarm();
  }, [permission, playAlarm]);

  // Main Timer Logic
  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setTimers(prevTimers => {
        let hasChanges = false;
        const newTimers = prevTimers.map(timer => {
          if (timer.status !== TimerStatus.RUNNING) return timer;

          hasChanges = true;
          
          if (timer.type === TimerType.COUNTDOWN) {
            const newRemaining = timer.remainingTime - 1;
            
            if (newRemaining <= 0) {
              // Timer Finished
              sendNotification(timer.title);
              return { ...timer, remainingTime: 0, status: TimerStatus.COMPLETED };
            }
            return { ...timer, remainingTime: newRemaining };
          } else {
            // Stopwatch
            return { ...timer, remainingTime: timer.remainingTime + 1 };
          }
        });
        
        return hasChanges ? newTimers : prevTimers;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sendNotification]);

  const addTimer = (data: TimerFormData, type: TimerType) => {
    const totalSeconds = (data.hours * 3600) + (data.minutes * 60) + data.seconds;
    
    const newTimer: Timer = {
      id: generateId(),
      title: data.title || (type === TimerType.STOPWATCH ? '专注计时' : '未命名任务'),
      type,
      totalDuration: totalSeconds,
      remainingTime: type === TimerType.COUNTDOWN ? totalSeconds : 0,
      status: TimerStatus.RUNNING, // Auto-start
      createdAt: Date.now(),
      color: data.color,
      mood: data.mood
    };

    setTimers(prev => [newTimer, ...prev]);
  };

  const addQuickTimer = (minutes: number, title: string) => {
    const totalSeconds = minutes * 60;
    const newTimer: Timer = {
        id: generateId(),
        title: title,
        type: TimerType.COUNTDOWN,
        totalDuration: totalSeconds,
        remainingTime: totalSeconds,
        status: TimerStatus.RUNNING,
        createdAt: Date.now(),
        color: COLORS[Math.floor(Math.random() * COLORS.length)].value,
        mood: 'energy' // Default mood for quick start
    };
    setTimers(prev => [newTimer, ...prev]);
  };

  const toggleTimer = (id: string) => {
    setTimers(prev => prev.map(t => {
      if (t.id !== id) return t;
      
      if (t.status === TimerStatus.RUNNING) {
        return { ...t, status: TimerStatus.PAUSED };
      } else if (t.status === TimerStatus.PAUSED || t.status === TimerStatus.IDLE) {
        return { ...t, status: TimerStatus.RUNNING };
      }
      return t;
    }));
  };

  const resetTimer = (id: string) => {
    setTimers(prev => prev.map(t => {
      if (t.id !== id) return t;
      return {
        ...t,
        status: TimerStatus.IDLE,
        remainingTime: t.type === TimerType.COUNTDOWN ? t.totalDuration : 0
      };
    }));
  };

  const deleteTimer = (id: string) => {
    setTimers(prev => prev.filter(t => t.id !== id));
  };

  const clearCompleted = () => {
    setTimers(prev => prev.filter(t => t.status !== TimerStatus.COMPLETED));
  };
  
  const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const changeBackground = () => {
      const bgs = [
          'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          'https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          'https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          'https://images.unsplash.com/photo-1490750967868-58cb75063ed4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80'
      ];
      const currentIdx = bgs.indexOf(bgImage);
      const nextIdx = (currentIdx + 1) % bgs.length;
      setBgImage(bgs[nextIdx]);
  }

  // Typewriter effect processor
  const processQueue = useCallback(() => {
    if (streamingQueue.current.length === 0) {
        isProcessingQueue.current = false;
        setIsTyping(false);
        return;
    }

    isProcessingQueue.current = true;
    setIsTyping(true);

    const char = streamingQueue.current.shift();

    if (char) {
        setChatHistory(prev => {
            const newHistory = [...prev];
            const lastIdx = newHistory.length - 1;
            // Ensure we are appending to the last model message
            if (lastIdx >= 0 && newHistory[lastIdx].role === 'model') {
                newHistory[lastIdx] = {
                    ...newHistory[lastIdx],
                    text: newHistory[lastIdx].text + char
                };
            }
            return newHistory;
        });
    }

    // Dynamic delay for natural typing feel
    let delay = 30; // Base typing speed (ms)
    // Add pause for punctuation
    if (char === '，' || char === ',') delay = 150;
    if (['。', '.', '!', '?', '！', '？', ':', '：', '\n'].includes(char || '')) delay = 300;

    setTimeout(processQueue, delay);
  }, []);

  // Chat Handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    // Prevent sending if empty, thinking, or still typing the previous message
    if (!chatInput.trim() || isChatLoading || isTyping) return;

    const userMsg = chatInput;
    setChatInput('');
    // Add user message to history
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    
    // Set loading (Thinking state)
    setIsChatLoading(true);

    // Convert history format for API (exclude current interaction for now, or include? Gemini handles context)
    // We need to exclude the placeholder model message we are about to add
    const apiHistory = chatHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    try {
        let isFirstChunk = true;

        // Add a placeholder message for the model
        setChatHistory(prev => [...prev, { role: 'model', text: '' }]);

        // Stream the response
        for await (const chunk of chatWithGeminiStream(apiHistory, userMsg)) {
            if (isFirstChunk) {
                // First chunk received: Stop thinking animation
                setIsChatLoading(false);
                isFirstChunk = false;
            }
            
            // Add characters to the queue
            // Array.from splits strings correctly for emojis/unicode
            const chars = Array.from(chunk);
            streamingQueue.current.push(...chars);

            // Start the typewriter loop if it's not running
            if (!isProcessingQueue.current) {
                processQueue();
            }
        }
    } catch (e) {
        console.error("Chat error", e);
        setIsChatLoading(false);
        setChatHistory(prev => {
             const newHist = [...prev];
             // If failed, show error in the last message
             if (newHist[newHist.length - 1].role === 'model' && newHist[newHist.length - 1].text === '') {
                 newHist[newHist.length - 1].text = "抱歉，网络似乎开了小差，请稍后再试。";
             }
             return newHist;
        });
    }
  };

  return (
    <div 
        className="min-h-screen font-sans selection:bg-blue-100 relative transition-all duration-700 ease-in-out"
        style={{ 
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
        }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      {/* Top Navigation Bar / Taskbar */}
      <header className="sticky top-0 z-40 mx-4 mt-4">
        <div className="max-w-4xl mx-auto bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl shadow-lg px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-800 hidden sm:block">TimeFlow</h1>
          </div>
          
          {/* Central Tabs */}
          <nav className="flex items-center p-1 bg-gray-100/50 rounded-xl">
             <button 
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
                <LayoutGrid size={18} />
                <span className="hidden sm:inline">计时看板</span>
             </button>
             <button 
                onClick={() => setActiveTab('tasks')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'tasks' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
                <ListTodo size={18} />
                <span className="hidden sm:inline">事项管理</span>
             </button>
             <button 
                onClick={() => setActiveTab('ai')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'ai' ? 'bg-white text-fuchsia-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
                <Bot size={18} />
                <span className="hidden sm:inline">AI 问答</span>
             </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
             <button
                onClick={changeBackground}
                 className="p-2 rounded-full text-gray-500 hover:bg-white/50 transition-colors"
                 title="切换背景"
             >
                 <ImageIcon size={20} />
             </button>

             <button
               onClick={requestNotificationPermission}
               className={`p-2 rounded-full transition-colors ${permission === 'granted' ? 'text-blue-500 bg-blue-50/50' : 'text-gray-500 hover:bg-white/50'}`}
               title={permission === 'granted' ? "通知已开启" : "开启通知"}
             >
               {permission === 'granted' ? <Bell size={20} /> : <BellOff size={20} />}
             </button>

             <div className="h-6 w-px bg-gray-300 mx-1"></div>

             {currentUser ? (
                <button 
                    onClick={() => setCurrentUser(null)}
                    className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-white/50 transition-colors group"
                >
                    <img src={currentUser.avatar} alt="User" className="w-8 h-8 rounded-full border border-white shadow-sm" />
                    <span className="text-sm font-medium text-gray-700 hidden md:inline group-hover:hidden">{currentUser.username}</span>
                    <span className="text-sm font-medium text-red-500 hidden group-hover:inline"><LogOut size={16} className="inline mr-1"/>退出</span>
                </button>
             ) : (
                <button 
                    onClick={() => setIsLoginModalOpen(true)}
                    className="p-2 rounded-full text-gray-600 hover:bg-white/50 hover:text-blue-600 transition-colors"
                    title="登录"
                >
                    <UserIcon size={20} />
                </button>
             )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24 relative z-10">
        
        {/* DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                
                {/* Quick Start Section */}
                <div>
                    <h2 className="text-white/90 text-lg font-bold mb-4 flex items-center gap-2 drop-shadow-sm">
                        <Zap size={20} className="text-yellow-300" /> 
                        快速开始
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <button onClick={() => addQuickTimer(5, '休息一下')} className="bg-white/80 hover:bg-white backdrop-blur-md p-4 rounded-2xl transition-all hover:scale-105 hover:shadow-lg text-left group">
                            <span className="text-2xl mb-1 block group-hover:scale-110 transition-transform">☕</span>
                            <div className="font-bold text-gray-800">5 分钟</div>
                            <div className="text-xs text-gray-500">小憩</div>
                        </button>
                        <button onClick={() => addQuickTimer(10, '简单阅读')} className="bg-white/80 hover:bg-white backdrop-blur-md p-4 rounded-2xl transition-all hover:scale-105 hover:shadow-lg text-left group">
                            <span className="text-2xl mb-1 block group-hover:scale-110 transition-transform">📖</span>
                            <div className="font-bold text-gray-800">10 分钟</div>
                            <div className="text-xs text-gray-500">阅读</div>
                        </button>
                        <button onClick={() => addQuickTimer(25, '番茄专注')} className="bg-white/80 hover:bg-white backdrop-blur-md p-4 rounded-2xl transition-all hover:scale-105 hover:shadow-lg text-left group">
                            <span className="text-2xl mb-1 block group-hover:scale-110 transition-transform">🍅</span>
                            <div className="font-bold text-gray-800">25 分钟</div>
                            <div className="text-xs text-gray-500">专注</div>
                        </button>
                        <button onClick={() => addQuickTimer(60, '深度工作')} className="bg-white/80 hover:bg-white backdrop-blur-md p-4 rounded-2xl transition-all hover:scale-105 hover:shadow-lg text-left group">
                            <span className="text-2xl mb-1 block group-hover:scale-110 transition-transform">🧠</span>
                            <div className="font-bold text-gray-800">60 分钟</div>
                            <div className="text-xs text-gray-500">深度</div>
                        </button>
                    </div>
                </div>

                {/* Active Timers Section */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-white/90 text-lg font-bold drop-shadow-sm">
                            正在进行 ({timers.filter(t => t.status !== TimerStatus.COMPLETED).length})
                        </h2>
                        {timers.some(t => t.status === TimerStatus.COMPLETED) && (
                            <button 
                                onClick={clearCompleted}
                                className="text-sm font-medium text-white/80 hover:text-white px-3 py-1 rounded-full bg-black/20 hover:bg-black/30 backdrop-blur-sm transition-colors"
                            >
                                清除已完成
                            </button>
                        )}
                    </div>

                    {timers.length === 0 ? (
                        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-8 text-center border border-white/30">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/30 mb-3">
                                <ListTodo size={24} className="text-white" />
                            </div>
                            <p className="text-white font-medium">暂无进行中的任务</p>
                            <p className="text-white/70 text-sm mt-1">点击上方快速开始，或去“事项管理”创建新任务</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {timers.map(timer => (
                            <TimerCard
                                key={timer.id}
                                timer={timer}
                                onToggle={toggleTimer}
                                onReset={resetTimer}
                                onDelete={deleteTimer}
                            />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* TASKS / LIST VIEW */}
        {activeTab === 'tasks' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white/85 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-white/50 min-h-[500px] flex flex-col">
                     {/* Header with New Button on Right */}
                     <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">所有事项</h3>
                            <p className="text-xs text-gray-500 mt-0.5">管理你的每日专注目标</p>
                        </div>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 transform hover:-translate-y-0.5"
                        >
                            <Plus size={18} />
                            <span>新建任务</span>
                        </button>
                    </div>

                    {/* Task List Table */}
                    <div className="flex-1 overflow-x-auto">
                        {timers.length === 0 ? (
                             <div className="flex flex-col items-center justify-center h-full p-10 text-center text-gray-500">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <Sparkles className="text-gray-300" size={32} />
                                </div>
                                <p className="text-lg font-medium text-gray-600">这里还很空旷</p>
                                <p className="text-sm mt-1 mb-6">创建一个任务，开始你的一天</p>
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="px-6 py-2 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
                                >
                                    + 添加第一个任务
                                </button>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/30 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3 w-16 text-center">状态</th>
                                        <th className="px-6 py-3">任务详情</th>
                                        <th className="px-6 py-3 text-right">剩余时间</th>
                                        <th className="px-6 py-3 text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {timers.map(timer => {
                                        const moodObj = MOOD_OPTIONS.find(m => m.id === timer.mood);
                                        return (
                                        <tr key={timer.id} className="hover:bg-white/80 transition-colors group bg-transparent">
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center">
                                                    {moodObj ? (
                                                        <span className={`flex items-center justify-center w-8 h-8 rounded-full border ${moodObj.style}`}>
                                                            <MoodIcon iconName={moodObj.icon} size={16} />
                                                        </span>
                                                    ) : (
                                                        <span className="text-xl">📝</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${COLORS.find(c => c.value === timer.color)?.value || 'bg-gray-300'}`} />
                                                    <div>
                                                        <div className="font-bold text-gray-800">{timer.title}</div>
                                                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                                            {timer.status === TimerStatus.RUNNING && <span className="text-emerald-600 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/> 进行中</span>}
                                                            {timer.status === TimerStatus.PAUSED && <span className="text-amber-600">已暂停</span>}
                                                            {timer.status === TimerStatus.COMPLETED && <span className="text-gray-400 line-through">已完成</span>}
                                                            {timer.status === TimerStatus.IDLE && <span className="text-gray-400">未开始</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-gray-600 font-medium text-right text-lg">
                                                {formatTime(timer.remainingTime)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => toggleTimer(timer.id)}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title={timer.status === TimerStatus.RUNNING ? "暂停" : "开始"}
                                                    >
                                                        {timer.status === TimerStatus.RUNNING ? <div className="w-4 h-4 border-l-2 border-r-2 border-current" /> : <div className="w-0 h-0 border-t-4 border-t-transparent border-l-8 border-l-current border-b-4 border-b-transparent ml-0.5" />}
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteTimer(timer.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="删除"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* AI CHAT VIEW */}
        {activeTab === 'ai' && (
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden border border-white/50 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[600px] flex flex-col">
                
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-fuchsia-50 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center shadow-md">
                        <Sparkles size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-800">AI 生活助手</h2>
                        <p className="text-xs text-gray-500">有什么可以帮你的吗？</p>
                    </div>
                </div>

                {/* Chat History */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                    {chatHistory.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none whitespace-pre-wrap'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isChatLoading && (
                        <div className="flex justify-start animate-in fade-in duration-300">
                            <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-100 rounded-2xl rounded-tl-none px-4 py-3 text-sm shadow-sm flex items-center gap-3">
                                <Brain size={16} className="text-violet-500 animate-pulse" />
                                <span className="text-violet-700 font-medium text-xs">AI 正在深度思考...</span>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="问点什么... (例如: 怎么提高专注力?)"
                            disabled={isChatLoading || isTyping}
                            className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button
                            type="submit"
                            disabled={!chatInput.trim() || isChatLoading || isTyping}
                            className="p-3 bg-violet-600 text-white rounded-xl hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </form>
            </div>
        )}

      </main>

      {/* Modals */}
      <AddTimerModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={addTimer} 
      />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={(user) => setCurrentUser(user)}
      />

    </div>
  );
}

export default App;
