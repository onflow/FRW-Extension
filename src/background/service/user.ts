import { type UserInfoResponse } from '@/shared/types/network-types';
import { getCurrentProfileId } from '@/shared/utils/current-id';
import { createSessionStore } from 'background/utils';

class UserInfoService {
  store!: Map<string, UserInfoResponse>;

  // TODO: remove this
  dashboardIndex = 0;
  init = async () => {
    this.store = new Map<string, UserInfoResponse>();
  };

  getUserInfo = (userId: string): UserInfoResponse => {
    return this.store[userId];
  };

  getCurrentUserInfo = async (): Promise<UserInfoResponse> => {
    const currentId = await getCurrentProfileId();
    return this.getUserInfo(currentId);
  };

  setCurrentUserInfo = async (userInfo: UserInfoResponse) => {
    const currentId = await getCurrentProfileId();

    let avatar = userInfo.avatar;
    const url = new URL(userInfo.avatar);

    if (url.host === 'firebasestorage.googleapis.com') {
      url.searchParams.append('alt', 'media');
      url.searchParams.append('token', process.env.FB_TOKEN!);
      avatar = url.toString();
    }

    const userInfoWithAvatar: UserInfoResponse = { ...userInfo, avatar };

    if (this.store[currentId]) {
      // Assign so that it maintains the reference
      Object.assign(this.store[currentId], userInfoWithAvatar);
    } else {
      // Create a new session store
      this.store[currentId] = createSessionStore<UserInfoResponse>({
        name: `user-info-${currentId}`,
        template: userInfoWithAvatar,
      });
    }
  };

  removeUserInfo = () => {
    // Note this removes the linkage to the store...
    this.store = new Map<string, UserInfoResponse>();
  };

  // Todo remove this...
  setDashIndex = (data: number) => {
    this.dashboardIndex = data;
  };

  getDashIndex = () => {
    return this.dashboardIndex;
  };
}

export default new UserInfoService();
