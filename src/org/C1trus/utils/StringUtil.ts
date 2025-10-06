export default class StringUtil {

	/**
	 * Check if string is blank
	 * @param str
	 */
	public static isBlank(str: string): boolean {
		return str == null || str.trim().length == 0;
	}

	/**
	 * Return default value if string is blank
	 */
	public static defaultIfBlank(str: string, defaultStr: string): string {
		return StringUtil.isBlank(str) ? defaultStr : str;
	}

	public static analyzeIdByUrl(url: string):string {
		let idPattern = /(\d){5,10}/g;
		let idE = idPattern.exec(url);
		let id = idE ? idE[0] : '';
		return id;
	}

	/**
	 * Parse request headers string to json
	 * @param text
	 * @return json object
	 */
	public static parseHeaders(text: string): any {
		let headers = {};
		if (text) {
			//Remove first line if it contains 'GET' or 'POST'
			if (text.indexOf('GET') == 0 || text.indexOf('POST') == 0) {
				text = text.substring(text.indexOf('\n') + 1);
			}
			let lines = text.split('\n');
			for (let line of lines) {
				let index = line.indexOf(':');
				if (index > 0) {
					let key = line.substring(0, index);
					let value = line.substring(index + 1).trim();
					// @ts-ignore
					headers[key] = value;
				}
			}
		}
		return headers;
	}

	public static confuse(text: string):string {
		if (!text) {
			return
		}
		let texts = Array.from(text);
		const length = texts.length;
		const newTexts = [];
		for (let i = 0; i < length; i++) {
			let val = text[i];
			if (i >= length/3 && i <= length * 2/3) {
				val = '*'
			}
			newTexts[i] = val;
		}
		return newTexts.join('');
	}

	/**
	 * Escape string - replace escape sequences with actual characters
	 */
	public static escape(text: string): string {
		if (!text) {
			return text;
		}
		let newText = text;
		EscapeMap.forEach((value, key) => {
			newText = newText.replace(key, value);
		});
		return newText;
	}

	public static notJsonString(str: string) {
		try {
			JSON.parse(str);
			return false;
		} catch (error) {
			return true;
		}
	}
}

export const EscapeMap:Map< { [Symbol.replace](string: string, replaceValue: string): string; }, string> = new Map([
	[/\\n/g, "\n"],
	[/\\t/g, "\t"],
	[/\\r/g, "\r"],
	[/\\f/g, "\f"],
	[/\\b/g, "\b"],
	[/\\'/g, "'"],
	[/\\"/g, '"'],
	[/\\\\/g, "\\"],
])