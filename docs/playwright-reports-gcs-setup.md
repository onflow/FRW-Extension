# Playwright Reports to Google Cloud Storage Setup

## Problem

The Playwright reports are getting too big for GitHub Pages and need to be moved to Google Cloud Storage.

## Current Setup Analysis

- Current workflow in `.github/workflows/build.yml` uses GitHub Pages deployment (lines 229-297)
- Reports are sanitized using `build/sanitize-playwright.ts` before publishing
- Each report stored in `/reports/run-{github.run_id}/` directory
- 99+ historical report runs consuming ~26MB total storage

## GCS and IAM Setup (Managed by IT)

The Google Cloud Storage bucket and associated IAM resources will be created and managed by the IT team via Terraform.

Authentication from GitHub Actions to Google Cloud will use **Workload Identity Federation**, which is a more secure method that avoids the need for long-lived service account keys. The IT team will provide the necessary identifiers for the Workload Identity Pool and the service account to be used by the GitHub Actions workflow.

### Set GitHub Repository Secrets

In your GitHub repository settings → Secrets and variables → Actions, add the following secrets, which will be provided by your IT team:

- `PROJECT_ID`: Your GCP project ID.
- `WORKLOAD_IDENTITY_PROVIDER`: The full identifier of the Workload Identity Provider.
- `SERVICE_ACCOUNT`: The email of the Google Cloud service account to impersonate.

Also, set the following as a **GitHub Variable** (not a secret):

- `GCS_BUCKET_NAME`: The name of the GCS bucket for reports (e.g., `frw-playwright-reports`).

## GitHub Actions Workflow Changes

Replace the current deploy job (lines 229-297) in `.github/workflows/build.yml` with the following two jobs. This example splits the report deployment from other deployment steps (like Storybook) and removes the unnecessary source code checkout.

```yaml
deploy-reports:
  needs: [test]
  runs-on: ubuntu-latest
  if: always()
  permissions:
    contents: 'read'
    id-token: 'write'

  steps:
    - name: Download Playwright report
      uses: actions/download-artifact@v4
      with:
        name: playwright-report
        path: playwright-report

    - name: Authenticate to Google Cloud
      id: auth
      uses: google-github-actions/auth@v2
      with:
        token_format: 'access_token'
        workload_identity_provider: ${{ secrets.WORKLOAD_IDENTITY_PROVIDER }}
        service_account: ${{ secrets.SERVICE_ACCOUNT }}

    - name: Setup Google Cloud CLI
      uses: google-github-actions/setup-gcloud@v1
      with:
        project_id: ${{ secrets.PROJECT_ID }}

    - name: Upload reports to GCS
      run: |
        RUN_DIR="reports/run-${{ github.run_id }}"
        gsutil -m cp -r playwright-report/* gs://${{ vars.GCS_BUCKET_NAME }}/$RUN_DIR/
        echo "REPORT_URL=https://storage.googleapis.com/${{ vars.GCS_BUCKET_NAME }}/$RUN_DIR/index.html" >> $GITHUB_ENV

    - name: Add Job Summary
      if: always()
      run: |
        echo "## 🎭 Playwright Test Results" >> $GITHUB_STEP_SUMMARY
        echo "### 📊 Report Details" >> $GITHUB_STEP_SUMMARY
        echo "- **Run ID**: ${{ github.run_id }}" >> $GITHUB_STEP_SUMMARY
        echo "- **Branch**: ${{ github.ref_name }}" >> $GITHUB_STEP_SUMMARY
        echo "" >> $GITHUB_STEP_SUMMARY
        echo "### 🔗 Links" >> $GITHUB_STEP_SUMMARY
        echo "- 📋 **[View Full Report](${{ env.REPORT_URL }})**" >> $GITHUB_STEP_SUMMARY
```

## Benefits Over GitHub Pages

1. **No size limits** - GCS can handle much larger reports
2. **Better performance** - Google's CDN for faster loading
3. **Cost effective** - Pay only for storage used
4. **Retention control** - Set lifecycle policies to auto-delete old reports (managed by IT via Terraform)
5. **Better security** - Fine-grained access controls with Workload Identity Federation.

## Access URLs

Reports will be accessible at:
`https://storage.googleapis.com/YOUR_BUCKET_NAME/reports/run-GITHUB_RUN_ID/index.html`

## Next Steps

1. Receive GCS bucket details and Workload Identity configuration from the IT team.
2. Add GitHub secrets (`PROJECT_ID`, `WORKLOAD_IDENTITY_PROVIDER`, `SERVICE_ACCOUNT`) to the repository.
3. Add GitHub variable (`GCS_BUCKET_NAME`) to the repository.
4. Implement the workflow changes in `.github/workflows/build.yml`.
5. Test with a new commit to verify the setup works.

## Task Status

- [x] Research current Playwright reporting setup in GitHub Actions
- [x] Investigate Google Cloud Storage bucket setup for hosting reports
- [x] Design workflow modification to upload reports to GCS instead of GitHub Pages
- [x] Update documentation to reflect new setup with Workload Identity Federation
- [ ] Implement GitHub Actions workflow changes (pending bucket setup and secrets)
