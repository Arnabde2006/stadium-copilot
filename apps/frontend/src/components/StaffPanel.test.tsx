import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StaffPanel from './StaffPanel';

const mockIncidents = [
  {
    id: 'inc-1',
    category: 'medical' as const,
    location: 'Section 104',
    urgency: 'high' as const,
    summary: 'Someone fainted near the stairs.',
    rawInput: 'Medical emergency: fan fainted near Section 104.',
    timestamp: new Date().toISOString()
  }
];

// Mock the useStaffReports hook to test component rendering in isolation
vi.mock('../hooks/useStaffReports', () => ({
  useStaffReports: () => ({
    incidents: mockIncidents,
    isLoading: false,
    error: null,
    reportIncident: vi.fn()
  })
}));

describe('StaffPanel Component Tests', () => {
  it('should render the panel title, input, and incident feed cards', () => {
    render(<StaffPanel />);
    
    // Verify header title
    expect(screen.getByText('Operations Command')).toBeInTheDocument();
    
    // Verify inputs and buttons are present
    expect(screen.getByPlaceholderText(/Spill near Section 104 restroom/)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    
    // Verify mock incident card details render correctly
    expect(screen.getByText('Someone fainted near the stairs.')).toBeInTheDocument();
    expect(screen.getByText('Section 104')).toBeInTheDocument();
    expect(screen.getByText('medical')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });
});
