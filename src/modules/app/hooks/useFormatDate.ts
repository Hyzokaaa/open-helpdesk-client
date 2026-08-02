import { useCallback } from 'react';
import useUser from '@modules/user/hooks/useUser';
import { formatDate, DateFormatOption } from '../utils/format-date';

export default function useFormatDate() {
  const { user } = useUser();
  const fmt = (user?.dateFormat as DateFormatOption) || 'DD/MM/YYYY';

  return useCallback((date: string | Date) => formatDate(date, fmt), [fmt]);
}
