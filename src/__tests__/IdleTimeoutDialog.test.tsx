import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IdleTimeoutDialog } from '../IdleTimeoutDialog';

describe('IdleTimeoutDialog', () => {
  const defaultProps = {
    isOpen: true,
    remainingTime: 30,
    onStayActive: vi.fn(),
    onIdle: vi.fn(),
  };

  it('renders the dialog with default text', () => {
    render(<IdleTimeoutDialog {...defaultProps} />);

    expect(screen.getByText('Session Timeout Warning')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your session is about to expire due to inactivity.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('0:30')).toBeInTheDocument();
    expect(screen.getByText('Stay Logged In')).toBeInTheDocument();
    expect(screen.getByText('Log Out')).toBeInTheDocument();
  });

  it('renders custom text', () => {
    render(
      <IdleTimeoutDialog
        {...defaultProps}
        title="Custom Title"
        message="Custom message"
        stayActiveText="Keep Going"
        idleText="Sign Out"
      />
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom message')).toBeInTheDocument();
    expect(screen.getByText('Keep Going')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('formats time correctly', () => {
    render(<IdleTimeoutDialog {...defaultProps} remainingTime={125} />);
    expect(screen.getByText('2:05')).toBeInTheDocument();
  });

  it('calls onStayActive when stay button is clicked', async () => {
    const onStayActive = vi.fn();
    render(
      <IdleTimeoutDialog {...defaultProps} onStayActive={onStayActive} />
    );

    await userEvent.click(screen.getByText('Stay Logged In'));
    expect(onStayActive).toHaveBeenCalledOnce();
  });

  it('calls onIdle when idle button is clicked', async () => {
    const onIdle = vi.fn();
    render(<IdleTimeoutDialog {...defaultProps} onIdle={onIdle} />);

    await userEvent.click(screen.getByText('Log Out'));
    expect(onIdle).toHaveBeenCalledOnce();
  });

  it('applies custom className', () => {
    render(<IdleTimeoutDialog {...defaultProps} className="my-dialog" />);
    const dialog = document.querySelector('dialog');
    expect(dialog?.className).toContain('my-dialog');
    expect(dialog?.className).toContain('idle-timeout-dialog');
  });

  it('has proper aria attributes', () => {
    render(<IdleTimeoutDialog {...defaultProps} />);
    const dialog = document.querySelector('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'idle-timeout-title');
    expect(dialog).toHaveAttribute(
      'aria-describedby',
      'idle-timeout-message'
    );
  });

  it('shows timer with role="timer" and aria-live', () => {
    render(<IdleTimeoutDialog {...defaultProps} />);
    const timer = screen.getByRole('timer');
    expect(timer).toHaveAttribute('aria-live', 'polite');
  });
});
