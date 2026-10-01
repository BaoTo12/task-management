// CONNECT (react-redux's API before hooks, still fully supported): a higher-order component that
//   1. subscribes to the store,
//   2. calls mapStateToProps(state) after every dispatch, and re-renders only if the result is SHALLOWLY different,
//   3. passes mapDispatchToProps's functions as props.
// The wrapped component (ReportsView) stays a plain, testable function of its props.

import { useEffect } from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import { bindActionCreators } from 'redux';
import type { Dispatch } from 'redux';

import { chartModeChanged } from '../legacy/actions';
import type { ReportsRootState } from '../legacy/reducers';
import { selectReportsViewModel } from '../legacy/selectors';
import { changeRange, fetchSummary, fetchSummaryIfNeeded } from '../legacy/thunks';
import { ReportsView } from './ReportsView';

/** One structured selector = the whole view model (stable object while nothing changed). */
const mapStateToProps = (state: ReportsRootState) => selectReportsViewModel(state);

/**
 * bindActionCreators wraps each creator in `(...args) => dispatch(creator(...args))`. The thunk creators work because
 * the store's dispatch has the thunk middleware. (The OBJECT shorthand `{ onRefresh: fetchSummary }` does the same.)
 * The cast: connect types `dispatch` as a plain Dispatch, which doesn't know thunks; the middleware does at runtime.
 */
const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators(
    {
      onRangeChange: changeRange,
      onChartModeChange: chartModeChanged,
      onRefresh: fetchSummary,
      onMount: fetchSummaryIfNeeded,
    },
    dispatch,
  ) as unknown as {
    onRangeChange: (from: string, to: string) => void;
    onChartModeChange: typeof chartModeChanged;
    onRefresh: () => void;
    onMount: () => void;
  };

const connector = connect(mapStateToProps, mapDispatchToProps);

/** ConnectedProps infers exactly what connect injects: the view model + the bound callbacks. */
type Props = ConnectedProps<typeof connector>;

function ReportsScreen({ onMount, ...props }: Props) {
  useEffect(() => {
    onMount();                                   // fetch unless fresh data for these filters is already there
  }, [onMount]);
  return <ReportsView {...props} />;
}

export const ReportsContainer = connector(ReportsScreen);
