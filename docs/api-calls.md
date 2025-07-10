# Flow Wallet Chrome Extension API Calls

This document provides a comprehensive list of all API calls made by the Flow Wallet Chrome Extension.

## Flow Blockchain API Calls (via FCL)

The extension uses the Flow Client Library (FCL) to interact with the Flow blockchain. Key API calls include:

### Account Operations

- `fcl.account`: Retrieves account information including keys, contracts, and balances
- `fcl.currentUser`: Manages the current user's authentication state
- `fcl.authenticate`: Authenticates the user with the Flow blockchain
- `fcl.unauthenticate`: Logs out the current user

### Transaction Operations

- `fcl.send`: Sends transactions to the Flow blockchain
- `fcl.tx`: Retrieves transaction information and monitors transaction status
- `fcl.getTransactionStatus`: Gets the current status of a transaction
- `fcl.getTransaction`: Retrieves detailed transaction information
- `fcl.signWithKey`: Signs transaction data with a private key
- `fcl.verifyUserSignatures`: Verifies signatures on transactions

### Script Execution

- `fcl.query`: Executes read-only Cadence scripts on the Flow blockchain
- `fcl.getEventsAtBlockHeightRange`: Retrieves events within a block height range
- `fcl.getEventsAtBlockIds`: Retrieves events at specific block IDs
- `fcl.getBlock`: Retrieves block information
- `fcl.getBlockHeader`: Retrieves block header information

### Network Configuration

- `fcl.config`: Configures the FCL library for different networks (mainnet, testnet)

## External API Calls

### Token Price and Market Data

- `getTokenPrice`: Retrieves current token prices
- `getTokenPriceHistoryArray`: Retrieves historical token price data
- `getUSDCPrice`: Gets the current price of USDC
- `getFlowPricePair`: Gets the current price of FLOW tokens

### NFT Data

- `getNFTList`: Retrieves a list of NFTs owned by an address
- `nftCatalogList`: Gets NFT catalog information
- `nftCatalogCollections`: Gets NFT collection information
- `nftCatalogCollectionList`: Gets a list of NFTs in a collection
- `getEvmNFT`: Retrieves NFT data for EVM-compatible blockchains

### User Management

- `register`: Registers a new user
- `loginV3`: Authenticates a user
- `importKey`: Imports a key for a user
- `userInfo`: Retrieves user information
- `updateProfile`: Updates user profile information
- `searchUser`: Searches for users

### Address Book

- `getAddressBook`: Retrieves the user's address book
- `addAddressBook`: Adds a contact to the address book
- `editAddressBook`: Edits a contact in the address book
- `deleteAddressBook`: Deletes a contact from the address book

### Domain Resolution

- `getFlownsAddress`: Resolves a .find domain to a Flow address
- `getFindAddress`: Resolves a .find domain to a Flow address
- `getFindDomainByAddress`: Gets the .find domain for a Flow address

## Firebase API Calls

### Authentication

- `signInAnonymously`: Signs in a user anonymously
- `signInWithCustomToken`: Signs in a user with a custom token
- `onAuthStateChanged`: Listens for changes in authentication state

### Remote Configuration

- `fetchConfig`: Fetches remote configuration values
- `activate`: Activates fetched configuration values

### Firestore

- Used for storing and retrieving user data, preferences, and other application state

## Google API Calls

### Google Drive

- `googleDriveService.backup`: Backs up wallet data to Google Drive
- `googleDriveService.restore`: Restores wallet data from Google Drive

### Safe Browsing

- `googleSafeHostService.getBlockList`: Retrieves a list of blocked hosts
- `googleSafeHostService.init`: Initializes the safe browsing service

## Analytics API Calls

### Mixpanel

- `mixpanelTrack.init`: Initializes the Mixpanel tracking
- `mixpanelTrack.track`: Tracks user events and actions

## Other API Calls

### News Service

- `getNews`: Retrieves news items related to cryptocurrency

### Recaptcha

- `validateRecaptcha`: Validates a reCAPTCHA token

### Device Management

- `deviceList`: Retrieves a list of devices
- `addDevice`: Adds a new device
- `synceDevice`: Syncs device information
