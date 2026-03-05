import fs from "node:fs/promises";
import path from "node:path";
import { buildIconIndex } from "../src/lib/icon-fs";
import { ICON_SETS, type IconSetId } from "../src/lib/icon-sets";

async function generateIconsNames() {
	const iconsNames: Record<string, string[]> = {};
	const allIcons: Set<string> = new Set();

	// Process each icon set
	for (const iconSet of ICON_SETS) {
		const setId = iconSet.id;
		const iconNames: Set<string> = new Set();

		// Process each style in the icon set
		for (const style of iconSet.styles) {
			try {
				const index = await buildIconIndex(setId, style.id);
				
				// Add all icon names from this style
				for (const icon of index.icons) {
					const normalizedName = icon.name.toLowerCase();
					iconNames.add(normalizedName);
					allIcons.add(`${setId}-${normalizedName}`);
				}
			} catch (error) {
				console.error(`Error processing ${setId}/${style.id}:`, error);
			}
		}

		// Convert Set to sorted array
		iconsNames[setId] = Array.from(iconNames).sort();
	}

	// Create the final structure
	const output = {
		"icons-names": iconsNames,
		"all": Array.from(allIcons).sort(),
	};

	// Write to file
	const outputPath = path.join(process.cwd(), "icons-name.json");
	await fs.writeFile(outputPath, JSON.stringify(output, null, 2), "utf-8");

	console.log(`✅ Generated icons-name.json with ${Object.keys(iconsNames).length} icon sets`);
	console.log(`   Total unique icons: ${allIcons.size}`);
	
	// Print summary
	for (const [setId, names] of Object.entries(iconsNames)) {
		console.log(`   - ${setId}: ${names.length} icons`);
	}
}

generateIconsNames().catch((error) => {
	console.error("Error generating icons-name.json:", error);
	process.exit(1);
});



