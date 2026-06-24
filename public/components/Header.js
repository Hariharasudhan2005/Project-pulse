import { AppState } from '../state.js';

export function renderHeader(container, state) {
  const currentProject = AppState.getCurrentProject() || { name: 'No Project Selected' };
  const currentUser = AppState.getCurrentUser() || { name: 'Guest', avatar: 'G' };
  const users = state.users;

  const isLightTheme = document.body.classList.contains('light-theme');

  const userOptions = users.map(u => 
    `<option value="${u.id}" ${u.id === state.currentUserId ? 'selected' : ''}>${u.name} (${u.role})</option>`
  ).join('');

  container.innerHTML = `
    <header class="header">
      <div class="header-title-section">
        <h2>${currentProject.name}</h2>
      </div>
      
      <div class="header-actions">
        <!-- Switch Identity Dropdown -->
        <div class="form-group" style="flex-direction: row; align-items: center; gap: 8px; margin: 0;">
          <label style="font-size: 0.75rem; white-space: nowrap;">Simulate User:</label>
          <select id="user-simulate-select" class="project-select-dropdown" style="width: auto; padding: 6px 12px; font-size: 0.8rem;">
            ${userOptions}
          </select>
        </div>

        <!-- Light/Dark Mode Toggle -->
        <button id="theme-toggle" class="theme-toggle-btn" title="Toggle Theme">
          ${isLightTheme ? 
            `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>` : 
            `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`
          }
        </button>

        <!-- Current User Avatar -->
        <div class="user-profile-badge">
          <div class="avatar-circle">${currentUser.avatar}</div>
          <span class="profile-name">${currentUser.name}</span>
        </div>
      </div>
    </header>
  `;

  // Event handlers
  const userSelect = container.querySelector('#user-simulate-select');
  if (userSelect) {
    userSelect.addEventListener('change', (e) => {
      AppState.setCurrentUser(e.target.value);
    });
  }

  const themeToggle = container.querySelector('#theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      // Re-render header to update sun/moon icon
      renderHeader(container, AppState.state);
    });
  }
}
