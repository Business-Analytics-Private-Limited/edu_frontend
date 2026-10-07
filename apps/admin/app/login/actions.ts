'use server';
/**
 * Runs on the server when the login form is sent: asks the API to check the email, password
 * and (with two-step login) the 6-digit code, stores the token in the login cookie, and opens
 * the dashboard.
 */
import { redirect } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
import { setToken } from '../../lib/session';
import type { FormState } from '../../lib/types';

export async function login(_previous: FormState, form: FormData): Promise<FormState> {
  try {
    const result = await api<{ accessToken: string }>('/auth/super-admin/login', {
      method: 'POST',
      body: {
        email: form.get('email'),
        password: form.get('password'),
        code: String(form.get('code') ?? '').trim() || undefined,
      },
      withToken: false,
    });
    await setToken(result.accessToken);
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    return { error: 'The server is not reachable. Is the backend running?' };
  }
  redirect('/');
}
