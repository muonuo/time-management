
import { Timer, User } from '../types';

const KEYS = {
  TIMERS: 'timeflow_data_timers',
  USER: 'timeflow_data_user'
};

export const storage = {
  /**
   * 获取所有计时器任务 (模拟数据库 Select)
   */
  getTimers: (): Timer[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(KEYS.TIMERS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load timers', e);
      return [];
    }
  },

  /**
   * 保存计时器数组 (模拟数据库 Update)
   */
  saveTimers: (timers: Timer[]) => {
    try {
      localStorage.setItem(KEYS.TIMERS, JSON.stringify(timers));
    } catch (e) {
      console.error('Failed to save timers', e);
    }
  },

  /**
   * 获取当前登录用户
   */
  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * 保存用户信息 (登录/退出)
   */
  saveUser: (user: User | null) => {
    try {
      if (user) {
        localStorage.setItem(KEYS.USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(KEYS.USER);
      }
    } catch (e) {
      console.error('Failed to save user', e);
    }
  }
};
