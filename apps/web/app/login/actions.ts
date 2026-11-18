'use server';
/**
 * Runs on the server when the login form is sent: asks the API to check the email and
 * password, stores the token in the login cookie, and opens the dashboard.
 */
import { redirect } from 'next/navigation';
import { api, errorMessage } from '../../lib/api';
import { setToken } from '../../lib/session';
import type { FormState } from '../../lib/types';

export async function login(_previous: FormState, form: FormData): Promise<FormState> {
  try {
    const result = await api<{ accessToken: string }>('/auth/login', {
      method: 'POST',
      body: { email: form.get('email'), password: form.get('password') },
      withToken: false,
    });
    await setToken(result.accessToken);
  } catch (error) {
    return { error: errorMessage(error) };
  }
  redirect('/'); // outside try: redirect() works by throwing
}
