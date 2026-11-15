/**
 * Form submission contract shared by the contact form and the estimator.
 * The backend is PHP (see php/api/leads.php / estimate.php); this helper keeps
 * the components' state handling identical to the former Server Actions.
 */
export type SubmitState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; reason: 'validation' | 'config' | 'server' | 'rate'; fieldErrors?: Record<string, string[] | undefined> };

type ErrorBody = { reason?: string; fieldErrors?: Record<string, string[] | undefined> };

/** Posts FormData to a PHP endpoint and maps the response onto SubmitState. */
export const postForm = async (url: string, formData: FormData): Promise<SubmitState> => {
  let response: Response;
  try {
    response = await fetch(url, { method: 'POST', body: formData, cache: 'no-store' });
  } catch {
    return { status: 'error', reason: 'server' };
  }
  if (response.ok) return { status: 'success' };
  const body = (await response.json().catch(() => ({}))) as ErrorBody;
  const reason = body.reason === 'validation' || body.reason === 'rate' ? body.reason : response.status === 429 ? 'rate' : body.reason === 'config' ? 'config' : 'server';
  return { status: 'error', reason, fieldErrors: body.fieldErrors };
};
