import { australianBirds, Bird } from "./australianBirds";
import { nonAustralianBirds } from "./nonAustralianBirds";
import {
  combineBirdCatalogs,
  getBirdCatalog,
  loadCompetitionPreference,
  saveCompetitionPreference,
  searchCompetitionBirds,
} from "./competition";

describe("competition preferences", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to Australia when no preference is saved", () => {
    expect(loadCompetitionPreference("birder-one")).toBe("australia");
  });

  it("saves and restores Worldwide for the same username", () => {
    saveCompetitionPreference("birder-one", "worldwide");

    expect(loadCompetitionPreference("birder-one")).toBe("worldwide");
  });

  it("keeps preferences isolated by username", () => {
    saveCompetitionPreference("birder-one", "worldwide");

    expect(loadCompetitionPreference("birder-two")).toBe("australia");
  });

  it("falls back to Australia without throwing for invalid or inaccessible storage", () => {
    localStorage.setItem(
      "wingwatch-competition:v1:birder-one",
      "not-a-competition",
    );
    const inaccessibleStorage: Storage = {
      length: 0,
      clear: jest.fn(),
      getItem: jest.fn(() => {
        throw new Error("Storage unavailable");
      }),
      key: jest.fn(),
      removeItem: jest.fn(),
      setItem: jest.fn(() => {
        throw new Error("Storage unavailable");
      }),
    };

    expect(loadCompetitionPreference("birder-one")).toBe("australia");
    expect(() =>
      saveCompetitionPreference("birder-one", "worldwide", inaccessibleStorage),
    ).not.toThrow();
    expect(loadCompetitionPreference("birder-one", inaccessibleStorage)).toBe(
      "australia",
    );
  });
});

describe("competition bird catalogs", () => {
  it("returns the existing Australian catalog unchanged", () => {
    expect(getBirdCatalog("australia")).toBe(australianBirds);
  });

  it("searches Australian and New Caledonian birds in Worldwide", () => {
    const australianBird = australianBirds[0];
    const nonAustralianBird = nonAustralianBirds[0];

    expect(
      searchCompetitionBirds(australianBird.scientificName, "worldwide"),
    ).toContain(australianBird);
    expect(
      searchCompetitionBirds(nonAustralianBird.commonName, "worldwide"),
    ).toContain(nonAustralianBird);
  });

  it("contains the 39 New Caledonian species absent from the Australian catalog", () => {
    expect(nonAustralianBirds).toHaveLength(39);
    expect(nonAustralianBirds).toContainEqual({
      commonName: "Kagu",
      scientificName: "Rhynochetos jubatus",
      family: "Kagu",
    });

    const australianScientificNames = new Set(
      australianBirds.map((bird) => bird.scientificName),
    );
    expect(
      nonAustralianBirds.every(
        (bird) => !australianScientificNames.has(bird.scientificName),
      ),
    ).toBe(true);
  });

  it("matches common name, scientific name, and family without case sensitivity", () => {
    const nonAustralianBird = nonAustralianBirds[0];

    expect(
      searchCompetitionBirds(nonAustralianBird.commonName.toUpperCase(), "worldwide"),
    ).toContain(nonAustralianBird);
    expect(
      searchCompetitionBirds(
        nonAustralianBird.scientificName.toUpperCase(),
        "worldwide",
      ),
    ).toContain(nonAustralianBird);
    expect(
      searchCompetitionBirds(nonAustralianBird.family.toUpperCase(), "worldwide"),
    ).toContain(nonAustralianBird);
  });

  it("deduplicates catalogs by scientific name", () => {
    const duplicate: Bird = {
      ...australianBirds[0],
      commonName: "Duplicate common name",
    };

    const combined = combineBirdCatalogs(australianBirds, [duplicate]);

    expect(
      combined.filter(
        (bird) => bird.scientificName === duplicate.scientificName,
      ),
    ).toHaveLength(1);
  });

  it("returns the selected catalog for an empty search", () => {
    expect(searchCompetitionBirds("", "australia")).toBe(australianBirds);
    expect(searchCompetitionBirds("", "worldwide")).toEqual(
      getBirdCatalog("worldwide"),
    );
  });
});
