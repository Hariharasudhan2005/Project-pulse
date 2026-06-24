import { AppState } from '../state.js';

export function renderListView(container, state) {
  const tasks = AppState.getTasksForCurrentProject();
  const users = state.users;

  const tableRows = tasks.map(t => {
    const assignee = users.find(u => u.id === t.assigneeId) || { name: 'Unassigned', avatar: '?' };
    
    // Status text formatter
    let statusText = t.status;
    if (t.status === 'in-progress') statusText = 'In Progress';
    if (t.status === 'in-review') statusText = 'In Review';
    if (t.status === 'todo') statusText = 'To Do';
    if (t.status === 'done') statusText = 'Done';

    return `
      <tr class="task-list-row" data-task-id="${t.id}">
        <td style="font-weight: 600;">${t.title}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="avatar-circle" style="width: 24px; height: 24px; font-size: 0.7rem; background: var(--secondary); box-shadow: none;">${assignee.avatar}</div>
            <span>${assignee.name}</span>
          </div>
        </td>
        <td>
          <div class="priority-badge ${t.priority}">${t.priority}</div>
        </td>
        <td>
          <span class="status-badge ${t.status}">${statusText}</span>
        </td>
        <td style="color: var(--text-muted); font-size: 0.85rem;">
          ${t.dueDate || 'No due date'}
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="view-container">
      <div class="kanban-controls">
        <div class="search-wrapper">
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" id="task-search-list" class="search-input" placeholder="Search tasks..." value="${state.searchQuery}">
        </div>
        <button id="add-task-trigger-list" class="add-task-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          New Task
        </button>
      </div>

      <div class="list-view-table-wrapper">
        <table class="list-table">
          <thead>
            <tr>
              <th>Task Title</th>
              <th>Assignee</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.length > 0 ? tableRows : `
              <tr>
                <td colspan="5" style="text-align: center; color: var(--text-dimmed); padding: 40px 0;">
                  No tasks found matches this criteria.
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Search input binding
  const searchInput = container.querySelector('#task-search-list');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      AppState.setSearchQuery(e.target.value);
    });
  }

  // Create Task button binding
  const addBtn = container.querySelector('#add-task-trigger-list');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const event = new CustomEvent('open-create-modal');
      document.dispatchEvent(event);
    });
  }

  // Row selection handler
  container.querySelectorAll('.task-list-row').forEach(row => {
    row.addEventListener('click', () => {
      const taskId = row.getAttribute('data-task-id');
      AppState.setActiveTask(taskId);
    });
  });
}
