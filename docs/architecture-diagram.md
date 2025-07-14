# Flow Wallet Chrome Extension Architecture Diagram

```
+---------------------+     +---------------------+     +---------------------+
|                     |     |                     |     |                     |
|      Web Page       |     |      Popup UI       |     |   Notification UI   |
|                     |     |                     |     |                     |
+----------+----------+     +----------+----------+     +----------+----------+
           |                           |                           |
           |                           |                           |
+----------v-----------+    +----------v-----------+    +----------v-----------+
|                      |    |                      |    |                      |
|   Page Provider      |    |   React Components   |    |   React Components   |
|   (EthereumProvider) |    |                      |    |                      |
|                      |    |                      |    |                      |
+----------+-----------+    +----------+-----------+    +----------+-----------+
           |                           |                           |
           |                           |                           |
+----------v-----------+    +----------v-----------+    +----------v-----------+
|                      |    |                      |    |                      |
|   Content Script     |<-->|   Background Script  |<-->|   Chrome Extension   |
|                      |    |                      |    |       APIs           |
+----------+-----------+    +----------+-----------+    +----------------------+
           |                           |
           |                           |
           |                +----------v-----------+
           |                |                      |
           |                |   Wallet Controller  |
           |                |                      |
           |                +----------+-----------+
           |                           |
           |                           |
+----------v-----------+    +----------v-----------+
|                      |    |                      |
|   BroadcastChannel   |    |    Core Services     |
|   Communication      |    |                      |
|                      |    +----------+-----------+
+----------------------+               |
                                       |
                           +-----------v------------+
                           |                        |
                           |   External APIs        |
                           |   - Flow Blockchain    |
                           |   - Firebase          |
                           |   - Google APIs       |
                           |   - Mixpanel          |
                           |   - Token Price APIs  |
                           |   - NFT APIs          |
                           |                        |
                           +------------------------+
```

## Component Relationships

1. **Web Page <-> Page Provider <-> Content Script <-> Background Script**

   - Web pages interact with the injected Page Provider (EthereumProvider)
   - The Page Provider communicates with the Content Script via BroadcastChannel
   - The Content Script communicates with the Background Script via Chrome messaging

2. **Popup/Notification UI <-> Background Script**

   - The Popup and Notification UIs communicate with the Background Script via port messaging
   - React components in the UI dispatch actions that are processed by the Background Script

3. **Background Script <-> Wallet Controller <-> Core Services <-> External APIs**

   - The Background Script uses the Wallet Controller to manage wallet operations
   - The Wallet Controller uses Core Services to perform specific operations
   - Core Services interact with External APIs to fetch data and perform blockchain operations

4. **Chrome Extension APIs <-> Background Script**
   - The Background Script uses Chrome Extension APIs for storage, notifications, etc.

## Data Flow

```
+-------------+     +-------------+     +-------------+     +-------------+
|             |     |             |     |             |     |             |
| User Action |---->| UI/Provider |---->| Background  |---->| Core        |
|             |     | Request     |     | Processing  |     | Services    |
|             |     |             |     |             |     |             |
+-------------+     +-------------+     +-------------+     +------+------+
                                                                   |
                                                                   v
+-------------+     +-------------+     +-------------+     +-------------+
|             |     |             |     |             |     |             |
| UI Update   |<----| Response    |<----| Result      |<----| External    |
|             |     | Formatting  |     | Processing  |     | API Calls   |
|             |     |             |     |             |     |             |
+-------------+     +-------------+     +-------------+     +-------------+
```

This architecture follows a unidirectional data flow pattern where:

1. User actions trigger requests from the UI or dApp provider
2. Requests are processed by the background script
3. Core services handle the business logic and make external API calls
4. Results are processed and formatted
5. UI is updated with the results
