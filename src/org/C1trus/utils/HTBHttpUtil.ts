import {requestUrl, RequestUrlParam, RequestUrlResponse} from 'obsidian';
import {HTB_API_BASE, HTB_DEFAULT_HEADERS, HTB_ERROR_MESSAGES} from '../constant/HTB';
import {log} from './Logutil';

/**
 * HTB HTTP 请求工具类
 */
export class HTBHttpUtil {
	
	/**
	 * GET 请求获取 JSON 数据
	 * @param url 请求地址
	 * @param headers 请求头
	 * @param debug 是否开启调试
	 */
	static async get(url: string, headers: any, debug: boolean = false): Promise<any> {
		if (debug) {
			console.log(`HTB HTTP: GET ${url}`);
		}
		
		const mergedHeaders = {
			...HTB_DEFAULT_HEADERS,
			...headers
		};
		
		const param: RequestUrlParam = {
			url: url,
			method: 'GET',
			headers: mergedHeaders
		};
		
		try {
			const response: RequestUrlResponse = await requestUrl(param);
			
			if (debug) {
				console.log(`HTB HTTP: 响应状态 ${response.status}`);
			}
			
			if (response.status === 200) {
				return response.json;
			} else {
				return this.handleErrorResponse(response, debug);
			}
		} catch (e) {
			// Obsidian requestUrl 在非 200 状态码时会抛出异常
			// 尝试提取详细错误信息
			const detailedError = this.extractDetailedError(e);
			
			if (debug) {
				console.log(`HTB HTTP: 请求失败 - ${detailedError.message}`);
			}
			
			throw detailedError;
		}
	}
	
	/**
	 * GET 请求获取 HTML 文本
	 * @param url 请求地址
	 * @param headers 请求头
	 * @param debug 是否开启调试
	 */
	static async getHtml(url: string, headers: any, debug: boolean = false): Promise<string> {
		if (debug) {
			console.log(`HTB HTTP: GET HTML ${url}`);
		}
		
		const mergedHeaders = {
			...HTB_DEFAULT_HEADERS,
			...headers,
			'Accept': 'text/html,application/xhtml+xml,application/xml'
		};
		
		const param: RequestUrlParam = {
			url: url,
			method: 'GET',
			headers: mergedHeaders
		};
		
		try {
			const response: RequestUrlResponse = await requestUrl(param);
			
			if (debug) {
				console.log(`HTB HTTP: 响应状态 ${response.status}`);
			}
			
			if (response.status === 200) {
				return response.text;
			} else {
				this.handleErrorResponse(response, debug);
				return '';
			}
		} catch (e) {
			if (debug) {
				console.log(`HTB HTTP: 请求失败 ${e.message}`);
			}
			log.error(`HTB HTTP 请求失败: ${url}`, e);
			
			// 尝试提取详细错误信息
			const detailedError = this.extractDetailedError(e);
			throw detailedError;
		}
	}
	
	/**
	 * POST 请求
	 * @param url 请求地址
	 * @param headers 请求头
	 * @param body 请求体
	 * @param debug 是否开启调试
	 */
	static async post(url: string, headers: any, body: any, debug: boolean = false): Promise<any> {
		if (debug) {
			console.log(`HTB HTTP: POST ${url}`);
		}
		
		const mergedHeaders = {
			...HTB_DEFAULT_HEADERS,
			...headers
		};
		
		const param: RequestUrlParam = {
			url: url,
			method: 'POST',
			headers: mergedHeaders,
			body: JSON.stringify(body)
		};
		
		try {
			const response: RequestUrlResponse = await requestUrl(param);
			
			if (debug) {
				console.log(`HTB HTTP: 响应状态 ${response.status}`);
			}
			
			if (response.status === 200 || response.status === 201) {
				return response.json;
			} else {
				return this.handleErrorResponse(response, debug);
			}
		} catch (e) {
			if (debug) {
				console.log(`HTB HTTP: 请求失败 ${e.message}`);
			}
			log.error(`HTB HTTP 请求失败: ${url}`, e);
			
			// 尝试提取详细错误信息
			const detailedError = this.extractDetailedError(e);
			throw detailedError;
		}
	}
	
	/**
	 * 下载图片
	 * @param url 图片地址
	 * @param debug 是否开启调试
	 */
	static async downloadImage(url: string, debug: boolean = false): Promise<ArrayBuffer> {
		if (debug) {
			console.log(`HTB HTTP: 下载图片 ${url}`);
		}
		
		const param: RequestUrlParam = {
			url: url,
			method: 'GET'
		};
		
		try {
			const response: RequestUrlResponse = await requestUrl(param);
			
			if (response.status === 200) {
				return response.arrayBuffer;
			} else {
				throw new Error(`下载图片失败: ${response.status}`);
			}
		} catch (e) {
			if (debug) {
				console.log(`HTB HTTP: 图片下载失败 ${e.message}`);
			}
			log.error(`HTB 图片下载失败: ${url}`, e);
			throw this.parseError(e);
		}
	}
	
	/**
	 * 处理错误响应
	 */
	private static handleErrorResponse(response: RequestUrlResponse, debug: boolean = false): never {
		let errorMessage = HTB_ERROR_MESSAGES.INVALID_RESPONSE;
		
		// 尝试从响应体中提取详细错误信息
		try {
			if (response.json && response.json.message) {
				errorMessage = response.json.message;
			} else if (response.text) {
				const jsonData = JSON.parse(response.text);
				if (jsonData.message) {
					errorMessage = jsonData.message;
				}
			}
		} catch (e) {
			// 如果解析失败，使用默认错误消息
		}
		
		// 如果没有从响应中获取到具体错误信息，使用默认消息
		if (errorMessage === HTB_ERROR_MESSAGES.INVALID_RESPONSE) {
			switch (response.status) {
				case 401:
					errorMessage = HTB_ERROR_MESSAGES.AUTH_FAILED;
					break;
				case 403:
					errorMessage = HTB_ERROR_MESSAGES.PERMISSION_DENIED;
					break;
				case 404:
					errorMessage = HTB_ERROR_MESSAGES.MACHINE_NOT_FOUND;
					break;
				case 429:
					errorMessage = HTB_ERROR_MESSAGES.RATE_LIMIT;
					break;
				case 500:
				case 502:
				case 503:
					errorMessage = '服务器错误，请稍后再试';
					break;
			}
		}
		
		if (debug) {
			console.log(`HTB HTTP: 错误响应 ${response.status} - ${errorMessage}`);
		}
		throw new Error(`[${response.status}] ${errorMessage}`);
	}
	
	/**
	 * 解析错误
	 */
	private static parseError(error: any): Error {
		if (error.message) {
			// 网络错误
			if (error.message.includes('ENOTFOUND') || 
				error.message.includes('ETIMEDOUT') || 
				error.message.includes('ECONNREFUSED')) {
				return new Error(HTB_ERROR_MESSAGES.NETWORK_ERROR);
			}
			
			// 其他错误
			return error;
		}
		
		return new Error('未知错误');
	}
	
	/**
	 * 提取详细错误信息
	 */
	private static extractDetailedError(error: any): Error {
		// 尝试从 Obsidian requestUrl 错误中提取 API 错误信息
		try {
			// Obsidian requestUrl 在非 200 响应时会抛出错误
			// 错误对象包含 status 和 headers 属性，但不包含响应体
			
			// 检查错误对象本身是否包含状态码
			let statusCode = 0;
			if (error.status) {
				statusCode = error.status;
			} else if (error.message) {
				const statusMatch = error.message.match(/status (\d+)/);
				if (statusMatch) {
					statusCode = parseInt(statusMatch[1]);
				}
			}
			
			// 根据状态码返回友好的错误信息
			if (statusCode > 0) {
				let errorMessage = '';
				switch (statusCode) {
					case 401:
						errorMessage = HTB_ERROR_MESSAGES.AUTH_FAILED;
						break;
					case 403:
						errorMessage = HTB_ERROR_MESSAGES.PERMISSION_DENIED;
						break;
					case 404:
						errorMessage = HTB_ERROR_MESSAGES.MACHINE_NOT_FOUND;
						break;
					case 429:
						errorMessage = HTB_ERROR_MESSAGES.RATE_LIMIT;
						break;
					case 500:
					case 502:
					case 503:
						errorMessage = '服务器错误，请稍后再试';
						break;
					default:
						errorMessage = `请求失败 (${statusCode})`;
				}
				return new Error(errorMessage);
			}
		} catch (e) {
			// 提取失败，使用原始错误
		}
		
		// 使用默认的 parseError
		return this.parseError(error);
	}
	
	/**
	 * 构建 API URL
	 * @param endpoint API 端点
	 * @param params 路径参数
	 */
	static buildApiUrl(endpoint: string, params?: Record<string, string>): string {
		let url = `${HTB_API_BASE}${endpoint}`;
		
		if (params) {
			Object.keys(params).forEach(key => {
				url = url.replace(`:${key}`, params[key]);
			});
		}
		
		return url;
	}
	
	/**
	 * 构建查询字符串
	 * @param params 查询参数
	 */
	static buildQueryString(params: Record<string, any>): string {
		const queryParts: string[] = [];
		
		Object.keys(params).forEach(key => {
			const value = params[key];
			if (value !== undefined && value !== null) {
				queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
			}
		});
		
		return queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
	}
}
