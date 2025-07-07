import { Period, PeriodFrequency } from '@/shared/types/network-types';

export const getPeriodFrequency = (period: Period): PeriodFrequency => {
  switch (period) {
    case Period.oneDay:
      return PeriodFrequency.halfHour;
    case Period.oneWeek:
      return PeriodFrequency.oneHour;
    case Period.oneMonth:
      return PeriodFrequency.oneDay;
    case Period.threeMonth:
      return PeriodFrequency.oneDay;
    case Period.oneYear:
      return PeriodFrequency.threeDay;
    case Period.all:
      return PeriodFrequency.oneWeek;
    default:
      return PeriodFrequency.oneDay;
  }
};
