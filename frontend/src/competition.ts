import { australianBirds, Bird } from "./australianBirds";
import { nonAustralianBirds } from "./nonAustralianBirds";

export type Competition = "australia" | "worldwide";

export const competitionLabels: Record<Competition, string> = {
  australia: "Australian Comp",
  worldwide: "Worldwide Comp",
};

const COMPETITION_STORAGE_PREFIX = "wingwatch-competition:v1:";

export const isCompetition = (value: unknown): value is Competition =>
  value === "australia" || value === "worldwide";

export const competitionStorageKey = (username: string): string =>
  `${COMPETITION_STORAGE_PREFIX}${encodeURIComponent(username)}`;

const getBrowserStorage = (): Storage | undefined => {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

export const loadCompetitionPreference = (
  username: string,
  storage: Storage | undefined = getBrowserStorage(),
): Competition => {
  try {
    const savedCompetition = storage?.getItem(competitionStorageKey(username));
    return isCompetition(savedCompetition) ? savedCompetition : "australia";
  } catch {
    return "australia";
  }
};

export const saveCompetitionPreference = (
  username: string,
  competition: Competition,
  storage: Storage | undefined = getBrowserStorage(),
): void => {
  try {
    storage?.setItem(competitionStorageKey(username), competition);
  } catch {
    // Browser privacy settings or storage limits must not block selection.
  }
};

export const combineBirdCatalogs = (
  australianCatalog: Bird[],
  additionalCatalog: Bird[],
): Bird[] => {
  const seenScientificNames = new Set<string>();

  return [...australianCatalog, ...additionalCatalog].filter((bird) => {
    const scientificName = bird.scientificName.trim().toLowerCase();
    if (seenScientificNames.has(scientificName)) return false;

    seenScientificNames.add(scientificName);
    return true;
  });
};

export const worldwideBirds = combineBirdCatalogs(
  australianBirds,
  nonAustralianBirds,
);

export const getBirdCatalog = (competition: Competition): Bird[] =>
  competition === "worldwide" ? worldwideBirds : australianBirds;

export const searchCompetitionBirds = (
  query: string,
  competition: Competition,
): Bird[] => {
  const catalog = getBirdCatalog(competition);
  if (!query) return catalog;

  const searchTerm = query.toLowerCase();
  return catalog.filter(
    (bird) =>
      bird.commonName.toLowerCase().includes(searchTerm) ||
      bird.scientificName.toLowerCase().includes(searchTerm) ||
      bird.family.toLowerCase().includes(searchTerm),
  );
};
