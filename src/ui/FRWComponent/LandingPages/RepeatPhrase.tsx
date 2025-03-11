import InfoIcon from '@mui/icons-material/Info';
import { Button, Typography } from '@mui/material';
import { Box } from '@mui/system';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

import SlideRelative from '@/ui/FRWComponent/SlideRelative';

const randomElement = (list: any[]) => {
  return list[Math.floor(Math.random() * list.length)];
};

const chunkArray = (myArray: any[], chunk_size: number) => {
  const results: any[] = [];
  while (myArray.length) {
    results.push(myArray.splice(0, chunk_size));
  }
  return results;
};

const RepeatPhrase = ({ handleSwitchTab, mnemonic }) => {
  const [incorrect, setIncorrect] = useState(false);
  const [chosenIndex, setChosen] = useState<number[]>([]);
  const [selectedPhrase, setSelect] = useState<any[]>([]);
  const [repeatArray, setRepeat] = useState<string[][]>([[], [], []]);

  const mnemonicArray = useMemo(() => mnemonic.split(' '), [mnemonic]);
  const fullIndex = useMemo(() => [...Array(mnemonicArray.length).keys()], [mnemonicArray]);
  const positionList = useMemo(
    () => chunkArray(fullIndex, Math.floor(mnemonicArray.length / 3)),
    [fullIndex, mnemonicArray]
  );

  const setSelected = useCallback(
    (i, v) => {
      const tempArray = selectedPhrase;
      tempArray[i] = v;
      setSelect([...tempArray]);
    },
    [selectedPhrase]
  );

  const checkMatch = () => {
    const correctMatch = chosenIndex.map((index) => mnemonicArray[index]);
    if (
      selectedPhrase[0] === correctMatch[0] &&
      selectedPhrase[1] === correctMatch[1] &&
      selectedPhrase[2] === correctMatch[2]
    ) {
      handleSwitchTab();
      return;
    }
    handleRandom();
    setIncorrect(true);
    setSelect([]);

    setTimeout(() => {
      setIncorrect(false);
    }, 5000);
  };

  const handleRandom = useCallback(() => {
    const arr: number[] = [];
    // [[0,1,2,3],[4,5,6,7],[8,9,10,11]]
    const repeatIndex: number[][] = [[], [], []];
    const repeatMap: string[][] = [[], [], []];

    const fullIndex = [...Array(mnemonicArray.length).keys()];
    positionList.forEach((list, i) => {
      const picked = randomElement(list);
      const exclude = fullIndex
        .filter((item) => item !== picked)
        .sort(() => {
          return Math.random() - 0.5;
        });
      arr.push(picked);
      const shuffled = [exclude.pop(), exclude.pop(), exclude.pop(), picked].sort(() => {
        return Math.random() - 0.5;
      });
      repeatIndex[i] = shuffled;
      repeatMap[i] = shuffled.map((index) => mnemonicArray[index]);
    });
    setChosen(arr);
    setRepeat(repeatMap);
  }, [mnemonicArray, positionList]);
  useEffect(() => {
    handleRandom();
  }, [handleRandom]);

  return (
    <>
      <Box className="registerBox">
        <Typography variant="h4" sx={{ fontWeight: 700 }} color="neutral.contrastText">
          {chrome.i18n.getMessage('Verify') + ' '}
          <Box display="inline" color="primary.main">
            {chrome.i18n.getMessage('Recovery__Phrase')}
          </Box>
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {chrome.i18n.getMessage('Please_select_the_word_one_by_one_refering_to_its_order')}
        </Typography>

        <Box
          sx={{
            borderRadius: '12px',
            position: 'relative',
            // overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
              flexDirection: 'column',
              minHeight: '172px',
              position: 'relative',
              // gridTemplateColumns: 'repeat(6, 1fr)',
              // gridAutoFlow: 'column',
              // margin: '-2%',
              py: '16px',
            }}
          >
            {repeatArray.map((word, i) => {
              return (
                <Box key={`row${i}`} aria-label={`row${i}`}>
                  <Typography variant="body1" sx={{ padding: '12px 0 12px' }}>
                    {chrome.i18n.getMessage('Select_the_word_at')}
                    <Typography component="span" color="primary.main" display="inline">
                      {' #' + (chosenIndex[i] + 1) + ' '}
                    </Typography>
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderRadius: '12px',
                      border: '2px solid #5E5E5E',
                      px: '0',
                      margin: '3px 0',
                      height: '56px',
                      backgroundColor: '#333333',
                      transition: 'all .3s linear',
                    }}
                  >
                    {word.map((v, index) => {
                      return (
                        <Box
                          sx={{ width: '33.3%', height: '100%' }}
                          key={`Select_the_word_at-${i}-${index}`}
                          aria-label={`Select_the_word_at-${i}-${index}`}
                        >
                          <Button
                            onClick={() => setSelected(i, v)}
                            sx={{
                              padding: '6px',
                              textAlign: 'center',
                              textTransform: 'lowercase',
                              height: '100%',
                              width: '100%',
                              borderRadius: '8px',
                              backgroundColor: `${selectedPhrase[i] === v ? '#fff' : 'none'}`,
                            }}
                          >
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 700,
                                color: `${selectedPhrase[i] === v ? '#000' : 'text.primary'}`,
                              }}
                            >
                              {v}
                            </Typography>
                          </Button>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1 }} />
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          <SlideRelative direction="down" show={incorrect}>
            <Box
              sx={{
                width: '95%',
                backgroundColor: 'error.light',
                mx: 'auto',
                borderRadius: '12px 12px 0 0',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                py: '8px',
              }}
            >
              <InfoIcon fontSize="medium" color="error" style={{ margin: '0px 12px auto 12px' }} />
              <Typography variant="body1" color="error.main" sx={{ fontSize: '14px' }}>
                {chrome.i18n.getMessage('Incorrect_recovery_phrases_please_try_again')}
              </Typography>
            </Box>
          </SlideRelative>
          <Button
            disabled={selectedPhrase.length !== 3}
            onClick={checkMatch}
            variant="contained"
            color="secondary"
            size="large"
            sx={{
              height: '56px',
              borderRadius: '12px',
              textTransform: 'capitalize',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="background.paper">
              {chrome.i18n.getMessage('Next')}
            </Typography>
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default RepeatPhrase;
