# Setting Page Storybook Stories

This directory contains Storybook stories for the main Settings page component (`SettingTab`).

## Stories Overview

### Default

- **Description**: Default settings page with no profile and no keyphrase backup
- **Use Case**: Shows the basic settings page layout without any user-specific features

### WithProfile

- **Description**: Settings page with a user profile displayed at the top
- **Use Case**: Demonstrates how the profile section appears when a user has a profile

### WithMultipleProfiles

- **Description**: Settings page with multiple profiles available
- **Use Case**: Shows the profile section when multiple profiles exist (triggers the profile display logic)

### WithKeyphraseBackup

- **Description**: Settings page with keyphrase backup option available
- **Use Case**: Demonstrates the backup section when the user has a keyphrase setup

### ChildAccount

- **Description**: Settings page when a child account is active (hides some options)
- **Use Case**: Shows how the settings change when a child account is active vs main account

### CompleteSetup

- **Description**: Settings page with all features enabled
- **Use Case**: Comprehensive view with multiple profiles, keyphrase backup, and child account

### Interactive

- **Description**: Interactive version with console logging for all click events
- **Use Case**: For testing and debugging click interactions

## Mocked Dependencies

The stories mock the following dependencies:

- **chrome.i18n**: Internationalization messages
- **useWallet**: Wallet context and methods
- **useProfiles**: User profile data
- **React Router**: Navigation functionality

## Key Features Demonstrated

1. **Profile Display**: Shows/hides based on number of profiles
2. **Conditional Sections**: Backup section only shows with keyphrase
3. **Account Type Logic**: Different behavior for child vs main accounts
4. **Navigation Links**: All settings sections are properly linked
5. **Mobile App Links**: App store buttons for iOS and Android
6. **Responsive Design**: Proper styling and layout

## Usage

To view these stories in Storybook:

1. Start Storybook: `npm run storybook`
2. Navigate to "Views/Setting/SettingTab"
3. Select different story variants from the sidebar

## Testing

Each story demonstrates different states and configurations of the Settings page, making it easy to test:

- Component rendering in various states
- Conditional logic for different user scenarios
- Navigation and interaction patterns
- Responsive design and styling
