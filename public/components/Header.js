import { AppState } from '../state.js';

export function renderHeader(container, state) {
  const currentProject = AppState.getCurrentProject() || { name: 'No Project Selected' };
  const currentUser = AppState.getCurrentUser() || { name: state.currentUser ? state.currentUser.name : 'Guest', avatar: state.currentUser ? state.currentUser.avatar : 'G' };

  const isLightTheme = document.body.classList.contains('light-theme');

  container.innerHTML = `
    <header class="header">
      <div class="header-title-section">
        <h2>${currentProject.name}</h2>
      </div>
      
      <div class="header-actions">
        <!-- Logout Button -->
        <button id="logout-btn" class="btn-secondary" style="padding: 6px 14px; font-size: 0.8rem; height: 36px; display: flex; align-items: center; gap: 6px; margin: 0;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          Logout
        </button>

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
  const logoutBtn = container.querySelector('#logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      AppState.logout();
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

