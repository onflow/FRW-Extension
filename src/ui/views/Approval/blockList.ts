import storage from '@/background/webapi/storage';

interface BlockList {
  flow: string[];
  evm: string[];
}

/**
 * Fetches the blocklist from the API and stores it in session storage
 * @returns The blocklist containing flow and evm domains
 */
export const fetchBlocklist = async (): Promise<BlockList> => {
  try {
    const response = await fetch('https://flow-blocklist.vercel.app/api/domain');
    if (!response.ok) {
      throw new Error(`Failed to fetch blocklist: ${response.status}`);
    }

    const blocklist: BlockList = await response.json();
    storage.setSession('flowBlocklist', JSON.stringify(blocklist.flow));
    storage.setSession('evmBlocklist', JSON.stringify(blocklist.evm));

    return blocklist;
  } catch (error) {
    console.error('Error fetching blocklist:', error);
    return {
      flow: [],
      evm: [],
    };
  }
};

/**
 * Gets the current flow blocklist from session storage
 * Fetches from API if not available
 * @returns The flow blocklist
 */
export const getFlowBlocklist = async (): Promise<string[]> => {
  try {
    const cachedBlocklist = await storage.getSession('flowBlocklist');

    // Only fetch if cachedBlocklist is undefined or null
    if (cachedBlocklist === undefined || cachedBlocklist === null) {
      console.log('Flow blocklist not found in session storage, fetching...');
      try {
        const blocklist = await fetchBlocklist();
        return blocklist.flow || [];
      } catch (fetchError) {
        console.error('Error fetching blocklist:', fetchError);
        return [];
      }
    } else {
      try {
        return JSON.parse(cachedBlocklist) || [];
      } catch (parseError) {
        console.error('Error parsing cached blocklist:', parseError);
        return [];
      }
    }
  } catch (error) {
    console.error('Error in getFlowBlocklist:', error);
    return [];
  }
};

/**
 * Gets the current EVM blocklist from session storage
 * Fetches from API if not available
 * @returns The EVM blocklist
 */
export const getEvmBlocklist = async (): Promise<string[]> => {
  try {
    const cachedBlocklist = await storage.getSession('evmBlocklist');

    // Only fetch if cachedBlocklist is undefined or null
    if (cachedBlocklist === undefined || cachedBlocklist === null) {
      try {
        console.log('EVM blocklist not found in session storage, fetching...');
        const blocklist = await fetchBlocklist();
        return blocklist.evm || [];
      } catch (fetchError) {
        console.error('Error fetching blocklist:', fetchError);
        return [];
      }
    } else {
      try {
        return JSON.parse(cachedBlocklist) || [];
      } catch (parseError) {
        console.error('Error parsing cached EVM blocklist:', parseError);
        return [];
      }
    }
  } catch (error) {
    console.error('Error in getEvmBlocklist:', error);
    return [];
  }
};

/**
 * Checks if a domain is in the flow blocklist
 * @param domain The domain to check
 * @returns True if the domain is blocked, false otherwise
 */
export const isFlowDomainBlocked = async (domain: string): Promise<boolean> => {
  try {
    const blocklist = await getFlowBlocklist();
    // Check if blocklist is valid before using .some()
    if (!blocklist || !Array.isArray(blocklist)) {
      console.error('Invalid EVM blocklist format:', blocklist);
      return false;
    }
    const isBlocked = blocklist.some(
      (blockedDomain) => domain === blockedDomain || domain.endsWith(`.${blockedDomain}`)
    );

    return isBlocked;
  } catch (error) {
    console.error('Error checking EVM blocklist:', error);
    return false;
  }
};

/**
 * Checks if a domain is in the EVM blocklist
 * @param domain The domain to check
 * @returns True if the domain is blocked, false otherwise
 */
export const isEvmDomainBlocked = async (domain: string): Promise<boolean> => {
  try {
    const blocklist = await getEvmBlocklist();
    if (!blocklist || !Array.isArray(blocklist)) {
      console.error('Invalid EVM blocklist format:', blocklist);
      return false;
    }
    // blocklist.push('https://flow-evm-rainbow-dev.vercel.app');
    const isBlocked = blocklist.some(
      (blockedDomain) => domain === blockedDomain || domain.endsWith(`.${blockedDomain}`)
    );
    console.log('isEvmDomainBlocked', isBlocked);
    return isBlocked;
  } catch (error) {
    console.error('Error checking EVM blocklist:', error);
    return false;
  }
};

/**
 * Checks if a domain is blocked in either the Flow or EVM blocklist
 * @param domain The domain to check
 * @returns True if the domain is blocked in either blocklist, false otherwise
 */
export const isDomainBlocked = async (domain: string): Promise<boolean> => {
  try {
    // Check both blocklists in parallel for efficiency
    const [isBlockedInFlow, isBlockedInEvm] = await Promise.all([
      isFlowDomainBlocked(domain),
      isEvmDomainBlocked(domain),
    ]);

    const isBlocked = isBlockedInFlow || isBlockedInEvm;

    return isBlocked;
  } catch (error) {
    console.error('Error checking domain against blocklists:', error);

    // Fallback to individual checks if parallel check fails
    try {
      const isBlockedInFlow = await isFlowDomainBlocked(domain);
      if (isBlockedInFlow) return true;

      const isBlockedInEvm = await isEvmDomainBlocked(domain);
      return isBlockedInEvm;
    } catch (fallbackError) {
      console.error('Fallback check also failed:', fallbackError);
      return false;
    }
  }
};
