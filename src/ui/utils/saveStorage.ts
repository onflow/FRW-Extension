import { storage } from 'background/webapi'

export const saveIndex = async (username = '', userId = null) => {
  const loggedInAccounts = await storage.get('loggedInAccounts') || [];
  let currentindex = 0;

  if (!loggedInAccounts || loggedInAccounts.length === 0) {
    currentindex = 0;
  } else {
    const index = loggedInAccounts.findIndex(account => account.username === username);
    currentindex = index !== -1 ? index : loggedInAccounts.length;
  }

  const path = await storage.get('temp_path') || "m/44'/539'/0'/0/0";
  const passphrase = await storage.get('temp_phrase') || '';
  await storage.set(`user${currentindex}_path`, path);
  await storage.set(`user${currentindex}_phrase`, passphrase);
  await storage.set(`user${userId}_path`, path);
  await storage.set(`user${userId}_phrase`, passphrase);
  await storage.remove(`temp_path`);
  await storage.remove(`temp_phrase`);
  await storage.set('currentAccountIndex', currentindex);
  if (userId) {
    await storage.set('currentId', userId);
  }
};


export const getStoragedAccount = async () => {
  const accountIndex = await storage.get('currentAccountIndex') || 0;
  const currentId = await storage.get('currentId') || null;
  const loggedInAccounts = await storage.get('loggedInAccounts') || [];
  console.log('loggedInAccounts ', loggedInAccounts)
  console.log('currentId ', currentId)
  let account;

  // Check if currentId is provided and valid
  if (currentId !== null) {
    // Find account with the currentId
    account = loggedInAccounts.find(acc => acc.id === currentId);

    // If no account is found with currentId, default to accountIndex
    if (!account) {
      account = loggedInAccounts[accountIndex];
    }
  } else {
    // If currentId is not provided, use accountIndex
    account = loggedInAccounts[accountIndex];
  }

  if (!account) {
    // Handle the case when no account is found
    throw new Error("Account info not found.");
  } else {
    // Return account
    return account;
  }

};
