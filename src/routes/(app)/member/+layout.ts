import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async (event) => {
	// Pass through all data
	return event.data;
};
