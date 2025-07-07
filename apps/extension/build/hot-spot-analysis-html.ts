import { type Summary, type HotSpot } from './analysis-types';

export function hotSpotAnalysisHtml(
  firstIssueDate: Date,
  summary: Summary,
  hotspots: HotSpot[],
  repos: string[] = [],
  defaultStartDate: Date = new Date(0)
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Bug Hotspots Analysis</title>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/luxon"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 20px;
      margin-bottom: 20px;
    }
    .alert {
      background: #e3f2fd;
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 20px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .alert-icon {
      color: #1976d2;
      font-size: 24px;
    }
    .hotspot {
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 8px;
      transition: filter 0.2s;
    }
    .hotspot:hover {
      filter: brightness(0.95);
    }
    .file-name {
      max-width: 400px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      position: relative;
    }
    .file-name:hover {
      overflow: visible;
      white-space: normal;
      word-break: break-all;
      background: white;
      z-index: 1;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .issue-count {
      width: 100px;
    }
    .issue-tag {
      display: inline-block;
      padding: 2px 6px;
      margin: 2px;
      border-radius: 4px;
      background: #e3f2fd;
      cursor: pointer;
    }
    .issue-tag:hover {
      background: #bbdefb;
    }
    .github-link {
      display: inline-block;
      margin-left: 4px;
      color: #666;
      opacity: 0.7;
      vertical-align: middle;
    }
    .github-link:hover {
      opacity: 1;
    }
    .filtered-row {
      display: none;
    }
    #active-filter {
      display: none;
      flex-direction: column;
      gap: 12px;
      margin: 16px 0;
      padding: 16px;
      background: #e3f2fd;
      border-radius: 4px;
    }
    #active-filter > div:first-child {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #filter-text {
      font-weight: 500;
    }
    #clear-filter {
      padding: 4px 8px;
      background: #bbdefb;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    #clear-filter:hover {
      background: #90caf9;
    }
    tr[data-intensity] {
      transition: filter 0.2s;
    }
    tr[data-intensity]:hover {
      filter: brightness(0.95);
    }
    tr[data-bug-count] {
      transition: filter 0.2s;
    }
    tr[data-bug-count]:hover {
      filter: brightness(0.95);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    th {
      background: #f5f5f5;
      font-weight: 600;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .summary-item {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .summary-value {
      font-size: 24px;
      font-weight: bold;
      color: #1976d2;
      margin-bottom: 8px;
    }
    .summary-label {
      font-size: 14px;
      color: #666;
    }
    h1 {
      margin: 0 0 24px 0;
      color: #1976d2;
    }
    .date-range {
      color: #666;
      font-size: 14px;
      margin: 0 0 20px;
      text-align: center;
    }
    .pr-link {
      display: inline-block;
      padding: 2px 6px;
      margin: 2px;
      border-radius: 4px;
      background: #e8f5e9;
      color: #2e7d32;
      text-decoration: none;
      font-size: 14px;
    }
    .pr-link:hover {
      background: #c8e6c9;
    }
    .pull-requests {
      font-family: monospace;
    }
    #pr-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .pr-list-header {
      font-weight: 500;
      color: #1976d2;
      margin-bottom: 4px;
    }
    .no-prs {
      color: #666;
      font-style: italic;
    }
    #pr-list .pr-link {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: #fff;
      border-radius: 4px;
      text-decoration: none;
      color: #2e7d32;
    }
    #pr-list .pr-link:hover {
      background: #f5f5f5;
    }
    tr[data-bug-count="1"] .file-name { border-color: #ffcdd2; }
    tr[data-bug-count="2"] .file-name { border-color: #ef9a9a; }
    tr[data-bug-count="3"] .file-name { border-color: #e57373; }
    tr[data-bug-count="4"] .file-name { border-color: #ef5350; }
    tr[data-bug-count="5"] .file-name { border-color: #f44336; }
    tr[data-bug-count="many"] .file-name { border-color: #d32f2f; }
    .date-controls {
      display: flex;
      gap: 16px;
      align-items: center;
      margin: 16px 0;
      padding: 16px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .date-controls label {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
    }
    .date-controls input {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .chart-container {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .chart-title {
      font-size: 16px;
      font-weight: 500;
      color: #1976d2;
      margin-bottom: 16px;
    }
    .tabs {
      margin: 20px 0;
    }

    .tab-buttons {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    }

    .tab-button {
      padding: 8px 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #f5f5f5;
      cursor: pointer;
    }

    .tab-button.active {
      background: #2196f3;
      color: white;
      border-color: #1976d2;
    }

    .tab-content {
      display: none;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .tab-content.active {
      display: block;
    }

    .chart-container {
      position: relative;
      height: 400px;
      width: 100%;
    }

    .date-range {
      display: flex;
      gap: 20px;
      align-items: center;
      margin-bottom: 20px;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 4px;
    }

    .date-range label {
      font-weight: 500;
    }

    .date-range input {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .repo-filters {
      margin: 20px 0;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 5px;
    }

    .repo-filters label {
      margin-right: 15px;
      cursor: pointer;
    }

    .repo-filters input[type="checkbox"] {
      margin-right: 5px;
    }

    tr.hidden {
      display: none;
    }
  </style>
  <script>
    // Store all issues data for filtering globally
    const allIssues = ${JSON.stringify(
      hotspots.flatMap((h) =>
        h.issues.map((i) => ({
          number: i.number,
          repo: i.repo,
          priority: i.priority,
          state: i.state,
          createdAt: i.createdAt,
          closedAt: i.closedAt,
          url: i.url,
        }))
      )
    )};

    function updateVisibility() {
      const selectedRepos = Array.from(document.querySelectorAll('input[name="repo-filter"]'))
        .filter(f => f.checked)
        .map(f => f.value);

      const startDate = new Date(document.getElementById('start-date').value);
      const endDate = new Date(document.getElementById('end-date').value);
      endDate.setHours(23, 59, 59, 999);

      const rows = document.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const issues = JSON.parse(row.dataset.issues || '[]');
        const issueData = allIssues.filter(i => {
          const createdDate = new Date(i.createdAt);
          return issues.some(issue => issue.number === i.number) &&
                 selectedRepos.includes(i.repo) &&
                 createdDate >= startDate &&
                 createdDate <= endDate;
        });

        row.classList.toggle('hidden', issueData.length === 0);
      });

      // Update summary with filtered issues
      const visibleIssues = allIssues.filter(i => {
        const createdDate = new Date(i.createdAt);
        return selectedRepos.includes(i.repo) &&
               createdDate >= startDate &&
               createdDate <= endDate;
      });
      updateSummary(visibleIssues);

      // Update charts
      updateCharts(startDate, endDate);
    }

    function updateSummary(visibleIssues) {
      const summary = {
        totalHighPriorityIssues: visibleIssues.length,
        activeIssues: visibleIssues.filter(i => i.state === 'OPEN').length,
        closedIssues: visibleIssues.filter(i => i.state === 'CLOSED').length,
        priorities: {
          p0: visibleIssues.filter(i => i.priority.startsWith('P0')).length,
          p1: visibleIssues.filter(i => i.priority.startsWith('P1')).length
        }
      };

      Object.entries(summary).forEach(([key, value]) => {
        if (typeof value === 'object') {
          Object.entries(value).forEach(([subKey, subValue]) => {
            const el = document.querySelector(\`[data-key="\${key}.\${subKey}"]\`);
            if (el) el.textContent = subValue;
          });
        } else {
          const el = document.querySelector(\`[data-key="\${key}"]\`);
          if (el) el.textContent = value;
        }
      });
    }

    function updatePeriod() {
      const period = document.getElementById('period-select').value;
      const now = new Date();
      let startDate = new Date();

      switch (period) {
        case 'this-quarter': {
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          break;
        }
        case 'last-quarter': {
          const thisQuarter = Math.floor(now.getMonth() / 3);
          const lastQuarter = thisQuarter - 1;
          const year = lastQuarter < 0 ? now.getFullYear() - 1 : now.getFullYear();
          const quarter = lastQuarter < 0 ? 3 : lastQuarter;
          startDate = new Date(year, quarter * 3, 1);
          break;
        }
        case 'last-90': {
          startDate.setDate(now.getDate() - 90);
          break;
        }
      }

      if (period !== 'custom') {
        document.getElementById('start-date').value = startDate.toISOString().split('T')[0];
        document.getElementById('end-date').value = now.toISOString().split('T')[0];
        updateDateRange();
      }
    }

    function updateDateRange() {
      updateVisibility();
    }

    function showTab(tabName) {
      // Hide all tab content
      document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
      });
      // Show selected tab content
      document.getElementById(tabName + '-tab').classList.add('active');

      // Update button states
      document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
      });
      document.querySelector(\`[onclick="showTab('\${tabName}')"]\`).classList.add('active');
    }

    function filterByIssue(issueNumber, repo) {
      const rows = document.querySelectorAll('tbody tr');
      const filterPanel = document.getElementById('active-filter');
      const filterText = document.getElementById('filter-text');
      const issueLink = document.getElementById('issue-link');
      const prList = document.getElementById('pr-list');

      // Find the issue data
      const issue = allIssues.find(i => i.number === issueNumber && i.repo === repo);
      if (!issue) return;

      // Update filter panel
      filterText.textContent = \`Showing files affected by issue #\${issueNumber}\`;
      issueLink.href = issue.url;
      filterPanel.style.display = 'block';

      // Show only rows with this issue
      rows.forEach(row => {
        const issues = JSON.parse(row.dataset.issues || '[]');
        const hasIssue = issues.some(i => i.number === issueNumber && i.repo === repo);
        row.classList.toggle('hidden', !hasIssue);
      });
    }

    function clearFilter() {
      document.getElementById('active-filter').style.display = 'none';
      updateVisibility();
    }

    // Helper to get Monday of the week for a given date
    function getMonday(date) {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff));
    }

    // Helper to format date as YYYY-MM-DD
    function formatDate(date) {
      return date.toISOString().split('T')[0];
    }

    // Add helper functions for date handling
    function getDefaultDateRange() {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 84); // 12 weeks = 84 days
      return { startDate, endDate };
    }


    function processWeeklyData(issues, startDate, endDate) {
      const weeklyData = new Map();
      const currentDate = new Date(startDate);

      // Initialize all weeks in range
      while (currentDate <= endDate) {
        const weekStart = getWeekStart(currentDate);
        const weekKey = formatDate(weekStart);
        if (!weeklyData.has(weekKey)) {
          weeklyData.set(weekKey, {
            created: { p0: 0, p1: 0 },
            closed: { p0: 0, p1: 0 },
            cumulative: { created: { p0: 0, p1: 0 }, closed: { p0: 0, p1: 0 } },
          });
        }
        currentDate.setDate(currentDate.getDate() + 7);
      }

      // Process each issue
      issues.forEach((issue) => {
        const createdAt = new Date(issue.createdAt);
        const closedAt = issue.closedAt ? new Date(issue.closedAt) : null;
        const priority = issue.priority.substring(0, 2).toLowerCase();

        if (createdAt >= startDate && createdAt <= endDate) {
          const weekStart = getWeekStart(createdAt);
          const weekKey = formatDate(weekStart);
          const data = weeklyData.get(weekKey);
          if (data) {
            data.created[priority]++;
          }
        }

        if (closedAt && closedAt >= startDate && closedAt <= endDate) {
          const weekStart = getWeekStart(closedAt);
          const weekKey = formatDate(weekStart);
          const data = weeklyData.get(weekKey);
          if (data) {
            data.closed[priority]++;
          }
        }
      });

      // Calculate cumulative totals
      let cumulativeCreatedP0 = 0;
      let cumulativeCreatedP1 = 0;
      let cumulativeClosedP0 = 0;
      let cumulativeClosedP1 = 0;

      Array.from(weeklyData.keys())
        .sort()
        .forEach((weekKey) => {
          const data = weeklyData.get(weekKey);
          cumulativeCreatedP0 += data.created.p0;
          cumulativeCreatedP1 += data.created.p1;
          cumulativeClosedP0 += data.closed.p0;
          cumulativeClosedP1 += data.closed.p1;

          data.cumulative = {
            created: { p0: cumulativeCreatedP0, p1: cumulativeCreatedP1 },
            closed: { p0: cumulativeClosedP0, p1: cumulativeClosedP1 },
          };
        });

      return Array.from(weeklyData.entries()).map(([date, data]) => ({
        date,
        ...data,
      }));
    }


    function getWeekStart(date) {
      const result = new Date(date);
      result.setDate(result.getDate() - result.getDay() + 1); // Monday
      result.setHours(0, 0, 0, 0);
      return result;
    }

    // Chart variables
    let creationChart;
    let closureChart;
    let cumulativeChart;

    function updateCharts(startDate, endDate) {
      // Get selected repos
      const selectedRepos = Array.from(document.querySelectorAll('input[name="repo-filter"]'))
        .filter(f => f.checked)
        .map(f => f.value);

      // Filter issues by selected repos and date range
      const filteredIssues = allIssues.filter(issue => {
        const createdDate = new Date(issue.createdAt);
        return selectedRepos.includes(issue.repo) &&
               createdDate >= startDate &&
               createdDate <= endDate;
      });

      // Debug output
      console.log('Filtered issues:', filteredIssues.length);
      console.log('Sample issue:', filteredIssues[0]);

      // Sort issues by date for proper cumulative counting
      const sortedIssues = [...new Set(filteredIssues.map(i => i.number))].map(num =>
        filteredIssues.find(i => i.number === num)
      ).sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      // Initialize weekly data
      const weeklyData = new Map();
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const weekStart = getWeekStart(currentDate);
        const weekKey = weekStart.toISOString().split('T')[0];
        if (!weeklyData.has(weekKey)) {
          weeklyData.set(weekKey, {
            created: { p0: 0, p1: 0 },
            closed: { p0: 0, p1: 0 },
            cumulative: {
              created: { p0: 0, p1: 0 },
              closed: { p0: 0, p1: 0 }
            }
          });
        }
        currentDate.setDate(currentDate.getDate() + 7);
      }

      // Debug output
      console.log('Unique issues:', sortedIssues.length);
      console.log('Week count:', weeklyData.size);

      // Process issues for weekly counts
      let cumulativeCreated = { p0: 0, p1: 0 };
      let cumulativeClosed = { p0: 0, p1: 0 };

      sortedIssues.forEach(issue => {
        // Debug priority string
        console.log('Issue priority:', issue.priority);

        const priority = issue.priority.toLowerCase().startsWith('p0') ? 'p0' :
                        issue.priority.toLowerCase().startsWith('p1') ? 'p1' : null;

        if (!priority) {
          console.log('Unknown priority:', issue.priority);
          return;
        }

        const createdDate = new Date(issue.createdAt);
        const createdWeekStart = getWeekStart(createdDate);
        const createdWeekKey = createdWeekStart.toISOString().split('T')[0];

        if (weeklyData.has(createdWeekKey)) {
          weeklyData.get(createdWeekKey).created[priority]++;
          cumulativeCreated[priority]++;
        }

        if (issue.closedAt) {
          const closedDate = new Date(issue.closedAt);
          if (closedDate >= startDate && closedDate <= endDate) {
            const closedWeekStart = getWeekStart(closedDate);
            const closedWeekKey = closedWeekStart.toISOString().split('T')[0];
            if (weeklyData.has(closedWeekKey)) {
              weeklyData.get(closedWeekKey).closed[priority]++;
              cumulativeClosed[priority]++;
            }
          }
        }
      });

      // Debug output weekly data
      console.log('Weekly data:', Object.fromEntries(weeklyData));

      // Update cumulative totals for each week
      let runningCreated = { p0: 0, p1: 0 };
      let runningClosed = { p0: 0, p1: 0 };
      Array.from(weeklyData.keys()).sort().forEach(weekKey => {
        const week = weeklyData.get(weekKey);
        runningCreated.p0 += week.created.p0;
        runningCreated.p1 += week.created.p1;
        runningClosed.p0 += week.closed.p0;
        runningClosed.p1 += week.closed.p1;
        week.cumulative.created = { ...runningCreated };
        week.cumulative.closed = { ...runningClosed };
      });

      // Prepare chart data
      const labels = Array.from(weeklyData.keys()).sort();
      const datasets = {
        creation: [
          {
            label: 'P0-Critical',
            data: labels.map(week => weeklyData.get(week).created.p0),
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1
          },
          {
            label: 'P1-High',
            data: labels.map(week => weeklyData.get(week).created.p1),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1
          }
        ],
        closure: [
          {
            label: 'P0-Critical',
            data: labels.map(week => weeklyData.get(week).closed.p0),
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1
          },
          {
            label: 'P1-High',
            data: labels.map(week => weeklyData.get(week).closed.p1),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1
          }
        ],
        cumulative: [
          {
            label: 'P0-Critical Created',
            data: labels.map(week => weeklyData.get(week).cumulative.created.p0),
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.1
          },
          {
            label: 'P0-Critical Closed',
            data: labels.map(week => weeklyData.get(week).cumulative.closed.p0),
            borderColor: 'rgb(255, 99, 132)',
            borderDash: [5, 5],
            tension: 0.1
          },
          {
            label: 'P1-High Created',
            data: labels.map(week => weeklyData.get(week).cumulative.created.p1),
            borderColor: 'rgb(54, 162, 235)',
            tension: 0.1
          },
          {
            label: 'P1-High Closed',
            data: labels.map(week => weeklyData.get(week).cumulative.closed.p1),
            borderColor: 'rgb(54, 162, 235)',
            borderDash: [5, 5],
            tension: 0.1
          }
        ]
      };

      // Update charts
      creationChart.data.labels = labels;
      creationChart.data.datasets = datasets.creation;
      creationChart.update();

      closureChart.data.labels = labels;
      closureChart.data.datasets = datasets.closure;
      closureChart.update();

      cumulativeChart.data.labels = labels;
      cumulativeChart.data.datasets = datasets.cumulative;
      cumulativeChart.update();
    }

    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
      // Initialize date inputs
      const defaultStartDate = new Date('${defaultStartDate.toISOString()}');
      document.getElementById('start-date').value = defaultStartDate.toISOString().split('T')[0];
      document.getElementById('end-date').value = new Date().toISOString().split('T')[0];

      // Add event listeners
      document.getElementById('start-date').addEventListener('change', updateDateRange);
      document.getElementById('end-date').addEventListener('change', updateDateRange);
      document.getElementById('period-select').addEventListener('change', updatePeriod);
      document.querySelectorAll('input[name="repo-filter"]').forEach(filter => {
        filter.addEventListener('change', updateVisibility);
      });

      // Initialize charts
      creationChart = new Chart(document.getElementById('creation-chart'), {
        type: 'bar',
        data: {
          datasets: [
            {
              label: 'P0 Created',
              backgroundColor: '#ffcdd2',
              borderColor: '#d32f2f',
              borderWidth: 1,
              data: []
            },
            {
              label: 'P1 Created',
              backgroundColor: '#ffe0b2',
              borderColor: '#f57c00',
              borderWidth: 1,
              data: []
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'week',
                displayFormats: {
                  week: 'MMM d'
                }
              },
              title: {
                display: true,
                text: 'Week Starting'
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Issues'
              }
            }
          }
        }
      });

      closureChart = new Chart(document.getElementById('closure-chart'), {
        type: 'bar',
        data: {
          datasets: [
            {
              label: 'P0 Closed',
              backgroundColor: '#c8e6c9',
              borderColor: '#388e3c',
              borderWidth: 1,
              data: []
            },
            {
              label: 'P1 Closed',
              backgroundColor: '#b3e5fc',
              borderColor: '#0288d1',
              borderWidth: 1,
              data: []
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'week',
                displayFormats: {
                  week: 'MMM d'
                }
              },
              title: {
                display: true,
                text: 'Week Starting'
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Issues'
              }
            }
          }
        }
      });

      cumulativeChart = new Chart(document.getElementById('cumulative-chart'), {
        type: 'line',
        data: {
          datasets: [
            {
              label: 'P0 Created (Total)',
              borderColor: '#d32f2f',
              backgroundColor: '#ffcdd2',
              fill: false,
              data: []
            },
            {
              label: 'P0 Closed (Total)',
              borderColor: '#388e3c',
              backgroundColor: '#c8e6c9',
              fill: false,
              data: []
            },
            {
              label: 'P1 Created (Total)',
              borderColor: '#f57c00',
              backgroundColor: '#ffe0b2',
              fill: false,
              data: []
            },
            {
              label: 'P1 Closed (Total)',
              borderColor: '#0288d1',
              backgroundColor: '#b3e5fc',
              fill: false,
              data: []
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'week',
                displayFormats: {
                  week: 'MMM d'
                }
              },
              title: {
                display: true,
                text: 'Week Starting'
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Total Issues'
              }
            }
          }
        }
      });

      // Initialize filters
      updateDateRange();
      updateVisibility();
    });
  </script>
</head>
<body>
  <div class="card">
    <h1>Bug Hotspots Analysis</h1>
    <p class="date-range">Analyzing issues from ${firstIssueDate.toLocaleDateString()} to present</p>

    <div class="repo-filters">
      <h3>Filter by Project:</h3>
      ${repos
        .map(
          (repo) => `
        <label>
          <input type="checkbox" name="repo-filter" value="${repo}" checked>
          ${repo}
        </label>
      `
        )
        .join('\n')}
    </div>

    <div class="container">
      <div class="date-range">
        <div>
          <label for="period-select">Period:</label>
          <select id="period-select" onchange="updatePeriod()">
            <option value="this-quarter">This Quarter</option>
            <option value="last-quarter">Last Quarter</option>
            <option value="last-90" selected>Last 90 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        <div>
          <label for="start-date">From:</label>
          <input type="date" id="start-date">
        </div>
        <div>
          <label for="end-date">To:</label>
          <input type="date" id="end-date">
        </div>
      </div>

      <div class="tabs">
        <div class="tab-buttons">
          <button class="tab-button active" onclick="showTab('summary')">Summary</button>
          <button class="tab-button" onclick="showTab('charts')">Trend Charts</button>
        </div>

        <div id="summary-tab" class="tab-content active">
    <div class="summary-grid">
      <div class="summary-item">
              <div class="summary-value" data-key="totalHighPriorityIssues">${summary.totalHighPriorityIssues}</div>
        <div class="summary-label">High Priority Issues</div>
      </div>
      <div class="summary-item">
              <div class="summary-value" data-key="activeIssues">${summary.activeIssues}</div>
        <div class="summary-label">Active Issues</div>
      </div>
      <div class="summary-item">
              <div class="summary-value" data-key="closedIssues">${summary.closedIssues}</div>
        <div class="summary-label">Closed Issues</div>
      </div>
      <div class="summary-item">
              <div class="summary-value" data-key="priorities.p0">${summary.priorities.p0}</div>
        <div class="summary-label">P0-Critical</div>
      </div>
      <div class="summary-item">
              <div class="summary-value" data-key="priorities.p1">${summary.priorities.p1}</div>
        <div class="summary-label">P1-High</div>
      </div>
    </div>

    <div class="alert">
      <div class="alert-icon">ℹ️</div>
      <div>
        Showing bug frequency heatmap across ${hotspots.length} files.
              The color intensity indicates the number of high priority issues affecting each file.
        Click on an issue number to filter the view.
      </div>
    </div>

    <div id="active-filter">
            <div>
      <span id="filter-text"></span>
        <a id="issue-link" href="#" target="_blank">View Issue</a>
            </div>
            <div id="pr-list"></div>
        <button id="clear-filter" onclick="clearFilter()">Clear Filter</button>
    </div>

    <table>
      <thead>
        <tr>
          <th class="file-name">File</th>
          <th class="issue-count">Issues</th>
          <th>Related Issues</th>
                <th>Pull Requests</th>
        </tr>
      </thead>
      <tbody>
        ${hotspots
          .map(
            (hotspot) => `
                <tr data-issues='${JSON.stringify(
                  hotspot.issues.map((i) => ({
                    number: i.number,
                    repo: i.repo,
                  }))
                )}'
                    data-bug-count="${hotspot.bugCount > 5 ? 'many' : hotspot.bugCount}">
                <td class="file-name">${hotspot.file}</td>
                <td class="issue-count">${hotspot.bugCount}</td>
                <td class="issues">
                  ${hotspot.issues
                    .map(
                      (issue) => `
                      <span class="issue-tag" onclick="filterByIssue(${issue.number}, '${issue.repo}')">
                        #${issue.number}
                        <a href="${issue.url}" target="_blank" onclick="event.stopPropagation();">
                          <svg width="12" height="12" viewBox="0 0 16 16" style="vertical-align: middle; margin-left: 4px; opacity: 0.7;">
                            <path fill="currentColor" d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z"></path>
                          </svg>
                        </a>
                      </span>
                    `
                    )
                    .join(' ')}
                </td>
                      <td class="pull-requests">
                        ${hotspot.issues
                          .flatMap((issue) =>
                            issue.pullRequests.map(
                              (pr) => `
                          <a href="${pr.url}" target="_blank" class="pr-link" title="${pr.title}">
                            #${pr.number}
                          </a>
                        `
                            )
                          )
                          .join(' ')}
                      </td>
                    </tr>
                  `
          )
          .join('\n')}
      </tbody>
    </table>
        </div>

        <div id="charts-tab" class="tab-content">
          <div class="chart-container">
            <h3>Weekly Bug Creation Rate</h3>
            <canvas id="creation-chart"></canvas>
          </div>
          <div class="chart-container">
            <h3>Weekly Bug Closure Rate</h3>
            <canvas id="closure-chart"></canvas>
          </div>
          <div class="chart-container">
            <h3>Cumulative Bug Totals</h3>
            <canvas id="cumulative-chart"></canvas>
          </div>
        </div>
      </div>
    </div>

    <script id="issue-data" type="application/json">
    ${JSON.stringify(
      hotspots.flatMap((h) =>
        h.issues.map((i) => ({
          number: i.number,
          priority: i.priority,
          createdAt: i.createdAt,
          updatedAt: i.updatedAt,
          closedAt: i.closedAt,
          state: i.state,
          pullRequests: i.pullRequests,
          url: i.url,
          repo: i.repo,
        }))
      )
    )}
    </script>
  </div>
</body>
</html>`;
}
