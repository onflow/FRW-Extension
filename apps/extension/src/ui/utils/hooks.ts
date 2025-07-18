import { useCallback, useEffect, useRef, useState } from 'react';

export const useSelectOption = <T>({
  options,
  defaultValue = [],
  onChange,
  value,
}: {
  options: T[];
  defaultValue?: T[];
  onChange?: (arg: T[]) => void;
  value?: T[];
}) => {
  const isControlled = useRef(typeof value !== 'undefined').current;
  const [chosenIndexes, setChosenIndexes] = useState(
    (isControlled ? value! : defaultValue).map((x) => options.indexOf(x))
  );

  useEffect(() => {
    if (!isControlled) {
      return;
    }

    // shallow compare
    if (value) {
      setChosenIndexes(value.map((x) => options.indexOf(x)));
    }
  }, [value, options, isControlled]);

  const changeValue = useCallback(
    (indexes: number[]) => {
      setChosenIndexes([...indexes]);
      if (onChange) {
        onChange(indexes.map((o) => options[o]));
      }
    },
    [options, onChange]
  );

  const handleRemove = useCallback(
    (i: number) => {
      chosenIndexes.splice(i, 1);
      changeValue(chosenIndexes);
    },
    [chosenIndexes, changeValue]
  );

  const handleChoose = useCallback(
    (i: number) => {
      if (chosenIndexes.includes(i)) {
        return;
      }

      chosenIndexes.push(i);
      changeValue(chosenIndexes);
    },
    [chosenIndexes, changeValue]
  );

  const handleToggle = useCallback(
    (i: number) => {
      const inIdxs = chosenIndexes.indexOf(i);
      if (inIdxs !== -1) {
        handleRemove(inIdxs);
      } else {
        handleChoose(i);
      }
    },
    [chosenIndexes, handleRemove, handleChoose]
  );

  const handleClear = useCallback(() => {
    changeValue([]);
  }, [changeValue]);

  return [
    chosenIndexes.map((o) => options[o]),
    handleRemove,
    handleChoose,
    handleToggle,
    handleClear,
    chosenIndexes,
  ] as const;
};

export interface UseHoverOptions {
  mouseEnterDelayMS?: number;
  mouseLeaveDelayMS?: number;
}

export type HoverProps = Pick<React.HTMLAttributes<HTMLElement>, 'onMouseEnter' | 'onMouseLeave'>;

export const useHover = ({ mouseEnterDelayMS = 0, mouseLeaveDelayMS = 0 }: UseHoverOptions = {}): [
  boolean,
  HoverProps,
] => {
  const [isHovering, setIsHovering] = useState(false);
  const mouseEnterTimer = useRef<number | undefined>();
  const mouseOutTimer = useRef<number | undefined>();

  const onMouseEnter = useCallback(() => {
    clearTimeout(mouseOutTimer.current);
    mouseEnterTimer.current = window.setTimeout(() => setIsHovering(true), mouseEnterDelayMS);
  }, [mouseEnterDelayMS, mouseOutTimer]);

  const onMouseLeave = useCallback(() => {
    clearTimeout(mouseEnterTimer.current);
    mouseOutTimer.current = window.setTimeout(() => setIsHovering(false), mouseLeaveDelayMS);
  }, [mouseLeaveDelayMS, mouseEnterTimer]);

  return [
    isHovering,
    {
      onMouseEnter,
      onMouseLeave,
    },
  ];
};
