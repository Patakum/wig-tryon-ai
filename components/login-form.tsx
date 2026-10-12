'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { authClient } from '@/src/lib/auth-client';
import { cn } from '@/src/lib/utils';

export function LoginForm({
  className,
  returnTo = '/catalog',
  ...props
}: React.ComponentProps<'div'> & { returnTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      setError('אנא הזן אימייל וסיסמה');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const { error } = await authClient.signIn.email({
        email: normalizedEmail,
        password,
        callbackURL: returnTo,
      });

      if (error) {
        setError(error.message ?? 'לא הצלחת להתחבר');
        return;
      }

      router.push(returnTo);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'לא הצלחת להתחבר');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    try {
      const { error } = await authClient.signIn.social({
        provider: 'google',
        callbackURL: returnTo,
      });
      if (error) {
        setError(error.message ?? 'לא הצלחת להתחבר עם Google.');
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'לא הצלחת להתחבר עם Google.',
      );
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>התחבר כמשתמש קיים</CardTitle>
          <CardDescription>
            הזן את האימייל שלך כדי להתחבר לחשבון הקיים שלך
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">אימייל</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </Field>
              <Field>
                <div className="w-full flex justify-between items-center">
                  <FieldLabel htmlFor="password"> סיסמה </FieldLabel>
                  <a
                    href="#"
                    className="text-gray-500 hover:underline"
                  >
                    שחכת את הסיסמה?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </Field>
              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'מתחבר...' : 'התחבר'}
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleGoogleSignIn}
                >
                  התחבר עם Google
                </Button>
                {error ? (
                  <FieldDescription className="text-center text-red-600">
                    {error}
                  </FieldDescription>
                ) : null}
                <FieldDescription className="text-center">
                  אין לך חשבון?{' '}
                  <a href={`/signup?next=${encodeURIComponent(returnTo)}`}>
                    Sign up
                  </a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
