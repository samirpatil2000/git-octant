import { GitHubOrganization } from '../types/github';

/**
 * Sorts GitHub organizations based on the user's preferred order.
 * Organizations in preferredOrder appear first in the specified sequence.
 * Any additional organizations not in preferredOrder are appended at the end.
 */
export function sortOrganizationsByPreference(
  organizations: GitHubOrganization[],
  preferredOrder?: string[]
): GitHubOrganization[] {
  if (!organizations || organizations.length === 0) {
    return [];
  }

  if (!preferredOrder || preferredOrder.length === 0) {
    return [...organizations];
  }

  const orderMap = new Map<string, number>();
  preferredOrder.forEach((login, idx) => {
    orderMap.set(login.toLowerCase(), idx);
  });

  const matched: { org: GitHubOrganization; index: number }[] = [];
  const unmatched: GitHubOrganization[] = [];

  for (const org of organizations) {
    const key = org.login.toLowerCase();
    if (orderMap.has(key)) {
      matched.push({ org, index: orderMap.get(key)! });
    } else {
      unmatched.push(org);
    }
  }

  matched.sort((a, b) => a.index - b.index);

  return [...matched.map((m) => m.org), ...unmatched];
}
