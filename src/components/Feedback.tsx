'use client';
import axios from 'axios';
import { useReducer } from 'react';
import {
  feedbackReducer,
  initialFeedbackState,
} from '@/src/components/Feedback.reducer';

export default function Feedback({ id }: { id: string }) {
  const [state, dispatch] = useReducer(feedbackReducer, initialFeedbackState);

  const handleSubmit = async () => {
    if (!state.message.trim()) return;

    dispatch({ type: 'SEND_START' });

    try {
      await axios.post('/api/feedback', {
        generationId: id,
        message: state.message,
      });

      dispatch({ type: 'SEND_SUCCESS' });
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error?.message ?? 'Failed to send feedback')
        : 'Failed to send feedback';

      dispatch({ type: 'SEND_ERROR', payload: message });
    }
  };

  return (
    <div className="mt-6">
      <h2 className="text-lg mb-2">Leave feedback</h2>

      <textarea
        value={state.message}
        onChange={(e) =>
          dispatch({ type: 'SET_MESSAGE', payload: e.target.value })
        }
        className="w-full border rounded p-2"
        placeholder="Write your message..."
      />

      <button
        onClick={handleSubmit}
        disabled={state.sending}
        className="mt-2 bg-black text-white px-4 py-2 rounded"
      >
        {state.sending ? 'Sending...' : 'Send feedback'}
      </button>

      {state.success && <p className="text-green-600 mt-2">Feedback sent!</p>}
      {state.error ? <p className="text-red-600 mt-2">{state.error}</p> : null}
    </div>
  );
}
