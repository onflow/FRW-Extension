import React, { useState, useEffect } from 'react';
import { Box } from '@mui/system';
import { Typography, Button } from '@mui/material';
import StakedListCard from './components/StakedListCard';
import nodeList from './nodeList.json';
import StakeCard from './components/StakeCard';
import { useWallet } from 'ui/utils';
interface HaveStakeProps {
  delegate: Array<any>;
}

const HaveStake = (props: HaveStakeProps) => {
  const usewallet = useWallet();

  const [newStake, setNewStake] = useState<boolean>(true);
  const [apr, setApr] = useState<any>(0);
  const [renderNodes, setNodes] = useState<any>([]);

  const getApy = async () => {
    const result = await usewallet.getApr();
    setApr(result);
  };

  const newNode = async () => {
    const newNodes = nodeList.filter((node) => {
      return !props.delegate.find((delegate) => {
        return node.id === delegate.nodeID;
      });
    });
    setNodes(newNodes);
  };

  useEffect(() => {
    getApy();
    newNode();
  }, []);

  return (
    <div className="page">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'black',
          width: '100%',
          height: '100%',
          padding: '0 18px',
        }}
      >
        {newStake ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              margin: '0',
            }}
          >
            <Typography
              variant="body1"
              sx={{
                paddingTop: '24px',
                paddingBottom: '19px',
                alignSelf: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
              }}
              component="span"
            >
              Staking List
            </Typography>
            {props.delegate.map((n, i) => (
              <Box sx={{ marginBottom: '12px' }}>
                <StakedListCard desc={(apr * 100).toFixed(3)} delegate={n} />
              </Box>
            ))}
            <Button
              onClick={() => {
                setNewStake(false);
              }}
              variant="contained"
              size="large"
              sx={{
                backgroundColor: '#1F1F1F',
                height: '48px',
                flexGrow: 1,
                borderRadius: '8px',
                textTransform: 'capitalize',
                marginBottom: '20px',
              }}
              // disabled={outAmount <= 0 || Number(amount) <= 0 || errorType || isLoading || token1 == null}
            >
              <Typography variant="subtitle1" sx={{ color: '#60C293' }}>
                + Stake new node
              </Typography>
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              margin: '0',
              overflow: 'auto',
            }}
          >
            <Typography
              variant="body1"
              sx={{
                py: '30px',
                alignSelf: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
              }}
              component="span"
            >
              Stakes
            </Typography>
            {renderNodes.map((item) => (
              <StakeCard
                name={item.name}
                img={item.icon}
                short={item.type}
                node={item.id}
                amount={(apr * 100).toFixed(4)}
              />
            ))}
          </Box>
        )}
      </Box>
    </div>
  );
};

export default HaveStake;
