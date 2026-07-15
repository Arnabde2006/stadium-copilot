import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

// Create mocks for the hooks
const mockLogin = vi.fn();
const mockLogout = vi.fn();
const mockReportIncident = vi.fn();

vi.mock('../hooks/useStaffAuth', () => ({
  useStaffAuth: () => ({
    token: 'mock-token',
    isAuthenticated: true,
    login: mockLogin,
    logout: mockLogout,
  })
}));

vi.mock('../hooks/useStaffReports', () => ({
  useStaffReports: () => ({
    incidents: mockIncidents,
    isLoading: false,
    error: null,
    reportIncident: mockReportIncident
  })
}));

describe('StaffPanel Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the panel title, input, and incident feed cards when authenticated', () => {
    render(<StaffPanel />);
    
    // Verify header title
    expect(screen.getByText('Operations Command')).toBeInTheDocument();
    
    // Verify inputs and buttons are present
    expect(screen.getByPlaceholderText(/Spill near Section 104 restroom/)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    
    // Verify mock incident card details render correctly
    expect(screen.getAllByText('Someone fainted near the stairs.')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Section 104')[0]).toBeInTheDocument();
    expect(screen.getAllByText('medical')[0]).toBeInTheDocument();
    expect(screen.getAllByText('high')[0]).toBeInTheDocument();
  });
});

