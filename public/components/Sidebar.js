import { AppState } from '../state.js';

export function renderSidebar(container, state) {
  const currentView = state.currentView;
  const currentProjectId = state.currentProjectId;
  const projects = state.projects;

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-dashboard"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>` },
    { id: 'kanban', name: 'Kanban Board', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-kanban"><path d="M6 3v12"/><path d="M12 3v6"/><path d="M18 3v18"/></svg>` },
    { id: 'list', name: 'Task List', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list-todo"><rect x="3" y="5" width="6" height="6" rx="1"/><rect x="3" y="13" width="6" height="6" rx="1"/><path d="M13 8h8"/><path d="M13 16h8"/></svg>` },
    { id: 'calendar', name: 'Calendar', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>` },
    { id: 'chat', name: 'Team Chat', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>` },
    { id: 'analytics', name: 'Analytics', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bar-chart-3"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M12 17V5"/><path d="M6 17v-4"/></svg>` }
  ];

  let projectOptionsHTML = projects.map(p => 
    `<option value="${p.id}" ${p.id === currentProjectId ? 'selected' : ''}>${p.name}</option>`
  ).join('');

  container.innerHTML = `
    <div class="sidebar">
      <div class="sidebar-logo">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
        <h1>ProjectPulse</h1>
      </div>
      
      <ul class="sidebar-menu">
        ${menuItems.map(item => `
          <li class="sidebar-item ${item.id === currentView ? 'active' : ''}" data-view="${item.id}">
            ${item.icon}
            <span>${item.name}</span>
          </li>
        `).join('')}
      </ul>

      <div class="sidebar-project-selector">
        <label for="project-select">Active Project</label>
        <select id="project-select" class="project-select-dropdown">
          ${projectOptionsHTML}
        </select>
      </div>
    </div>
  `;

  // Attach event listeners
  container.querySelectorAll('.sidebar-item').forEach(el => {
    el.addEventListener('click', () => {
      const view = el.getAttribute('data-view');
      AppState.setView(view);
    });
  });

  const select = container.querySelector('#project-select');
  if (select) {
    select.addEventListener('change', (e) => {
      AppState.setCurrentProject(e.target.value);
    });
  }
}
