import QrScanner from 'qr-scanner';
import React, { useEffect, useRef, useState } from 'react';

import { consoleError } from '@onflow/flow-wallet-shared/utils/console-log';

const QrScannerComponent = ({ setUrl }) => {
  const videoRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    const qrScanner = new QrScanner(
      videoRef.current,
      (result) => {
        const { data = '' } = result;
        if (data && data.length > 0) {
          setUrl(data);
          qrScanner.stop();
        }
      },
      { returnDetailedScanResult: true }
    );

    qrScanner.start().catch((err) => {
      consoleError(err);
      setError('Camera access denied. Please allow camera access.');
    });

    return () => qrScanner.stop();
  }, [setUrl]);

  return (
    <div>
      <video ref={videoRef}></video>
      {error && (
        <div>
          <p>{chrome.i18n.getMessage('lease_allow_the_camera_permission')}</p>
        </div>
      )}
    </div>
  );
};

export default QrScannerComponent;
