# Flow Wallet Chrome Extension Architecture

## Overview

The Flow Wallet Chrome Extension is a cryptocurrency wallet that primarily supports the Flow blockchain but also provides Ethereum compatibility. It allows users to manage their crypto assets, interact with dApps, and perform transactions on the Flow blockchain.

## Architecture Components

### 1. Background Script

The background script (`src/background/index.ts`) is the central component of the extension that:

- Initializes the wallet and restores app state
- Manages communication between different parts of the extension
- Handles authentication with Firebase
- Processes requests from content scripts and UI
- Manages wallet controllers and services

Key controllers:

- `walletController`: Manages wallet operations
- `providerController`: Handles provider-related operations
- `notificationService`: Manages notifications and approval requests

### 2. Content Script

The content script (`src/content-script/index.ts`) is injected into web pages to:

- Establish communication between web pages and the extension
- Inject the page provider script into web pages
- Relay messages between web pages and the background script
- Handle FCL (Flow Client Library) integration

### 3. Page Provider

The page provider (`src/content-script/pageProvider/eth/index.ts`) is injected into web pages to:

- Provide an Ethereum-compatible provider interface
- Implement EIP-6963 for wallet discovery
- Route requests between the page and the appropriate wallet
- Coexist with other wallet extensions like MetaMask

### 4. Core Services

The core services (`src/core/service/`) provide the main functionality of the wallet:

#### Key Management

- `keyringService`: Manages cryptographic keys
- `permissionService`: Manages dApp permissions

#### Blockchain Interaction

- `openapiService`: Handles API interactions with blockchain nodes
- `transactionService`: Manages transaction creation, signing, and submission
- `userWalletService`: Manages user wallet functionality

#### Asset Management

- `coinListService`: Manages supported cryptocurrencies
- `nftService`: Manages NFTs on Flow blockchain
- `evmNftService`: Manages NFTs on EVM-compatible blockchains
- `tokenListService`: Manages token lists

#### User Data

- `userInfoService`: Manages user information
- `addressBookService`: Manages user contacts/addresses
- `preferenceService`: Manages user preferences
- `sessionService`: Manages user sessions
- `signTextHistoryService`: Manages history of signed messages

#### External Integrations

- `googleDriveService`: Google Drive integration for backup
- `googleSafeHostService`: Safe browsing integration
- `mixpanelTrack`: Analytics integration
- `newsService`: News updates
- `remoteConfigService`: Remote configuration

### 5. UI Components

The UI (`src/ui/`) provides the user interface for the extension:

- Popup interface (`popup.html`)
- Notification interface (`notification.html`)
- React components for different screens and features
- State management using Redux

## Communication Flow

1. **dApp to Extension**: Web pages communicate with the extension through the injected page provider
2. **Page Provider to Content Script**: The page provider sends messages to the content script using BroadcastChannel
3. **Content Script to Background**: The content script communicates with the background script using Chrome's messaging API
4. **Background to Services**: The background script uses the core services to perform operations
5. **Background to UI**: The background script communicates with the UI using port messaging

## Data Flow

1. **User Actions**: User interacts with the UI or a dApp
2. **Request Processing**: Requests are processed by the background script
3. **Service Operations**: Core services perform the requested operations
4. **Blockchain Interaction**: Services interact with the blockchain through FCL or other APIs
5. **Response**: Results are sent back to the UI or dApp

## Security Model

- Sensitive operations require user approval through the notification UI
- Keys are managed securely by the keyring service
- Permissions are managed by the permission service
- Communication between components uses secure channels

## External Dependencies

- **Flow Client Library (FCL)**: For interacting with the Flow blockchain
- **Firebase**: For authentication, storage, and remote configuration
- **React**: For building the UI
- **Redux**: For state management
- **Ethereum RPC**: For Ethereum compatibility

## API Calls

The extension makes various API calls to interact with blockchains and external services:

### Flow Blockchain API Calls (via FCL)

- Account information retrieval
- Transaction submission and monitoring
- Token balance queries
- NFT queries
- Smart contract interactions

### External API Calls

- Token price data
- NFT metadata
- News updates
- Analytics tracking

### Firebase API Calls

- Authentication
- Remote configuration
- Storage for user data

### Google API Calls

- Google Drive for backup
- Safe browsing checks
