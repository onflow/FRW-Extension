import { useCallback, useEffect, useRef } from 'react';

import { useWallet } from '@/ui/hooks/use-wallet';
import { useNftHook } from '@/ui/hooks/useNftHook';

interface NFTLoaderProps {
  selectedCollection: string;
  onNFTsLoaded: (nfts: any[]) => void;
  onLoadingChange: (loading: boolean) => void;
  ownerAddress: string;
}

const NFTLoader: React.FC<NFTLoaderProps> = ({
  selectedCollection,
  onNFTsLoaded,
  onLoadingChange,
  ownerAddress,
}) => {
  const usewallet = useWallet();
  const initialCollectionRef = useRef(selectedCollection);

  // Only use the initial collection value
  const collectionToUse = initialCollectionRef.current;

  const getCollection = useCallback(
    async (ownerAddress, collection, offset) => {
      // Only fetch if the collection matches the initial one
      if (collection !== collectionToUse) {
        return { nfts: [], nftCount: 0 };
      }

      return await usewallet.getSingleCollection(ownerAddress, collection, offset);
    },
    [usewallet, collectionToUse]
  );

  const { allNfts, loading: hookLoading } = useNftHook({
    getCollection,
    ownerAddress: ownerAddress,
    collectionName: collectionToUse,
    isEvm: false,
  });

  useEffect(() => {
    onLoadingChange(hookLoading);

    if (!hookLoading && allNfts) {
      onNFTsLoaded(allNfts);
    }
  }, [allNfts, hookLoading, onNFTsLoaded, onLoadingChange, collectionToUse]);

  return null; // This is a logic-only component
};

export default NFTLoader;
