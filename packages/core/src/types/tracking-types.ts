import type {
  HashAlgoString,
  SignAlgoString,
  ImportKeyType,
  RecoveryMechanismType,
} from './algo-types';

type OnRampSourceType = 'moonpay' | 'coinbase';

type AddressType = 'flow' | 'evm' | 'child' | 'coa';

export type TrackingEvents = {
  // Mixpanel Events
  $identify: {
    distinct_id: string; // The distinct id of the user
    $anon_distinct_id: string; // The anonymous distinct id of the user
    $name?: string; // The name of the user
  };
  $mp_web_page_view: {
    current_page_title: string; // The title of the current page
    current_domain: string; // The domain of the current page
    current_url_path: string; // The path of the current page
    current_url_protocol: string;
  };
  // General Events
  script_error: {
    error: string; // Error message of the script, e.g., Rate limit exceeded
    script_id: string; // Script name from script API, e.g. checkCoaLink
  };
  delegation_created: {
    address: string; // Address of the account that delegated
    node_id: string; // ID of the node that was delegated to
    amount: string; // Amount as a string
  };
  on_ramp_clicked: {
    source: OnRampSourceType; // The on ramp platform the user choose e.g. moonpay or coinbase
  };
  coa_creation: {
    tx_id: string; // The transaction ID
    flow_address: string; //
    error_message?: string; // Any error message
  };
  security_tool: {
    type: 'biometric' | 'pin' | 'none';
  };

  // Backup Events
  multi_backup_created: {
    address: string; // Address of the account that set up multi-backup
    providers: ImportKeyType[]; // Providers used in the multi-backup, GoogleDrive, iCloud, Seed e.g. google_drive  icloud seed_phrase
  };
  multi_backup_creation_failed: {
    address: string; // Address of the account that set up multi-backup
    providers: ImportKeyType[]; // Providers used in the multi-backup, GoogleDrive, iCloud, Seed e.g. google_drive  icloud seed_phrase
  };

  // Transaction Events

  cadence_transaction_signed: {
    cadence: string; // SHA256 Hashed Cadence that was signed.
    tx_id: string; // String of the transaction ID.
    authorizers: string[]; // Comma separated list of authorizer account address in the transaction
    proposer: string; // Address of the transactions proposer.
    payer: string; // Payer of the transaction.
    success: boolean; // Boolean of if the transaction was sent successful or not. true/false
  };
  evm_transaction_signed: {
    success: boolean; // Boolean of if the transaction was sent successful or not. true/false
    flow_address: string; // Address of the account that signed the transaction
    evm_address: string; // EVM Address of the account that signed the transaction
    tx_id: string; // transaction id
  };
  ft_transfer: {
    from_address: string; // Address of the account that transferred the FT
    to_address: string; // Address of the account that received the FT
    type: string; // Type of FT sent (e.g., "FLOW", "USDf")
    amount: string; // The amount of FT as a fixed string
    ft_identifier: string; // The identifier of fungible token
  };
  nft_transfer: {
    from_address: string; // Address of the account that transferred the FT
    to_address: string; // Address of the account that received the FT
    nft_identifier: string; // The identifier of non fungible token
    tx_id: string; // ID of the NFT that was transferred
    from_type: AddressType; // The type of from address whether it's flow, child account, coa or evm account.
    to_type: AddressType; // The type of to address whether it's flow, child account, coa or evm account.
    isMove: boolean; // The transfer flow is triggerred from Move account
  };

  transaction_result: {
    tx_id: string; // The transaction id
    is_successful: boolean; // If the transaction is successful
    error_message?: string; // Error message of transaction
  };
  // Account Events
  account_created: {
    public_key: string; // The public key used for creating the new account
    key_type?: ImportKeyType; // The key type of the account (if available)
    sign_algo: SignAlgoString; // Signature algorithm of the key
    hash_algo: HashAlgoString; // Hash algo Hash algorithm of the key
  };

  account_creation_time: {
    // Timing Events
  };
  account_recovered: {
    address: string; // Address that was recovered
    mechanism: RecoveryMechanismType; // The way the account was recovered
    methods: ImportKeyType[]; // Array of providers used in the multi-backup, GoogleDrive, iCloud, Seed
  };

  // Password Events
  password_updated: {
    address: string; // Address of the account that updated password
    success: boolean; // Whether the password update was successful
    profilesUpdated: number; // Number of profiles updated
  };

  password_update_failed: {
    address: string; // Address of the account that failed to update password
    error: string; // Error message explaining why update failed
  };

  // Error Logging
  error: {
    code: number; // Error code
    category: string; // Error category
    message: string; // Error message
    extra: string; // Extra information about the error - stack trace, etc.
    value: string; // value of the message
  };
};

export type TrackEventMessage<T extends keyof TrackingEvents = keyof TrackingEvents> = {
  msg: 'track_event';
  eventName: T;
  properties?: TrackingEvents[T];
};

export type TrackUserMessage = {
  msg: 'track_user';
  userId: string;
};

export type TrackResetMessage = {
  msg: 'track_reset';
};

export type TrackTimeMessage = {
  msg: 'track_time';
  eventName: keyof TrackingEvents;
};

export type TrackMessage =
  | TrackEventMessage
  | TrackUserMessage
  | TrackResetMessage
  | TrackTimeMessage;
