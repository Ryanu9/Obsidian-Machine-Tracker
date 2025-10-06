export default class NumberUtil {
	/**
	 * Generate random number in range
	 * @Min minimum value
	 * @Max maximum value
	 */
	public static getRandomNum(min:number, max:number):number {
		const range = max - min;
		const rand = Math.random();
		return (min + Math.round(rand * range));
	}

	static isNumber(value: string) {
		return !isNaN(Number(value));
	}

	static isInt(value: string) {
		return Number.isInteger(Number(value));
	}

	static value(value: string) {
		return Number(value);
	}
}