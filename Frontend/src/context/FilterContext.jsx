import { useSelector, useDispatch } from 'react-redux';
import { setProvider as setProviderAction, setDateRange as setDateRangeAction } from '../store/slices/filterSlice';

export function useGlobalFilters() {
  const dispatch = useDispatch();
  const provider = useSelector((state) => state.filters.provider);
  const dateRange = useSelector((state) => state.filters.dateRange);

  return {
    provider,
    setProvider: (val) => dispatch(setProviderAction(val)),
    dateRange,
    setDateRange: (val) => dispatch(setDateRangeAction(val)),
  };
}