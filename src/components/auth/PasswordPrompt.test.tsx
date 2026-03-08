import { render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PasswordPrompt from './PasswordPrompt';

const { unlockTrackerMock } = vi.hoisted(() => ({
  unlockTrackerMock: vi.fn(async () => {}),
}));

vi.mock('../../state/auth', () => ({
  error: () => '',
  unlockTracker: unlockTrackerMock,
}));

describe('PasswordPrompt', () => {
  beforeEach(() => {
    unlockTrackerMock.mockClear();
  });

  it('unlocks the tracker and clears the field on success', async () => {
    const user = userEvent.setup();
    render(() => <PasswordPrompt />);

    const input = screen.getByTestId('password-unlock-input') as HTMLInputElement;
    await user.type(input, 'bayand-password');
    await user.click(screen.getByTestId('unlock-tracker-button'));

    await waitFor(() => {
      expect(unlockTrackerMock).toHaveBeenCalledWith('bayand-password');
      expect(input.value).toBe('');
    });
  });
});
