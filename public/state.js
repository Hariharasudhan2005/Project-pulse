/* ==========================================================================
   ProjectPulse Reactive State Manager (state.js)
   ========================================================================== */

const API_BASE = '/api';

class AppStateManager {
  constructor() {
    this.state = {
      users: [],
      projects: [],
      tasks: [],
      messages: [],
      currentProjectId: 'p1',
      currentUserId: 'u1',
      currentView: 'dashboard',
      searchQuery: '',
      activeTaskId: null // For details modal
    };
    this.listeners = [];
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
    try {
      const res = await fetch(`${API_BASE}/data`);
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, { method: 'DELETE' });
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
