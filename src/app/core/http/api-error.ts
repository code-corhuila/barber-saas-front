export interface FieldError {
  field: string;
  message: string;
}

/**
 * What every failed request becomes before it reaches a domain app: the shared error envelope,
 * the HTTP status (0 = no answer) and the message a person sees, decided here, in ONE place
 * (annex H). Framework-neutral: the Angular interceptor and the apiClient of the React apps use it.
 */
export interface ApiError {
  status: number;
  code: string;
  message: string;
  details: FieldError[];
  traceId: string;
  userMessage: string;
}

interface Envelope {
  error?: string;
  message?: string;
  details?: FieldError[];
  traceId?: string;
}

export function toApiError(status: number, body: unknown, headerTraceId: string | null, correlationId: string): ApiError {
  const envelope: Envelope = typeof body === 'object' && body !== null ? (body as Envelope) : {};
  const traceId = envelope.traceId ?? headerTraceId ?? correlationId;
  const code = envelope.error ?? (status === 0 ? 'NETWORK_ERROR' : `HTTP_${status}`);
  const message = envelope.message ?? '';
  return {
    status,
    code,
    message,
    details: envelope.details ?? [],
    traceId,
    userMessage: describe(status, code, message, traceId),
  };
}

export function isApiError(value: unknown): value is ApiError {
  return typeof value === 'object' && value !== null && 'userMessage' in value && 'status' in value;
}

/** Text shown on screen: Spanish, the language of the app's users (ADR-001). */
function describe(status: number, code: string, message: string, traceId: string): string {
  const reference = traceId ? ` (referencia ${traceId})` : '';
  if (status === 0) {
    return code === 'TIMEOUT'
      ? `El servidor tardó demasiado en responder. Inténtalo de nuevo.${reference}`
      : `No hay conexión con el servidor. Revisa tu conexión e inténtalo de nuevo.${reference}`;
  }
  if (status === 400) return 'Algunos datos no son válidos. Revísalos e inténtalo de nuevo.';
  if (status === 401) return code === 'UNAUTHORIZED' && message === 'Incorrect email or password'
    ? 'Correo o contraseña incorrectos.'
    : 'Tu sesión expiró. Inicia sesión de nuevo.';
  if (status === 403) return 'No tienes permiso para hacer esto.';
  if (status === 404) return 'No existe o fue eliminado.';
  if (status === 409 || status === 422) return translate(message);
  if (status === 429) return 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.';
  return `El servicio no está disponible en este momento. Inténtalo más tarde.${reference}`;
}

/** Business messages travel in English (ADR-001); the screen shows them in Spanish. */
const BUSINESS_MESSAGES: Record<string, string> = {
  'The email is already registered': 'Ese correo ya está registrado.',
  'The password needs at least one uppercase letter and one digit':
    'La contraseña necesita al menos una mayúscula y un número.',
  'The password must have between 8 and 100 characters': 'La contraseña debe tener entre 8 y 100 caracteres.',
  'The e-mail is not valid': 'El correo no es válido.',
};

function translate(message: string): string {
  return BUSINESS_MESSAGES[message] ?? 'No se pudo completar la operación. Revisa los datos.';
}
