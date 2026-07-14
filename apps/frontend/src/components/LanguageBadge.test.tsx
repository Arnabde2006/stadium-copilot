import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LanguageBadge from './LanguageBadge';

describe('LanguageBadge Component Tests', () => {
  it('should render the Spanish flag and label when code is es', () => {
    render(<LanguageBadge code="es" />);
    expect(screen.getByText('🇪🇸')).toBeInTheDocument();
    expect(screen.getByText('Español')).toBeInTheDocument();
  });

  it('should render the English flag and label when code is en', () => {
    render(<LanguageBadge code="en" />);
    expect(screen.getByText('🇬🇧')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('should render a fallback tag for unrecognized language codes', () => {
    render(<LanguageBadge code="ar" />);
    expect(screen.getByText('Lang: AR')).toBeInTheDocument();
  });
});
