import Particles, { initParticlesEngine, type IParticlesProps } from '@tsparticles/react';
import React, { useEffect, useRef, useState } from 'react';
import { loadFull } from 'tsparticles';

const CONFETTI_OPTIONS: IParticlesProps['options'] = {
  backgroundMode: {
    enable: true,
  },
  fullScreen: {
    zIndex: -1,
  },
  emitters: [
    {
      direction: 'bottom',
      startCount: 0,
      position: { x: 50, y: 0 },
      size: {
        width: 20,
        height: 0,
      },
      rate: {
        delay: 0,
        quantity: 2,
      },
      life: {
        count: 200,
        duration: 0.01,
        // delay: 0.6,
      },
    },
  ],
  particles: {
    number: {
      value: 250,
    },
    color: {
      value: ['#9146FF', '#FFAAA8', '#8FFFD2', '#FFD37A', '#FF38DB'],
    },
    shape: {
      type: ['square', 'circle', 'heart'],
      options: {},
    },
    opacity: {
      value: {
        min: 0,
        max: 1,
      },
      animation: {
        enable: true,
        speed: 0.5,
        startValue: 'max',
        destroy: 'min',
      },
    },
    size: {
      value: {
        min: 2,
        max: 5,
      },
    },
    links: {
      enable: false,
    },
    life: {
      duration: {
        sync: true,
        value: 10,
      },
      count: 1,
    },
    move: {
      angle: {
        value: 45,
        offset: 0,
      },
      drift: {
        min: -0,
        max: 0,
      },
      enable: true,
      gravity: {
        enable: true,
        acceleration: 20,
      },
      speed: {
        min: 20,
        max: 90,
      },
      decay: 0.1,
      //direction: 'left',
      straight: false,
      outModes: {
        default: 'none',
        bottom: 'destroy',
      },
    },
    rotate: {
      value: {
        min: 0,
        max: 360,
      },
      direction: 'random',
      move: true,
      animation: {
        enable: true,
        speed: 60,
      },
    },
    tilt: {
      direction: 'random',
      enable: true,
      move: true,
      value: {
        min: 0,
        max: 360,
      },
      animation: {
        enable: true,
        speed: 60,
      },
    },
    roll: {
      darken: {
        enable: true,
        value: 25,
      },
      enable: true,
      speed: {
        min: 15,
        max: 25,
      },
    },
    wobble: {
      distance: 20,
      enable: true,
      move: true,
      speed: {
        min: -15,
        max: 15,
      },
    },
  },
};

export const useParticlesInit = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  const initRef = useRef<Promise<boolean> | null | boolean>(false);

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = initParticlesEngine(async (engine) => {
        await loadFull(engine);
      }).then(() => {
        setIsInitialized(true);

        return true;
      });
    }
  }, []);

  return isInitialized;
};

// Confetti component
// This is using the particles library.
// It would be a good idea to replace it with react-confetti
const Confetti = () => {
  const isInitialized = useParticlesInit();
  if (!isInitialized) {
    return null;
  }
  return (
    <Particles id="tsparticles" options={CONFETTI_OPTIONS} style={{ pointerEvents: 'none' }} />
  );
};

export default Confetti;
