const fs = require("fs");

try {
  const csv = fs.readFileSync("WLAB-Table 1.csv", "utf8");
  const lines = csv.split("\n");
  const header = lines[0].split(",");

  // Find column indices
  const taxonNameIndex = header.findIndex((col) => col.trim() === "TaxonName");
  const scientificNameIndex = header.findIndex(
    (col) => col.trim() === "TaxonScientificName"
  );
  const familyNameIndex = header.findIndex(
    (col) => col.trim() === "FamilyCommonName"
  );
  const taxonLevelIndex = header.findIndex(
    (col) => col.trim() === "TaxonLevel"
  );

  console.log("Found columns at indices:");
  console.log("TaxonName:", taxonNameIndex);
  console.log("TaxonScientificName:", scientificNameIndex);
  console.log("FamilyCommonName:", familyNameIndex);
  console.log("TaxonLevel:", taxonLevelIndex);

  // Extract species data (skip subspecies, hybrids, groups)
  const birds = [];
  const seen = new Set(); // To avoid duplicates

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const cols = lines[i].split(",");
    const taxonLevel = cols[taxonLevelIndex]?.trim();

    // Only include main species (sp) and skip subspecies (ssp), groups, hybrids
    if (taxonLevel === "sp") {
      const commonName = cols[taxonNameIndex]?.trim();
      const scientificName = cols[scientificNameIndex]?.trim();
      const family = cols[familyNameIndex]?.trim();

      if (commonName && scientificName && family) {
        const key = `${commonName}|${scientificName}`;
        if (!seen.has(key)) {
          seen.add(key);
          birds.push({
            commonName,
            scientificName,
            family,
          });
        }
      }
    }
  }

  // Sort by common name
  birds.sort((a, b) => a.commonName.localeCompare(b.commonName));

  console.log(`\nExtracted ${birds.length} unique bird species`);
  console.log("\nFirst 10 entries:");
  birds.slice(0, 10).forEach((bird, i) => {
    console.log(
      `${i + 1}. ${bird.commonName} (${bird.scientificName}) - ${bird.family}`
    );
  });

  // Create the birds data file
  const birdsData = `// Australian Bird Species Database
// Extracted from WLAB-Table 1.csv
// Contains ${birds.length} species

export const australianBirds = ${JSON.stringify(birds, null, 2)};
`;

  fs.writeFileSync("australianBirds.ts", birdsData);
  console.log("\nBirds data written to australianBirds.ts");
} catch (error) {
  console.error("Error processing CSV:", error.message);
}
