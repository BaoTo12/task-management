// The task form's state machine (08.07 useReducer), framework-free so it's testable without React.
// Five pieces of state that change TOGETHER (values, touched, submit attempt, submitting, server errors) were five
// useState calls; one reducer makes every transition explicit and keeps them consistent.
import type { TaskFormErrors, TaskFormValues } from './task-form';

type Field = keyof TaskFormValues;

export interface TaskFormState {
  values: TaskFormValues;
  initialValues: TaskFormValues;
  /** Mapped type (06.11): one optional boolean per field of TaskFormValues, derived, never retyped. */
  touched: { [K in Field]?: boolean };
  submitAttempted: boolean;
  submitting: boolean;
  /** Errors only the server can detect (e.g. a duplicate title). State: they come from a response. */
  serverErrors: TaskFormErrors;
}

/**
 * A mapped type turned into a union (06.11 + 13B.09): one `fieldChanged` member PER FIELD, each pairing the
 * field name with ITS value type. `{ field: 'dueDate', value: 42 }` is a compile error, and after
 * `action.field === 'status'` TypeScript knows `action.value` is a TaskStatus.
 */
type FieldChanged = {
  [K in Field]: { type: 'fieldChanged'; field: K; value: TaskFormValues[K] };
}[Field];

/** A discriminated union (06.06): `type` is the discriminant the switch narrows on. */
export type TaskFormAction =
  | FieldChanged
  | { type: 'fieldBlurred'; field: Field }
  | { type: 'submitAttempted' }
  | { type: 'submitStarted' }
  | { type: 'submitFinished'; serverErrors?: TaskFormErrors }
  | { type: 'reset' };

export function initTaskForm(initialValues: TaskFormValues): TaskFormState {
  return { values: initialValues, initialValues, touched: {}, submitAttempted: false, submitting: false, serverErrors: {} };
}

export function taskFormReducer(state: TaskFormState, action: TaskFormAction): TaskFormState {
  switch (action.type) {
    case 'fieldChanged': {
      // Editing a field makes its server error obsolete (the server hasn't seen the new value yet).
      const { [action.field]: _obsolete, ...serverErrors } = state.serverErrors;
      return { ...state, values: { ...state.values, [action.field]: action.value }, serverErrors };
    }
    case 'fieldBlurred':
      return state.touched[action.field] ? state : { ...state, touched: { ...state.touched, [action.field]: true } };
    case 'submitAttempted':
      return { ...state, submitAttempted: true };
    case 'submitStarted':
      return { ...state, submitting: true };
    case 'submitFinished':
      return { ...state, submitting: false, serverErrors: action.serverErrors ?? {} };
    case 'reset':
      return initTaskForm(state.initialValues);
    default:
      // Exhaustiveness (13B.13): adding an action type without a case makes this line a compile error.
      return action satisfies never;
  }
}

/** Derived, not stored (08.05): has any field changed since the form opened? */
export function isTaskFormDirty(state: TaskFormState): boolean {
  return (Object.keys(state.values) as Field[]).some((key) => state.values[key] !== state.initialValues[key]);
}

/** Show a client error once the field was left, or after a submit attempt; a server error always. */
export function visibleError(state: TaskFormState, errors: TaskFormErrors, field: Field): string | undefined {
  return (state.touched[field] || state.submitAttempted ? errors[field] : undefined) ?? state.serverErrors[field];
}
