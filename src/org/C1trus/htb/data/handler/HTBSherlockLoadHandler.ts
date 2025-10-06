import {HTBSherlock, HTBSherlockApiResponse, HTBSherlockSearchResult, HTBSherlockListApiResponse} from "../model/HTBSherlock";
import {HTBHttpUtil} from "../../../utils/HTBHttpUtil";
import {HTB_API_ENDPOINTS} from "../../../constant/HTB";
import {log} from "../../../utils/Logutil";
import {App, moment, Notice, normalizePath} from "obsidian";
import HTBPlugin from "../../../main";

/**
 * HTB Sherlock 数据加载处理器
 */
export default class HTBSherlockLoadHandler {
	private app: App;
	private plugin: HTBPlugin;
	
	constructor(app: App, plugin: HTBPlugin) {
		this.app = app;
		this.plugin = plugin;
	}
	
	/**
	 * 加载 Sherlock 信息
	 * @param sherlockInput Sherlock ID 或名称
	 */
	async loadSherlock(sherlockInput: string): Promise<HTBSherlock | null> {
		const debug = this.plugin.settings.debug;
		if (debug) {
			console.log(`HTB Sherlock 处理器: 开始加载 Sherlock 信息 ${sherlockInput}`);
		}
		
		try {
			let sherlockId: string = sherlockInput;
			let sherlockFromCache: HTBSherlockSearchResult | null = null;
			
			// 如果输入不是纯数字，先搜索获取 ID
			if (!/^\d+$/.test(sherlockInput)) {
				if (debug) {
					console.log(`HTB Sherlock 处理器: 输入不是纯数字，尝试搜索 Sherlock`);
				}
				const searchResults = await this.searchSherlocks(sherlockInput);
				if (searchResults.length === 0) {
					new Notice(`未找到 Sherlock: ${sherlockInput}`);
					return null;
				}
				// 精确匹配
				const exactMatch = searchResults.find(s => s.name.toLowerCase() === sherlockInput.toLowerCase());
				const matchedResult = exactMatch || searchResults[0];
				sherlockId = matchedResult.id.toString();
				sherlockFromCache = matchedResult;
				if (debug) {
					console.log(`HTB Sherlock 处理器: 找到 Sherlock ID: ${sherlockId}`);
				}
			} else {
				// 如果是纯数字 ID，尝试从缓存中查找
				const cache = this.plugin.settings.sherlockCache || [];
				sherlockFromCache = cache.find((item: HTBSherlockSearchResult) => item.id.toString() === sherlockId) || null;
				if (debug && sherlockFromCache) {
					console.log(`HTB Sherlock 处理器: 从缓存中找到 Sherlock ${sherlockId}`);
				}
			}
			
			// 优先使用缓存中的数据（列表 API 的数据更完整）
			if (sherlockFromCache) {
				if (debug) {
					console.log(`HTB Sherlock 处理器: 使用缓存数据构建 Sherlock 对象`);
				}
				const sherlock = this.parseFromSearchResult(sherlockFromCache);
				
				// 获取详细描述（如果需要）
				try {
					const headers = {
						'Authorization': `Bearer ${this.plugin.settings.apiToken}`
					};
					const apiUrl = HTBHttpUtil.buildApiUrl(HTB_API_ENDPOINTS.SHERLOCK_INFO, {id: sherlockId});
					const response: HTBSherlockApiResponse = await HTBHttpUtil.get(apiUrl, headers, debug);
					
					if (response && response.data && response.data.description) {
						sherlock.description = response.data.description;
					}
				} catch (e) {
					// 如果获取描述失败（比如权限问题），仍然返回基本信息
					if (debug) {
						console.log(`HTB Sherlock 处理器: 获取描述失败，使用基本信息`, e);
					}
					// 显示错误消息到右上角
					new Notice(`获取 Sherlock 描述失败: ${e.message}`);
				}
				
				return sherlock;
			}
			
			// 如果缓存中没有，调用详情 API（这种情况应该很少见）
			const headers = {
				'Authorization': `Bearer ${this.plugin.settings.apiToken}`
			};
			
			const apiUrl = HTBHttpUtil.buildApiUrl(HTB_API_ENDPOINTS.SHERLOCK_INFO, {id: sherlockId});
			
			if (debug) {
				console.log(`HTB Sherlock 处理器: 缓存中无数据，调用详情 API - ${apiUrl}`);
			}
			
			const response: HTBSherlockApiResponse = await HTBHttpUtil.get(apiUrl, headers, debug);
			
			if (debug) {
				console.log('[HTBSherlockLoadHandler] API 完整响应:', response);
			}
			
			if (response && response.data) {
				const sherlock = this.parseFromApi(response.data);
				if (debug) {
					console.log(`HTB Sherlock 处理器: 成功获取 Sherlock 信息 ${sherlock.name}`);
				}
				return sherlock;
			}
			
			return null;
		} catch (e) {
			log.error(`获取 HTB Sherlock 信息失败: ${sherlockInput}`, e);
			new Notice(`获取 Sherlock 失败: ${e.message}`);
			return null;
		}
	}
	
	/**
	 * 搜索 Sherlock（新逻辑：先查缓存，无缓存则调用 API）
	 * @param query 搜索关键词
	 */
	async searchSherlocks(query: string): Promise<HTBSherlockSearchResult[]> {
		const debug = this.plugin.settings.debug;
		if (debug) {
			console.log(`HTB Sherlock 处理器: 搜索 Sherlock "${query}"`);
		}
		
		try {
			// 只从缓存中搜索，不自动请求 API
			const cache = this.plugin.settings.sherlockCache || [];
			const searchLower = query.toLowerCase();
			
			// 在缓存中查找匹配项
			const cachedResults = cache.filter((item: HTBSherlockSearchResult) => 
				item.name.toLowerCase().includes(searchLower) ||
				item.id.toString().includes(query) ||
				item.category_name?.toLowerCase().includes(searchLower)
			);
			
			if (debug) {
				console.log(`HTB Sherlock 处理器: 缓存中找到 ${cachedResults.length} 个匹配项`);
			}
			
			// 直接返回缓存中的结果（如果没有匹配就返回空数组）
			return cachedResults;
		} catch (e) {
			log.error(`搜索 HTB Sherlock 失败: ${query}`, e);
			throw e;
		}
	}
	
	/**
	 * 从 API 获取所有 Sherlock（自动处理分页）
	 */
	private async fetchAllSherlocksFromApi(): Promise<HTBSherlockSearchResult[]> {
		const debug = this.plugin.settings.debug;
		const allSherlocks: HTBSherlockSearchResult[] = [];
		let currentPage = 1;
		let hasMorePages = true;
		
		try {
			const headers = {
				'Authorization': `Bearer ${this.plugin.settings.apiToken}`
			};
			
			while (hasMorePages) {
				const apiUrl = HTBHttpUtil.buildApiUrl(HTB_API_ENDPOINTS.SHERLOCK_LIST);
				const queryString = HTBHttpUtil.buildQueryString({page: currentPage});
				const fullUrl = apiUrl + queryString;
				
				if (debug) {
					console.log(`HTB Sherlock 处理器: 获取第 ${currentPage} 页 - ${fullUrl}`);
				}
				
				const response: HTBSherlockListApiResponse = await HTBHttpUtil.get(fullUrl, headers, debug);
				
				if (response && response.data && Array.isArray(response.data)) {
					allSherlocks.push(...response.data);
					
					// 检查是否还有更多页
					if (response.meta && response.meta.current_page < response.meta.last_page) {
						currentPage++;
					} else {
						hasMorePages = false;
					}
					
					if (debug && response.meta) {
						console.log(`分页信息: ${response.meta.current_page}/${response.meta.last_page}, 本页: ${response.data.length} 个, 总计: ${allSherlocks.length} 个`);
					}
				} else {
					hasMorePages = false;
				}
			}
			
			if (debug) {
				console.log(`HTB Sherlock 处理器: 共获取 ${allSherlocks.length} 个 Sherlock`);
			}
			
			return allSherlocks;
		} catch (e) {
			log.error('从 API 获取 Sherlock 列表失败', e);
			throw e;
		}
	}
	
	/**
	 * 更新 Sherlock 缓存
	 */
	private async updateSherlockCache(sherlocks: HTBSherlockSearchResult[]): Promise<void> {
		const debug = this.plugin.settings.debug;
		
		try {
			// 合并新获取的 Sherlock 到缓存
			const existingCache = this.plugin.settings.sherlockCache || [];
			const existingIds = new Set(existingCache.map((item: HTBSherlockSearchResult) => item.id));
			
			// 添加新的 Sherlock（去重）
			const newSherlocks = sherlocks.filter(item => !existingIds.has(item.id));
			const updatedCache = [...existingCache, ...newSherlocks];
			
			// 更新设置
			this.plugin.settings.sherlockCache = updatedCache;
			this.plugin.settings.sherlockCacheTime = Date.now();
			
			// 保存设置到 data.json
			await this.plugin.saveSettings();
			
			if (debug) {
				console.log(`HTB Sherlock 处理器: 缓存已更新，共 ${updatedCache.length} 个 Sherlock（新增 ${newSherlocks.length} 个）`);
			}
		} catch (e) {
			log.error('更新 Sherlock 缓存失败', e);
		}
	}
	
	/**
	 * 刷新 Sherlock 缓存（强制从 API 重新获取所有数据）
	 * 用于搜索无结果时手动刷新
	 */
	async refreshCache(): Promise<void> {
		const debug = this.plugin.settings.debug;
		
		if (debug) {
			console.log('HTB Sherlock 处理器: 开始刷新 Sherlock 缓存');
		}
		
		try {
			// 从 API 获取所有 Sherlock
			const allSherlocks = await this.fetchAllSherlocksFromApi();
			
			if (debug) {
				console.log(`HTB Sherlock 处理器: 从 API 获取到 ${allSherlocks.length} 个 Sherlock`);
			}
			
			// 完全替换缓存（不是合并）
			this.plugin.settings.sherlockCache = allSherlocks;
			this.plugin.settings.sherlockCacheTime = Date.now();
			
			// 保存设置
			await this.plugin.saveSettings();
			
			if (debug) {
				console.log(`HTB Sherlock 处理器: 缓存刷新成功，共 ${allSherlocks.length} 个 Sherlock`);
			}
			
			new Notice(`已保存 ${allSherlocks.length} 个 Sherlock 列表信息到缓存`);
		} catch (e) {
			log.error('刷新 Sherlock 缓存失败', e);
			new Notice(`刷新缓存失败: ${e.message}`);
			throw e;
		}
	}
	
	/**
	 * 生成内容
	 */
	async generateContent(sherlock: HTBSherlock, targetPath: string): Promise<string> {
		let template: string;
		
		const matchedTemplate = await this.getMatchedTemplate(targetPath);
		if (matchedTemplate) {
			template = matchedTemplate;
		} else {
			template = await this.getDefaultTemplate();
		}
		
		return this.fillTemplate(template, sherlock);
	}
	
	/**
	 * 获取当前类型的模板配置
	 */
	private getTemplateSettings() {
		return this.plugin.settings.sherlockTemplate;
	}
	
	/**
	 * 获取默认模板
	 */
	private async getDefaultTemplate(): Promise<string> {
		const templateSettings = this.getTemplateSettings();
		
		// 优先使用类型特定的模板内容
		if (templateSettings?.defaultTemplateContent && templateSettings.defaultTemplateContent.trim() !== '') {
			return templateSettings.defaultTemplateContent;
		}
		
		// 尝试加载类型特定的模板文件
		if (templateSettings?.defaultTemplateFile && templateSettings.defaultTemplateFile.trim() !== '') {
			const fileTemplate = await this.loadTemplate(templateSettings.defaultTemplateFile);
			if (fileTemplate) {
				return fileTemplate;
			}
		}
		
		// 回退到全局默认模板内容
		const settings = this.plugin.settings;
		if (settings.defaultTemplateContent && settings.defaultTemplateContent.trim() !== '') {
			return settings.defaultTemplateContent;
		}
		
		// 回退到全局默认模板文件
		if (settings.defaultTemplateFile && settings.defaultTemplateFile.trim() !== '') {
			const fileTemplate = await this.loadTemplate(settings.defaultTemplateFile);
			if (fileTemplate) {
				return fileTemplate;
			}
		}
		
		// 最后使用内置的类型默认模板
		return this.getDefaultSherlockTemplate();
	}
	
	/**
	 * 获取内置 Sherlock 默认模板
	 */
	private getDefaultSherlockTemplate(): string {
		return `---
id: {{id}}
title: {{title}}
name: {{name}}
type: Sherlock
categoryId: {{categoryId}}
categoryName: {{categoryName}}
difficulty: {{difficulty}}
difficultyText: {{difficultyText}}
rating: {{rating}}
score: {{score}}
scoreStar: {{scoreStar}}
stars: {{stars}}
ratingCount: {{ratingCount}}
imageUrl: {{imageUrl}}
avatar: {{avatar}}
currentDate: {{currentDate}}
currentTime: {{currentTime}}
releaseAt: {{releaseAt}}
releaseDate: {{releaseDate}}
state: {{state}}
retired: {{retired}}
isOwned: {{isOwned}}
isTodo: {{isTodo}}
solves: {{solves}}
userOwnsCount: {{userOwnsCount}}
progress: {{progress}}
authUserHasReviewed: {{authUserHasReviewed}}
userCanReview: {{userCanReview}}
writeupVisible: {{writeupVisible}}
showGoVip: {{showGoVip}}
favorite: {{favorite}}
pinned: {{pinned}}
playMethods: {{playMethods}}
retires: {{retires}}
tags: {{tags}}
url: {{url}}
---

![300]({{imageUrl}})

# {{name}}

> HTB Sherlock - 数字取证与事件响应挑战

## 📋 基本信息

| 项目 | 内容 |
|------|------|
| **Sherlock ID** | {{id}} |
| **名称** | {{name}} |
| **类型** | {{type}} |
| **分类ID** | {{categoryId}} |
| **分类名称** | {{categoryName}} |
| **难度** | {{difficultyText}} (难度值: {{difficultyNum}}) |
| **评分** | {{score}} / 5.0 {{scoreStar}} |
| **发布时间** | {{releaseAt}} |
| **状态** | {{state}} |
| **是否退役** | {{retired}} |
| **HTB URL** | {{url}} |

## 📊 统计数据

| 项目 | 数值 |
|------|------|
| **解题数** | {{solves}} |
| **用户拥有数** | {{userOwnsCount}} |
| **评分** | {{rating}} |
| **评分人数** | {{ratingCount}} |
| **星级** | {{stars}} 星 |

## 👤 个人状态

| 项目 | 状态 |
|------|------|
| **是否完成** | {{isOwned}} |
| **是否待办** | {{isTodo}} |
| **进度** | {{progress}}% |
| **是否收藏** | {{favorite}} |
| **是否置顶** | {{pinned}} |
| **已评价** | {{authUserHasReviewed}} |
| **可评价** | {{userCanReview}} |
| **Writeup可见** | {{writeupVisible}} |

## 🎮 游戏信息

| 项目 | 内容 |
|------|------|
| **游戏方式** | {{playMethods}} |
| **显示VIP引导** | {{showGoVip}} |

## 🏷️ 标签

{{tags}}

## 📝 场景描述

{{description}}

## ⚙️ 其他信息

| 项目 | 值 |
|------|-----|
| **生成日期** | {{currentDate}} |
| **生成时间** | {{currentTime}} |
| **退役信息** | {{retires}} |
`;
	}
	
	/**
	 * 根据文件路径获取匹配的模板
	 */
	private async getMatchedTemplate(targetPath: string): Promise<string | null> {
		const templateSettings = this.getTemplateSettings();
		
		// 优先使用类型特定的文件夹规则
		if (templateSettings?.folderTemplateRules && templateSettings.folderTemplateRules.length > 0) {
			const typeSpecificTemplate = await this.matchFolderRules(targetPath, templateSettings.folderTemplateRules);
			if (typeSpecificTemplate) {
				return typeSpecificTemplate;
			}
		}
		
		// 回退到全局文件夹规则
		const settings = this.plugin.settings;
		if (settings.folderTemplateRules && settings.folderTemplateRules.length > 0) {
			return await this.matchFolderRules(targetPath, settings.folderTemplateRules);
		}
		
		return null;
	}
	
	/**
	 * 匹配文件夹规则
	 */
	private async matchFolderRules(targetPath: string, rules: any[]): Promise<string | null> {
		const normalizedPath = targetPath.replace(/\\/g, '/').toLowerCase();
		
		const sortedRules = [...rules]
			.filter(rule => rule.enabled)
			.sort((a, b) => b.priority - a.priority);
		
		for (const rule of sortedRules) {
			const folderPattern = rule.folderPath.replace(/\\/g, '/').toLowerCase();
			
			if (normalizedPath.includes(folderPattern)) {
				// 找到匹配的规则，加载模板
				// 如果规则启用了内置模板
				if (rule.useBuiltInTemplate) {
					// 1. 优先使用内置模板内容（如果有）
					if (rule.templateContent && rule.templateContent.trim() !== '') {
						return rule.templateContent;
					}
					// 2. 尝试使用外部模板文件作为备选
					if (rule.templateFile && rule.templateFile.trim() !== '') {
						const template = await this.loadTemplate(rule.templateFile);
						if (template) {
							return template;
						}
					}
					// 3. 都没有，返回 null 使用默认模板
					return null;
				}
				
				// 如果未启用内置模板，使用外部模板文件
				if (rule.templateFile && rule.templateFile.trim() !== '') {
					const template = await this.loadTemplate(rule.templateFile);
					if (template) {
						return template;
					}
					// 外部模板加载失败，返回 null 使用默认模板
					log.warn(`规则 "${rule.name}" 的外部模板加载失败，将使用默认模板`);
					return null;
				}
				
				// 规则未配置任何模板，返回 null 使用默认模板
				return null;
			}
		}
		
		return null;
	}
	
	/**
	 * 从文件加载模板
	 */
	private async loadTemplate(templatePath: string): Promise<string | null> {
		try {
			const normalizedPath = normalizePath(templatePath);
			const file = this.app.metadataCache.getFirstLinkpathDest(normalizedPath, "");
			
			if (!file) {
				log.error(`模板文件不存在: ${templatePath}`, new Error('File not found'));
				return null;
			}
			
			const content = await this.app.vault.cachedRead(file);
			return content;
		} catch (e) {
			log.error(`加载模板文件失败: ${templatePath}`, e);
			return null;
		}
	}
	
	/**
	 * 填充模板
	 */
	private fillTemplate(template: string, sherlock: HTBSherlock): string {
		let content = template;
		
		// 基本信息
		content = content.replace(/\{\{id\}\}/g, sherlock.id || '');
		content = content.replace(/\{\{title\}\}/g, sherlock.name || '');
		content = content.replace(/\{\{name\}\}/g, sherlock.name || '');
		content = content.replace(/\{\{type\}\}/g, 'Sherlock');
		content = content.replace(/\{\{category\}\}/g, 'Forensics');
		content = content.replace(/\{\{categoryId\}\}/g, sherlock.categoryId?.toString() || '');
		content = content.replace(/\{\{categoryName\}\}/g, sherlock.category || 'DFIR');
		
		// 难度信息
		content = content.replace(/\{\{difficulty\}\}/g, sherlock.difficulty || '');
		content = content.replace(/\{\{difficultyText\}\}/g, sherlock.difficulty || '');
		
		// 评分信息
		content = content.replace(/\{\{rating\}\}/g, sherlock.rating?.toString() || '0');
		content = content.replace(/\{\{score\}\}/g, sherlock.rating?.toFixed(1) || '0.0');
		content = content.replace(/\{\{scoreStar\}\}/g, '⭐'.repeat(Math.round(sherlock.stars || 0)));
		content = content.replace(/\{\{stars\}\}/g, sherlock.stars?.toString() || '0');
		content = content.replace(/\{\{ratingCount\}\}/g, sherlock.ratingCount?.toString() || '0');
		
		// 图片
		content = content.replace(/\{\{imageUrl\}\}/g, sherlock.avatar || '');
		content = content.replace(/\{\{avatar\}\}/g, sherlock.avatar || '');
		
		// 时间信息（UTC+8格式）
		const currentDate = moment().utcOffset(8).format('YYYY-MM-DD HH:mm');
		const currentTime = moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss');
		content = content.replace(/\{\{currentDate\}\}/g, currentDate);
		content = content.replace(/\{\{currentTime\}\}/g, currentTime);
		
		// releaseAt 和 releaseDate 使用相同的值（UTC+8格式）
		const releaseAt = sherlock.releaseDate || (sherlock.release ? moment(sherlock.release).utcOffset(8).format('YYYY-MM-DD HH:mm') : '');
		content = content.replace(/\{\{releaseAt\}\}/g, releaseAt);
		content = content.replace(/\{\{releaseDate\}\}/g, releaseAt);
		content = content.replace(/\{\{datePublished\}\}/g, releaseAt);
		content = content.replace(/\{\{release\}\}/g, releaseAt);
		
		// 制作者信息
		const authors = sherlock.maker?.map(m => `- [${m.name}](https://app.hackthebox.com/profile/${m.id})`).join('\n') || '';
		content = content.replace(/\{\{author\}\}/g, authors);
		content = content.replace(/\{\{maker\}\}/g, authors);
		
		// 积分
		content = content.replace(/\{\{points\}\}/g, sherlock.points?.toString() || '0');
		
		// 统计信息
		content = content.replace(/\{\{solves\}\}/g, sherlock.solves?.toString() || '0');
		content = content.replace(/\{\{userOwnsCount\}\}/g, sherlock.solves?.toString() || '0');
		
		// 状态信息
		content = content.replace(/\{\{state\}\}/g, sherlock.state || (sherlock.retired ? 'retired_free' : 'active'));
		content = content.replace(/\{\{retired\}\}/g, sherlock.retired ? '是' : '否');
		content = content.replace(/\{\{isOwned\}\}/g, sherlock.isCompleted ? '是' : '否');
		content = content.replace(/\{\{isCompleted\}\}/g, sherlock.isCompleted ? '是' : '否');
		content = content.replace(/\{\{completed\}\}/g, sherlock.isCompleted ? '是' : '否');
		content = content.replace(/\{\{solved\}\}/g, sherlock.isSolved ? '是' : '否');
		content = content.replace(/\{\{isTodo\}\}/g, sherlock.isTodo ? '是' : '否');
		
		// 进度和状态
		content = content.replace(/\{\{progress\}\}/g, sherlock.progress?.toString() || '0');
		content = content.replace(/\{\{authUserHasReviewed\}\}/g, sherlock.authUserHasReviewed ? '是' : '否');
		content = content.replace(/\{\{userCanReview\}\}/g, sherlock.userCanReview ? '是' : '否');
		content = content.replace(/\{\{writeupVisible\}\}/g, sherlock.writeupVisible ? '是' : '否');
		content = content.replace(/\{\{showGoVip\}\}/g, sherlock.showGoVip ? '是' : '否');
		content = content.replace(/\{\{favorite\}\}/g, sherlock.favorite ? '是' : '否');
		content = content.replace(/\{\{pinned\}\}/g, sherlock.pinned ? '是' : '否');
		
		// 场景描述
		content = content.replace(/\{\{scenario\}\}/g, sherlock.scenario || sherlock.description || '');
		content = content.replace(/\{\{description\}\}/g, sherlock.description || '');
		
		// 标签
		const tagsStr = sherlock.tags?.join(', ') || '';
		content = content.replace(/\{\{tags\}\}/g, tagsStr);
		
		// 游戏方式
		const playMethods = sherlock.playMethods?.join(', ') || '';
		content = content.replace(/\{\{playMethods\}\}/g, playMethods);
		
		// 退役信息（retires）
		content = content.replace(/\{\{retires\}\}/g, sherlock.retires || '');
		content = content.replace(/\{\{retiresName\}\}/g, '');
		content = content.replace(/\{\{retiresDifficulty\}\}/g, '');
		content = content.replace(/\{\{retiresAvatar\}\}/g, '');
		
		// URL
		const url = `https://app.hackthebox.com/sherlocks/${sherlock.id}`;
		content = content.replace(/\{\{url\}\}/g, url);
		
		return content;
	}
	
	/**
	 * 从搜索结果构建 Sherlock 对象
	 * 搜索结果包含完整的基本信息（name, difficulty, category 等）
	 */
	private parseFromSearchResult(searchResult: HTBSherlockSearchResult): HTBSherlock {
		const debug = this.plugin.settings.debug;
		
		if (debug) {
			console.log('[HTBSherlockLoadHandler] parseFromSearchResult:', searchResult);
		}
		
		const sherlock: HTBSherlock = {
			id: searchResult.id.toString(),
			name: searchResult.name || '',
			category: searchResult.category_name || 'DFIR',
			categoryId: (searchResult as any).category_id,
			difficulty: searchResult.difficulty || '',
			difficultyNum: this.parseDifficulty(searchResult.difficulty),
			rating: searchResult.rating || 0,
			stars: Math.round(searchResult.rating || 0),
			ratingCount: searchResult.rating_count || 0,
			avatar: searchResult.avatar || '',
			avatarThumb: searchResult.avatar || '',
			release: searchResult.release_date ? new Date(searchResult.release_date) : new Date(),
			releaseDate: searchResult.release_date ? moment(searchResult.release_date).utcOffset(8).format('YYYY-MM-DD HH:mm') : '',
			state: searchResult.state || '',
			retired: searchResult.state !== 'active',
			active: searchResult.state === 'active',
			maker: [],
			tags: [],
			labels: [],
			points: 0,
			staticPoints: 0,
			isCompleted: searchResult.is_owned || false,
			isTodo: false,
			isSolved: searchResult.is_owned || false,
			progress: (searchResult as any).progress || 0,
			solves: searchResult.solves || 0,
			downloads: 0,
			hasDownload: (searchResult as any).play_methods?.includes('download') || false,
			playMethods: (searchResult as any).play_methods || [],
			description: '',
			scenario: '',
			likes: 0,
			dislikes: 0,
			recommended: 0,
			favorite: (searchResult as any).favorite || false,
			pinned: (searchResult as any).pinned || false,
			writeupVisible: false,
			authUserHasReviewed: (searchResult as any).auth_user_has_reviewed || false,
			userCanReview: true,
			showGoVip: false,
			retires: (searchResult as any).retires || null
		};
		
		// URL
		sherlock.url = `https://app.hackthebox.com/sherlocks/${sherlock.id}`;
		
		if (debug) {
			console.log('[HTBSherlockLoadHandler] parseFromSearchResult 解析后:', {
				id: sherlock.id,
				name: sherlock.name,
				difficulty: sherlock.difficulty,
				category: sherlock.category,
				releaseDate: sherlock.releaseDate,
				solves: sherlock.solves
			});
		}
		
		return sherlock;
	}
	
	/**
	 * 从 API 响应解析数据
	 */
	/**
	 * 解析详情 API 返回的 Sherlock 数据
	 * 基于真实 API: GET /api/v4/sherlocks/:id/info
	 */
	private parseFromApi(data: any): HTBSherlock {
		const debug = this.plugin.settings.debug;
		
		if (debug) {
			console.log('[HTBSherlockLoadHandler] parseFromApi 原始数据:', {
				id: data.id,
				name: data.name,
				difficulty: data.difficulty,
				category_name: data.category_name,
				release_at: data.release_at,
				user_owns_count: data.user_owns_count,
				tags: data.tags,
				rating: data.rating
			});
		}
		
		const sherlock: HTBSherlock = {
			id: data.id?.toString() || '',
			name: data.name || '',
			category: data.category_name || 'DFIR',
			categoryId: data.category_id,
			difficulty: data.difficulty || '',
			difficultyNum: this.parseDifficulty(data.difficulty),
			rating: data.rating || 0,
			stars: Math.round(data.rating || 0),
			ratingCount: data.rating_count || 0,
			avatar: data.avatar || '',
			avatarThumb: data.avatar || '',
			release: data.release_at ? new Date(data.release_at) : new Date(),
			releaseDate: data.release_at ? moment(data.release_at).utcOffset(8).format('YYYY-MM-DD HH:mm') : '',
			state: data.state || '',
			retired: data.retired === true || data.state === 'retired_free',
			active: data.state === 'active',
			maker: [],  // /info 接口不返回 maker 信息
			tags: [],
			points: 0,  // /info 接口不返回 points
			staticPoints: 0,
			isCompleted: false,
			isTodo: data.isTodo || false,
			isSolved: false,
			progress: 0,
			solves: data.user_owns_count || 0,
			downloads: 0,
			hasDownload: data.play_methods?.includes('download') || false,
			playMethods: data.play_methods || [],
			description: data.description || '',  // /info 接口返回 description
			scenario: data.description || '',     // 使用 description 作为 scenario
			likes: 0,
			dislikes: 0,
			recommended: 0,
			favorite: data.favorite || false,
			pinned: false,
			writeupVisible: data.writeup_visible || false,
			authUserHasReviewed: data.auth_user_has_reviewed || false,
			userCanReview: data.user_can_review || false,
			showGoVip: data.show_go_vip || false,
			retires: null
		};
		
		// 解析标签
		if (data.tags && Array.isArray(data.tags)) {
			sherlock.tags = data.tags.map((tag: any) => tag.name || '');
			sherlock.labels = sherlock.tags;
		}
		
		// URL
		sherlock.url = `https://app.hackthebox.com/sherlocks/${sherlock.id}`;
		
		if (debug) {
			console.log('[HTBSherlockLoadHandler] parseFromApi 解析后:', {
				id: sherlock.id,
				name: sherlock.name,
				difficulty: sherlock.difficulty,
				category: sherlock.category,
				releaseDate: sherlock.releaseDate,
				solves: sherlock.solves,
				tags: sherlock.tags
			});
		}
		
		return sherlock;
	}
	
	/**
	 * 获取 Sherlock 列表（支持分页）
	 * API: GET /api/v4/sherlocks?page=1
	 */
	async getSherlockList(retired: boolean = false, page: number = 1): Promise<HTBSherlock[]> {
		const debug = this.plugin.settings.debug;
		if (debug) {
			console.log(`HTB Sherlock 处理器: 获取 Sherlock 列表 (retired: ${retired}, page: ${page})`);
		}
		
		try {
			const headers = {
				'Authorization': `Bearer ${this.plugin.settings.apiToken}`
			};
			
			// 构建 API URL
			const apiUrl = HTBHttpUtil.buildApiUrl(HTB_API_ENDPOINTS.SHERLOCK_LIST);
			const queryString = HTBHttpUtil.buildQueryString({page});
			const fullUrl = apiUrl + queryString;
			
			if (debug) {
				console.log('HTB Sherlock 列表 API URL:', fullUrl);
			}
			
			const response = await HTBHttpUtil.get(fullUrl, headers, debug);
			
			if (debug) {
				console.log('HTB Sherlock 列表 API 响应类型:', typeof response);
				console.log('HTB Sherlock 列表 API 响应数据:', JSON.stringify(response).substring(0, 500));
			}
			
			// API 返回格式: { data: [...], links: {...}, meta: {...} }
			if (response && response.data && Array.isArray(response.data)) {
				const sherlocks = response.data.map((item: any) => this.parseSherlockFromListApi(item));
				
				if (debug) {
					console.log(`HTB Sherlock 处理器: 获取到 ${sherlocks.length} 个 Sherlock`);
					if (response.meta) {
						console.log(`分页信息: 当前页 ${response.meta.current_page}/${response.meta.last_page}, 总计 ${response.meta.total} 个`);
					}
				}
				
				return sherlocks;
			}
			
			return [];
		} catch (e) {
			log.error('获取 HTB Sherlock 列表失败', e);
			throw e;
		}
	}
	
	/**
	 * 获取所有 Sherlock（优先使用缓存，无缓存时才调用 API）
	 */
	async getAllSherlocks(retired: boolean = false): Promise<HTBSherlock[]> {
		const debug = this.plugin.settings.debug;
		
		// 1. 优先从缓存获取
		const cache = this.plugin.settings.sherlockCache || [];
		if (cache.length > 0) {
			if (debug) {
				console.log(`HTB Sherlock 处理器: 从缓存返回 ${cache.length} 个 Sherlock`);
			}
			// 将缓存项转换为完整的 HTBSherlock 对象
			return cache.map((item: HTBSherlockSearchResult) => this.parseFromSearchResult(item));
		}
		
		// 2. 缓存为空，从 API 获取所有 Sherlock
		if (debug) {
			console.log('HTB Sherlock 处理器: 缓存为空，从 API 获取所有 Sherlock');
		}
		
		const allSherlocks: HTBSherlock[] = [];
		let currentPage = 1;
		let hasMorePages = true;
		
		try {
			while (hasMorePages) {
				const headers = {
					'Authorization': `Bearer ${this.plugin.settings.apiToken}`
				};
				
				const apiUrl = HTBHttpUtil.buildApiUrl(HTB_API_ENDPOINTS.SHERLOCK_LIST);
				const queryString = HTBHttpUtil.buildQueryString({page: currentPage});
				const fullUrl = apiUrl + queryString;
				
				const response = await HTBHttpUtil.get(fullUrl, headers, debug);
				
				if (response && response.data && Array.isArray(response.data)) {
					const sherlocks = response.data.map((item: any) => this.parseSherlockFromListApi(item));
					allSherlocks.push(...sherlocks);
					
					// 检查是否还有更多页
					if (response.meta && response.meta.current_page < response.meta.last_page) {
						currentPage++;
					} else {
						hasMorePages = false;
					}
				} else {
					hasMorePages = false;
				}
			}
			
			if (debug) {
				console.log(`HTB Sherlock 处理器: 共获取 ${allSherlocks.length} 个 Sherlock`);
			}
			
			// 3. 更新缓存
			const cacheItems: HTBSherlockSearchResult[] = allSherlocks.map(s => ({
				id: parseInt(s.id),
				name: s.name,
				avatar: s.avatar || '',
				difficulty: s.difficulty || '',
				category_name: s.category || '',
				release_date: s.releaseDate || '',
				is_owned: s.isCompleted || false,
				state: s.active ? 'active' : 'retired',
				rating: s.rating || 0,
				rating_count: s.ratingCount || 0,
				solves: s.solves || 0
			}));
			
			this.plugin.settings.sherlockCache = cacheItems;
			await this.plugin.saveSettings();
			
			if (debug) {
				console.log(`HTB Sherlock 处理器: 已更新缓存，共 ${cacheItems.length} 个 Sherlock`);
			}
			
			return allSherlocks;
		} catch (e) {
			log.error('获取所有 HTB Sherlock 失败', e);
			throw e;
		}
	}
	
	/**
	 * 解析列表 API 返回的 Sherlock 数据
	 * 列表 API 返回的字段比详情 API 多，包含完整信息
	 */
	private parseSherlockFromListApi(data: any): HTBSherlock {
		const sherlock: HTBSherlock = {
			id: data.id.toString(),
			name: data.name || 'Unknown',
			avatar: data.avatar || '',
			category: data.category_name || 'Unknown',
			difficulty: data.difficulty || 'Unknown',
			difficultyNum: this.parseDifficulty(data.difficulty),
			rating: data.rating || 0,
			stars: Math.round(data.rating || 0),
			release: data.release_date ? new Date(data.release_date) : new Date(),
			releaseDate: data.release_date ? moment(data.release_date).utcOffset(8).format('YYYY-MM-DD HH:mm') : '',
			retired: data.state !== 'active',
			active: data.state === 'active',
			maker: [],  // 列表 API 不返回 maker 信息
			tags: [],   // 列表 API 不返回 tags 信息
			points: data.solves || 0,
			staticPoints: 0,
			isCompleted: data.is_owned || false,
			isSolved: data.is_owned || false,
			solves: data.solves || 0,
			ratingCount: data.rating_count || 0,
			url: `https://app.hackthebox.com/sherlocks/${data.id}`
		};
		
		return sherlock;
	}
	
	/**
	 * 解析难度字符串为数值
	 */
	private parseDifficulty(difficulty: string): number {
		const difficultyMap: Record<string, number> = {
			'Very Easy': 10,
			'Easy': 20,
			'Medium': 40,
			'Hard': 60,
			'Insane': 90
		};
		return difficultyMap[difficulty] || 0;
	}
}

