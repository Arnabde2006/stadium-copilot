import { useState } from 'react';
import { ReuniteMemberInput, ReuniteResponse } from '../types';
import { reuniteMembers } from '../lib/api';

export function useReunite() {
  const [members, setMembers] = useState<ReuniteMemberInput[]>([
    { id: '1', name: 'Alice', location: 'sec-100', locale: 'en' },
    { id: '2', name: 'Bob', location: 'sec-103', locale: 'es' }
  ]);
  const [reuniteResult, setReuniteResult] = useState<ReuniteResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const addMember = (): void => {
    if (members.length >= 4) return;
    const nextId = (members.length + 1).toString();
    const locations = ['sec-100', 'sec-101', 'sec-102', 'sec-103', 'sec-104', 'sec-105'];
    const nextLocation = locations[members.length % locations.length];
    const locales = ['en', 'es', 'fr', 'de'];
    const nextLocale = locales[members.length % locales.length];

    setMembers(prev => [
      ...prev,
      { id: nextId, name: `Member ${nextId}`, location: nextLocation, locale: nextLocale }
    ]);
  };

  const removeMember = (id: string): void => {
    if (members.length <= 2) return;
    setMembers(prev => prev.filter(m => m.id !== id));
    setReuniteResult(null);
  };

  const updateMember = (id: string, updates: Partial<ReuniteMemberInput>): void => {
    setMembers(prev =>
      prev.map(m => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const findMeetup = async (accessibilityMode: boolean = false): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await reuniteMembers(members, accessibilityMode);
      setReuniteResult(response);
    } catch (err: any) {
      console.error('Failed to locate minimax group meeting point:', err);
      setError(err.message || 'Failed to locate group meetup point.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearReunite = (): void => {
    setReuniteResult(null);
    setError(null);
  };

  return {
    members,
    reuniteResult,
    isLoading,
    error,
    addMember,
    removeMember,
    updateMember,
    findMeetup,
    clearReunite,
  };
}
export default useReunite;
