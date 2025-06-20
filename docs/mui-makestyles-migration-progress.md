# MUI makeStyles to sx API Migration Progress

## Overview

Migration from @mui/styles (makeStyles) to sx API as part of MUI v5 to v6 upgrade.

## Migration Status

### ✅ Phase 1: Simple Components (5 files) - COMPLETED

- `/src/ui/components/LLSpinner.tsx` - Removed unused makeStyles
- `/src/ui/components/PrimaryButton.tsx` - Removed unused makeStyles
- `/src/ui/components/FRWChildProfile.tsx` - Removed unused makeStyles
- `/src/ui/components/SlideDown.tsx` - Removed unused makeStyles
- `/src/ui/components/SlideLeftRight.tsx` - Removed unused makeStyles

### ✅ Phase 2: Settings Components (12 files) - COMPLETED

- `/src/ui/views/Setting/About/About.tsx`
- `/src/ui/views/Setting/Account/index.tsx`
- `/src/ui/views/Setting/AddressBook/index.tsx`
- `/src/ui/views/Setting/AddressBook/AddressBookList.tsx`
- `/src/ui/views/Setting/Backups/BackupsPassword.tsx`
- `/src/ui/views/Setting/Currency/index.tsx`
- `/src/ui/views/Setting/DeveloperMode/DeveloperMode.tsx`
- `/src/ui/views/Setting/KeyList/KeyList.tsx`
- `/src/ui/views/Setting/Linked/index.tsx`
- `/src/ui/views/Setting/Linked/LinkedDetail.tsx`
- `/src/ui/views/Setting/recoveryphase/Recoveryphasedetail.tsx`
- `/src/ui/views/Setting/Security.tsx`

### ✅ Phase 3: Main Dashboard & Navigation (4 files) - COMPLETED

- `/src/ui/views/Dashboard/Header.tsx`
- `/src/ui/views/Dashboard/Components/MenuDrawer.tsx`
- `/src/ui/views/InnerRoute.tsx`
- `/src/ui/views/Setting/index.tsx`

### ✅ Phase 4: NFT Components (9 files) - COMPLETED

- `/src/ui/views/NFT/CollectionDetail.tsx` - Removed unused makeStyles
- `/src/ui/views/NFT/Detail.tsx`
- `/src/ui/views/NFT/ListTab.tsx`
- `/src/ui/views/NFT/NFTList/AddList.tsx`
- `/src/ui/views/NFT/SendNFT/SendToAddress.tsx`
- `/src/ui/views/NftEvm/CollectionDetail.tsx` - Removed unused makeStyles
- `/src/ui/views/NftEvm/Detail.tsx`
- `/src/ui/views/NftEvm/ListTab.tsx`
- `/src/ui/views/NftEvm/SendNFT/SendToAddress.tsx`

### ✅ Phase 5: Transaction & Wallet Components (8 files) - COMPLETED

- `/src/ui/views/Send/index.tsx`
- `/src/ui/views/SendTo/TransferAmount.tsx`
- `/src/ui/views/TokenDetail/index.tsx`
- `/src/ui/views/TokenList/index.tsx`
- `/src/ui/views/ManageToken/index.tsx`
- `/src/ui/views/Deposit/index.tsx`
- `/src/ui/views/MoveBoard/AccountBox.tsx` - Removed unused makeStyles
- `/src/ui/views/MoveBoard/AccountMainBox.tsx` - Removed unused makeStyles

### 🔄 Phase 6: Onboarding & Authentication (7 files) - PENDING

- `/src/ui/views/Welcome/Sync/SyncQr.tsx`
- `/src/ui/views/Welcome/AccountImport/Google/GoogleRecoverPassword.tsx`
- `/src/ui/views/Welcome/AccountImport/Google/DecryptWallet.tsx`
- `/src/ui/views/Welcome/AccountImport/ImportComponents/SeedPhraseImport.tsx`
- `/src/ui/views/Welcome/AccountImport/ImportComponents/KeyImport.tsx`
- `/src/ui/views/Welcome/AccountImport/ImportComponents/JsonImport.tsx`
- `/src/ui/views/Forgot/Recover/RecoverPage.tsx`

### 🔄 Phase 7: Remaining Components (13 files) - PENDING

- `/src/ui/views/Approval/components/LinkingBlock.tsx`
- `/src/ui/components/FRWProfile.tsx`
- `/src/ui/components/KeyPathInputs.tsx`
- `/src/ui/components/LLProfile.tsx`
- `/src/ui/components/SettingsPassword.tsx`
- `/src/ui/components/Send/ContactCard.tsx`
- `/src/ui/components/NFTs/CollectionDetailGrid.tsx`
- `/src/ui/components/NFTs/GridView.tsx`
- `/src/ui/components/LandingPages/PasswordComponents.tsx`
- `/src/ui/components/LandingPages/SetPassword.tsx`
- `/src/ui/components/LandingPages/PickUsername.tsx`
- `/src/ui/components/LLLinkingLoading.tsx`
- `/src/ui/components/LLContactEth.tsx`
- `/src/ui/components/LLContactCard.tsx`
- `/src/ui/components/FWMoveDropdown.tsx`
- `/src/ui/components/FWDropDownProfile.tsx`
- `/src/ui/components/FWContactCard.tsx`
- `/src/ui/components/FRWTargetProfile.tsx`
- `/src/ui/components/Approval/SignHeader.tsx`

## Summary

- **Total Files**: ~50
- **Completed**: 38 files
- **Remaining**: ~20 files
- **Progress**: ~76%

## Commits

1. Phase 1 & 2: "refactor(935): migrate Phase 1 & 2 components from makeStyles to sx API"
2. Phase 3 & 4: "refactor: migrate Phase 3 & 4 components from makeStyles to sx API"
3. Phase 5: "refactor: migrate Phase 5 transaction and wallet components from makeStyles to sx API"

## Key Changes Made

1. Removed `makeStyles` imports from `@mui/styles`
2. Converted style objects to `sx` props
3. Handled theme access via function syntax in sx
4. Fixed TypeScript issues with ListItem button props
5. Achieved cleaner, more maintainable code with fewer lines
6. Removed several unused makeStyles definitions entirely
