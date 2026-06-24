import { AppState } from '../state.js';

export function renderKanbanBoard(container, state) {
  const tasks = AppState.getTasksForCurrentProject();
  const users = state.users;

  const columns = [
    { id: 'todo', name: 'To Do', class: 'todo' },
    { id: 'in-progress', name: 'In Progress', class: 'inprogress' },
    { id: 'in-review', name: 'In Review', class: 'inreview' },
    { id: 'done', name: 'Done', class: 'done' }
  ];

  // Organize tasks by column status
  const tasksByColumn = {
    'todo': [],
    'in-progress': [],
    'in-review': [],
    'done': []
  };
  tasks.forEach(t => {
    if (tasksByColumn[t.status]) {
      tasksByColumn[t.status].push(t);
    } else {
      tasksByColumn['todo'].push(t); // fallback
    }
  });

  const columnsHTML = columns.map(col => {
    const colTasks = tasksByColumn[col.id];
    const cardsHTML = colTasks.map(t => {
      // Priority badge
      const priorityClass = t.priority === 'high' ? 'high' : t.priority === 'medium' ? 'medium' : 'low';
      
      // Progress calculation
      const subtasks = t.subtasks || [];
      const completedSubtasks = subtasks.filter(s => s.completed).length;
      const progressPercent = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;
      const showProgress = subtasks.length > 0;
      
      // Assignee avatar
      const assignee = users.find(u => u.id === t.assigneeId) || { name: 'Unassigned', avatar: '?' };

      // Date check
      let dateHTML = '';
      if (t.dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(t.dueDate);
        due.setHours(0, 0, 0, 0);
        const isOverdue = due < today && t.status !== 'done';
        
        dateHTML = `
          <div class="task-date-info ${isOverdue ? 'overdue' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <span>${t.dueDate}</span>
          </div>
        `;
      }

      return `
        <div class="task-card" draggable="true" data-task-id="${t.id}">
          <div class="priority-badge ${priorityClass}">${t.priority}</div>
          <h4 class="task-card-title">${t.title}</h4>
          <p class="task-card-desc">${t.description || 'No description provided.'}</p>
          
          ${showProgress ? `
            <div class="subtasks-progress-container">
              <div class="subtasks-progress-info">
                <span>Subtasks</span>
                <span>${completedSubtasks}/${subtasks.length}</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
              </div>
            </div>
          ` : ''}

          <div class="task-card-footer">
            ${dateHTML}
            <div class="task-card-assignee" title="${assignee.name} (${assignee.role})">
              <div class="avatar-circle" style="width: 26px; height: 26px; font-size: 0.75rem; background: var(--primary); box-shadow: none;">${assignee.avatar}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="kanban-column" data-status="${col.id}">
        <div class="column-header">
          <div class="column-title">
            <span class="column-dot ${col.class}"></span>
            <span>${col.name}</span>
          </div>
          <span class="task-count-badge">${colTasks.length}</span>
        </div>
        
        <div class="column-cards-wrapper">
          ${cardsHTML}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="view-container">
      <div class="kanban-controls">
        <div class="search-wrapper">
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" id="task-search" class="search-input" placeholder="Search tasks..." value="${state.searchQuery}">
        </div>
        <button id="add-task-trigger" class="add-task-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          New Task
        </button>
      </div>

      <div class="kanban-grid">
        ${columnsHTML}
      </div>
    </div>
  `;

  // Attach Event Listeners
  // 1. Search Query
  const searchInput = container.querySelector('#task-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      AppState.setSearchQuery(e.target.value);
    });
  }

  // 2. Open Add Task Dialog
  const addBtn = container.querySelector('#add-task-trigger');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      openCreateTaskModal();
    });
  }

  // 3. Click Task Card to open Task Detail Modal
  container.querySelectorAll('.task-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't open detail if we are starting a drag
      if (card.classList.contains('dragging')) return;
      const taskId = card.getAttribute('data-task-id');
      AppState.setActiveTask(taskId);
    });
  });

  // 4. Drag & Drop Event bindings
  const cards = container.querySelectorAll('.task-card');
  const cardWrappers = container.querySelectorAll('.column-cards-wrapper');

  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', card.getAttribute('data-task-id'));
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });
  });

  cardWrappers.forEach(wrapper => {
    const column = wrapper.closest('.kanban-column');
    const status = column.getAttribute('data-status');

    wrapper.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      column.style.borderColor = 'var(--primary)';
    });

    wrapper.addEventListener('dragleave', () => {
      column.style.borderColor = 'var(--border-color)';
    });

    wrapper.addEventListener('drop', (e) => {
      e.preventDefault();
      column.style.borderColor = 'var(--border-color)';
      const taskId = e.dataTransfer.getData('text/plain');
      if (taskId) {
        AppState.updateTask(taskId, { status: status }).then(() => {
          // Play confetti if task dragged to "done"
          if (status === 'done' && window.confetti) {
            window.confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
          }
        });
      }
    });
  });
}

// Global modal helpers for creating tasks (detailed later in app.js or TaskModal.js)
function openCreateTaskModal() {
  const event = new CustomEvent('open-create-modal');
  document.dispatchEvent(event);
}
