'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';

type BusinessInfo = {
  id: string;
  whatsappNumber: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  openingHours: string | null;
  createdAt: string;
  updatedAt: string;
};

export function BusinessInfoFormClient() {
  const [data, setData] = useState<Partial<BusinessInfo>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    const fetchBusinessInfo = async () => {
      try {
        const res = await fetch('/api/admin/business-info');
        if (!res.ok) throw new Error('Failed to fetch');
        const info = await res.json();
        setData(info || {});
      } catch (error) {
        console.error('Error fetching business info:', error);
        setMessage({
          type: 'error',
          text: 'Failed to load business information',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinessInfo();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: value || null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/business-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to save');
      }

      const saved = await res.json();
      setData(saved);
      setMessage({
        type: 'success',
        text: 'Business information saved successfully!',
      });
    } catch (error) {
      console.error('Error saving business info:', error);
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Failed to save business information',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="whatsappNumber" className="text-sm font-medium">
          WhatsApp Number
        </label>
        <Input
          id="whatsappNumber"
          name="whatsappNumber"
          type="tel"
          placeholder="+1 (555) 123-4567"
          value={data.whatsappNumber || ''}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="phone" className="text-sm font-medium">
          Phone Number
        </label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+1 (555) 123-4567"
          value={data.phone || ''}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="contact@example.com"
          value={data.email || ''}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="address" className="text-sm font-medium">
          Address
        </label>
        <textarea
          id="address"
          name="address"
          placeholder="Street address, city, country"
          value={data.address || ''}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="openingHours" className="text-sm font-medium">
          Opening Hours
        </label>
        <textarea
          id="openingHours"
          name="openingHours"
          placeholder="Mon-Fri: 9AM-6PM 
            Sat: 10AM-4PM
            Sun: Closed"
          value={data.openingHours || ''}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
        />
      </div>

      <Button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Business Information'}
      </Button>

      {message && (
        <p
          className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
