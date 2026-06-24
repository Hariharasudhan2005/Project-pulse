import { AppState } from '../state.js';

export function renderAnalyticsView(container, state) {
  const tasks = AppState.getTasksForCurrentProject();
  const users = state.users;

  // 1. Task Status distribution
  const total = tasks.length;
  const todo = tasks.filter(t => t.status === 'todo').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const inReview = tasks.filter(t => t.status === 'in-review').length;
  const done = tasks.filter(t => t.status === 'done').length;

  // Percentages for SVG donut chart (circumference of 100)
  const todoPct = total > 0 ? (todo / total) * 100 : 0;
  const inProgressPct = total > 0 ? (inProgress / total) * 100 : 0;
  const inReviewPct = total > 0 ? (inReview / total) * 100 : 0;
  const donePct = total > 0 ? (done / total) * 100 : 0;

  // Dash offsets for SVG
  const todoOffset = 100 - todoPct;
  const inProgressOffset = 100 - inProgressPct;
  const inReviewOffset = 100 - inReviewPct;
  const doneOffset = 100 - donePct;

  // We can render multiple concentric or segmented circle segments.
  // Standard SVG circular progress trick: circumference = 2 * PI * R
  // If R = 15.915, Circumference = 100.
  // We can stack segments on top of each other and shift their start with stroke-dashoffset.
  let accumulatedPercent = 0;
  const donutSegments = [
    { class: 'todo', val: todoPct, offset: 0 },
    { class: 'inprogress', val: inProgressPct, offset: 0 },
    { class: 'inreview', val: inReviewPct, offset: 0 },
    { class: 'done', val: donePct, offset: 0 }
  ];

  donutSegments.forEach(seg => {
    seg.offset = 100 - accumulatedPercent;
    accumulatedPercent += seg.val;
  });

  // 2. Task Allocation per Member (Bar Chart)
  const userCounts = users.map(u => {
    const count = tasks.filter(t => t.assigneeId === u.id).length;
    return { name: u.name, avatar: u.avatar, count };
  });

  const maxCount = Math.max(...userCounts.map(u => u.count), 1); // avoid division by 0

  const barChartHTML = userCounts.map(uc => {
    const heightPercent = Math.round((uc.count / maxCount) * 100);
    return `
      <div class="bar-column">
        <span style="font-size: 0.8rem; font-weight: 700;">${uc.count}</span>
        <div class="bar-fill-container">
          <div class="bar-fill" data-height="${heightPercent}%" style="height: 0%;"></div>
        </div>
        <div class="avatar-circle" style="width: 24px; height: 24px; font-size: 0.7rem; background: var(--secondary); box-shadow: none; margin-top: 4px;" title="${uc.name}">${uc.avatar}</div>
        <span class="bar-label" title="${uc.name}">${uc.name.split(' ')[0]}</span>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="view-container">
      <div class="dashboard-hero" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(99, 102, 241, 0.05) 100%); border-color: var(--border-color);">
        <h2>Reporting & Analytics</h2>
        <p>Real-time visual reports tracking workload distribution, completed items, and velocity metrics.</p>
      </div>

      <div class="analytics-grid">
        <!-- Status Share Donut Chart -->
        <div class="chart-card">
          <h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; vertical-align: middle;"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
            Task Breakdown
          </h3>
          <div class="chart-content" style="gap: 40px; justify-content: center; flex-wrap: wrap;">
            ${total > 0 ? `
              <div style="position: relative; width: 200px; height: 200px;">
                <svg viewBox="0 0 42 42" class="donut-svg">
                  <!-- Base Circle -->
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--bg-input)" stroke-width="4"></circle>
                  
                  <!-- Segments -->
                  ${donutSegments.map(seg => {
                    if (seg.val === 0) return '';
                    return `
                      <circle cx="21" cy="21" r="15.915" class="donut-segment ${seg.class}"
                        stroke-dasharray="${seg.val} ${100 - seg.val}"
                        stroke-dashoffset="${seg.offset}"
                        stroke-width="5"
                      ></circle>
                    `;
                  }).join('')}
                </svg>
                
                <!-- Inner Text -->
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                  <span style="font-size: 2.2rem; font-weight: 800; font-family: var(--font-heading); line-height: 1;">${total}</span>
                  <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-top: 4px;">Tasks</span>
                </div>
              </div>
            ` : `
              <div style="color: var(--text-dimmed); text-align: center; padding: 40px 0;">No tasks to analyze.</div>
            `}

            <div class="donut-legend">
              <div class="legend-item">
                <span class="legend-color" style="background: var(--status-todo);"></span>
                <span>To Do (${todo} - ${Math.round(todoPct)}%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background: var(--status-inprogress);"></span>
                <span>In Progress (${inProgress} - ${Math.round(inProgressPct)}%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background: var(--status-inreview);"></span>
                <span>In Review (${inReview} - ${Math.round(inReviewPct)}%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background: var(--status-done);"></span>
                <span>Done (${done} - ${Math.round(donePct)}%)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Workload Distribution Bar Chart -->
        <div class="chart-card">
          <h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; vertical-align: middle;"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Workload Distribution
          </h3>
          <div class="chart-content">
            <div class="bar-chart">
              ${barChartHTML}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Animate the bars height on load
  setTimeout(() => {
    const bars = container.querySelectorAll('.bar-fill');
    bars.forEach(bar => {
      const height = bar.getAttribute('data-height');
      bar.style.height = height;
    });
  }, 100);
}
