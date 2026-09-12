import { User, Post, SpaceFolder, Forum, ForumMessage, Quiz, QuizSubmission, Poll, AppNotification } from '../types';

const TOKEN_KEY = 'med_sfax_token';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeStoredToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Erreur requête (${res.status})`);
  }
  return data;
}

// Authentication
export const api = {
  auth: {
    register: async (userData: {
      nom: string;
      prenom: string;
      email: string;
      password?: string;
      avatarUrl: string;
      promo: string;
      bio?: string;
    }): Promise<{ user: User; token: string }> => {
      const data = await fetchWithAuth('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      if (data.token) {
        setStoredToken(data.token);
      }
      return data;
    },

    login: async (credentials: { email: string; password?: string }): Promise<{ user: User; token: string }> => {
      const data = await fetchWithAuth('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (data.token) {
        setStoredToken(data.token);
      }
      return data;
    },

    getMe: async (): Promise<{ user: User }> => {
      return fetchWithAuth('/api/auth/me');
    },

    updateProfile: async (updates: Partial<User>): Promise<{ user: User }> => {
      return fetchWithAuth('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    logout: () => {
      removeStoredToken();
    },
  },

  posts: {
    getAll: async (): Promise<{ posts: Post[] }> => {
      return fetchWithAuth('/api/posts');
    },

    create: async (postData: {
      content: string;
      attachments?: any[];
      tags?: string[];
    }): Promise<{ post: Post }> => {
      return fetchWithAuth('/api/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
      });
    },

    update: async (id: string, updates: { content?: string; attachments?: any[]; tags?: string[] }): Promise<{ post: Post }> => {
      return fetchWithAuth(`/api/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    delete: async (id: string): Promise<{ success: boolean; id: string }> => {
      return fetchWithAuth(`/api/posts/${id}`, {
        method: 'DELETE',
      });
    },

    toggleLike: async (id: string): Promise<{ likes: string[] }> => {
      return fetchWithAuth(`/api/posts/${id}/like`, {
        method: 'POST',
      });
    },

    addComment: async (id: string, content: string, parentId?: string): Promise<{ comment: any; comments: any[] }> => {
      return fetchWithAuth(`/api/posts/${id}/comment`, {
        method: 'POST',
        body: JSON.stringify({ content, parentId }),
      });
    },
  },

  spaces: {
    getAll: async (): Promise<{ spaces: SpaceFolder[] }> => {
      return fetchWithAuth('/api/spaces');
    },

    create: async (spaceData: {
      name: string;
      category?: string;
      description?: string;
      color?: string;
    }): Promise<{ space: SpaceFolder }> => {
      return fetchWithAuth('/api/spaces', {
        method: 'POST',
        body: JSON.stringify(spaceData),
      });
    },

    update: async (id: string, updates: Partial<SpaceFolder>): Promise<{ space: SpaceFolder }> => {
      return fetchWithAuth(`/api/spaces/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    delete: async (id: string): Promise<{ success: boolean }> => {
      return fetchWithAuth(`/api/spaces/${id}`, {
        method: 'DELETE',
      });
    },

    addPost: async (spaceId: string, postId: string): Promise<{ space: SpaceFolder }> => {
      return fetchWithAuth(`/api/spaces/${spaceId}/add-post`, {
        method: 'POST',
        body: JSON.stringify({ postId }),
      });
    },

    removePost: async (spaceId: string, postId: string): Promise<{ space: SpaceFolder }> => {
      return fetchWithAuth(`/api/spaces/${spaceId}/remove-post/${postId}`, {
        method: 'DELETE',
      });
    },
  },

  forums: {
    getAll: async (): Promise<{ forums: Forum[] }> => {
      return fetchWithAuth('/api/forums');
    },

    create: async (forumData: {
      title: string;
      description?: string;
      category?: string;
      isPrivate: boolean;
      accessCode?: string;
    }): Promise<{ forum: Forum }> => {
      return fetchWithAuth('/api/forums', {
        method: 'POST',
        body: JSON.stringify(forumData),
      });
    },

    verifyCode: async (forumId: string, code: string): Promise<{ authorized: boolean }> => {
      return fetchWithAuth(`/api/forums/${forumId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
    },

    getMessages: async (forumId: string): Promise<{ messages: ForumMessage[] }> => {
      return fetchWithAuth(`/api/forums/${forumId}/messages`);
    },

    sendMessage: async (forumId: string, content: string): Promise<{ message: ForumMessage }> => {
      return fetchWithAuth(`/api/forums/${forumId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    },
  },

  quizzes: {
    getAll: async (): Promise<{ quizzes: Quiz[] }> => {
      return fetchWithAuth('/api/quizzes');
    },

    create: async (quizData: {
      title: string;
      description?: string;
      subject: string;
      questions: any[];
    }): Promise<{ quiz: Quiz }> => {
      return fetchWithAuth('/api/quizzes', {
        method: 'POST',
        body: JSON.stringify(quizData),
      });
    },

    submit: async (quizId: string, answers: Record<string, string[]>): Promise<any> => {
      return fetchWithAuth(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
      });
    },

    getLeaderboard: async (quizId: string): Promise<{ leaderboard: QuizSubmission[] }> => {
      return fetchWithAuth(`/api/quizzes/${quizId}/leaderboard`);
    },

    getGlobalLeaderboard: async (): Promise<any> => {
      return fetchWithAuth('/api/leaderboard/global');
    },
  },

  polls: {
    getAll: async (): Promise<{ polls: Poll[] }> => {
      return fetchWithAuth('/api/polls');
    },

    create: async (pollData: {
      question: string;
      description?: string;
      options: string[];
    }): Promise<{ poll: Poll }> => {
      return fetchWithAuth('/api/polls', {
        method: 'POST',
        body: JSON.stringify(pollData),
      });
    },

    vote: async (pollId: string, optionId: string): Promise<{ poll: Poll }> => {
      return fetchWithAuth(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ optionId }),
      });
    },
  },

  admin: {
    getUsers: async (): Promise<{ users: any[] }> => {
      return fetchWithAuth('/api/admin/users');
    },

    banUser: async (
      userId: string,
      duration: '1d' | '3d' | '14d' | 'permanent',
      reason?: string
    ): Promise<{ user: any; message: string }> => {
      return fetchWithAuth(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        body: JSON.stringify({ duration, reason }),
      });
    },

    unbanUser: async (userId: string): Promise<{ user: any; message: string }> => {
      return fetchWithAuth(`/api/admin/users/${userId}/unban`, {
        method: 'POST',
      });
    },

    restrictUser: async (
      userId: string,
      isRestricted: boolean,
      reason?: string
    ): Promise<{ user: any; message: string }> => {
      return fetchWithAuth(`/api/admin/users/${userId}/restrict`, {
        method: 'POST',
        body: JSON.stringify({ isRestricted, reason }),
      });
    },

    deleteUser: async (userId: string): Promise<{ success: boolean; id: string }> => {
      return fetchWithAuth(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
    },
  },

  notifications: {
    getAll: async (): Promise<{ notifications: AppNotification[] }> => {
      return fetchWithAuth('/api/notifications');
    },
    markAsRead: async (id: string): Promise<{ success: boolean }> => {
      return fetchWithAuth(`/api/notifications/${id}/read`, {
        method: 'POST',
      });
    },
    markAllAsRead: async (): Promise<{ success: boolean }> => {
      return fetchWithAuth('/api/notifications/read-all', {
        method: 'POST',
      });
    },
    clearAll: async (): Promise<{ success: boolean }> => {
      return fetchWithAuth('/api/notifications', {
        method: 'DELETE',
      });
    },
    sendTestNotification: async (): Promise<{ notification: AppNotification }> => {
      return fetchWithAuth('/api/notifications/test', {
        method: 'POST',
      });
    },
  },
};

// Real-time EventSource listener
export function subscribeToLiveUpdates(onEvent: (event: string, payload: any) => void) {
  let eventSource: EventSource | null = null;
  let retryTimeout: any = null;

  function connect() {
    try {
      eventSource = new EventSource('/api/live');

      eventSource.addEventListener('update', (e) => {
        try {
          const data = JSON.parse(e.data);
          onEvent(data.event, data.payload);
        } catch (err) {
          console.error('Error parsing live event payload:', err);
        }
      });

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
        }
        retryTimeout = setTimeout(connect, 3000);
      };
    } catch (e) {
      retryTimeout = setTimeout(connect, 4000);
    }
  }

  connect();

  return () => {
    if (eventSource) {
      eventSource.close();
    }
    if (retryTimeout) {
      clearTimeout(retryTimeout);
    }
  };
}

// Helper to convert File to Base64 Data URL
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
