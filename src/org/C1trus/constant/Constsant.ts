/**
 * Basic Constants
 */
export const BasicConst = {
	YAML_FRONT_MATTER_SYMBOL: '---',
	/**
	 * Status bar display duration (milliseconds)
	 */
	CLEAN_STATUS_BAR_DELAY: 5000,
	/**
	 * Request delay (milliseconds)
	 */
	CALL_API_DELAY: 4000,
}

/**
 * Estimate processing time per item
 */
export const ESTIMATE_TIME_PER: number = 2000;

/**
 * Action types
 */
export enum Action {
	Import = 'import',
}

/**
 * Handle mode
 */
export enum HandleMode {
	FOR_CREATE = 'create',
	FOR_REPLACE = 'replace',
}