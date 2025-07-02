import { type RepoSummary } from './analysis-types';

export const bugReportsIndexHtml = (
  firstIssueDate: Date,
  repoSummaries: RepoSummary[]
): string => `<!DOCTYPE html>
<html>
<head>
  <title>Bug Reports Index</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 20px;
      margin-bottom: 20px;
    }
    h1 {
      color: #1976d2;
      text-align: center;
      margin-top: 0;
    }
    .repo-grid {
      display: grid;
      gap: 20px;
      margin-top: 20px;
    }
    .repo-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      border: 1px solid #e0e0e0;
    }
    .repo-card h2 {
      margin-top: 0;
      color: #1976d2;
    }
    .repo-card h2 a {
      color: inherit;
      text-decoration: none;
    }
    .repo-card h2 a:hover {
      text-decoration: underline;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
      margin-top: 15px;
    }
    .stat {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      text-align: center;
    }
    .stat-label {
      font-size: 14px;
      color: #666;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #1976d2;
      margin-top: 5px;
    }
    .links {
      margin-top: 15px;
      display: flex;
      gap: 10px;
    }
    .links a {
      color: #1976d2;
      text-decoration: none;
      font-size: 14px;
    }
    .links a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Bug Reports Index</h1>
    <p style="text-align: center; color: #666;">Generated on ${new Date().toLocaleString()}</p>
    <p style="text-align: center; color: #666;">Analyzing issues from ${firstIssueDate.toLocaleDateString()} to present</p>

    <div class="repo-grid">
      ${repoSummaries
        .map(({ repoName, summary }) => {
          const safeRepoName = repoName.replace('/', '-');
          return `
        <div class="repo-card">
          <h2><a href="./${safeRepoName}-bug-heatmap.html">${repoName}</a></h2>
          <div class="stats">
            <div class="stat">
              <div class="stat-label">Total Issues</div>
              <div class="stat-value">${summary.totalHighPriorityIssues}</div>
            </div>
            <div class="stat">
              <div class="stat-label">P0 Critical</div>
              <div class="stat-value">${summary.priorities.p0}</div>
            </div>
            <div class="stat">
              <div class="stat-label">P1 High</div>
              <div class="stat-value">${summary.priorities.p1}</div>
            </div>
          </div>
          <div class="links">
            <a href="./${safeRepoName}-bug-heatmap.html">View Heatmap</a> |
            <a href="./${safeRepoName}-high-priority-report.md">View Report</a>
          </div>
        </div>`;
        })
        .join('\n')}
    </div>
  </div>
</body>
</html>`;
