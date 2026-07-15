import { useState, useEffect } from 'react';
import { IncidentReport } from '../types';
import { reportIncident as apiReportIncident, getIncidents as apiGetIncidents } from '../lib/api';
import { getStaffToken } from '../auth/staffToken';

export function useStaffReports(token?: string | null) {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Poll for incidents every 5 seconds if authenticated
  useEffect(() => {
    if (!token) {
      setIncidents([]);
      return;
    }

    async function loadIncidents() {
      if (!getStaffToken()) return;
      try {
        const data = await apiGetIncidents();
        setIncidents(data);
      } catch (err: any) {
        console.error('Failed to poll incidents:', err);
      }
    }

    loadIncidents(); // Initial load
    const timer = setInterval(loadIncidents, 5000);
    return () => clearInterval(timer);
  }, [token]);

  const reportIncident = async (input: string): Promise<void> => {
    if (!input.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const newReport = await apiReportIncident(input.trim());
      setIncidents(prev => [newReport, ...prev]);
    } catch (err: any) {
      console.error('Failed to submit incident report:', err);
      setError(err.message || 'Failed to submit incident report.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    incidents,
    isLoading,
    error,
    reportIncident,
  };
}

export default useStaffReports;
