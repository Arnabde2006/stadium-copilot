import { IncidentReport } from '../types';

const incidentReports: IncidentReport[] = [];

export function addIncident(incident: IncidentReport): void {
  incidentReports.push(incident);
}

export function getIncidents(): IncidentReport[] {
  return [...incidentReports];
}
