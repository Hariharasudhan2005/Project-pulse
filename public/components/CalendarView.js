import { AppState } from '../state.js';

export function renderCalendarView(container, state) {
  const tasks = AppState.getTasksForCurrentProject();

  // Set default view month/year to June 2026 (matches current time metadata)
  const viewYear = 2026;
  const viewMonth = 5; // 0-indexed, so 5 is June
  const monthName = 'June 2026';

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Start of the calendar grid:
  // June 1, 2026 is a Monday.
  // So the Sunday before June 1 is May 31, 2026.
  // May 31 is day number 31.
  const gridDays = [];

  // Add Sunday, May 31st
  gridDays.push({ day: 31, month: 4, year: 2026, otherMonth: true });

  // Add June 1 to June 30
  for (let i = 1; i <= 30; i++) {
    gridDays.push({ day: i, month: 5, year: 2026, otherMonth: false });
  }

  // Add July 1 to July 11 (to make 42 grid cells - 6 rows)
  for (let i = 1; i <= 11; i++) {
    gridDays.push({ day: i, month: 6, year: 2026, otherMonth: true });
  }

  const cellsHTML = gridDays.map(cell => {
    // Format cell date string: YYYY-MM-DD
    const mStr = String(cell.month + 1).padStart(2, '0');
    const dStr = String(cell.day).padStart(2, '0');
    const dateStr = `${cell.year}-${mStr}-${dStr}`;

    // Find tasks due on this date
    const dayTasks = tasks.filter(t => t.dueDate === dateStr);

    const taskTagsHTML = dayTasks.map(t => `
      <div class="calendar-task-tag" data-task-id="${t.id}" title="${t.title}">
        ${t.title}
      </div>
    `).join('');

    // Highlight today (June 24, 2026)
    const isToday = cell.day === 24 && cell.month === 5 && cell.year === 2026;

    return `
      <div class="calendar-cell ${cell.otherMonth ? 'other-month' : ''}" style="${isToday ? 'border-color: var(--primary); background: rgba(99, 102, 241, 0.08);' : ''}">
        <div class="calendar-day-number" style="${isToday ? 'color: var(--primary); font-size: 0.9rem;' : ''}">
          ${cell.day} ${isToday ? '<span style="font-size: 0.65rem; padding: 2px 6px; border-radius: 10px; background: var(--primary); color: #fff; margin-left: 4px;">Today</span>' : ''}
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px; overflow-y: auto; flex-grow: 1;">
          ${taskTagsHTML}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="view-container">
      <div class="calendar-wrapper">
        <div class="calendar-header">
          <h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; vertical-align: middle;"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            ${monthName}
          </h3>
          <div style="font-size: 0.85rem; color: var(--text-dimmed);">June 2026 Schedule</div>
        </div>

        <div class="calendar-grid">
          ${dayHeaders.map(h => `<div class="calendar-day-header">${h}</div>`).join('')}
          ${cellsHTML}
        </div>
      </div>
    </div>
  `;

  // Attach click listener to task tags
  container.querySelectorAll('.calendar-task-tag').forEach(tag => {
    tag.addEventListener('click', (e) => {
      e.stopPropagation(); // prevent grid cell triggers if any
      const taskId = tag.getAttribute('data-task-id');
      AppState.setActiveTask(taskId);
    });
  });
}
