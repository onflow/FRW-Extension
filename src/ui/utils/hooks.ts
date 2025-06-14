import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { useWallet } from './WalletContext';

export const useApproval = () => {
  const usewallet = useWallet();
  const history = useHistory();

  const getApproval = useCallback(() => usewallet.getApproval(), [usewallet]);
  const stableUsewallet = useMemo(() => usewallet, [usewallet]);
  const stableHistory = useMemo(() => history, [history]);

  const linkingConfirm = useCallback(
    async (data?: any, stay = false, forceReject = false) => {
      const approval = await getApproval();

      if (approval) {
        await stableUsewallet.resolveApproval(data, forceReject);
        return;
      }
      if (stay) {
        return;
      }
      // setTimeout(() => {
      //   stableHistory.replace('/');
      // });
    },
    [getApproval, stableUsewallet]
  );

  const resolveApproval = useCallback(
    async (data?: any, stay = false, forceReject = false) => {
      const approval = await getApproval();

      if (approval) {
        stableUsewallet.resolveApproval(data, forceReject);
      }
      if (stay) {
        return;
      }
      setTimeout(() => {
        stableHistory.replace('/');
      });
    },
    [getApproval, stableUsewallet, stableHistory]
  );

  const rejectApproval = useCallback(
    async (err?) => {
      const approval = await getApproval();
      if (approval) {
        await stableUsewallet.rejectApproval(err);
      }
      stableHistory.push('/');
    },
    [getApproval, stableUsewallet, stableHistory]
  );

  return [getApproval, resolveApproval, rejectApproval, linkingConfirm] as const;
};

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

export const useWalletRequest = (
  requestFn,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?(arg: any): void;
    onError?(arg: any): void;
  }
) => {
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);
  const [loading, setLoading] = useState<boolean>(false);
  const [res, setRes] = useState<any>();
  const [err, setErr] = useState<any>();

  const run = useCallback(
    async (...args) => {
      setLoading(true);
      try {
        const _res = await Promise.resolve(requestFn(...args));
        if (!mounted.current) {
          return;
        }
        setRes(_res);
        if (onSuccess) {
          onSuccess(_res);
        }
      } catch (err) {
        if (!mounted.current) {
          return;
        }
        setErr(err);
        if (onError) {
          onError(err);
        }
      } finally {
        if (mounted.current) {
          setLoading(false);
        }
      }
    },
    [requestFn, mounted, onSuccess, onError]
  );

  return [run, loading, res, err] as const;
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
