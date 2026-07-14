import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReunitePanel from './ReunitePanel';
import { StadiumNode } from '../types';

const mockNodes: StadiumNode[] = [
  { id: 'sec-100', name: 'Section 100', type: 'section', x: 100, y: 100 },
  { id: 'sec-103', name: 'Section 103', type: 'section', x: 200, y: 200 }
];

describe('ReunitePanel Component Tests', () => {
  it('should render the panel title, inputs, and button controls', () => {
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    const onUpdate = vi.fn();
    const onFind = vi.fn();

    render(
      <ReunitePanel
        nodes={mockNodes}
        members={[
          { id: '1', name: 'Alice', location: 'sec-100', locale: 'en' },
          { id: '2', name: 'Bob', location: 'sec-103', locale: 'es' }
        ]}
        reuniteResult={null}
        isLoading={false}
        error={null}
        accessibilityMode={false}
        onAddMember={onAdd}
        onRemoveMember={onRemove}
        onUpdateMember={onUpdate}
        onFindMeetup={onFind}
      />
    );

    // Verify Title
    expect(screen.getByText('Reunite Group Meetup')).toBeInTheDocument();

    // Verify member values
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bob')).toBeInTheDocument();

    // Verify buttons
    expect(screen.getByText('Add Group Member')).toBeInTheDocument();
    expect(screen.getByText('Calculate Meetup Location')).toBeInTheDocument();
  });
});
