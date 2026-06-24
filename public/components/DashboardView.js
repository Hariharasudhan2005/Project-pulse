import { AppState } from '../state.js';

export function renderDashboardView(container, state) {
  const currentProject = AppState.getCurrentProject() || { name: 'No Project Selected', description: '' };
  const tasks = AppState.getTasksForCurrentProject();
  const users = state.users;

  // Compute metrics
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const inReviewTasks = tasks.filter(t => t.status === 'in-review').length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Workload data (count of in-progress or todo tasks per user)
  const workload = {};
  users.forEach(u => {
    workload[u.id] = { name: u.name, avatar: u.avatar, count: 0 };
  });
  tasks.forEach(t => {
    if (t.status !== 'done' && workload[t.assigneeId]) {
      workload[t.assigneeId].count += 1;
    }
  });

  // Recent comments across all project tasks
  const activities = [];
  tasks.forEach(t => {
    (t.comments || []).forEach(c => {
      activities.push({
        type: 'comment',
        userName: c.userName,
        taskTitle: t.title,
        text: c.text,
        timestamp: new Date(c.timestamp),
        taskId: t.id
      });
    });
    (t.attachments || []).forEach(a => {
      activities.push({
        type: 'attachment',
        userName: 'Someone', // Mock name
        taskTitle: t.title,
        text: `attached file "${a.name}"`,
        timestamp: new Date(a.date),
        taskId: t.id
      });
    });
  });

  // Sort activities by latest first
  activities.sort((a, b) => b.timestamp - a.timestamp);
  const recentActivities = activities.slice(0, 5);

  container.innerHTML = `
    <div class="view-container">
      <!-- Hero Banner -->
      <div class="dashboard-hero">
        <h2>Welcome back to ProjectPulse</h2>
        <p>${currentProject.description || 'Manage tasks, collaborate with your team, and view reports.'}</p>
        <div class="dashboard-hero-glow"></div>
      </div>

      <!-- Metrics Grid -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span>Total Tasks</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <div class="metric-value">${totalTasks}</div>
          <div class="metric-footer">Across all stages</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span>In Progress</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <div class="metric-value">${inProgressTasks}</div>
          <div class="metric-footer">Active execution</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span>In Review</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m10 15 5-3-5-3v6Z"/></svg>
          </div>
          <div class="metric-value">${inReviewTasks}</div>
          <div class="metric-footer">Awaiting approval</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span>Completion Rate</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
          </div>
          <div class="metric-value">${completionRate}%</div>
          <div class="metric-footer">${completedTasks} of ${totalTasks} completed</div>
        </div>
      </div>

      <!-- Detail Widgets Grid -->
      <div class="recent-activity-section">
        <!-- Activity Stream -->
        <div class="activity-panel">
          <h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Recent Activity
          </h3>
          <div class="activity-list">
            ${recentActivities.length > 0 ? recentActivities.map(act => {
              const formattedTime = act.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return `
                <div class="activity-item" style="cursor: pointer;" data-task-id="${act.taskId}">
                  <div class="activity-icon-wrapper">
                    ${act.type === 'comment' ? 
                      `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>` :
                      `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`
                    }
                  </div>
                  <div class="activity-details">
                    <p><strong>${act.userName}</strong> on <em>${act.taskTitle}</em>: "${act.text}"</p>
                    <div class="activity-time">${formattedTime} - ${act.timestamp.toLocaleDateString()}</div>
                  </div>
                </div>
              `;
            }).join('') : `
              <div style="color: var(--text-dimmed); text-align: center; padding: 20px 0;">No recent activity in this project.</div>
            `}
          </div>
        </div>

        <!-- Workload allocation Widget -->
        <div class="workload-panel">
          <h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Active Workload
          </h3>
          <div class="activity-list">
            ${Object.values(workload).map(user => `
              <div class="activity-item" style="align-items: center; border: none; padding-bottom: 0;">
                <div class="avatar-circle" style="width: 36px; height: 36px; font-size: 0.9rem; flex-shrink: 0; background: var(--secondary); box-shadow: none;">${user.avatar}</div>
                <div class="activity-details" style="flex-grow: 1;">
                  <p style="font-weight: 600; font-size: 0.9rem;">${user.name}</p>
                </div>
                <span class="task-count-badge" style="padding: 4px 10px; background: ${user.count > 2 ? 'var(--priority-high-bg)' : 'var(--bg-surface-active)'}; color: ${user.count > 2 ? 'var(--priority-high-text)' : 'inherit'}">${user.count} tasks</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  // Event handler for clicking activity items to open task details modal
  container.querySelectorAll('.activity-item').forEach(el => {
    const taskId = el.getAttribute('data-task-id');
    if (taskId) {
      el.addEventListener('click', () => {
        AppState.setActiveTask(taskId);
      });
    }
  });
}
