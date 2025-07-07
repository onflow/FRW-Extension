import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';

import { useWallet } from './use-wallet';

export const useApproval = () => {
  const usewallet = useWallet();
  const navigate = useNavigate();

  const getApproval = useCallback(() => usewallet.getApproval(), [usewallet]);
  const stableUsewallet = useMemo(() => usewallet, [usewallet]);
  const stableNavigate = useMemo(() => navigate, [navigate]);

  const linkingConfirm = useCallback(
    async (data?: any, stay = false, forceReject = false) => {
      const approval = await getApproval();

      if (approval) {
        await stableUsewallet.resolveApproval(data, forceReject);
        return;
      }
      if (stay) {
        return;
      }
    },
    [getApproval, stableUsewallet]
  );

  const resolveApproval = useCallback(
    async (data?: any, stay = false, forceReject = false) => {
      const approval = await getApproval();

      if (approval) {
        stableUsewallet.resolveApproval(data, forceReject);
      }
      if (stay) {
        return;
      }
      setTimeout(() => {
        stableNavigate('/', { replace: true });
      });
    },
    [getApproval, stableUsewallet, stableNavigate]
  );

  const rejectApproval = useCallback(
    async (err?) => {
      const approval = await getApproval();
      if (approval) {
        await stableUsewallet.rejectApproval(err);
      }
      stableNavigate('/');
    },
    [getApproval, stableUsewallet, stableNavigate]
  );

  return [getApproval, resolveApproval, rejectApproval, linkingConfirm] as const;
};
