import { promises as fs } from 'fs';
import * as path from 'path';

import {
  type PullRequest,
  type HighPriorityChange,
  type Summary,
  type HotSpot,
  type RepoSummary,
  type ProjectItem,
} from './analysis-types';
import { bugReportsIndexHtml } from './bug-reports-index-html';
import { hotSpotAnalysisHtml } from './hot-spot-analysis-html';

function generateHeatmapHtml(highPriorityChanges: HighPriorityChange[], summary: Summary): string {
  const hotspots = Object.entries(
    highPriorityChanges.reduce(
      (fileMap, change) => {
        // First, deduplicate PRs for this issue by PR number
        const uniquePRs = new Map();
        change.pullRequests.forEach((pr) => {
          uniquePRs.set(pr.number, pr);
        });

        Array.from(uniquePRs.values()).forEach((pr) => {
          pr.files.forEach((file) => {
            const existing = fileMap[file.path] || {
              file: file.path,
              bugCount: 0,
              lastOccurrence: new Date(0),
              issues: [],
            };

            existing.bugCount += 1;
            const issueDate = new Date(change.issue.createdAt);
            if (issueDate > existing.lastOccurrence) {
              existing.lastOccurrence = issueDate;
            }

            // Check if we already have this issue in the list
            const existingIssue = existing.issues.find((i) => i.number === change.issue.number);
            if (!existingIssue) {
              existing.issues.push({
                number: change.issue.number,
                priority: change.issue.priority,
                url: change.issue.url,
                createdAt: change.issue.createdAt,
                updatedAt: change.issue.updatedAt,
                state: change.issue.state,
                closedAt: change.issue.closedAt,
                repo: change.repo || '',
                pullRequests: Array.from(uniquePRs.values()).map((pr) => ({
                  number: pr.number,
                  title: pr.title,
                  url: pr.url,
                  files: pr.files,
                })),
              });
            }

            fileMap[file.path] = existing;
          });
        });
        return fileMap;
      },
      {} as Record<string, HotSpot>
    )
  )
    .map(([_, hotspot]) => hotspot)
    .sort((a, b) => b.bugCount - a.bugCount);

  // Calculate max bug count for color scaling
  const maxBugCount = Math.max(...hotspots.map((d) => d.bugCount));

  // Generate the HTML
  const firstIssueDate =
    highPriorityChanges.length > 0
      ? new Date(Math.min(...highPriorityChanges.map((c) => new Date(c.issue.createdAt).getTime())))
      : new Date();

  return hotSpotAnalysisHtml(firstIssueDate, summary, hotspots);
}

function generateIndexHtml(repoSummaries: RepoSummary[]): string {
  // Find overall date range
  const firstIssueDate =
    repoSummaries.length > 0
      ? new Date(Math.min(...repoSummaries.map((s) => s.firstIssueDate.getTime())))
      : new Date();

  return bugReportsIndexHtml(firstIssueDate, repoSummaries);
}

async function getClosedDateFromTimeline(
  repo: string,
  issueNumber: number
): Promise<string | null> {
  try {
    const timelineFile = `.github-data/${repo}-timelines/issue-${issueNumber}-timeline.json`;
    const timelineData = JSON.parse(await fs.readFile(timelineFile, 'utf8'));

    // Find the closed event
    const closedEvent = timelineData.find((event: any) => event.event === 'closed');
    return closedEvent ? closedEvent.created_at : null;
  } catch (error) {
    console.log(`Could not read timeline for issue ${issueNumber} in ${repo}`);
    return null;
  }
}

function generateCombinedHeatmapHtml(
  repoData: { repoName: string; changes: HighPriorityChange[]; summary: Summary }[]
): string {
  // Calculate combined summary
  const combinedSummary: Summary = {
    totalHighPriorityIssues: 0,
    activeIssues: 0,
    closedIssues: 0,
    archivedIssues: 0,
    totalPRs: 0,
    totalFilesChanged: 0,
    totalChanges: 0,
    priorities: { p0: 0, p1: 0 },
  };

  // Combine summaries
  repoData.forEach(({ summary }) => {
    combinedSummary.totalHighPriorityIssues += summary.totalHighPriorityIssues;
    combinedSummary.activeIssues += summary.activeIssues;
    combinedSummary.closedIssues += summary.closedIssues;
    combinedSummary.archivedIssues += summary.archivedIssues;
    combinedSummary.totalPRs += summary.totalPRs;
    combinedSummary.totalFilesChanged += summary.totalFilesChanged;
    combinedSummary.totalChanges += summary.totalChanges;
    combinedSummary.priorities.p0 += summary.priorities.p0;
    combinedSummary.priorities.p1 += summary.priorities.p1;
  });

  // Get earliest issue date
  const firstIssueDate = new Date(
    Math.min(
      ...repoData.flatMap(({ changes }) =>
        changes.map((c) => new Date(c.issue.createdAt).getTime())
      )
    )
  );

  // Default to last 90 days if no data
  const defaultStartDate = new Date();
  defaultStartDate.setDate(defaultStartDate.getDate() - 90);

  // Generate hotspots for all repos
  const allHotspots = Object.entries(
    repoData
      .flatMap(({ repoName, changes }) => changes)
      .reduce(
        (fileMap, change) => {
          // First, deduplicate PRs for this issue by PR number
          const uniquePRs = new Map();
          change.pullRequests.forEach((pr) => {
            uniquePRs.set(pr.number, pr);
          });

          Array.from(uniquePRs.values()).forEach((pr) => {
            pr.files.forEach((file) => {
              const existing = fileMap[file.path] || {
                file: file.path,
                bugCount: 0,
                lastOccurrence: new Date(0),
                issues: [],
              };

              existing.bugCount += 1;
              const issueDate = new Date(change.issue.createdAt);
              if (issueDate > existing.lastOccurrence) {
                existing.lastOccurrence = issueDate;
              }

              // Check if we already have this issue in the list
              const existingIssue = existing.issues.find((i) => i.number === change.issue.number);
              if (!existingIssue) {
                existing.issues.push({
                  number: change.issue.number,
                  priority: change.issue.priority,
                  url: change.issue.url,
                  createdAt: change.issue.createdAt,
                  updatedAt: change.issue.updatedAt,
                  state: change.issue.state,
                  closedAt: change.issue.closedAt,
                  repo: change.repo || '', // Add repo info
                  pullRequests: Array.from(uniquePRs.values()).map((pr) => ({
                    number: pr.number,
                    title: pr.title,
                    url: pr.url,
                    files: pr.files,
                  })),
                });
              }

              fileMap[file.path] = existing;
            });
          });
          return fileMap;
        },
        {} as Record<string, HotSpot>
      )
  )
    .map(([_, hotspot]) => hotspot)
    .sort((a, b) => b.bugCount - a.bugCount);

  return hotSpotAnalysisHtml(
    firstIssueDate,
    combinedSummary,
    allHotspots,
    repoData.map((d) => d.repoName),
    defaultStartDate
  );
}

async function analyzeData() {
  // Read repositories data
  const reposData = JSON.parse(
    await fs.readFile(path.join('.github-data', 'repositories.json'), 'utf8')
  );
  const activeRepos = reposData.data.organization.repositories.nodes
    .filter((repo: any) => !repo.isArchived && repo.name.startsWith('FRW'))
    .map((repo: any) => repo.nameWithOwner);

  console.log('\nFound FRW repositories:');
  activeRepos.forEach((repo) => console.log(`- ${repo}`));
  console.log('');

  // Read project items data
  const projectItemsData = JSON.parse(
    await fs.readFile(path.join('.github-data', 'project-items.json'), 'utf8')
  );

  const projectItems = projectItemsData.data.organization.projectV2.items.nodes as ProjectItem[];
  console.log(`Found ${projectItems.length} project items`);

  // Group items by repository
  const repoItems = new Map<string, ProjectItem[]>();

  projectItems.forEach((item) => {
    if (!item.content?.url) return;

    // Extract repo from URL, e.g., "https://github.com/Outblock/FRW-Extension/issues/123"
    const repoMatch = item.content.url.match(/github\.com\/([^/]+\/[^/]+)/);
    if (!repoMatch) return;

    const repoName = repoMatch[1];
    if (!repoItems.has(repoName)) {
      repoItems.set(repoName, []);
    }
    repoItems.get(repoName)?.push(item);
  });

  // Collect summaries for index
  const repoSummaries: RepoSummary[] = [];

  // Collect data for combined report
  const repoData: { repoName: string; changes: HighPriorityChange[]; summary: Summary }[] = [];

  // Process each repository
  for (const repoName of activeRepos) {
    console.log(`\nProcessing repository: ${repoName}`);

    // Get items for this repo
    const items = repoItems.get(repoName) || [];

    // Get high priority items for this repo
    const highPriorityItems = items.filter((item) => {
      if (!item.content) {
        console.log('Found item without content:', JSON.stringify(item, null, 2));
        return false;
      }

      if (!item.fieldValues?.nodes) {
        console.log(`Item ${item.content.number} has no field values`);
        return false;
      }

      const priorityField = item.fieldValues.nodes.find(
        (field) => field?.field?.name === 'Priority'
      );

      if (!priorityField) {
        console.log(`Item ${item.content.number} has no priority field`);
        return false;
      }

      const priority = priorityField.name;
      const status = item.isArchived ? '(archived)' : '(active)';
      console.log(`Item ${item.content.number} ${status} has priority: ${priority}`);

      return priority.startsWith('P0') || priority.startsWith('P1');
    });

    console.log(`\nSummary for ${repoName}:`);
    console.log(`Total project items: ${items.length}`);
    console.log(`High priority items: ${highPriorityItems.length}`);
    console.log(`- Archived: ${highPriorityItems.filter((item) => item.isArchived).length}`);
    console.log(`- Active: ${highPriorityItems.filter((item) => !item.isArchived).length}`);
    const safeRepoName = repoName.replace('/', '-');

    try {
      // Get PRs for this repo
      const pullRequests = JSON.parse(
        await fs.readFile(path.join('.github-data', `${safeRepoName}-pull-requests.json`), 'utf8')
      ) as PullRequest[];

      console.log(`Found ${pullRequests.length} PRs for ${repoName}`);

      // Process PRs and generate report
      const issuePRMap = new Map<number, PullRequest[]>();
      for (const pr of pullRequests) {
        // Get issue numbers from various sources
        const issueNumbers = new Set<number>();

        // From branch name - format: "321-some-title"
        const branchMatch = pr.headRefName.match(/^(\d+)-/);
        if (branchMatch) {
          const num = parseInt(branchMatch[1]);
          if (num > 0 && num !== 123) {
            issueNumbers.add(num);
            console.log(`Found issue number ${num} in branch name: ${pr.headRefName}`);
          }
        }

        // From PR title
        const titleRefs = [
          ...(pr.title.match(/#(\d+)/g) || []).map((ref) => parseInt(ref.slice(1))),
          ...(pr.title.match(/[Ff]ix(?:es)?\s+#(\d+)/g) || []).map((ref) =>
            parseInt(ref.match(/\d+/)?.[0] || '0')
          ),
        ];
        titleRefs.forEach((num) => {
          if (num !== 123) issueNumbers.add(num); // Ignore template number
        });

        // From PR body
        const bodyRefs = [
          ...(pr.body?.match(/#(\d+)/g) || []).map((ref) => parseInt(ref.slice(1))),
          ...(
            pr.body?.match(
              /(?:fix|fixes|fixed|close|closes|closed|resolve|resolves|resolved)\s+#(\d+)/gi
            ) || []
          ).map((ref) => parseInt(ref.match(/\d+/)?.[0] || '0')),
        ];
        bodyRefs.forEach((num) => {
          if (num !== 123) issueNumbers.add(num); // Ignore template number
        });

        // From first commit message
        if (pr.firstCommitMessage) {
          const commitRefs = [
            ...(pr.firstCommitMessage.match(/#(\d+)/g) || []).map((ref) => parseInt(ref.slice(1))),
            ...(
              pr.firstCommitMessage.match(
                /(?:fix|fixes|fixed|close|closes|closed|resolve|resolves|resolved)\s+#(\d+)/gi
              ) || []
            ).map((ref) => parseInt(ref.match(/\d+/)?.[0] || '0')),
          ];
          commitRefs.forEach((num) => {
            if (num !== 123) issueNumbers.add(num); // Ignore template number
          });
        }

        // Remove invalid numbers
        issueNumbers.delete(0);
        issueNumbers.delete(pr.number); // Remove self-references

        // Debug output for PR linking
        if (issueNumbers.size > 0) {
          console.log(
            `PR #${pr.number} (${pr.headRefName}) links to issues:`,
            Array.from(issueNumbers)
          );
        } else {
          console.log(`PR #${pr.number} has no valid issue links`);
        }

        // Add PR to each referenced issue
        for (const issueNumber of issueNumbers) {
          if (!issuePRMap.has(issueNumber)) {
            issuePRMap.set(issueNumber, []);
          }
          issuePRMap.get(issueNumber)?.push(pr);
        }
      }

      console.log(`Found links to ${issuePRMap.size} issues in PRs`);

      // Get issues for this repo
      const issues = JSON.parse(
        await fs.readFile(path.join('.github-data', `${safeRepoName}-issues.json`), 'utf8')
      );

      // Create a map of issue numbers to their closed dates
      const issueClosedDates = new Map<number, string>();
      for (const issue of issues) {
        if (issue.state === 'CLOSED') {
          const closedDate = await getClosedDateFromTimeline(safeRepoName, issue.number);
          if (closedDate) {
            issueClosedDates.set(issue.number, closedDate);
          } else {
            // Fall back to updatedAt if timeline data is not available
            issueClosedDates.set(issue.number, issue.updatedAt);
          }
        }
      }

      // Update the high priority changes mapping to include the closed date
      const highPriorityChanges: HighPriorityChange[] = highPriorityItems
        .filter((item) => item.content && item.fieldValues?.nodes)
        .map((item) => ({
          issue: {
            number: item.content.number,
            title: item.content.title,
            url: item.content.url,
            state: item.content.state,
            createdAt: item.content.createdAt,
            updatedAt: item.content.updatedAt,
            closedAt: issueClosedDates.get(item.content.number) || null,
            isArchived: item.isArchived,
            priority:
              item.fieldValues.nodes.find(
                (field) => field?.field?.name === 'Priority' && field.name
              )?.name || 'Unknown',
          },
          pullRequests: (issuePRMap.get(item.content.number) || [])
            .filter((pr) => pr && pr.files)
            .map((pr) => ({
              number: pr.number,
              title: pr.title,
              state: pr.state,
              url: pr.url,
              body: pr.body,
              headRefName: pr.headRefName,
              createdAt: pr.createdAt,
              mergedAt: pr.mergedAt,
              files: pr.files.map((file) => ({
                path: file.path,
                additions: file.additions,
                deletions: file.deletions,
                changes: file.changes,
              })),
            })),
        }));

      // Skip if no high priority issues
      if (highPriorityChanges.length === 0) {
        console.log(`No high priority issues found for ${repoName}, skipping report generation`);
        continue;
      }

      const firstIssueDate = new Date(
        Math.min(...highPriorityChanges.map((c) => new Date(c.issue.createdAt).getTime()))
      );

      const summary = {
        totalHighPriorityIssues: highPriorityChanges.length,
        activeIssues: highPriorityChanges.filter((item) => item.issue.state === 'OPEN').length,
        closedIssues: highPriorityChanges.filter((item) => item.issue.state === 'CLOSED').length,
        archivedIssues: highPriorityChanges.filter((item) => item.issue.isArchived).length,
        totalPRs: highPriorityChanges.reduce((sum, item) => sum + item.pullRequests.length, 0),
        totalFilesChanged: highPriorityChanges.reduce(
          (sum, item) =>
            sum +
            item.pullRequests.reduce(
              (prSum, pr) => prSum + new Set(pr.files.map((c) => c.path)).size,
              0
            ),
          0
        ),
        totalChanges: highPriorityChanges.reduce(
          (sum, item) =>
            sum +
            item.pullRequests.reduce(
              (prSum, pr) =>
                prSum + pr.files.reduce((cSum, c) => cSum + (c.additions + c.deletions), 0),
              0
            ),
          0
        ),
        priorities: {
          p0: highPriorityChanges.filter((item) => item.issue.priority.startsWith('P0')).length,
          p1: highPriorityChanges.filter((item) => item.issue.priority.startsWith('P1')).length,
        },
      };

      // Save results with repo name in filename
      await fs.writeFile(
        `.github-data/${safeRepoName}-high-priority-changes.json`,
        JSON.stringify({ summary, changes: highPriorityChanges }, null, 2)
      );

      const report = generateMarkdownReport(summary, highPriorityChanges);
      await fs.writeFile(`.github-data/${safeRepoName}-high-priority-report.md`, report);

      const heatmapHtml = generateHeatmapHtml(highPriorityChanges, summary);
      await fs.writeFile(`.github-data/${safeRepoName}-bug-heatmap.html`, heatmapHtml);

      console.log(`\nAnalysis complete for ${repoName}. Results saved in:`);
      console.log(`- ${safeRepoName}-high-priority-changes.json (raw data)`);
      console.log(`- ${safeRepoName}-high-priority-report.md (formatted report)`);
      console.log(`- ${safeRepoName}-bug-heatmap.html (interactive heatmap)`);

      // Add to summaries
      repoSummaries.push({ repoName, summary, firstIssueDate });

      // Add repo info to each change
      const changesWithRepo = highPriorityChanges.map((change) => ({
        ...change,
        repo: repoName,
      }));

      // Add to repo data
      repoData.push({
        repoName,
        changes: changesWithRepo,
        summary,
      });
    } catch (error) {
      console.error(`Error processing repository ${repoName}:`, error);
    }
  }

  // Only generate index if there are repos with high priority issues
  if (repoSummaries.length > 0) {
    const indexHtml = generateIndexHtml(repoSummaries);
    await fs.writeFile('.github-data/index.html', indexHtml);
    console.log('- index.html (repository index)');
  } else {
    console.log('No repositories with high priority issues found, skipping index generation');
  }

  // Generate combined report if we have data
  if (repoData.length > 0) {
    const combinedHtml = generateCombinedHeatmapHtml(repoData);
    await fs.writeFile('.github-data/combined-bug-heatmap.html', combinedHtml);
    console.log('- combined-bug-heatmap.html (combined interactive heatmap)');
  }
}

function generateMarkdownReport(summary: Summary, changes: HighPriorityChange[]): string {
  const firstIssueDate =
    changes.length > 0
      ? new Date(Math.min(...changes.map((c) => new Date(c.issue.createdAt).getTime())))
      : new Date();

  return `# High Priority Changes Report
Generated on ${new Date().toLocaleString()}
Analyzing issues from ${firstIssueDate.toLocaleDateString()} to present

## Summary
- Total high priority issues: ${summary.totalHighPriorityIssues}
- Active issues: ${summary.activeIssues}
- Closed issues: ${summary.closedIssues}
- Archived issues: ${summary.archivedIssues}
- Total related PRs: ${summary.totalPRs}
- Total files changed: ${summary.totalFilesChanged}
- Total changes: ${summary.totalChanges}

### Priority Breakdown
- P0-Critical: ${summary.priorities.p0}
- P1-High: ${summary.priorities.p1}

## Issues and Changes
${changes
  .map(
    (item) => `
### Issue #${item.issue.number} - ${item.issue.title}
- Priority: ${item.issue.priority}
- State: ${item.issue.state}
- Created: ${new Date(item.issue.createdAt).toLocaleDateString()}
- Last Updated: ${new Date(item.issue.updatedAt).toLocaleDateString()}
${item.issue.closedAt ? `- Closed: ${new Date(item.issue.closedAt).toLocaleDateString()}` : ''}
- URL: ${item.issue.url}

${
  item.pullRequests.length > 0
    ? `#### Related Pull Requests:
${item.pullRequests
  .map(
    (pr) => `
- PR [#${pr.number}](${pr.url}) - ${pr.title}
  - Created: ${new Date(pr.createdAt).toLocaleDateString()}
  - State: ${pr.state}
  ${pr.mergedAt ? `- Merged: ${new Date(pr.mergedAt).toLocaleDateString()}` : ''}

  Changed Files:
  ${pr.files
    .map(
      (file) => `  - ${file.path}
    - Added: ${file.additions} lines
    - Deleted: ${file.deletions} lines
    - Total changes: ${file.changes}`
    )
    .join('\n  ')}`
  )
  .join('\n')}`
    : 'No linked pull requests found.'
}
`
  )
  .join('\n---\n')}`;
}

analyzeData().catch((error) => {
  console.error('Analysis failed:', error);
  process.exit(1);
});
