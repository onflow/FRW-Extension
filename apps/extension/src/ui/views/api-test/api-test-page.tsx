import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import * as bip39 from 'bip39';
import React, { useEffect, useState } from 'react';

import { consoleError } from '@onflow/flow-wallet-shared/utils/console-log';

import {
  API_TEST_RESULTS,
  type ApiTestResult,
  type FetchDetail,
} from '@/extension-shared/utils/test-data/api-test-results';
import {
  type ApiTestFunction,
  type CommonParams,
  createTestGroups,
} from '@/extension-shared/utils/test-data/test-groups';
import { useWallet } from '@/ui/hooks/use-wallet';

const addFunctionResult = (prev: ApiTestResult[], result: ApiTestResult) => {
  const prevFunctionResult = prev.find((r) => r.functionName === result.functionName);

  if (prevFunctionResult) {
    // Merge the fetch details
    const prevFetchDetails = prevFunctionResult.fetchDetails;
    const newFetchDetails = [...prevFetchDetails, ...result.fetchDetails];

    // I could use Object.assign here but I want to be explicit about what I'm doing
    const newResult = {
      ...prevFunctionResult,
      ...result,
      fetchDetails: newFetchDetails,
    };
    // Remove the old result and add the new result
    return [...prev.filter((r) => r.functionName !== result.functionName), newResult];
  }
  // Otherwise add the new result to the end of the array
  return [...prev, result];
};

const addGroupResult = (
  prev: Record<string, ApiTestResult[]>,
  group: string,
  result: ApiTestResult
) => {
  const newGroupResults = addFunctionResult(prev[group] || [], result);

  return {
    ...prev,
    [group]: newGroupResults,
  };
};

const findTestResult = (
  results: Record<string, ApiTestResult[]>,
  group: string,
  func: ApiTestFunction
): ApiTestResult[] | undefined => {
  if (func.controlledBy) {
    return func.controlledBy.reduce((acc, c) => {
      const result = findTestResult(results, group, c);
      if (result) {
        acc.push(...result);
      }
      return acc;
    }, [] as ApiTestResult[]);
  } else {
    const result = results[group]?.find((f) => func.name === f.functionName);
    return result ? [result] : undefined;
  }
};

const ApiTestPage: React.FC = () => {
  const wallet = useWallet();
  const [commonParams, setCommonParams] = useState<CommonParams>({
    address: '',
    addressEvm: '',
    network: 'testnet',
    username: 'coolpanda',
    password: process.env.TEST_PASSWORD || '',
    token: 'flow',
    mnemonicExisting: '',
    mnemonicGenerated: '',
    publicKey: {
      P256: { pubK: '', pk: '' },
      SECP256K1: { pubK: '', pk: '' },
    },
    deviceInfo: {
      device_id: 'test-device',
      district: '',
      name: 'Test Device',
      type: '2',
      user_agent: 'Test',
    },
  });

  const [results, setResults] = useState<Record<string, ApiTestResult[]>>(API_TEST_RESULTS);
  const [loading, setLoading] = useState<boolean>(false);
  const [runningAllTests, setRunningAllTests] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ completed: number; total: number }>({
    completed: 0,
    total: 0,
  });

  const [currentTestFunctionName, setCurrentTestFunctionName] = useState<string | null>(null);
  const [currentTestGroup, setCurrentTestGroup] = useState<string | null>(null);

  useEffect(() => {
    const initializeParams = async () => {
      try {
        const address = await wallet.getCurrentAddress();
        const addressEvm = await wallet.getEvmAddress();
        const network = await wallet.getNetwork();
        const publicKey = await wallet.getPubKey();
        if (address) {
          setCommonParams((prev) => ({
            ...prev,
            address,
            addressEvm,
            network,
            publicKey,
          }));
        }
      } catch (error) {
        consoleError('Error initializing params:', error);
      }
    };
    initializeParams();

    // Set up message listener for API calls
    const messageListener = (message: { type: string; data: FetchDetail }) => {
      if (message.type === 'API_CALL_RECORDED') {
        const { data } = message;
        // Try to determine the function group from the URL
        const group = currentTestGroup || 'misc';

        const result: ApiTestResult = {
          functionName: currentTestFunctionName || 'unknown',
          functionGroup: group,
          fetchDetails: [
            {
              url: data.url,
              params: data.params || {}, // Parameters sent to fetch
              requestInit: {
                ...data.requestInit,
                headers: {
                  ...data.requestInit?.headers,
                  Authorization: 'Bearer mock-token',
                },
              },
              responseData: data.responseData, // Raw response from fetch
              status: data.status,
              statusText: data.statusText,
            },
          ],
        };

        setResults((prev) => addGroupResult(prev, group, result));
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [currentTestFunctionName, currentTestGroup, wallet]);

  const handleParamChange = (param: keyof CommonParams, value: unknown) => {
    setCommonParams((prev) => ({
      ...prev,
      [param]: value,
    }));
  };

  const executeTest = async (
    functionName: string,
    group: string,
    params: Record<string, unknown> = {},
    callWallet: boolean = false
  ) => {
    try {
      // Set the current test function name so that listener can identify the test
      setCurrentTestFunctionName(functionName);
      setCurrentTestGroup(group);
      const result: ApiTestResult = {
        functionName,
        functionGroup: group,
        functionParams: params,
        functionResponse: null,
        fetchDetails: [],
        timestamp: Date.now(),
        error: undefined,
      };
      setResults((prev) => addGroupResult(prev, group, result));

      // Execute the API call
      try {
        if (callWallet) {
          result.functionResponse = await wallet[functionName](...Object.values(params));
        } else {
          result.functionResponse = await wallet.openapi[functionName](...Object.values(params));
        }
      } catch (error) {
        result.error = error.message;
      }
      // Update results (note: actual API call details will come through the message listener)
      setResults((prev) => addGroupResult(prev, group, result));

      if (runningAllTests) {
        setProgress((prev) => ({ ...prev, completed: prev.completed + 1 }));
      }
    } catch (error) {
      consoleError('Test execution error:', error);
    } finally {
      // Clear the current test function name
      setCurrentTestFunctionName(null);
      setCurrentTestGroup(null);
    }
  };

  const executeTestFunc = async (group: string, func: ApiTestFunction) => {
    if (func.controlledBy) {
      // Call it through the controller
      for (const controller of func.controlledBy) {
        await executeTest(controller.name, group, controller.params, true);
      }
    } else {
      await executeTest(func.name, group, func.params, false);
    }
  };

  const executeAllTests = async () => {
    setRunningAllTests(true);
    setLoading(true);
    setResults({});

    const testGroups = createTestGroups(commonParams);
    const totalTests = Object.values(testGroups).reduce((sum, group) => sum + group.length, 0);
    setProgress({ completed: 0, total: totalTests });

    // Execute tests sequentially to avoid overwhelming the API
    for (const [group, functions] of Object.entries(testGroups)) {
      for (const func of functions) {
        await executeTestFunc(group, func);
        // Add a small delay between tests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    setRunningAllTests(false);
    setLoading(false);
  };

  const downloadResults = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'api-test-results.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const testGroups = createTestGroups(commonParams);

  const generateNewMnemonic = () => {
    const newMnemonic = bip39.generateMnemonic();
    setCommonParams((prev) => ({
      ...prev,
      mnemonicGenerated: newMnemonic,
    }));
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          API Test Page
        </Typography>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Common Parameters
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Username"
              value={commonParams.username}
              onChange={(e) => handleParamChange('username', e.target.value)}
            />
            <TextField
              label="Password"
              value={commonParams.password}
              type="password"
              onChange={(e) => handleParamChange('password', e.target.value)}
            />
            <TextField
              label="Address"
              value={commonParams.address}
              onChange={(e) => handleParamChange('address', e.target.value)}
            />
            <TextField
              label="EVM Address"
              value={commonParams.addressEvm}
              onChange={(e) => handleParamChange('addressEvm', e.target.value)}
            />
            <TextField
              label="Network"
              value={commonParams.network}
              onChange={(e) => handleParamChange('network', e.target.value)}
            />

            <TextField
              label="Token"
              value={commonParams.token}
              onChange={(e) => handleParamChange('token', e.target.value)}
            />
            <TextField
              label="Mnemonic Existing"
              value={commonParams.mnemonicExisting}
              onChange={(e) => handleParamChange('mnemonicExisting', e.target.value)}
              multiline
              rows={4}
            />
            <TextField
              label="New Mnemonic"
              value={commonParams.mnemonicGenerated}
              onChange={(e) => handleParamChange('mnemonicGenerated', e.target.value)}
              multiline
              rows={4}
            />
            <Button variant="contained" onClick={generateNewMnemonic}>
              Generate Mnemonic
            </Button>
          </Box>
        </Paper>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button variant="contained" onClick={executeAllTests} disabled={loading} color="primary">
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={24} />
                {runningAllTests && (
                  <Typography variant="body2">
                    {progress.completed} / {progress.total}
                  </Typography>
                )}
              </Box>
            ) : (
              'Run All Tests'
            )}
          </Button>
          <Button
            variant="contained"
            onClick={downloadResults}
            disabled={Object.keys(results).length === 0}
            color="secondary"
          >
            Download Results
          </Button>
        </Box>

        {Object.entries(testGroups).map(([group, functions]) => (
          <Accordion key={group}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                {group} Functions ({functions.length})
                {results[group] && ` - ${results[group].length} tested`}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {functions.map((func) => {
                  const testResults = findTestResult(results, group, func);
                  return (
                    <Box
                      key={func.name}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography>
                          {func.name}
                          {func.unused && ' (unused)'}
                        </Typography>
                        <Button
                          variant="contained"
                          color={
                            testResults && testResults.length
                              ? testResults?.some((r) => r.error)
                                ? 'error'
                                : 'primary'
                              : 'secondary'
                          }
                          onClick={() => {
                            setLoading(true);
                            executeTestFunc(group, func).finally(() => setLoading(false));
                          }}
                          disabled={loading}
                        >
                          {loading ? <CircularProgress size={24} /> : 'Test'}
                        </Button>
                      </Box>
                      {testResults?.flatMap((r) => (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle1">Results:</Typography>
                          <Box sx={{ position: 'relative' }}>
                            <Button
                              sx={{
                                position: 'absolute',
                                right: 0,
                                top: 0,
                                zIndex: 1,
                              }}
                              size="small"
                              onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(r, null, 2));
                              }}
                            >
                              Copy
                            </Button>
                            <pre style={{ maxHeight: '200px', overflow: 'auto' }}>
                              {JSON.stringify(r, null, 2)}
                            </pre>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  );
                })}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Container>
  );
};

export default ApiTestPage;
