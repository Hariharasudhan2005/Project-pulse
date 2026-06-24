import { AppState } from '../state.js';

// Format file size
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// 1. RENDER CREATE TASK MODAL
export function renderCreateTaskModal(container, state) {
  const users = state.users;
  const userOptions = users.map(u => `<option value="${u.id}">${u.name} (${u.role})</option>`).join('');

  container.innerHTML = `
    <div class="modal-overlay" id="create-task-modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Create New Task</h3>
          <button class="modal-close-btn" id="create-modal-close">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>
        
        <form id="create-task-form">
          <div class="modal-body">
            <div class="form-group">
              <label for="task-title">Task Title</label>
              <input type="text" id="task-title" class="form-input" placeholder="What needs to be done?" required>
            </div>
            
            <div class="form-group">
              <label for="task-desc">Description</label>
              <textarea id="task-desc" class="form-textarea" placeholder="Add detailed context for the assignee..."></textarea>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="task-priority">Priority</label>
                <select id="task-priority" class="form-select">
                  <option value="low">Low</option>
                  <option value="medium" selected>Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div class="form-group">
                <label for="task-status">Initial Status</label>
                <select id="task-status" class="form-select">
                  <option value="todo" selected>To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="in-review">In Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="task-assignee">Assign To</label>
                <select id="task-assignee" class="form-select">
                  ${userOptions}
                </select>
              </div>

              <div class="form-group">
                <label for="task-due-date">Due Date</label>
                <input type="date" id="task-due-date" class="form-input">
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn-secondary" id="create-modal-cancel">Cancel</button>
            <button type="submit" class="btn-primary">Create Task</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Attach handlers
  const overlay = container.querySelector('#create-task-modal-overlay');
  const closeBtn = container.querySelector('#create-modal-close');
  const cancelBtn = container.querySelector('#create-modal-cancel');
  const form = container.querySelector('#create-task-form');

  const closeModal = () => {
    container.innerHTML = '';
  };

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = form.querySelector('#task-title').value;
    const description = form.querySelector('#task-desc').value;
    const priority = form.querySelector('#task-priority').value;
    const status = form.querySelector('#task-status').value;
    const assigneeId = form.querySelector('#task-assignee').value;
    const dueDate = form.querySelector('#task-due-date').value;

    AppState.createTask({
      title,
      description,
      priority,
      status,
      assigneeId,
      dueDate,
      subtasks: [],
      comments: [],
      attachments: []
    }).then(() => {
      closeModal();
      if (status === 'done' && window.confetti) {
        window.confetti({ particleCount: 80, spread: 60 });
      }
    });
  });
}

// 2. RENDER VIEW / EDIT TASK DETAIL MODAL
export function renderTaskDetailModal(container, state) {
  const task = state.tasks.find(t => t.id === state.activeTaskId);
  if (!task) return;

  const users = state.users;
  const currentSimUser = AppState.getCurrentUser();

  const assigneeOptions = users.map(u => 
    `<option value="${u.id}" ${u.id === task.assigneeId ? 'selected' : ''}>${u.name}</option>`
  ).join('');

  const priorityOptions = ['low', 'medium', 'high'].map(p => 
    `<option value="${p}" ${p === task.priority ? 'selected' : ''}>${p.toUpperCase()}</option>`
  ).join('');

  const statusOptions = [
    { id: 'todo', name: 'To Do' },
    { id: 'in-progress', name: 'In Progress' },
    { id: 'in-review', name: 'In Review' },
    { id: 'done', name: 'Done' }
  ].map(s => 
    `<option value="${s.id}" ${s.id === task.status ? 'selected' : ''}>${s.name}</option>`
  ).join('');

  // Render Subtask list
  const subtasks = task.subtasks || [];
  const subtasksHTML = subtasks.map(s => `
    <div class="checklist-item ${s.completed ? 'completed' : ''}" data-subtask-id="${s.id}">
      <div class="checklist-checkbox">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <span class="checklist-text">${s.title}</span>
    </div>
  `).join('');

  // Render Comment list
  const comments = task.comments || [];
  const commentsHTML = comments.map(c => {
    let commentTime = '';
    if (c.timestamp) {
      const date = new Date(c.timestamp);
      commentTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString();
    }
    return `
      <div class="comment-item">
        <div class="comment-header">
          <span class="comment-author">${c.userName}</span>
          <span class="comment-time">${commentTime}</span>
        </div>
        <p class="comment-text">${c.text}</p>
      </div>
    `;
  }).join('');

  // Render Attachment list
  const attachments = task.attachments || [];
  const attachmentsHTML = attachments.map(a => `
    <div class="attachment-item">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-paperclip"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
      <div class="attachment-info">
        <span class="attachment-name" title="${a.name}">${a.name}</span>
        <span class="attachment-size">${a.size} • ${a.date}</span>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="modal-overlay" id="detail-task-modal-overlay">
      <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
          <h3>Task Details</h3>
          <div style="display: flex; align-items: center; gap: 12px;">
            <button class="btn-secondary" id="detail-delete-btn" style="padding: 6px 14px; font-size: 0.8rem; background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); color: #f87171;">
              Delete Task
            </button>
            <button class="modal-close-btn" id="detail-modal-close">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div class="modal-body">
          <div class="task-detail-grid">
            <!-- Left Panel (Title, Desc, Subtasks, Comments) -->
            <div class="task-detail-main">
              <div class="form-group">
                <label for="detail-title-input">Title</label>
                <input type="text" id="detail-title-input" class="form-input" style="font-size: 1.1rem; font-weight: 600;" value="${task.title}">
              </div>

              <div class="form-group">
                <label for="detail-desc-input">Description</label>
                <textarea id="detail-desc-input" class="form-textarea" style="min-height: 80px;">${task.description || ''}</textarea>
              </div>

              <!-- Checklist Subtasks Section -->
              <div class="form-group">
                <span class="detail-section-title">Checklist</span>
                <div class="checklist-list">
                  ${subtasksHTML}
                </div>
                <div class="add-subtask-wrapper">
                  <input type="text" id="new-subtask-input" class="add-subtask-input" placeholder="Add checklist item...">
                  <button id="add-subtask-btn" class="add-subtask-btn-small">Add</button>
                </div>
              </div>

              <!-- Comments Section -->
              <div class="form-group">
                <span class="detail-section-title">Comments</span>
                <div class="comments-list" id="detail-comments-log">
                  ${comments.length > 0 ? commentsHTML : '<p style="color: var(--text-dimmed); font-size: 0.85rem; font-style: italic;">No comments yet. Write one below!</p>'}
                </div>
                <div class="comment-input-wrapper">
                  <textarea id="new-comment-input" class="comment-textarea-small" placeholder="Ask a question or post update..."></textarea>
                  <button id="add-comment-btn" class="comment-submit-btn-small">Send</button>
                </div>
              </div>
            </div>

            <!-- Right Panel (Status, Assignee, Due Date, Attachments) -->
            <div class="task-detail-sidebar">
              <div class="form-group">
                <label for="detail-status-select">Status</label>
                <select id="detail-status-select" class="form-select">
                  ${statusOptions}
                </select>
              </div>

              <div class="form-group">
                <label for="detail-assignee-select">Assignee</label>
                <select id="detail-assignee-select" class="form-select">
                  ${assigneeOptions}
                </select>
              </div>

              <div class="form-group">
                <label for="detail-priority-select">Priority</label>
                <select id="detail-priority-select" class="form-select">
                  ${priorityOptions}
                </select>
              </div>

              <div class="form-group">
                <label for="detail-due-date-input">Due Date</label>
                <input type="date" id="detail-due-date-input" class="form-input" value="${task.dueDate || ''}">
              </div>

              <!-- File Sharing Attachments Section -->
              <div class="form-group" style="margin-top: 10px;">
                <span class="detail-section-title">Attachments</span>
                <div class="attachments-list">
                  ${attachmentsHTML}
                </div>
                
                <div class="upload-btn-wrapper">
                  <button class="upload-btn-mock">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                    Attach File
                  </button>
                  <input type="file" id="detail-file-upload-input" class="upload-input-hidden">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Scroll comments log to bottom
  const commentsLog = container.querySelector('#detail-comments-log');
  if (commentsLog) {
    commentsLog.scrollTop = commentsLog.scrollHeight;
  }

  // Attach handlers
  const overlay = container.querySelector('#detail-task-modal-overlay');
  const closeBtn = container.querySelector('#detail-modal-close');
  const deleteBtn = container.querySelector('#detail-delete-btn');

  const closeModal = () => {
    AppState.setActiveTask(null);
  };

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Delete task
  deleteBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete this task?')) {
      AppState.deleteTask(task.id).then(() => closeModal());
    }
  });

  // Track edits of main inputs (Title, Description, Status, Assignee, Priority, Due Date)
  const saveTaskEdits = () => {
    const title = container.querySelector('#detail-title-input').value;
    const description = container.querySelector('#detail-desc-input').value;
    const status = container.querySelector('#detail-status-select').value;
    const assigneeId = container.querySelector('#detail-assignee-select').value;
    const priority = container.querySelector('#detail-priority-select').value;
    const dueDate = container.querySelector('#detail-due-date-input').value;

    AppState.updateTask(task.id, {
      title,
      description,
      status,
      assigneeId,
      priority,
      dueDate
    }).then(() => {
      // Trigger confetti if status updated to done in view modal
      if (status === 'done' && task.status !== 'done' && window.confetti) {
        window.confetti({ particleCount: 70, spread: 60 });
      }
    });
  };

  // Blur listeners for text inputs
  container.querySelector('#detail-title-input').addEventListener('blur', saveTaskEdits);
  container.querySelector('#detail-desc-input').addEventListener('blur', saveTaskEdits);

  // Change listeners for dropdowns/dates
  container.querySelector('#detail-status-select').addEventListener('change', saveTaskEdits);
  container.querySelector('#detail-assignee-select').addEventListener('change', saveTaskEdits);
  container.querySelector('#detail-priority-select').addEventListener('change', saveTaskEdits);
  container.querySelector('#detail-due-date-input').addEventListener('change', saveTaskEdits);

  // Toggle checklist completed state
  container.querySelectorAll('.checklist-item').forEach(item => {
    item.addEventListener('click', () => {
      const subtaskId = item.getAttribute('data-subtask-id');
      const updatedSubtasks = subtasks.map(s => {
        if (s.id === subtaskId) {
          const completed = !s.completed;
          // Confetti for subtask complete
          if (completed && window.confetti) {
            window.confetti({ particleCount: 20, spread: 30, origin: { y: 0.8 } });
          }
          return { ...s, completed };
        }
        return s;
      });
      AppState.updateTask(task.id, { subtasks: updatedSubtasks });
    });
  });

  // Add checklist item
  const newSubtaskInput = container.querySelector('#new-subtask-input');
  const addSubtaskBtn = container.querySelector('#add-subtask-btn');
  
  const handleAddSubtask = () => {
    const text = newSubtaskInput.value.trim();
    if (text) {
      const newSub = {
        id: `s${Date.now()}`,
        title: text,
        completed: false
      };
      const updatedSubtasks = [...subtasks, newSub];
      AppState.updateTask(task.id, { subtasks: updatedSubtasks });
      newSubtaskInput.value = '';
    }
  };

  addSubtaskBtn.addEventListener('click', handleAddSubtask);
  newSubtaskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddSubtask();
  });

  // Add Comment
  const newCommentInput = container.querySelector('#new-comment-input');
  const addCommentBtn = container.querySelector('#add-comment-btn');

  const handleAddComment = () => {
    const text = newCommentInput.value.trim();
    if (text) {
      AppState.addComment(task.id, text);
      newCommentInput.value = '';
    }
  };

  addCommentBtn.addEventListener('click', handleAddComment);
  newCommentInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  });

  // Add Attachment (File Upload Simulation)
  const fileInput = container.querySelector('#detail-file-upload-input');
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const name = file.name;
      const sizeStr = formatBytes(file.size);
      AppState.addAttachment(task.id, name, sizeStr);
    }
  });
}
