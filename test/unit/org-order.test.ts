import { describe, it, expect } from 'vitest';
import { sortOrganizationsByPreference } from '../../src/lib/org-sorter';
import { GitHubOrganization } from '../../src/types/github';
import { DEFAULT_SETTINGS, saveStoredSettings, getStoredSettings } from '../../src/lib/storage';

const mockOrgs: GitHubOrganization[] = [
  { id: 1, login: 'Hitha-Farm', node_id: '1', url: '', avatar_url: '', description: null },
  { id: 2, login: 'Stories25', node_id: '2', url: '', avatar_url: '', description: null },
  { id: 3, login: 'finora-ai', node_id: '3', url: '', avatar_url: '', description: null },
  { id: 4, login: 'growwx-1', node_id: '4', url: '', avatar_url: '', description: null },
  { id: 5, login: 'OrcheStrat360', node_id: '5', url: '', avatar_url: '', description: null },
];

describe('sortOrganizationsByPreference', () => {
  it('returns original array when preferred order is empty or undefined', () => {
    expect(sortOrganizationsByPreference(mockOrgs, [])).toEqual(mockOrgs);
    expect(sortOrganizationsByPreference(mockOrgs, undefined)).toEqual(mockOrgs);
  });

  it('reorders organizations according to custom order', () => {
    const customOrder = ['OrcheStrat360', 'finora-ai', 'Stories25', 'growwx-1', 'Hitha-Farm'];
    const sorted = sortOrganizationsByPreference(mockOrgs, customOrder);
    expect(sorted.map((o) => o.login)).toEqual(customOrder);
  });

  it('handles partial order by appending unlisted orgs at the end', () => {
    const partialOrder = ['growwx-1', 'Stories25'];
    const sorted = sortOrganizationsByPreference(mockOrgs, partialOrder);
    expect(sorted.map((o) => o.login)).toEqual([
      'growwx-1',
      'Stories25',
      'Hitha-Farm',
      'finora-ai',
      'OrcheStrat360',
    ]);
  });

  it('matches organization logins case-insensitively', () => {
    const caseInsensitiveOrder = ['orchestrat360', 'FINORA-AI'];
    const sorted = sortOrganizationsByPreference(mockOrgs, caseInsensitiveOrder);
    expect(sorted[0].login).toBe('OrcheStrat360');
    expect(sorted[1].login).toBe('finora-ai');
  });

  it('ignores obsolete logins that the user is no longer a member of', () => {
    const orderWithOldOrg = ['non-existent-org', 'Stories25', 'Hitha-Farm'];
    const sorted = sortOrganizationsByPreference(mockOrgs, orderWithOldOrg);
    expect(sorted.map((o) => o.login)).toEqual([
      'Stories25',
      'Hitha-Farm',
      'finora-ai',
      'growwx-1',
      'OrcheStrat360',
    ]);
  });
});

describe('storage orgOrder preferences', () => {
  it('includes orgOrder in DEFAULT_SETTINGS', () => {
    expect(DEFAULT_SETTINGS.orgOrder).toEqual([]);
  });

  it('saves and retrieves orgOrder preferences', async () => {
    const testOrder = ['Stories25', 'finora-ai'];
    await saveStoredSettings({ orgOrder: testOrder });
    const settings = await getStoredSettings();
    expect(settings.orgOrder).toEqual(testOrder);
  });
});
