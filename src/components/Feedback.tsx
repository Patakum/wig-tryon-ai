'use client';

import axios from 'axios';
import { useEffect, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import {
  feedbackReducer,
  initialFeedbackState,
} from '@/src/components/Feedback.reducer';
import { Button } from './ui/button';

export default function Feedback({ id }: { id: string }) {
  const router = useRouter();
  const [state, dispatch] = useReducer(feedbackReducer, initialFeedbackState);
  const draftKey = `wig-feedback-draft:${id}`;

  useEffect(() => {
    const draft = sessionStorage.getItem(draftKey);
    if (draft) {
      dispatch({ type: 'SET_MESSAGE', payload: draft });
      sessionStorage.removeItem(draftKey);
    }
  }, [draftKey]);

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
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        try {
          sessionStorage.setItem(draftKey, state.message);
        } catch (storageError) {
          console.error('Unable to preserve feedback draft:', storageError);
          dispatch({
            type: 'SEND_ERROR',
            payload: 'כדי לשלוח משוב, עליך להתחבר למשתמש תחילה. הטיוטה שלך לא נשמרה.',
          });
          return;
        }

        router.push(`/login?next=${encodeURIComponent(`/result?id=${id}`)}`);
        return;
      }

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
