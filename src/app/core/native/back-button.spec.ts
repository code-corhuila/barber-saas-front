import { describe, expect, it, vi } from 'vitest';
import { onBack } from './back-button';

describe('onBack', () => {
  it('goes back while there is history', () => {
    const back = vi.fn();
    const exit = vi.fn();
    onBack(true, back, exit);
    expect(back).toHaveBeenCalledOnce();
    expect(exit).not.toHaveBeenCalled();
  });

  it('leaves the app on the first screen', () => {
    const back = vi.fn();
    const exit = vi.fn();
    onBack(false, back, exit);
    expect(exit).toHaveBeenCalledOnce();
    expect(back).not.toHaveBeenCalled();
  });
});
