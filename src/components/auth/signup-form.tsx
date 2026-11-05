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

export function SignupForm({
  returnTo = '/catalog',
  ...props
}: React.ComponentProps<typeof Card> & { returnTo?: string }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: returnTo,
      });

      if (error) {
        setError(error.message ?? 'לא הצלחת ליצור חשבון');
        return;
      }

      router.push(returnTo);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'לא הצלחת ליצור חשבון',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignUp() {
    setError(null);

    try {
      const { error } = await authClient.signIn.social({
        provider: 'google',
        callbackURL: returnTo,
      });
      if (error) {
        setError(error.message ?? 'לא הצלחת ליצור חשבון עם Google.');
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'לא הצלחת ליצור חשבון עם Google.',
      );
    }
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>צור חשבון</CardTitle>
        <CardDescription>
          הזן את המידע שלך למטה כדי ליצור חשבון חדש
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">שם מלא</FieldLabel>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </Field>
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
              <FieldDescription>
                נשתמש באימייל זה כדי ליצור איתך קשר. לא נשתף את האימייל שלך עם אף אחד אחר.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">סיסמה</FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
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
              <FieldDescription>
                הסיסמה חייבת להיות באורך של לפחות 8 תווים.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                אשר סיסמה
              </FieldLabel>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  aria-label={
                    showConfirmPassword ? 'Hide password' : 'Show password'
                  }
                  onClick={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                  className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <FieldDescription>אנא אשר את הסיסמה שלך.</FieldDescription>
            </Field>
            <Field>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'יוצר חשבון...' : 'צור חשבון'}
              </Button>
              <Button
                variant="outline"
                type="button"
                disabled={isSubmitting}
                onClick={handleGoogleSignUp}
              >
                Sign up with Google
              </Button>
              {error ? (
                <FieldDescription
                  role="alert"
                  className="text-center text-red-600"
                >
                  {error}
                </FieldDescription>
              ) : null}
              <FieldDescription className="px-6 text-center">
                Already have an account?{' '}
                <a href={`/login?next=${encodeURIComponent(returnTo)}`}>
                  Sign in
                </a>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
