import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { describe, expect, it } from 'vitest';

describe('ProductSense app', () => {
  it('renders the dashboard by default', () => {
    render(<App />);
    expect(screen.getAllByText(/ProductSense/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Total customer feedback/i)).toBeInTheDocument();
  });

  it('allows adding feedback', async () => {
    render(<App />);
    const navButtons = screen.getAllByRole('button', { name: /Customer Feedback/i });
    fireEvent.click(navButtons[0]);
    fireEvent.change(screen.getByLabelText(/^Customer$/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/^Title$/i), { target: { value: 'Test feedback title' } });
    fireEvent.change(screen.getByLabelText(/^Description$/i), { target: { value: 'The product is very useful and fast.' } });
    fireEvent.click(screen.getByRole('button', { name: /^Add feedback$/i }));
    await waitFor(() => expect(screen.getByText(/Feedback added successfully./i)).toBeInTheDocument());
  });

  it('generates a PRD from the form', async () => {
    render(<App />);
    const navButtons = screen.getAllByRole('button', { name: /PRD Generator/i });
    fireEvent.click(navButtons[0]);
    fireEvent.change(screen.getByPlaceholderText(/PRD name/i), { target: { value: 'Release 2 PRD' } });
    fireEvent.change(screen.getByPlaceholderText(/Problem statement/i), { target: { value: 'We need a better dashboard.' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate PRD/i }));
    await waitFor(() => expect(screen.getByText(/PRD generated and saved./i)).toBeInTheDocument());
  });
});
