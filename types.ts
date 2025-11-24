
export enum TimerType {
  COUNTDOWN = 'COUNTDOWN',
  STOPWATCH = 'STOPWATCH'
}

export enum TimerStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED'
}

export interface Timer {
  id: string;
  title: string;
  type: TimerType;
  totalDuration: number; // In seconds (for countdown)
  remainingTime: number; // In seconds (current value)
  status: TimerStatus;
  createdAt: number;
  color: string; // Hex or Tailwind class key
  mood: string; // ID of the mood option
}

export interface TimerFormData {
  title: string;
  hours: number;
  minutes: number;
  seconds: number;
  color: string;
  mood: string;
}

export interface User {
  username: string;
  email: string;
  avatar: string;
}

export interface MoodOption {
  id: string;
  label: string;
  icon: string; // Lucide icon name mapping
  style: string; // Tailwind classes for badge
}

export const COLORS = [
  { name: 'Blue', value: 'bg-blue-500', hex: '#3b82f6' },
  { name: 'Indigo', value: 'bg-indigo-500', hex: '#6366f1' },
  { name: 'Purple', value: 'bg-purple-500', hex: '#a855f7' },
  { name: 'Pink', value: 'bg-pink-500', hex: '#ec4899' },
  { name: 'Rose', value: 'bg-rose-500', hex: '#f43f5e' },
  { name: 'Orange', value: 'bg-orange-500', hex: '#f97316' },
  { name: 'Emerald', value: 'bg-emerald-500', hex: '#10b981' },
  { name: 'Cyan', value: 'bg-cyan-500', hex: '#06b6d4' },
];

export const MOOD_OPTIONS: MoodOption[] = [
  { id: 'focus', label: '深度专注', icon: 'Brain', style: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { id: 'energy', label: '活力满满', icon: 'Zap', style: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { id: 'creative', label: '灵感迸发', icon: 'Lightbulb', style: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'learning', label: '沉浸学习', icon: 'BookOpen', style: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'relax', label: '休憩放松', icon: 'Coffee', style: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'routine', label: '日常琐事', icon: 'ClipboardList', style: 'bg-gray-100 text-gray-700 border-gray-200' },
  { id: 'tired', label: '略感疲惫', icon: 'BatteryLow', style: 'bg-stone-100 text-stone-600 border-stone-200' },
  { id: 'anxious', label: '焦虑压力', icon: 'CloudRain', style: 'bg-slate-200 text-slate-600 border-slate-300' },
];
