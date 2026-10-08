'use server';
/**
 * Runs on the server when the login form is sent. Two steps (ADR-0028):
 *   1. email and password. Without two-step login that's it: the token goes into the login
 *      cookie and the dashboard opens.
 *   2. with two-step login on, the API answers "code needed" (only after a right password);
 *      the form then asks for the 6-digit code and sends email, password and code together.
 */
import { redirect } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
import { setToken } from '../../lib/session';
import type { FormState } from '../../lib/types';

/** What the login form needs back: a message, and whether to show the code step. */
export interface LoginState extends FormState {
  needsCode?: boolean;
}

export async function login(_previous: LoginState, form: FormData): Promise<LoginState> {
  const code = String(form.get('code') ?? '').trim() || undefined;
  try {
    const result = await api<{ accessToken: string }>('/auth/super-admin/login', {
      method: 'POST',
      body: { email: form.get('email'), password: form.get('password'), code },
      withToken: false,
    });
    await setToken(result.accessToken);
  } catch (error) {
    if (!(error instanceof ApiError)) {
      return { error: 'The server is not reachable. Is the backend running?' };
    }
    // The password was right; now the code.
    if (error.details.twoFactorRequired) return { needsCode: true };
    if (code && error.message === 'Email or password is wrong') {
      return { needsCode: true, error: 'That code is not right. Type the code the app shows now.' };
    }
    return { needsCode: Boolean(code), error: error.message };
  }
  redirect('/');
}
