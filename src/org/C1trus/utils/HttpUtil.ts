import {Platform, RequestUrlResponse, requestUrl} from "obsidian";

export default class HttpUtil {
	/**
	 * Simple HTTP GET request
	 * @param url Request URL
	 * @param headers Request headers
	 */
	public static async httpRequest(url: string, headers: any): Promise<{status: number, headers: any, text: string}> {
		const response = await requestUrl({
			url: url,
			method: 'GET',
			headers: headers
		});
		return {
			status: response.status,
			headers: response.headers,
			text: response.text
		};
	}

	/**
	 * GET request for text
	 * @param url Request URL
	 * @param headers Request headers
	 */
	public static async getText(url: string, headers: any): Promise<{status: number, headers: any, text: string}> {
		return this.httpRequest(url, headers);
	}

	/**
	 * GET request for binary data
	 * @param url Request URL
	 * @param headers Request headers
	 */
	public static async httpRequestBuffer(url: string, headers: any): Promise<{status: number, headers: any, arrayBuffer: ArrayBuffer}> {
		const response = await requestUrl({
			url: url,
			method: 'GET',
			headers: headers
		});
		return {
			status: response.status,
			headers: response.headers,
			arrayBuffer: response.arrayBuffer
		};
	}

	public static parse(url: string): { protocol: string, host: string, port: string, path: string } {
		const regex = /^(.*?):\/\/([^\/:]+)(?::(\d+))?([^?]*)$/;
		const matches = url.match(regex);

		if (matches) {
			const protocol = matches[1];
			const host = matches[2];
			const port = matches[3] || '';
			const path = matches[4];

			return { protocol, host, port, path };
		}

		throw new Error('Invalid URL');
	}

	public static replaceUrlPath(url: string, newPath: string): string {
		const regex = /^(https?:\/\/[^\/]+)(:\d+)?(\/.*)$/;
		const matches = url.match(regex);
		if (matches && matches.length === 4) {
			return matches[1] + (matches[2] || '') + newPath;
		}
		return url;
	}

	/**
	 * Extract URL from string
	 * @param str
	 */
	public static extractURLFromString(str: string): string  {
		const urlRegex = /(?:!\[.*?\]\()?(https?:\/\/[^\s)]+)/g;
		const matches = str.match(urlRegex);
		if (matches && matches.length > 0) {
			return matches[0];
		}
		return str;
	}

	/**
	 * URL encode string
	 * @param keyword
	 */
	static encodeUrl(keyword: string) {
		if (!keyword) {
			return '';
		}
		return encodeURIComponent(keyword);
	}
}