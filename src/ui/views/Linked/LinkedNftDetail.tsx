import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import { Box, Button, CardMedia, Container, IconButton, Typography } from '@mui/material';
import { StyledEngineProvider } from '@mui/material/styles';
import { saveAs } from 'file-saver';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import fallback from '@/ui/assets/image/errorImage.png';
import SendIcon from '@/ui/assets/svg/detailSend.svg';
import { useWallet } from '@/ui/hooks/use-wallet';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { type PostMedia } from '@/ui/utils/url';
import MoveFromChild from '@/ui/views/NFT/SendNFT/MoveFromChild';

interface NFTDetailState {
  nft: any;
  media: PostMedia;
  index: number;
  ownerAddress: any;
}

const LinkedNftDetail = () => {
  const emptyContact = {
    address: '',
    contact_name: '',
    avatar: '',
    domain: {
      domain_type: 0,
      value: '',
    },
  };

  const location = useLocation();
  const navigate = useNavigate();
  const usewallet = useWallet();
  const { childAccounts } = useProfiles();
  const [nftDetail, setDetail] = useState<any>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [ownerAddress, setOwnerAddress] = useState<any>(null);
  const [media, setMedia] = useState<PostMedia | null>(null);
  const [moveOpen, setMoveOpen] = useState<boolean>(false);
  const [childActive, setChildActive] = useState<boolean>(false);
  const [contactOne, setContactOne] = useState<any>(emptyContact);
  const [contactTwo, setContactTwo] = useState<any>(emptyContact);
  const [isAccessibleNft, setisAccessibleNft] = useState<any>(false);
  const [nftDetailState, setNftDetailState] = useState({
    nft: null,
    media: null,
    ownerAddress: null,
    index: null,
  });

  const fetchNft = useCallback(
    async (ownerAddresss) => {
      const userInfo = await usewallet.getUserInfo(false);
      const currentAddress = ownerAddresss;
      const parentAddress = await usewallet.getParentAddress();
      const isChild = true;
      const userTemplate = {
        avatar: userInfo.avatar,
        domain: {
          domain_type: 0,
          value: '',
        },
      };

      const childAccount = childAccounts?.[currentAddress!];
      const userOne = {
        avatar: childAccount?.icon ?? '',
        domain: {
          domain_type: 0,
          value: '',
        },
        address: currentAddress,
        contact_name: childAccount?.name ?? '',
      };
      const userTwo = {
        ...userTemplate,
        address: parentAddress,
        contact_name: userInfo.nickname,
      };

      setContactOne(userOne);
      setContactTwo(userTwo);
      setChildActive(isChild);

      await usewallet.setDashIndex(1);
    },
    [usewallet, childAccounts, setContactOne, setContactTwo, setChildActive]
  );

  useEffect(() => {
    const savedState = localStorage.getItem('nftDetailState');
    if (savedState) {
      const nftDetail = JSON.parse(savedState);
      setDetail(nftDetail.nft);
      setMedia(nftDetail.media);
      setOwnerAddress(nftDetail.ownerAddress);
      setMetadata(nftDetail.nft);
      if (nftDetail.isAccessibleNft) {
        setisAccessibleNft(nftDetail.isAccessibleNft);
      }

      fetchNft(nftDetail.ownerAddress);
    }
  }, [fetchNft]);

  const replaceIPFS = (url: string | null): string => {
    if (!url) {
      return '';
    }

    const lilicoEndpoint = 'https://gateway.pinata.cloud/ipfs/';

    const replacedURL = url
      .replace('ipfs://', lilicoEndpoint)
      .replace('https://ipfs.infura.io/ipfs/', lilicoEndpoint)
      .replace('https://ipfs.io/ipfs/', lilicoEndpoint)
      .replace('https://lilico.app/api/ipfs/', lilicoEndpoint);

    return replacedURL;
  };

  const downloadImage = (image_url, title) => {
    saveAs(image_url, title); // Put your image url here.
  };

  const MetaBox = (props) => {
    return (
      <Box
        sx={{
          borderRadius: '12px',
          border: '1px solid rgba(186, 186, 186, 0.4)',
          padding: '6px 10px',
          maxWidth: '360px',
        }}
      >
        <Typography color="neutral2.main" variant="caption" sx={{ textTransform: 'uppercase' }}>
          {props.name}
        </Typography>
        <Box
          sx={{
            width: '100%',
            maxWidth: '100%',
          }}
        >
          <Typography
            color="text.secondary"
            variant="body1"
            sx={{ width: '100%', maxWidth: '100%' }}
          >
            {props.value}
          </Typography>
        </Box>
      </Box>
    );
  };

  const createMetaBoxes = (props, index) => {
    if (props.value && typeof props.value === 'string')
      return (
        <MetaBox
          meta_id={props.name}
          name={props.name}
          value={props.value}
          key={props.name + index}
        />
      );
  };

  const getUri = () => {
    return (
      <>
        {mediaLoading ? (
          <div />
        ) : (
          <div
            style={{
              background: '#222222',
              height: '100%',
              width: '100%',
              borderRadius: '8px',
            }}
          />
        )}

        {media &&
          (media.image ? (
            <img
              src={replaceIPFS(media.image)}
              style={{
                width: '100%',
                borderRadius: '8px',
              }}
              onLoad={() => setMediaLoading(true)}
              onError={({ currentTarget }) => {
                currentTarget.onerror = null; // prevents looping
                currentTarget.src = fallback;
              }}
            />
          ) : (
            <>
              <video
                loop
                autoPlay
                controls
                muted
                preload="auto"
                controlsList="noremoteplayback nofullscreen"
                onLoadedData={() => setMediaLoading(true)}
                style={{
                  margin: '0 auto',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '8px',
                }}
              >
                <source src={media.video} type="video/mp4" />
              </video>
            </>
          ))}
      </>
    );
  };

  const getMedia = () => {
    return (
      <>
        {mediaLoading && (
          <img
            src={replaceIPFS(media?.image || null)}
            style={{
              width: '100%',
              borderRadius: '8px',
            }}
          />
        )}
        <video
          loop
          autoPlay
          controls
          muted
          playsInline
          preload="auto"
          controlsList="noremoteplayback nofullscreen"
          onLoadedData={() => setMediaLoading(false)}
          style={{ visibility: mediaLoading ? 'hidden' : 'visible', width: '100%' }}
        >
          <source src={media?.video || undefined} type="video/mp4" />
        </video>
      </>
    );
  };

  return (
    <StyledEngineProvider injectFirst>
      <Box
        className="page"
        style={{ display: 'flex', position: 'relative', flexDirection: 'column' }}
      >
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            width: '100%',
            backgroundColor: '#121212',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <IconButton
            onClick={() => navigate(-1)}
            sx={{
              borderRadius: '100%',
              margin: '8px',
            }}
          >
            <ArrowBackIcon sx={{ color: 'icon.navi' }} />
          </IconButton>
          {/* {
            nftDetail &&
            <>
              <IconButton onClick={handleClick} className={classes.extendMore}>
                <MoreHorizIcon sx={{ color: 'icon.navi'}} />
              </IconButton>
              <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                  'aria-labelledby': 'basic-button',
                }}
              >
                <MenuItem onClick={handleClose}>
                  <a href={'https://lilico.app/nft/' + ownerAddress +'/'+ nftDetail.contract.address +'/'+ nftDetail.contract.name + '?tokenId=' + nftDetail.id.tokenId} target="_blank">
                Share
                  </a>
                </MenuItem>
              </Menu>
            </>
          } */}
        </Box>

        {nftDetail && (
          <Container
            sx={{
              height: '100%',
              width: '100%',
              overflowY: 'scroll',
              justifyContent: 'space-between',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box
              sx={{
                padding: '10px 18px',
                justifyContent: 'center',
                backgroundColor: '#121212',
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  justifyContent: 'center',
                  backgroundColor: 'inherit',
                  flexGrow: 1,
                  paddingBottom: '10px',
                }}
              >
                {media && media?.video !== null ? getMedia() : getUri()}
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <Box sx={{ flex: '1 0 auto' }}>
                  <Typography
                    component="div"
                    color="text.primary"
                    variant="h6"
                    sx={{ maxWidth: '270px' }}
                  >
                    {media?.title}
                  </Typography>

                  {nftDetail && (
                    <a href={nftDetail.externalURL} target="_blank">
                      <Typography
                        component="div"
                        color="text.secondary"
                        variant="body1"
                        display="flex"
                        flexDirection="row"
                        alignItems="center"
                      >
                        <img
                          src={nftDetail.collectionSquareImage}
                          width="20px"
                          style={{ marginRight: '6px', borderRadius: '50%' }}
                        />
                        {nftDetail.collectionContractName}
                        <ArrowForwardOutlinedIcon
                          sx={{
                            color: 'icon.navi',
                            marginLeft: '6px',
                            mt: 0,
                            fontSize: '20px',
                            padding: 0,
                          }}
                        />
                      </Typography>
                    </a>
                  )}
                </Box>
                <Box
                  sx={{ mt: 0, mr: 0, pr: 0, display: 'flex', gap: '8px', alignItems: 'center' }}
                >
                  <IconButton
                    sx={{
                      backgroundColor: '#FFFFFF33',
                      p: '8px',
                      aspectRatio: '1 / 1',
                      // mr: '10px',
                    }}
                    onClick={() =>
                      downloadImage(media?.image || media?.video, media?.title || 'NFT')
                    }
                  >
                    <SaveAltIcon color="primary" />
                  </IconButton>
                </Box>
              </Box>
            </Box>

            <Container
              sx={{
                width: '100%',
                backgroundColor: '#282828',
                borderRadius: '16px 16px 0 0',
                padding: '18px',
                margin: 0,
              }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  gap: '10px',
                  flexDirection: 'row',
                  p: '10px 0',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-start',
                  maxWidth: '400px',
                }}
              >
                {metadata && metadata.traits && metadata.traits.map(createMetaBoxes)}
              </Box>

              <Typography
                variant="body1"
                color="text.secondary"
                component="div"
                sx={{ mb: '90px' }}
              >
                {media && media.description}
              </Typography>
            </Container>
          </Container>
        )}

        <Box sx={{ height: '42px', position: 'fixed', bottom: '32px', right: '18px' }}>
          {!(
            nftDetail?.collectionContractName === 'Domains' && media?.title?.includes('.meow')
          ) && (
            <Button
              sx={{
                backgroundColor: '#FFFFFF33',
                p: '12px',
                color: '#fff',
                borderRadius: '12px',
                height: '42px',
                fill: 'var(--Special-Color-White-2, rgba(255, 255, 255, 0.20))',
                filter: 'drop-shadow(0px 8px 16px rgba(0, 0, 0, 0.24))',
                backdropFilter: 'blur(6px)',
              }}
              disabled={!isAccessibleNft}
              onClick={() =>
                navigate('/dashboard/nft/send/', {
                  state: {
                    nft: nftDetail,
                    media: media,
                    contract: nftDetail,
                    linked: ownerAddress,
                  },
                })
              }
            >
              {/* <IosShareOutlinedIcon color="primary" /> */}
              <CardMedia
                image={SendIcon}
                sx={{ width: '20px', height: '20px', color: '#fff', marginRight: '8px' }}
              />
              {chrome.i18n.getMessage('Send')}
            </Button>
          )}
          {/* TODO: TB July 2025. This is not working as the script doesn't exist. Turning off for now */}
          {/*
          {nftDetail?.collectionID && (
            <Button
              sx={{
                backgroundColor: '#FFFFFF33',
                p: '12px',
                color: '#fff',
                borderRadius: '12px',
                height: '42px',
                marginLeft: '8px',
                fill: 'var(--Special-Color-White-2, rgba(255, 255, 255, 0.20))',
                filter: 'drop-shadow(0px 8px 16px rgba(0, 0, 0, 0.24))',
                backdropFilter: 'blur(6px)',
              }}
              disabled={!isAccessibleNft}
              onClick={() => setMoveOpen(true)}
            >
              <CardMedia
                image={DetailMove}
                sx={{ width: '20px', height: '20px', color: '#fff', marginRight: '8px' }}
              />
              {chrome.i18n.getMessage('Move')}
            </Button>
          )}
          */}
        </Box>

        {moveOpen && (
          <MoveFromChild
            isConfirmationOpen={moveOpen}
            data={{
              contact: contactTwo,
              userContact: contactOne,
              nft: nftDetail,
              contract: nftDetail,
              media: media,
            }}
            handleCloseIconClicked={() => setMoveOpen(false)}
            handleCancelBtnClicked={() => setMoveOpen(false)}
            handleAddBtnClicked={() => {
              setMoveOpen(false);
            }}
          />
        )}
      </Box>
    </StyledEngineProvider>
  );
};

export default LinkedNftDetail;
