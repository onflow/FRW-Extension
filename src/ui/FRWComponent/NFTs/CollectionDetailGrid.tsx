import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Button,
  ButtonBase,
  Tooltip,
  Skeleton,
  Dialog,
} from '@mui/material';
import { StyledEngineProvider } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import { ReactComponent as SearchIcon } from '@/ui/FRWAssets/svg/searchIcon.svg';
import { truncate } from '@/ui/utils';

import SearchDialog from './SearchDialog';

const useStyles = makeStyles((theme) => ({
  iconbox: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 18px',
    alignItems: 'center',
  },
  arrowback: {
    padding: '0',
    borderRadius: '12px',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  grid: {
    padding: '0 8px',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    marginBottom: '16px',
    borderRadius: '12px',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
  },
  cardNoHover: {
    width: '48%',
    marginBottom: '16px',
    borderRadius: '12px',
    backgroundColor: 'transparent',
  },
  cardmedia: {
    padding: '8px',
  },
  content: {
    padding: '8px',
    paddingTop: 0,
    '&:last-child': {
      paddingBottom: '8px',
    },
  },
}));

interface CollectionDetailProps {
  info: any;
  list: any[];
  allNfts?: any[];
  total: number;
  loading: boolean;
  isLoadingAll?: boolean;
  refreshCollectionImpl: () => void;
  createGridCard: (item: any, index: number) => JSX.Element;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  loadingMore: boolean;
}

const CollectionDetailGrid: React.FC<CollectionDetailProps> = ({
  info,
  list,
  allNfts = [],
  total,
  loading,
  isLoadingAll = false,
  refreshCollectionImpl,
  createGridCard,
  searchTerm,
  setSearchTerm,
  loadingMore,
}) => {
  const classes = useStyles();
  const history = useHistory();
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="page" id="scrollableDiv" style={{ overflow: 'auto' }}>
      <Box className={classes.iconbox}>
        <IconButton onClick={() => history.push('/dashboard')} className={classes.arrowback}>
          <ArrowBackIcon sx={{ color: 'icon.navi' }} />
        </IconButton>
        <IconButton
          onClick={() => setSearchOpen(true)}
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            borderRadius: '12px',
            padding: '0',
            height: '20px',
          }}
        >
          <SearchIcon style={{ width: '20px', height: '20px' }} />
        </IconButton>
      </Box>

      {info ? (
        <>
          <Grid container sx={{ width: '100%', p: '0 25px 18px 25px' }}>
            <Grid
              item
              sx={{
                justifyContent: 'center',
                backgroundColor: '#121212',
                width: '108px',
                height: '108px',
              }}
            >
              <img
                src={info?.collectionDisplay?.squareImage?.file?.url || info?.logo}
                alt="collection avatar"
                style={{ borderRadius: '12px', width: '100%', height: '100%' }}
              />
            </Grid>
            <Grid item sx={{ ml: 0, pl: '18px' }}>
              <Typography component="div" color="text.primary" variant="h6">
                {truncate(info?.name || info.contract_name, 16)}
              </Typography>

              <Tooltip title={chrome.i18n.getMessage('Refresh')} arrow>
                <ButtonBase
                  sx={{ flexGrow: 1, justifyContent: 'flex-start' }}
                  onClick={refreshCollectionImpl}
                >
                  <Typography component="div" color="text.secondary" variant="body1">
                    {total | 0} {chrome.i18n.getMessage('NFTs')}
                  </Typography>

                  <ReplayRoundedIcon fontSize="inherit" />
                </ButtonBase>
              </Tooltip>

              <Box sx={{ p: 0, mt: '10px' }}>
                {info.marketplace && (
                  <Button
                    startIcon={
                      <StorefrontOutlinedIcon
                        width="16px"
                        color="primary"
                        sx={{ ml: '4px', mr: 0 }}
                      />
                    }
                    sx={{
                      backgroundColor: 'neutral2.main',
                      color: 'text.secondary',
                      borderRadius: '12px',
                      textTransform: 'none',
                      p: '10px 8px',
                      mr: '10px',
                    }}
                  >
                    <a
                      href={info.marketplace}
                      target="_blank"
                      style={{ textTransform: 'none', color: 'inherit', ml: 0 }}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '14px' }}>
                        {chrome.i18n.getMessage('Market')}
                      </Typography>
                    </a>
                  </Button>
                )}
                {info.collectionDisplay?.externalURL && (
                  <Button
                    startIcon={
                      <PublicOutlinedIcon width="16px" color="primary" sx={{ ml: '4px', mr: 0 }} />
                    }
                    sx={{
                      backgroundColor: 'neutral2.main',
                      color: 'text.secondary',
                      borderRadius: '12px',
                      textTransform: 'none',
                      p: '10px 8px',
                    }}
                  >
                    <a
                      href={info.collectionDisplay?.externalURL?.url}
                      target="_blank"
                      style={{ textTransform: 'none', color: 'inherit', ml: 0 }}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '14px' }}>
                        {chrome.i18n.getMessage('Website')}
                      </Typography>
                    </a>
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>

          <SearchDialog
            open={searchOpen}
            onClose={() => setSearchOpen(false)}
            items={list}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onFilteredResults={(results) => setFilteredList(results)}
            createGridCard={createGridCard}
            isLoadingAll={isLoadingAll}
            total={total}
            loadingMore={loadingMore}
          />

          {loading ? (
            <Grid container className={classes.grid}>
              {[...Array(4).keys()].map((key) => (
                <Card className={classes.card} elevation={0} key={key}>
                  <CardMedia className={classes.cardmedia}>
                    <Skeleton
                      variant="rectangular"
                      width={150}
                      height={150}
                      sx={{ margin: '0 auto', borderRadius: '8px' }}
                    />
                  </CardMedia>
                  <CardContent className={classes.content}>
                    <Skeleton variant="text" width={150} sx={{ margin: '0 auto' }} />
                  </CardContent>
                </Card>
              ))}
            </Grid>
          ) : (
            info && (
              <>
                {list && list.length > 0 ? (
                  <Grid container className={classes.grid}>
                    {list.map(createGridCard)}
                    {list.length % 2 !== 0 && (
                      <Card className={classes.cardNoHover} elevation={0} />
                    )}
                  </Grid>
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      No NFTs found in this collection
                    </Typography>
                  </Box>
                )}
              </>
            )
          )}
        </>
      ) : (
        <Grid container className={classes.grid}>
          {[...Array(4).keys()].map((key) => (
            <Card className={classes.card} elevation={0} key={key}>
              <CardMedia className={classes.cardmedia}>
                <Skeleton
                  variant="rectangular"
                  width={150}
                  height={150}
                  sx={{ margin: '0 auto', borderRadius: '8px' }}
                />
              </CardMedia>
              <CardContent className={classes.content}>
                <Skeleton variant="text" width={150} sx={{ margin: '0 auto' }} />
              </CardContent>
            </Card>
          ))}
        </Grid>
      )}
    </div>
  );
};

export default CollectionDetailGrid;
