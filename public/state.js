/* ==========================================================================
   ProjectPulse Reactive State Manager (state.js)
   ========================================================================== */

const API_BASE = '/api';

class AppStateManager {
  constructor() {
    const savedUser = sessionStorage.getItem('project_pulse_user');
    const parsedUser = savedUser ? JSON.parse(savedUser) : null;

    this.state = {
      users: [],
      projects: [],
      tasks: [],
      messages: [],
      currentProjectId: 'p1',
      currentUserId: parsedUser ? parsedUser.id : null,
      currentUser: parsedUser,
      sessionUsername: parsedUser ? parsedUser.username : null,
      currentView: 'dashboard',
      searchQuery: '',
      activeTaskId: null
    };
    this.listeners = [];
  }

  // Authentication Helpers
  async login(username, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.success && data.user) {
        this.state.currentUser = data.user;
        this.state.currentUserId = data.user.id;
        this.state.sessionUsername = data.user.username;
        sessionStorage.setItem('project_pulse_user', JSON.stringify(data.user));
        await this.fetchAllData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  }

  async register(username, password, name, role) {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name, role })
      });
      return res.ok;
    } catch (err) {
      console.error('Registration error:', err);
      return false;
    }
  }

  logout() {
    sessionStorage.removeItem('project_pulse_user');
    this.state.currentUser = null;
    this.state.currentUserId = null;
    this.state.sessionUsername = null;
    this.state.users = [];
    this.state.projects = [];
    this.state.tasks = [];
    this.state.messages = [];
    this.notify();
  }

  apiHeaders() {
    const headers = {};
    if (this.state.sessionUsername) {
      headers['X-User-Session'] = this.state.sessionUsername;
    }
    return headers;
  }


  // Register callback for UI re-renders
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Setters
  setView(view) {
    this.state.currentView = view;
    this.notify();
  }

  setCurrentProject(projectId) {
    this.state.currentProjectId = projectId;
    this.notify();
  }

  setCurrentUser(userId) {
    this.state.currentUserId = userId;
    this.notify();
  }

  setSearchQuery(query) {
    this.state.searchQuery = query;
    this.notify();
  }

  setActiveTask(taskId) {
    this.state.activeTaskId = taskId;
    this.notify();
  }

  // Getters
  getCurrentProject() {
    return this.state.projects.find(p => p.id === this.state.currentProjectId) || this.state.projects[0];
  }

  getCurrentUser() {
    return this.state.users.find(u => u.id === this.state.currentUserId) || this.state.users[0];
  }

  getTasksForCurrentProject() {
    const pTasks = this.state.tasks.filter(t => t.projectId === this.state.currentProjectId);
    if (!this.state.searchQuery) return pTasks;
    const q = this.state.searchQuery.toLowerCase();
    return pTasks.filter(t => 
      t.title.toLowerCase().includes(q) || 
      t.description.toLowerCase().includes(q)
    );
  }

  getMessagesForCurrentProject() {
    return this.state.messages.filter(m => m.projectId === this.state.currentProjectId);
  }

  // ==========================================================================
  // API Calls to Flask Server
  // ==========================================================================

  async fetchAllData() {
    if (!this.state.sessionUsername) return;
    try {
      const res = await fetch(`${API_BASE}/data`, {
        headers: this.apiHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      
      this.state.users = data.users || [];
      this.state.projects = data.projects || [];
      this.state.tasks = data.tasks || [];
      this.state.messages = data.messages || [];
      
      // Default fallback
      if (this.state.projects.length > 0 && !this.state.currentProjectId) {
        this.state.currentProjectId = this.state.projects[0].id;
      }
      
      this.notify();
    } catch (err) {
      console.error('API Error in fetchAllData:', err);
    }
  }

  async createTask(taskData) {
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.apiHeaders() },
        body: JSON.stringify({
          ...taskData,
          projectId: this.state.currentProjectId
        })
      });
      if (!res.ok) throw new Error('Failed to create task');
      const newTask = await res.json();
      
      this.state.tasks.push(newTask);
      this.notify();
      return newTask;
    } catch (err) {
      console.error('API Error in createTask:', err);
    }
  }

  async updateTask(taskId, updates) {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...this.apiHeaders() },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update task');
      const updatedTask = await res.json();
      
      // Update local state array
      this.state.tasks = this.state.tasks.map(t => t.id === taskId ? updatedTask : t);
      this.notify();
      return updatedTask;
    } catch (err) {
      console.error('API Error in updateTask:', err);
    }
  }

  async deleteTask(taskId) {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: this.apiHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete task');
      
      this.state.tasks = this.state.tasks.filter(t => t.id !== taskId);
      if (this.state.activeTaskId === taskId) {
        this.state.activeTaskId = null;
      }
      this.notify();
    } catch (err) {
      console.error('API Error in deleteTask:', err);
    }
  }

  async addComment(taskId, commentText) {
    if (!commentText.trim()) return;
    const currentUser = this.getCurrentUser();
    
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.apiHeaders() },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          text: commentText,
          timestamp: new Date().toISOString()
        })
      });
      if (!res.ok) throw new Error('Failed to add comment');
      const newComment = await res.json();
      
      // Update local task comments
      this.state.tasks = this.state.tasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            comments: [...(t.comments || []), newComment]
          };
        }
        return t;
      });
      this.notify();
    } catch (err) {
      console.error('API Error in addComment:', err);
    }
  }

  async addAttachment(taskId, fileName, fileSize) {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.apiHeaders() },
        body: JSON.stringify({
          name: fileName,
          size: fileSize,
          date: new Date().toISOString().split('T')[0]
        })
      });
      if (!res.ok) throw new Error('Failed to add attachment');
      const newAttachment = await res.json();
      
      this.state.tasks = this.state.tasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            attachments: [...(t.attachments || []), newAttachment]
          };
        }
        return t;
      });
      this.notify();
    } catch (err) {
      console.error('API Error in addAttachment:', err);
    }
  }

  async sendMessage(messageText) {
    if (!messageText.trim()) return;
    const currentUser = this.getCurrentUser();
    
    try {
      const res = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.apiHeaders() },
        body: JSON.stringify({
          projectId: this.state.currentProjectId,
          userId: currentUser.id,
          userName: currentUser.name,
          text: messageText,
          timestamp: new Date().toISOString()
        })
      });
      if (!res.ok) throw new Error('Failed to post message');
      const newMsg = await res.json();
      
      this.state.messages.push(newMsg);
      this.notify();
    } catch (err) {
      console.error('API Error in sendMessage:', err);
    }
  }
}

// Export a single instance
export const AppState = new AppStateManager();
