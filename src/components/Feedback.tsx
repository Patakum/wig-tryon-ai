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
    setMessage((prev) => ({ ...prev, sending: true }));

    await axios.post('/api/feedback', {
      generationId: id,
      userId: 'temp-user', // replace later with auth
      message: message.message,
    });

    setMessage((prev) => ({ ...prev, sending: false, success: true }));
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
    </div>
  );
}
