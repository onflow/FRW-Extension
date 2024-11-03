import React, { useState, useEffect, useRef } from 'react';


export const FRWHoldButton = ({ onHoldTrigger, holdDuration = 2000 }) => {
  const [holding, setHolding] = useState(false);
  const holdTimer = useRef<any>(null);

  const startHold = () => {
    setHolding(true);
    holdTimer.current = setTimeout(onHoldTrigger, holdDuration);
  };

  const endHold = () => {
    if (holdTimer.current !== null) {
      clearTimeout(holdTimer.current);
    }
    setHolding(false);
  };

  useEffect(() => {
    return () => {
      if (holdTimer.current !== null) {
        clearTimeout(holdTimer.current);
      }
    };
  }, []);

  return (
    <button 
      onMouseDown={startHold} 
      onMouseUp={endHold} 
      onMouseLeave={endHold}
    >
      {holding ? 'Holding...' : 'Hold Me'}
    </button>
  );
};