import { AppState } from '../state.js';

let isRegisterMode = false;
let errorMessage = '';

export function renderLoginView(container, state) {
  const roleOptions = [
    { value: 'Project Manager', label: 'Project Manager' },
    { value: 'Lead Developer', label: 'Lead Developer' },
    { value: 'UI/UX Designer', label: 'UI/UX Designer' },
    { value: 'QA Engineer', label: 'QA Engineer' }
  ].map(r => `<option value="${r.value}">${r.label}</option>`).join('');

  container.innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <div class="login-card-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
          <h2>${isRegisterMode ? 'Create Account' : 'Welcome Back'}</h2>
          <p>${isRegisterMode ? 'Join ProjectPulse and organize your work.' : 'Log in to access your secure workspace.'}</p>
        </div>

        ${errorMessage ? `<div class="error-message">${errorMessage}</div>` : ''}

        <form id="auth-form" style="display: flex; flex-direction: column; gap: 16px;">
          <div class="form-group">
            <label for="auth-username">Username</label>
            <input type="text" id="auth-username" class="form-input" placeholder="e.g. johndoe" required>
          </div>

          <div class="form-group">
            <label for="auth-password">Password</label>
            <input type="password" id="auth-password" class="form-input" placeholder="••••••••" required>
          </div>

          ${isRegisterMode ? `
            <div class="form-group">
              <label for="auth-fullname">Full Name</label>
              <input type="text" id="auth-fullname" class="form-input" placeholder="e.g. John Doe" required>
            </div>

            <div class="form-group">
              <label for="auth-role">Role</label>
              <select id="auth-role" class="form-select">
                ${roleOptions}
              </select>
            </div>
          ` : ''}

          <button type="submit" class="btn-primary" style="margin-top: 10px; height: 46px; justify-content: center;">
            ${isRegisterMode ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <div class="login-toggle-text">
          ${isRegisterMode ? 
            `Already have an account? <span class="login-toggle-link" id="auth-toggle">Log In</span>` : 
            `New to ProjectPulse? <span class="login-toggle-link" id="auth-toggle">Create account</span>`
          }
        </div>
      </div>
    </div>
  `;

  // Attach event handlers
  const form = container.querySelector('#auth-form');
  const toggleLink = container.querySelector('#auth-toggle');

  if (toggleLink) {
    toggleLink.addEventListener('click', () => {
      isRegisterMode = !isRegisterMode;
      errorMessage = ''; // clear error
      renderLoginView(container, state);
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = form.querySelector('#auth-username').value.trim().toLowerCase();
      const password = form.querySelector('#auth-password').value;

      if (!username || !password) return;

      errorMessage = '';

      if (isRegisterMode) {
        const fullName = form.querySelector('#auth-fullname').value.trim();
        const role = form.querySelector('#auth-role').value;
        
        const success = await AppState.register(username, password, fullName, role);
        if (success) {
          isRegisterMode = false; // switch to login mode on success
          errorMessage = 'Account created successfully! Please log in.';
          renderLoginView(container, state);
        } else {
          errorMessage = 'Username already exists. Please choose another.';
          renderLoginView(container, state);
        }
      } else {
        const success = await AppState.login(username, password);
        if (!success) {
          errorMessage = 'Invalid username or password.';
          renderLoginView(container, state);
        }
      }
    });
  }
}
