#!/bin/bash

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI (gh) is not installed. Please install it first."
    exit 1
fi

# Check if logged in
if ! gh auth status &> /dev/null; then
    echo "Please login to GitHub first using: gh auth login"
    exit 1
fi

# Create data directory
mkdir -p .github-data

# Create data directory
mkdir -p .github-data/Outblock

# Get list of repositories in the Outblock organization
echo "Fetching Outblock repositories..."
gh api graphql -f query='
  query {
    organization(login: "Outblock") {
      repositories(first: 100, orderBy: {field: UPDATED_AT, direction: DESC}) {
        nodes {
          name
          nameWithOwner
          isArchived
        }
      }
    }
  }
' > .github-data/repositories.json

# Get active repositories
REPOS=$(jq -r '.data.organization.repositories.nodes[] | select(.isArchived == false and (.name | startswith("FRW"))) | .nameWithOwner' .github-data/repositories.json)

# Debug output
echo "Found FRW repositories:"
echo "$REPOS" | while read -r repo; do
  echo "- $repo"
done

# Get project data
echo "Fetching project data..."
gh api graphql -f query='
  query {
    organization(login: "Outblock") {
      projectsV2(first: 20, orderBy: {field: UPDATED_AT, direction: DESC}) {
        nodes {
          number
          title
          shortDescription
          closed
          url
        }
      }
    }
  }
' > .github-data/projects.json

# Display available projects
echo "Available projects:"
jq -r '.data.organization.projectsV2.nodes[] | "\(.number): \(.title) \(if .closed then "(closed)" else "" end)\n  URL: \(.url)\n  Description: \(.shortDescription // "No description")\n"' .github-data/projects.json

# Set project number to 2
PROJECT_NUMBER=2
echo "Project number set to: $PROJECT_NUMBER"

# Get project items
echo "Fetching project items..."

# Initialize variables for pagination
cursor=""
has_next_page="true"
first_batch="true"

# Create a temporary file for accumulating results
echo '{"data":{"organization":{"projectV2":{"title":null,"items":{"nodes":[]}}}}}' > .github-data/project-items.json

while [ "$has_next_page" = "true" ]; do
  # Construct the cursor argument
  cursor_arg=""
  if [ "$first_batch" = "false" ]; then
    cursor_arg=", after: \"$cursor\""
  fi

  # Fetch the next batch
  gh api graphql -f query="
    query(\$projectNumber: Int!) {
      organization(login: \"Outblock\") {
        projectV2(number: \$projectNumber) {
          title
          items(first: 100${cursor_arg}) {
            nodes {
              isArchived
              content {
                ... on Issue {
                  number
                  title
                  createdAt
                  updatedAt
                  state
                  url
                }
              }
              fieldValues(first: 8) {
                nodes {
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    field {
                      ... on ProjectV2SingleSelectField {
                        name
                      }
                    }
                    name
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    }
  " -F projectNumber=$PROJECT_NUMBER > .github-data/temp_batch.json

  # Extract pagination info for next iteration
  has_next_page=$(jq -r '.data.organization.projectV2.items.pageInfo.hasNextPage' .github-data/temp_batch.json)
  cursor=$(jq -r '.data.organization.projectV2.items.pageInfo.endCursor' .github-data/temp_batch.json)

  # Merge this batch with previous results
  if [ "$first_batch" = "true" ]; then
    mv .github-data/temp_batch.json .github-data/project-items.json
    first_batch="false"
  else
    # Combine the nodes arrays from both files
    jq -s '
      .[0].data.organization.projectV2.items.nodes += .[1].data.organization.projectV2.items.nodes |
      .[0]
    ' .github-data/project-items.json .github-data/temp_batch.json > .github-data/temp_combined.json
    mv .github-data/temp_combined.json .github-data/project-items.json
  fi

  # Count items so far
  current_count=$(jq '.data.organization.projectV2.items.nodes | length' .github-data/project-items.json)
  echo "Fetched $current_count items so far..."
done

rm -f .github-data/temp_batch.json

# Debug output
echo "Project items fetched. Checking data..."
total_items=$(jq '.data.organization.projectV2.items.nodes | length' .github-data/project-items.json)
archived_items=$(jq '.data.organization.projectV2.items.nodes | map(select(.isArchived == true)) | length' .github-data/project-items.json)
echo "Total items found: $total_items"
echo "Archived items: $archived_items"

# Fetch data for each repository
echo "Fetching repository data..."
for repo in $REPOS; do
  echo "Processing repository: $repo"

  # Convert repo name for file saving (e.g., "Outblock/FRW-Extension" -> "Outblock-FRW-Extension")
  safe_repo=$(echo "$repo" | tr '/' '-')

  # Get all issues from the repository
  echo "Fetching issues..."
  gh issue list --repo $repo --state all --json number,title,state,createdAt,updatedAt,url,labels -L 1000 > ".github-data/${safe_repo}-issues.json"

  # Get all pull requests from the repository
  echo "Fetching pull requests..."
  gh pr list --repo $repo --json number,title,state,createdAt,mergedAt,url,files,body,headRefName --state all -L 1000 > ".github-data/${safe_repo}-pull-requests.json"

  # After fetching issues, get timeline events for closed issues
  echo "Fetching timeline events for closed issues in $repo"

  # Get list of closed issue numbers
  closed_issues=$(jq -r '.[] | select(.state=="CLOSED") | .number' ".github-data/${safe_repo}-issues.json")

  # Create timeline directory
  mkdir -p ".github-data/${safe_repo}-timelines"

  # Fetch timeline for each closed issue
  for issue in $closed_issues; do
    gh api "repos/${repo}/issues/${issue}/timeline" --paginate > ".github-data/${safe_repo}-timelines/issue-${issue}-timeline.json"
    echo "Fetched timeline for issue #${issue}"
  done

  echo "Completed fetching data for $repo"
done

echo "Data fetching complete. Files saved in .github-data/"
