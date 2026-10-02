import { describe, expect, it } from 'vitest';
import { toApiError } from './api-error';

describe('toApiError', () => {
  it('keeps the shared envelope and its trace id', () => {
    const e = toApiError(422, { error: 'BUSINESS_RULE_VIOLATION', message: 'The email is already registered', traceId: 't-1' }, null, 'c-1');

    expect(e.code).toBe('BUSINESS_RULE_VIOLATION');
    expect(e.traceId).toBe('t-1');
    expect(e.userMessage).toBe('Ese correo ya está registrado.');
  });

  it('decides one message for a request that got no answer', () => {
    const e = toApiError(0, { error: 'TIMEOUT' }, null, 'c-1');

    expect(e.code).toBe('TIMEOUT');
    expect(e.userMessage).toContain('tardó demasiado');
    expect(e.traceId).toBe('c-1');
  });

  it('tells wrong credentials apart from an expired session', () => {
    expect(toApiError(401, { error: 'UNAUTHORIZED', message: 'Incorrect email or password' }, null, 'c').userMessage)
      .toBe('Correo o contraseña incorrectos.');
    expect(toApiError(401, { error: 'UNAUTHORIZED', message: 'the token is invalid or has expired' }, null, 'c').userMessage)
      .toContain('sesión expiró');
  });

  it('keeps the field errors of a validation error', () => {
    const e = toApiError(400, { error: 'VALIDATION_ERROR', details: [{ field: 'email', message: 'required' }] }, 'h-1', 'c');

    expect(e.details).toEqual([{ field: 'email', message: 'required' }]);
    expect(e.traceId).toBe('h-1');
  });

  it('never shows an unknown business message in english', () => {
    expect(toApiError(422, { error: 'BUSINESS_RULE_VIOLATION', message: 'Something new' }, null, 'c').userMessage)
      .toBe('No se pudo completar la operación. Revisa los datos.');
  });
});
