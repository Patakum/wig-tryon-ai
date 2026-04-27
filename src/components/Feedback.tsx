'use client';
import axios from 'axios';
import { useState } from 'react';

export default function Feedback({ id }: { id: string }) {
  const [message, setMessage] = useState({
    message: '',
    sending: false,
    success: false,
    error: '',
  });

  const handleSubmit = async () => {
    if (!message.message) return;
    if (!message.message.trim()) return;
    setMessage((prev) => ({
      ...prev,
      sending: true,
      success: false,
      error: '',
    }));

    try {
      await axios.post('/api/feedback', {
        generationId: id,
        message: message.message,
      });

      setMessage((prev) => ({ ...prev, sending: false, success: true }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setMessage((prev) => ({
          ...prev,
          sending: false,
          error:
            error.response?.data?.error?.message ?? 'Failed to send feedback',
        }));
        return;
      }

      setMessage((prev) => ({
        ...prev,
        sending: false,
        error: 'Failed to send feedback',
      }));
    }
  };
  return (
    <div className="mt-6">
      <h2 className="text-lg mb-2">Leave feedback</h2>

      <textarea
        value={message.message}
        onChange={(e) =>
          setMessage((prev) => ({ ...prev, message: e.target.value }))
        }
        className="w-full border rounded p-2"
        placeholder="Write your message..."
      />

      <button
        onClick={handleSubmit}
        disabled={message.sending}
        className="mt-2 bg-black text-white px-4 py-2 rounded"
      >
        {message.sending ? 'Sending...' : 'Send feedback'}
      </button>

      {message.success && <p className="text-green-600 mt-2">Feedback sent!</p>}
      {message.error ? (
        <p className="text-red-600 mt-2">{message.error}</p>
      ) : null}
    </div>
  );
}
