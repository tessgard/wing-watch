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

  // Extract species data (skip subspecies, hybrids, groups)
  const birds = [];
  const seen = new Set();

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    // Use a more robust CSV parsing approach
    const line = lines[i];
    const cols = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        cols.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    cols.push(current); // Add the last column

    const taxonLevel = cols[taxonLevelIndex]?.trim();

    // Only include main species (sp)
    if (taxonLevel === "sp") {
      const commonName = cols[taxonNameIndex]?.trim().replace(/"/g, "");
      const scientificName = cols[scientificNameIndex]
        ?.trim()
        .replace(/"/g, "");
      const family = cols[familyNameIndex]?.trim().replace(/"/g, "");

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

  console.log(`Extracted ${birds.length} unique bird species`);
  console.log("First 10 entries:");
  birds.slice(0, 10).forEach((bird, i) => {
    console.log(
      `${i + 1}. ${bird.commonName} (${bird.scientificName}) - ${bird.family}`
    );
  });

  // Create the birds data file for frontend
  const birdsData = `// Australian Bird Species Database
// Extracted from WLAB-Table 1.csv
// Contains ${birds.length} species

export interface Bird {
  commonName: string;
  scientificName: string;
  family: string;
}

export const australianBirds: Bird[] = ${JSON.stringify(birds, null, 2)};

// Helper function to search birds
export const searchBirds = (query: string): Bird[] => {
  if (!query) return australianBirds;
  
  const searchTerm = query.toLowerCase();
  return australianBirds.filter(bird => 
    bird.commonName.toLowerCase().includes(searchTerm) ||
    bird.scientificName.toLowerCase().includes(searchTerm) ||
    bird.family.toLowerCase().includes(searchTerm)
  );
};
`;

  // Write to frontend src directory
  const frontendPath = "../../../frontend/src/australianBirds.ts";
  fs.writeFileSync(frontendPath, birdsData);
  console.log("\\nBirds data written to frontend/src/australianBirds.ts");
} catch (error) {
  console.error("Error processing CSV:", error.message);
}
