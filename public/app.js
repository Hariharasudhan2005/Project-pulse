/* ==========================================================================
   ProjectPulse Application Entry & Router (app.js)
   ========================================================================== */

import { AppState } from './state.js';
import { renderSidebar } from './components/Sidebar.js';
import { renderHeader } from './components/Header.js';
import { renderDashboardView } from './components/DashboardView.js';
import { renderKanbanBoard } from './components/KanbanBoard.js';
import { renderListView } from './components/ListView.js';
import { renderCalendarView } from './components/CalendarView.js';
import { renderChatView } from './components/ChatView.js';
import { renderAnalyticsView } from './components/AnalyticsView.js';
import { renderCreateTaskModal, renderTaskDetailModal } from './components/TaskModal.js';

const root = document.getElementById('app-root');

// Main render orchestrator
function renderApp(state) {
  // If data hasn't loaded yet, keep showing loader
  if (!state.projects.length || !state.users.length) {
    root.innerHTML = `
      <div class="loader-container">
        <div class="loader"></div>
        <p>Loading ProjectPulse workspace...</p>
      </div>
    `;
    return;
  }

  // Create main app shell structure if not already present
  let appShell = document.getElementById('app-container');
  if (!appShell) {
    root.innerHTML = `
      <div id="app-container">
        <div id="sidebar-target"></div>
        <main class="main-content">
          <div id="header-target"></div>
          <div id="view-target"></div>
        </main>
        <div id="modal-target-detail"></div>
        <div id="modal-target-create"></div>
      </div>
    `;
    appShell = document.getElementById('app-container');
  }

  const sidebarTarget = document.getElementById('sidebar-target');
  const headerTarget = document.getElementById('header-target');
  const viewTarget = document.getElementById('view-target');
  const detailModalTarget = document.getElementById('modal-target-detail');
  const createModalTarget = document.getElementById('modal-target-create');

  // Render static shell components
  renderSidebar(sidebarTarget, state);
  renderHeader(headerTarget, state);

  // Render active view route
  switch (state.currentView) {
    case 'dashboard':
      renderDashboardView(viewTarget, state);
      break;
    case 'kanban':
      renderKanbanBoard(viewTarget, state);
      break;
    case 'list':
      renderListView(viewTarget, state);
      break;
    case 'calendar':
      renderCalendarView(viewTarget, state);
      break;
    case 'chat':
      renderChatView(viewTarget, state);
      break;
    case 'analytics':
      renderAnalyticsView(viewTarget, state);
      break;
    default:
      renderDashboardView(viewTarget, state);
  }

  // Render detail modal overlay if active task is set
  if (state.activeTaskId) {
    renderTaskDetailModal(detailModalTarget, state);
  } else {
    detailModalTarget.innerHTML = '';
  }
}

// Global modal event listener
document.addEventListener('open-create-modal', () => {
  const createModalTarget = document.getElementById('modal-target-create');
  if (createModalTarget) {
    renderCreateTaskModal(createModalTarget, AppState.state);
  }
});

// Subscribe to state changes to automatically re-render the app
AppState.subscribe(renderApp);

// Bootstrapping: Fetch initial workspace data
AppState.fetchAllData();

// Poll for database changes (real-time chat and multi-user updates simulation)
setInterval(() => {
  AppState.fetchAllData();
}, 4000);
