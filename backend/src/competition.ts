import { australianBirds } from './australianBirds';

export type Competition = 'australia' | 'worldwide';

export interface StoredBird {
  name: string;
}

export interface CompetitionUser<TBird extends StoredBird = StoredBird> {
  username: string;
  birds: TBird[];
}

export interface LeaderboardEntry {
  username: string;
  birdCount: number;
}

const australianScientificNames = new Set(
  australianBirds.map((bird) => bird.scientificName)
);

const canonicalAustralianNames = new Set(
  australianBirds.map(
    (bird) => `${bird.commonName} (${bird.scientificName})`
  )
);

export function parseCompetitionQuery(value: unknown): Competition {
  if (value === undefined) {
    return 'australia';
  }

  if (value === 'australia' || value === 'worldwide') {
    return value;
  }

  throw new Error('Unsupported competition');
}

export function parseStoredScientificName(name: string): string | null {
  const match = name.match(/\(([^()]+)\)\s*$/);
  return match?.[1].trim() || null;
}

export function isAustralianBirdName(name: string): boolean {
  const scientificName = parseStoredScientificName(name);

  return (
    (scientificName !== null && australianScientificNames.has(scientificName)) ||
    canonicalAustralianNames.has(name)
  );
}

export function filterBirdsForCompetition<TBird extends StoredBird>(
  birds: TBird[],
  competition: Competition
): TBird[] {
  return competition === 'worldwide'
    ? birds
    : birds.filter((bird) => isAustralianBirdName(bird.name));
}

export function projectBirdCount(
  birds: StoredBird[],
  competition: Competition
): number {
  return filterBirdsForCompetition(birds, competition).length;
}

export function projectLeaderboard(
  users: CompetitionUser[],
  competition: Competition
): LeaderboardEntry[] {
  return users
    .map((user) => ({
      username: user.username,
      birdCount: projectBirdCount(user.birds, competition),
    }))
    .sort((a, b) => b.birdCount - a.birdCount)
    .slice(0, 10);
}
