'use client';
import axios from 'axios';
import { useReducer } from 'react';
import {
  feedbackReducer,
  initialFeedbackState,
} from '@/src/components/Feedback.reducer';
import { Button } from './ui/button';

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
        ? (error.response?.data?.error?.message ?? 'נכשל בשליחת המשוב')
        : 'נכשל בשליחת המשוב';

      dispatch({ type: 'SEND_ERROR', payload: message });
    }
  };

  return (
    <div className="mt-6">
      <h2 className="text-lg mb-2">השאר משוב</h2>

      <textarea
        value={state.message}
        onChange={(e) =>
          dispatch({ type: 'SET_MESSAGE', payload: e.target.value })
        }
        className="w-full border rounded p-2"
        placeholder="כתוב את חוות דעתך..."
      />

      <Button
        onClick={handleSubmit}
        disabled={state.sending}
        variant="default"
        className="mt-2 bg-secondary-foreground"
      >
        {state.sending ? 'שולח...' : 'שלח משוב'}
      </Button>

      {state.success && <p className="text-green-600 mt-2">המשוב נשלח!</p>}
      {state.error ? <p className="text-red-600 mt-2">{state.error}</p> : null}
    </div>
  );
}
