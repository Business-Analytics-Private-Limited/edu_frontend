/**
 * /account: the super admin's password and two-step login (ADR-0028).
 *
 * Two-step login: "Set up" creates a secret and shows its QR code; scanning it with an
 * authenticator app (Google Authenticator, Microsoft Authenticator, ...) and typing the 6-digit
 * code confirms it. From then on, logging in needs the password AND the code from the phone.
 */
import {
  ActionForm,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  Input,
  PageHeader,
} from '@eduplatform/ui';
import { api } from '../../../lib/api';
import type { Me, TwoFactorSetup } from '../../../lib/types';
import { changePassword, disableTwoFactor, enableTwoFactor, startTwoFactor } from './actions';

export const metadata = { title: 'Account' };

export default async function AccountPage() {
  const me = await api<Me>('/auth/me');
  const pending =
    me.twoFactor === 'pending' ? await api<TwoFactorSetup>('/auth/two-factor/pending') : null;

  return (
    <>
      <PageHeader title="Account" description={me.email} />
      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>Logs you out on your other devices.</CardDescription>
          </CardHeader>
          <CardContent>
            <ActionForm action={changePassword} submitLabel="Change password" resetOnSuccess>
              <Field label="Current password" htmlFor="currentPassword">
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </Field>
              <Field label="New password" htmlFor="newPassword" hint="At least 10 characters">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={10}
                  required
                />
              </Field>
              <Field label="New password again" htmlFor="repeatPassword">
                <Input
                  id="repeatPassword"
                  name="repeatPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                />
              </Field>
            </ActionForm>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Two-step login
              <Badge variant={me.twoFactor === 'on' ? 'success' : 'destructive'}>
                {me.twoFactor === 'on' ? 'On' : 'Off'}
              </Badge>
            </CardTitle>
            <CardDescription>
              After the password, a 6-digit code from an app on your phone. Whoever steals the
              password still can&apos;t log in.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            {me.twoFactor === 'off' && (
              <ActionForm action={startTwoFactor} submitLabel="Set up two-step login" />
            )}

            {pending && (
              <>
                <ol className="list-decimal space-y-1 pl-5">
                  <li>
                    Open an authenticator app (Google Authenticator, Microsoft Authenticator, …).
                  </li>
                  <li>Scan this QR code, or type the key below.</li>
                  <li>Enter the 6-digit code the app shows.</li>
                </ol>
                <img
                  src={pending.qrCode}
                  alt="QR code for the authenticator app"
                  className="size-48"
                />
                <p>
                  Key: <code className="break-all rounded bg-muted px-1">{pending.secret}</code>
                </p>
                <ActionForm action={enableTwoFactor} submitLabel="Turn on">
                  <Field label="Code from the app" htmlFor="code">
                    <Input
                      id="code"
                      name="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                    />
                  </Field>
                </ActionForm>
              </>
            )}

            {me.twoFactor === 'on' && (
              <ActionForm
                action={disableTwoFactor}
                submitLabel="Turn off"
                submitVariant="outline"
                confirmMessage="Turn off two-step login? Only the password will protect this account."
              >
                <Field label="Password" htmlFor="offPassword">
                  <Input
                    id="offPassword"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </Field>
                <Field label="Code from the app" htmlFor="offCode">
                  <Input
                    id="offCode"
                    name="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                  />
                </Field>
              </ActionForm>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
