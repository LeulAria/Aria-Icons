/**
 * Iconify packs whose SVGs contain SMIL / CSS animation
 * (`Contains Animations` in collections.json).
 *
 * Keep in sync with Iconify collection tags when fetching new sets.
 */
export const ANIMATED_SET_IDS = new Set([
	"line-md",
	"svg-spinners",
	"meteocons",
]);

export function isAnimatedSet(setId: string): boolean {
	return ANIMATED_SET_IDS.has(setId);
}
