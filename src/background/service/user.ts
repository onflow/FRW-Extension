import { createPersistStore } from 'background/utils';

export interface UserInfoStore {
  avatar: string;
  nickname: string;
  username: string;
  dashboardIndex: number;
  private: number;
  user_id: string;
  created_at: string;
  meow: Meows;
}

interface Meows {
  mainnet: string,
  testnet: string,
}

const template = {
  avatar: '',
  nickname: '',
  username: '',
  dashboardIndex: 0,
  private: 0,
  user_id: '',
  created_at: '',
  meow: {
    mainnet: '',
    testnet: '',
  }
}

class UserInfo {
  store!: UserInfoStore;

  init = async () => {
    this.store = await createPersistStore<UserInfoStore>({
      name: 'userInfo',
      template: template,
    });
  };

  getUserInfo = () => {
    return this.store;
  };

  addUserInfo = (data: UserInfoStore) => {
    this.store.nickname = data['nickname'];
    this.store.private = data['private'];
    this.store.username = data['username'];

    const url = new URL(data['avatar'])
    if (url.host === 'firebasestorage.googleapis.com') {
      url.searchParams.append('alt', 'media')
      url.searchParams.append('token', process.env.FB_TOKEN!)
      this.store.avatar = url.toString()
    }
    this.store.avatar = data['avatar'];
  };

  addUserId = (userId: string) => {
    this.store.user_id = userId;
  };

  removeUserInfo = () => {
    this.store = template;
  };

  updateUserInfo = (data: UserInfoStore) => {
    this.store = data;
  };

  setDashIndex = (data: number) => {
    this.store.dashboardIndex = data;
  };

  getDashIndex = () => {
    return this.store.dashboardIndex;
  };

  setMeow = (domain: string, network: string) => {
    this.store.meow[network] = domain;
  };

  getMeow = (network: string) => {
    return this.store.meow[network]
  };
}

export default new UserInfo();
