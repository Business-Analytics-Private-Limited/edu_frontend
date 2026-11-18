'use client';
/**
 * The super admin login form, in two steps (ADR-0028):
 *   1. email and password;
 *   2. only when the account has two-step login on: the 6-digit code from the authenticator app.
 * In step 2 the email and password fields stay in the form (hidden), so they are sent again with
 * the code and nobody types the password twice. "Back" returns to step 1.
 */
import { Alert, Button, Field, Input } from '@eduplatform/ui';
import { startTransition, useActionState, useEffect, useState, type FormEvent } from 'react';
import { login, type LoginState } from './actions';

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});
  const [step, setStep] = useState<'password' | 'code'>('password');
  const [email, setEmail] = useState('');

  useEffect(() => {
    setStep(state.needsCode ? 'code' : 'password');
  }, [state]);

  // Sent by hand (not <form action>), so React doesn't empty the fields after each answer.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    startTransition(() => formAction(fields));
  }

  const codeStep = step === 'code';
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}

      <div className={codeStep ? 'hidden' : 'flex flex-col gap-4'}>
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>
      </div>

      {codeStep && (
        <>
          <p className="text-sm text-muted-foreground">
            Two-step login is on for <span className="font-medium text-foreground">{email}</span>.
            Open your authenticator app and type the 6-digit code it shows.
          </p>
          <Field label="Code" htmlFor="code">
            <Input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoFocus
            />
          </Field>
        </>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? (codeStep ? 'Checking…' : 'Signing in…') : codeStep ? 'Verify' : 'Sign in'}
      </Button>
      {codeStep && (
        <Button type="button" variant="ghost" size="sm" onClick={() => setStep('password')}>
          Back
        </Button>
      )}
    </form>
  );
}
