import { render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import PasswordCreation from './PasswordCreation';

const { createTrackerMock } = vi.hoisted(() => ({
  createTrackerMock: vi.fn(async () => {}),
}));

vi.mock('../../state/auth', () => ({
  createTracker: createTrackerMock,
  error: () => '',
}));

describe('PasswordCreation', () => {
  beforeEach(() => {
    createTrackerMock.mockClear();
  });

  it('creates a tracker when both password fields match', async () => {
    const user = userEvent.setup();
    render(() => <PasswordCreation />);

    await user.type(screen.getByTestId('password-create-input'), 'correct horse battery staple');
    await user.type(screen.getByTestId('password-repeat-input'), 'correct horse battery staple');
    await user.click(screen.getByTestId('create-tracker-button'));

    await waitFor(() => {
      expect(createTrackerMock).toHaveBeenCalledWith('correct horse battery staple');
    });
  });
});
