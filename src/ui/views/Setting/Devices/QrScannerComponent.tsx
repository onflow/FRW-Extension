import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';

const QrScannerComponent = ({ setUrl }) => {
  const videoRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }
    console.log('video ref  true, ', videoRef)

    const qrScanner = new QrScanner(
      videoRef.current,
      result => {
        console.log('decoded qr code:', result)
        const { data = '' } = result
        if (data && data.length > 0) {
          setUrl(data)
          qrScanner.stop()
        }

      },
      { returnDetailedScanResult: true }
    );

    qrScanner.start()
      .catch(err => {
        console.error(err);
        setError('Camera access denied. Please allow camera access.');
      });

    return () => qrScanner.stop();
  }, []);

  // useEffect(()=>{
  //   if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  //     navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
  //         // video.src = window.URL.createObjectURL(stream);
  //         // video.play();
  //         console.log(stream)
  //     }).catch(function(error) {
  //         console.log("获取摄像头访问权限失败：", error);
  //     });
  //   }
  // })

  const retryAccess = () => {
    setError('');

    // Re-initiate QR Scanner or refresh the page
  };

  return (
    <div>
      <video ref={videoRef}></video>
      {error && (
        <div>
          <p>
            {chrome.i18n.getMessage('lease_allow_the_camera_permission')}
          </p>
        </div>
      )}
    </div>
  );
};

export default QrScannerComponent;