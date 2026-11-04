export type FeedbackState = {
  message: string;
  sending: boolean;
  success: boolean;
  error: string;
};

export function createInitialFeedbackState(message = ''): FeedbackState {
  return { message, sending: false, success: false, error: '' };
}

export type FeedbackAction =
  | { type: 'SET_MESSAGE'; payload: string }
  | { type: 'SEND_START' }
  | { type: 'SEND_SUCCESS' }
  | { type: 'SEND_ERROR'; payload: string };

export function feedbackReducer(
  state: FeedbackState,
  action: FeedbackAction,
): FeedbackState {
  switch (action.type) {
    case 'SET_MESSAGE':
      return { ...state, message: action.payload };
    case 'SEND_START':
      return { ...state, sending: true, success: false, error: '' };
    case 'SEND_SUCCESS':
      return { ...state, sending: false, success: true };
    case 'SEND_ERROR':
      return { ...state, sending: false, error: action.payload };
  }
}
