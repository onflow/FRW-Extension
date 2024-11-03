const Options = {
  fullScreen: true,
  fpsLimit: 120,
  detectRetina: true,
  emitters: {
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
      // delay:0.6,
    },
  },
  particles: {
    number: {
      value: 250,
    },
    color: {
      value: ['#9146FF', '#FFAAA8', '#8FFFD2', '#FFD37A', '#FF38DB'],
    },
    shape: {
      type: ['square', 'circle', 'heart'],
    },
    opacity: {
      value: 1,
      animation: {
        enable: true,
        minimumValue: 0,
        speed: 0.5,
        startValue: 'max',
        destroy: 'min',
      },
    },
    size: {
      value: 5,
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
      speed: 90,
      decay: 1 - 0.9,
      direction: -90,
      random: true,
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
      animation: {
        enable: true,
        speed: 60,
      },
    },
    tilt: {
      direction: 'random',
      enable: true,
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
      speed: {
        min: -15,
        max: 15,
      },
    },
  },
};

export { Options };