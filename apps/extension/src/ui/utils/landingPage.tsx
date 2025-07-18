import { Box } from '@mui/material';
import React, { type FC, useState } from 'react';
import { useNavigate } from 'react-router';

export interface PageConfig {
  component: React.ComponentType<any>;
  props: Record<string, any>;
}

export enum Direction {
  Right,
  Left,
}

interface PageStepperProps {
  activeIndex: number;
  children: React.ReactNode;
}

export const PageSlider: FC<PageStepperProps> = ({ activeIndex, children }) => {
  const pages = React.Children.toArray(children);
  return <Box>{pages[activeIndex]}</Box>;
};

export const getDirectionType = (direction: Direction) => {
  return direction === Direction.Left ? 'left' : 'right';
};

export const useNavigation = (maxSteps: number) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(Direction.Right);
  const navigate = useNavigate();

  const goNext = () => {
    setDirection(Direction.Right);
    if (activeIndex < maxSteps) {
      setActiveIndex(activeIndex + 1);
    } else {
      window.close();
    }
  };

  const goBack = () => {
    setDirection(Direction.Left);
    if (activeIndex >= 1) {
      setActiveIndex(activeIndex - 1);
    } else {
      navigate(-1);
    }
  };

  const goCustom = (index: number) => {
    setDirection(Direction.Right);
    setActiveIndex(index);
  };

  return {
    activeIndex,
    direction: getDirectionType(direction),
    goNext,
    goBack,
    goCustom,
  };
};
