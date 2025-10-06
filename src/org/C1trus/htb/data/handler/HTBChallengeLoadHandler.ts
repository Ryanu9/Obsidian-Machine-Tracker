import {HTBChallenge, HTBChallengeApiResponse} from "../model/HTBChallenge";
import {HTBHttpUtil} from "../../../utils/HTBHttpUtil";
import {HTB_API_ENDPOINTS} from "../../../constant/HTB";
import {log} from "../../../utils/Logutil";
import {App, moment, Notice, normalizePath} from "obsidian";
import HTBPlugin from "../../../main";

/**
 * HTB Challenge 分类 ID 到名称的映射
 */
const CHALLENGE_CATEGORIES: Record<number, string> = {
	1: 'Reversing',
	2: 'Crypto',
	3: 'Stego',
	4: 'Pwn',
	5: 'Web',
	6: 'Misc',
	7: 'Forensics',
	8: 'Mobile',
	9: 'OSINT',
	10: 'Hardware',
	11: 'Fullpwn',
	12: 'Blockchain'
};

/**
 * HTB Challenge 数据加载处理器
 */
export default class HTBChallengeLoadHandler {
	private app: App;
	private plugin: HTBPlugin;
	
	constructor(app: App, plugin: HTBPlugin) {
		this.app = app;
		this.plugin = plugin;
	}
	
	/**
	 * 根据分类 ID 获取分类名称
	 */
	private getCategoryName(categoryId: number | undefined, fallbackName?: string): string {
		if (categoryId && CHALLENGE_CATEGORIES[categoryId]) {
			return CHALLENGE_CATEGORIES[categoryId];
		}
		return fallbackName || 'Unknown';
	}
	
	/**
	 * 加载 Challenge 信息
	 * @param challengeInput Challenge ID 或名称
	 */
	async loadChallenge(challengeInput: string): Promise<HTBChallenge | null> {
		const debug = this.plugin.settings.debug;
		if (debug) {
			console.log(`HTB Challenge 处理器: 开始加载 Challenge 信息 ${challengeInput}`);
		}
		
		try {
			// 如果输入不是纯数字，先搜索获取 ID
			let challengeId = challengeInput;
			if (!/^\d+$/.test(challengeInput)) {
				if (debug) {
					console.log(`HTB Challenge 处理器: 输入不是纯数字，尝试搜索 Challenge`);
				}
				const searchResults = await this.searchChallenges(challengeInput);
				if (searchResults.length === 0) {
					new Notice(`未找到 Challenge: ${challengeInput}`);
					return null;
				}
				// 精确匹配
				const exactMatch = searchResults.find(c => c.name.toLowerCase() === challengeInput.toLowerCase());
				if (exactMatch) {
					challengeId = exactMatch.id;
				} else {
					challengeId = searchResults[0].id;
				}
				if (debug) {
					console.log(`HTB Challenge 处理器: 找到 Challenge ID: ${challengeId}`);
				}
			}
			
			// 构建认证头
			const headers = {
				'Authorization': `Bearer ${this.plugin.settings.apiToken}`
			};
			
		// 使用 HTB API 获取 Challenge 信息
		const apiUrl = HTBHttpUtil.buildApiUrl(HTB_API_ENDPOINTS.CHALLENGE_INFO, {id: challengeId});
		const response: any = await HTBHttpUtil.get(apiUrl, headers, debug);
		
		// API 返回格式：{ "challenge": {...} } 而不是 { "info": {...} }
		if (response && response.challenge) {
			const challenge = this.parseFromApi(response.challenge);
			if (debug) {
				console.log(`HTB Challenge 处理器: 成功获取 Challenge 信息 ${challenge.name}`);
			}
			return challenge;
		}
		
		return null;
		} catch (e) {
			log.error(`获取 HTB Challenge 信息失败: ${challengeInput}`, e);
			new Notice(`获取 Challenge 失败: ${e.message}`);
			return null;
		}
	}
	
	/**
	 * 获取所有 Challenge（优先使用缓存，无缓存时才调用 API）
	 */
	async getAllChallenges(): Promise<HTBChallenge[]> {
		const debug = this.plugin.settings.debug;
		
		// 1. 优先从缓存获取
		const cache = this.plugin.settings.challengeCache || [];
		if (cache.length > 0) {
			if (debug) {
				console.log(`HTB Challenge 处理器: 从缓存返回 ${cache.length} 个 Challenge`);
			}
			// 将缓存项转换为完整的 HTBChallenge 对象
			return cache.map((item: any) => this.parseFromApi(item));
		}
		
		// 2. 缓存为空，从 API 获取所有 Challenge
		if (debug) {
			console.log('HTB Challenge 处理器: 缓存为空，从 API 获取所有 Challenge');
		}
		
		try {
			const headers = {
				'Authorization': `Bearer ${this.plugin.settings.apiToken}`
			};
			
			// 使用两个 API 获取所有 Challenge：活跃的和已退役的
			const apiUrl = HTBHttpUtil.buildApiUrl(HTB_API_ENDPOINTS.CHALLENGE_LIST);
			const retiredApiUrl = HTBHttpUtil.buildApiUrl(HTB_API_ENDPOINTS.CHALLENGE_LIST_RETIRED);
			
			// 并行请求两个接口
			const [response, retiredResponse] = await Promise.all([
				HTBHttpUtil.get(apiUrl, headers, debug),
				HTBHttpUtil.get(retiredApiUrl, headers, debug)
			]);
			
			// 打印响应数据结构以便调试
			if (debug) {
				console.log('HTB Challenge List API 响应类型:', typeof response);
				console.log('HTB Challenge List Retired API 响应类型:', typeof retiredResponse);
			}
			
			// 解析两个响应数据
			let items: any[] = [];
			
			// 解析活跃 Challenge
			if (response) {
				if (Array.isArray(response)) {
					items = response;
				} else if (response.data && Array.isArray(response.data)) {
					items = response.data;
				} else if (response.challenges && Array.isArray(response.challenges)) {
					items = response.challenges;
				}
			}
			
			// 解析已退役 Challenge
			if (retiredResponse) {
				let retiredItems: any[] = [];
				if (Array.isArray(retiredResponse)) {
					retiredItems = retiredResponse;
				} else if (retiredResponse.data && Array.isArray(retiredResponse.data)) {
					retiredItems = retiredResponse.data;
				} else if (retiredResponse.challenges && Array.isArray(retiredResponse.challenges)) {
					retiredItems = retiredResponse.challenges;
				}
				// 合并已退役 Challenge
				items = items.concat(retiredItems);
			}
			
			if (items.length > 0) {
				// 保存到缓存
				this.plugin.settings.challengeCache = items;
				this.plugin.settings.challengeCacheTime = Date.now();
				await this.plugin.saveSettings();
				
				if (debug) {
					console.log(`HTB Challenge 处理器: 已缓存 ${items.length} 个 Challenge（活跃 + 已退役）`);
				}
				
				// 转换为 HTBChallenge 对象
				const allChallenges = items.map((item: any) => this.parseFromApi(item));
				return allChallenges;
			}
			
			return [];
		} catch (e) {
			log.error('获取 HTB Challenge 列表失败', e);
			throw e;
		}
	}
	
	/**
	 * 强制刷新缓存（从 API 重新获取所有 Challenge）
	 */
	async refreshCache(): Promise<HTBChallenge[]> {
		const debug = this.plugin.settings.debug;
		
		if (debug) {
			console.log('HTB Challenge 处理器: 强制刷新缓存');
		}
		
		try {
			const headers = {
				'Authorization': `Bearer ${this.plugin.settings.apiToken}`
			};
			
			// 使用两个 API 获取所有 Challenge：活跃的和已退役的
			const apiUrl = HTBHttpUtil.buildApiUrl(HTB_API_ENDPOINTS.CHALLENGE_LIST);
			const retiredApiUrl = HTBHttpUtil.buildApiUrl(HTB_API_ENDPOINTS.CHALLENGE_LIST_RETIRED);
			
			// 并行请求两个接口
			const [response, retiredResponse] = await Promise.all([
				HTBHttpUtil.get(apiUrl, headers, debug),
				HTBHttpUtil.get(retiredApiUrl, headers, debug)
			]);
			
			// 解析两个响应数据
			let items: any[] = [];
			
			// 解析活跃 Challenge
			if (response) {
				if (Array.isArray(response)) {
					items = response;
				} else if (response.data && Array.isArray(response.data)) {
					items = response.data;
				} else if (response.challenges && Array.isArray(response.challenges)) {
					items = response.challenges;
				}
			}
			
			// 解析已退役 Challenge
			if (retiredResponse) {
				let retiredItems: any[] = [];
				if (Array.isArray(retiredResponse)) {
					retiredItems = retiredResponse;
				} else if (retiredResponse.data && Array.isArray(retiredResponse.data)) {
					retiredItems = retiredResponse.data;
				} else if (retiredResponse.challenges && Array.isArray(retiredResponse.challenges)) {
					retiredItems = retiredResponse.challenges;
				}
				// 合并已退役 Challenge
				items = items.concat(retiredItems);
			}
			
			if (items.length > 0) {
				// 保存到缓存
				this.plugin.settings.challengeCache = items;
				this.plugin.settings.challengeCacheTime = Date.now();
				await this.plugin.saveSettings();
				
				if (debug) {
					console.log(`HTB Challenge 处理器: 已刷新缓存，共 ${items.length} 个 Challenge（活跃 + 已退役）`);
				}
				
				// 转换为 HTBChallenge 对象
				const allChallenges = items.map((item: any) => this.parseFromApi(item));
				return allChallenges;
			}
			
			return [];
		} catch (e) {
			log.error('刷新 HTB Challenge 缓存失败', e);
			throw e;
		}
	}
	
	/**
	 * 搜索 Challenge（使用缓存）
	 * @param query 搜索关键词
	 */
	async searchChallenges(query: string): Promise<HTBChallenge[]> {
		const debug = this.plugin.settings.debug;
		if (debug) {
			console.log(`HTB Challenge 处理器: 搜索 Challenge "${query}"`);
		}
		
		try {
			// 获取所有 Challenge（优先使用缓存）
			const allChallenges = await this.getAllChallenges();
			
			if (debug) {
				console.log(`HTB Challenge 处理器: 解析到 ${allChallenges.length} 个 Challenge`);
				if (allChallenges.length > 0) {
					console.log('第一个 Challenge 示例:', JSON.stringify(allChallenges[0]).substring(0, 300));
				}
			}
			
			// 本地过滤匹配的 Challenge
			const queryLower = query.toLowerCase();
			const filteredChallenges = allChallenges.filter((challenge: HTBChallenge) => {
				const nameMatch = challenge.name && challenge.name.toLowerCase().includes(queryLower);
				const idMatch = challenge.id && challenge.id.toString().includes(query);
				const categoryMatch = challenge.category && challenge.category.toLowerCase().includes(queryLower);
				
				if (debug && nameMatch) {
					console.log(`匹配到 Challenge: ${challenge.name} (ID: ${challenge.id})`);
				}
				
				return nameMatch || idMatch || categoryMatch;
			});
			
			if (debug) {
				console.log(`HTB Challenge 处理器: 搜索到 ${filteredChallenges.length} 个匹配的 Challenge（共 ${allChallenges.length} 个）`);
			}
			return filteredChallenges;
		} catch (e) {
			log.error(`搜索 HTB Challenge 失败: ${query}`, e);
			throw e;
		}
	}
	
	/**
	 * 生成内容
	 * 优先级：文件夹专属模板 > 默认模板
	 */
	async generateContent(challenge: HTBChallenge, targetPath: string): Promise<string> {
		let template: string;
		
		// 1. 尝试匹配文件夹专属模板规则
		const matchedTemplate = await this.getMatchedTemplate(targetPath);
		if (matchedTemplate) {
			template = matchedTemplate;
		} else {
			// 2. 使用默认模板
			template = await this.getDefaultTemplate();
		}
		
		return this.fillTemplate(template, challenge);
	}
	
	/**
	 * 获取类型特定的模板配置
	 * 优先使用新的 challengeTemplate 配置，如果不存在则回退到旧配置以保持兼容性
	 */
	private getTemplateSettings() {
		if (this.plugin.settings.challengeTemplate) {
			return this.plugin.settings.challengeTemplate;
		}
		// 回退到旧版兼容配置
		return {
			defaultDataFilePath: this.plugin.settings.defaultDataFilePath,
			defaultFileNameTemplate: this.plugin.settings.defaultFileNameTemplate,
			defaultAttachmentPath: this.plugin.settings.defaultAttachmentPath,
			useDefaultBuiltInTemplate: this.plugin.settings.useDefaultBuiltInTemplate,
			defaultTemplateFile: this.plugin.settings.defaultTemplateFile,
			defaultTemplateContent: this.plugin.settings.defaultTemplateContent,
			folderTemplateRules: this.plugin.settings.folderTemplateRules,
			enableFolderTemplates: this.plugin.settings.enableFolderTemplates
		};
	}

	/**
	 * 获取默认模板
	 * 优先级：defaultTemplateContent > defaultTemplateFile > 内置模板
	 */
	private async getDefaultTemplate(): Promise<string> {
		const settings = this.getTemplateSettings();
		
		// 如果启用了内置默认模板
		if (settings.useDefaultBuiltInTemplate) {
			// 1. 如果设置了默认模板内容，优先使用
			if (settings.defaultTemplateContent && settings.defaultTemplateContent.trim() !== '') {
				return settings.defaultTemplateContent;
			}
			
			// 2. 使用内置默认模板（Challenge 专用）
			return this.getDefaultChallengeTemplate();
		}
		
		// 如果未启用内置模板，仅使用外部模板文件
		if (settings.defaultTemplateFile && settings.defaultTemplateFile.trim() !== '') {
			const fileTemplate = await this.loadTemplate(settings.defaultTemplateFile);
			if (fileTemplate) {
				return fileTemplate;
			}
		}
		
		// 如果外部文件也没有，回退到内置模板
		return this.getDefaultChallengeTemplate();
	}
	
	/**
	 * 获取内置 Challenge 默认模板
	 */
	private getDefaultChallengeTemplate(): string {
		return `---
created: {{currentTime}}
tags:
  - HTB
  - Challenge
  - {{category}}
title: "{{title}}"
type: Challenge
category: {{category}}
difficulty: {{difficulty}}
datePublished: {{datePublished}}
image: {{imageUrl}}
author:
{{author}}
comment: 
aliases:
score: {{score}}
scoreStar: {{scoreStar}}
solves: {{solves}}
updated: {{currentTime}}
locked: false
---

![]({{imageUrl}})

## Challenge 信息

- **类型**: Challenge
- **分类**: {{category}}
- **难度**: {{difficulty}}
- **积分**: {{points}}
- **解题数**: {{solves}}
- **发布日期**: {{datePublished}}

## 制作者

{{author}}

## 描述

{{description}}

## 解题思路

<!-- 在这里记录你的解题过程 -->

## Flag

\`\`\`
<!-- flag 内容 -->
\`\`\`

## 参考资料

<!-- 记录参考的文章、工具等 -->
`;
	}
	
	/**
	 * 根据文件路径获取匹配的模板
	 */
	private async getMatchedTemplate(targetPath: string): Promise<string | null> {
		const settings = this.getTemplateSettings();
		
		// 如果未启用文件夹模板功能，直接返回
		if (!settings.enableFolderTemplates) {
			return null;
		}
		
		// 没有配置规则，返回 null
		if (!settings.folderTemplateRules || settings.folderTemplateRules.length === 0) {
			return null;
		}
		
		// 标准化路径
		const normalizedPath = targetPath.replace(/\\/g, '/').toLowerCase();
		
		// 按优先级排序（从高到低）
		const sortedRules = [...settings.folderTemplateRules]
			.filter(rule => rule.enabled)  // 只使用启用的规则
			.sort((a, b) => b.priority - a.priority);
		
		// 遍历规则，找到第一个匹配的
		for (const rule of sortedRules) {
			const folderPattern = rule.folderPath.replace(/\\/g, '/').toLowerCase();
			
			// 简单的路径匹配（包含即可）
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
	private fillTemplate(template: string, challenge: HTBChallenge): string {
		let content = template;
		
		// 基本信息
		content = content.replace(/\{\{id\}\}/g, challenge.id || '');
		content = content.replace(/\{\{title\}\}/g, challenge.name || '');
		content = content.replace(/\{\{name\}\}/g, challenge.name || '');
		content = content.replace(/\{\{type\}\}/g, 'Challenge');
		content = content.replace(/\{\{category\}\}/g, challenge.category || '');
		content = content.replace(/\{\{categoryName\}\}/g, challenge.category || '');
		
		// 难度信息
		content = content.replace(/\{\{difficulty\}\}/g, challenge.difficulty || '');
		content = content.replace(/\{\{difficultyText\}\}/g, challenge.difficulty || '');
		content = content.replace(/\{\{difficultyNum\}\}/g, challenge.difficultyNum?.toString() || '0');
		content = content.replace(/\{\{avgDifficulty\}\}/g, challenge.difficultyNum?.toString() || '0');
		
		// 评分信息
		content = content.replace(/\{\{rating\}\}/g, challenge.rating?.toString() || '0');
		content = content.replace(/\{\{score\}\}/g, challenge.rating?.toFixed(1) || '0.0');
		content = content.replace(/\{\{scoreStar\}\}/g, '⭐'.repeat(Math.round(challenge.stars || 0)));
		content = content.replace(/\{\{stars\}\}/g, challenge.stars?.toString() || '0');
		
		// 图片
		content = content.replace(/\{\{imageUrl\}\}/g, challenge.avatar || '');
		content = content.replace(/\{\{avatar\}\}/g, challenge.avatar || '');
		content = content.replace(/\{\{image\}\}/g, challenge.avatar || '');
		
		// 时间信息（UTC+8格式）
		const currentDate = moment().utcOffset(8).format('YYYY-MM-DD HH:mm');
		const currentTime = moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss');
		content = content.replace(/\{\{currentDate\}\}/g, currentDate);
		content = content.replace(/\{\{currentTime\}\}/g, currentTime);
		
		// 使用预先格式化好的 releaseDate（已转换为 UTC+8）
		const releaseDate = challenge.releaseDate || (challenge.release ? moment(challenge.release).utcOffset(8).format('YYYY-MM-DD HH:mm') : '');
		content = content.replace(/\{\{datePublished\}\}/g, releaseDate);
		content = content.replace(/\{\{release\}\}/g, releaseDate);
		content = content.replace(/\{\{releaseDate\}\}/g, releaseDate);
		
		// 完成时间（使用 authUserSolveTime 字段，已在 parseFromApi 中格式化为 UTC+8）
		const authUserSolveTime = challenge.authUserSolveTime || '';
		content = content.replace(/\{\{authUserSolveTime\}\}/g, authUserSolveTime);
		
		// 制作者信息（纯文本格式，只显示名字）
		const authors = challenge.maker?.map(m => m.name).join(', ') || '';
		content = content.replace(/\{\{author\}\}/g, authors);
		content = content.replace(/\{\{maker\}\}/g, authors);
		
		// 单个制作者字段（第一个制作者）
		const firstMaker = challenge.maker && challenge.maker.length > 0 ? challenge.maker[0] : null;
		content = content.replace(/\{\{creatorName\}\}/g, firstMaker?.name || '');
		content = content.replace(/\{\{creatorId\}\}/g, firstMaker?.id || '');
		content = content.replace(/\{\{creatorAvatar\}\}/g, firstMaker?.avatar || '');
		content = content.replace(/\{\{isRespected\}\}/g, firstMaker?.isRespected ? 'true' : 'false');
		
		// 第二制作者字段
		const secondMaker = challenge.creator2;
		content = content.replace(/\{\{creator2Name\}\}/g, secondMaker?.name || '');
		content = content.replace(/\{\{creator2Id\}\}/g, secondMaker?.id || '');
		content = content.replace(/\{\{creator2Avatar\}\}/g, secondMaker?.avatar || '');
		content = content.replace(/\{\{isRespected2\}\}/g, secondMaker?.isRespected ? 'true' : 'false');
		
	// 首杀信息
	const firstBlood = challenge.firstBlood;
	content = content.replace(/\{\{firstBloodUser\}\}/g, firstBlood?.user || '');
	content = content.replace(/\{\{firstBloodUserId\}\}/g, firstBlood?.userId || '');
	content = content.replace(/\{\{firstBloodUserAvatar\}\}/g, firstBlood?.userAvatar || '');
	const firstBloodTimeStr = firstBlood?.time ? (typeof firstBlood.time === 'string' ? firstBlood.time : firstBlood.time.toString()) : '';
	content = content.replace(/\{\{firstBloodTime\}\}/g, firstBloodTimeStr);
		
		// 描述
		content = content.replace(/\{\{description\}\}/g, challenge.description || '');
		
		// 下载信息
		content = content.replace(/\{\{download\}\}/g, challenge.hasDownload ? 'true' : 'false');
		content = content.replace(/\{\{sha256\}\}/g, challenge.sha256 || '');
		content = content.replace(/\{\{fileName\}\}/g, challenge.fileName || '');
		content = content.replace(/\{\{fileSize\}\}/g, challenge.fileSize || '');
		
		// Docker 信息
		content = content.replace(/\{\{docker\}\}/g, challenge.docker ? 'true' : 'false');
		content = content.replace(/\{\{dockerIp\}\}/g, challenge.dockerIp || '');
		content = content.replace(/\{\{dockerPort\}\}/g, challenge.dockerPorts || '');
		content = content.replace(/\{\{dockerPorts\}\}/g, challenge.dockerPorts || '');
		content = content.replace(/\{\{dockerStatus\}\}/g, challenge.dockerStatus || '');
		
		// 播放信息（play_info）
		content = content.replace(/\{\{playInfoStatus\}\}/g, challenge.playInfoStatus || '');
		content = content.replace(/\{\{playInfoExpiresAt\}\}/g, challenge.playInfoExpiresAt || '');
		content = content.replace(/\{\{playInfoIp\}\}/g, challenge.playInfoIp || '');
		content = content.replace(/\{\{playInfoPorts\}\}/g, challenge.playInfoPorts || '');
		
		// 积分
		content = content.replace(/\{\{points\}\}/g, challenge.points?.toString() || '0');
		content = content.replace(/\{\{staticPoints\}\}/g, challenge.staticPoints?.toString() || '0');
		
		// 统计信息
		content = content.replace(/\{\{solves\}\}/g, challenge.solves?.toString() || '0');
		content = content.replace(/\{\{likes\}\}/g, challenge.likes?.toString() || '0');
		content = content.replace(/\{\{dislikes\}\}/g, challenge.dislikes?.toString() || '0');
		content = content.replace(/\{\{likeByAuthUser\}\}/g, challenge.likeByAuthUser ? 'true' : 'false');
		content = content.replace(/\{\{dislikeByAuthUser\}\}/g, challenge.dislikeByAuthUser ? 'true' : 'false');
		content = content.replace(/\{\{reviewsCount\}\}/g, challenge.reviewsCount?.toString() || '0');
		
		// 状态
		content = content.replace(/\{\{retired\}\}/g, challenge.retired ? '已退役' : '活跃中');
		content = content.replace(/\{\{retiredStatus\}\}/g, challenge.retired ? 'true' : 'false');
		content = content.replace(/\{\{state\}\}/g, challenge.state || '');
		content = content.replace(/\{\{released\}\}/g, challenge.released?.toString() || '');
		content = content.replace(/\{\{isCompleted\}\}/g, challenge.isCompleted ? 'true' : 'false');
		content = content.replace(/\{\{solved\}\}/g, challenge.isSolved ? '是' : '否');
		content = content.replace(/\{\{authUserSolve\}\}/g, challenge.authUserSolve ? 'true' : 'false');
		content = content.replace(/\{\{isActive\}\}/g, challenge.active ? 'true' : 'false');
		content = content.replace(/\{\{isTodo\}\}/g, challenge.isTodo ? 'true' : 'false');
		
		// 收藏状态（默认为 false）
		content = content.replace(/\{\{favorite\}\}/g, 'false');
		
		// 推荐
		content = content.replace(/\{\{recommended\}\}/g, challenge.recommended?.toString() || '0');
		
		// 其他布尔字段
		content = content.replace(/\{\{authUserHasReviewed\}\}/g, challenge.authUserHasReviewed ? 'true' : 'false');
		content = content.replace(/\{\{userCanReview\}\}/g, challenge.userCanReview ? 'true' : 'false');
		content = content.replace(/\{\{canAccessWalkthrough\}\}/g, challenge.canAccessWalkthrough ? 'true' : 'false');
		content = content.replace(/\{\{hasChangelog\}\}/g, challenge.hasChangelog ? 'true' : 'false');
		content = content.replace(/\{\{showGoVip\}\}/g, challenge.showGoVip ? 'true' : 'false');
		content = content.replace(/\{\{userSubmittedDifficulty\}\}/g, challenge.userSubmittedDifficulty?.toString() || '');
		
		// 启动方式
		const playMethods = challenge.playMethods?.join(', ') || '';
		content = content.replace(/\{\{playMethods\}\}/g, playMethods);
		
		// 难度反馈统计
		const diffChart = challenge.difficultyChart;
		content = content.replace(/\{\{feedbackCake\}\}/g, diffChart?.counterCake?.toString() || '0');
		content = content.replace(/\{\{feedbackVeryEasy\}\}/g, diffChart?.counterVeryEasy?.toString() || '0');
		content = content.replace(/\{\{feedbackEasy\}\}/g, diffChart?.counterEasy?.toString() || '0');
		content = content.replace(/\{\{feedbackTooEasy\}\}/g, diffChart?.counterTooEasy?.toString() || '0');
		content = content.replace(/\{\{feedbackMedium\}\}/g, diffChart?.counterMedium?.toString() || '0');
		content = content.replace(/\{\{feedbackBitHard\}\}/g, diffChart?.counterBitHard?.toString() || '0');
		content = content.replace(/\{\{feedbackHard\}\}/g, diffChart?.counterHard?.toString() || '0');
		content = content.replace(/\{\{feedbackTooHard\}\}/g, diffChart?.counterTooHard?.toString() || '0');
		content = content.replace(/\{\{feedbackExHard\}\}/g, diffChart?.counterExHard?.toString() || '0');
		content = content.replace(/\{\{feedbackBrainFuck\}\}/g, diffChart?.counterBrainFuck?.toString() || '0');
		
		// 标签
		const tagsStr = challenge.tags?.join(', ') || '';
		content = content.replace(/\{\{tags\}\}/g, tagsStr);
		
		// URL
		const url = `https://app.hackthebox.com/challenges/${challenge.id}`;
		content = content.replace(/\{\{url\}\}/g, url);
		
		return content;
	}
	
	/**
	 * 从 API 响应解析数据
	 */
	private parseFromApi(data: any): HTBChallenge {
		// 分类 ID 处理
		const categoryId = data.challenge_category_id || data.category_id;
		const categoryName = this.getCategoryName(categoryId, data.category_name || data.category);
		
		// 解析发布时间（UTC+8）
		const releaseRaw = data.release_date || data.release;
		const releaseDate = releaseRaw ? moment(releaseRaw).utcOffset(8) : moment();
		
		const challenge: HTBChallenge = {
			id: data.id?.toString() || '',
			name: data.name || '',
			category: categoryName,
			challenge_category_id: categoryId,
			difficulty: data.difficultyText || data.difficulty || '',
			difficultyNum: data.avg_difficulty || data.difficulty || 0,
			rating: data.stars || data.rating || 0,
			stars: data.stars || 0,
			avatar: data.avatar || '',
			avatarThumb: data.avatar_thumb || data.avatar || '',
			release: releaseDate.toDate(),
			releaseDate: releaseDate.format('YYYY-MM-DD HH:mm'),
			retired: data.retired === 1 || data.retired === true,
			active: data.active === 1 || data.active === true || data.state === 'active',
			state: data.state || (data.retired ? 'retired' : 'active'),
			maker: [],
			tags: [],
			points: data.points || 0,
			staticPoints: data.static_points || 0,
			isCompleted: data.isCompleted || false,
			isTodo: data.isTodo || false,
			isSolved: data.isSolved || data.authUserSolve || false,
			authUserSolve: data.authUserSolve || false,
			solves: data.solves || 0,
			downloads: data.downloads || 0,
			hasDownload: data.download === true || data.hasDownload === true,
			docker: data.docker === true || data.docker === 1,
			description: data.description || '',
			synopsis: data.synopsis || '',
			likes: data.likes || 0,
			dislikes: data.dislikes || 0,
			recommended: data.recommended || 0,
			// 文件信息
			fileName: data.file_name || '',
			fileSize: data.file_size || '',
			sha256: data.sha256 || '',
			// Docker 信息
			dockerIp: data.docker_ip || '',
			dockerPorts: data.docker_ports || '',
			dockerStatus: data.docker_status || '',
			// 播放信息
			playInfoStatus: data.play_info?.status || '',
			playInfoExpiresAt: data.play_info?.expires_at ? moment(data.play_info.expires_at).utcOffset(8).format('YYYY-MM-DD HH:mm') : '',
			playInfoIp: data.play_info?.ip || '',
			playInfoPorts: data.play_info?.ports || '',
			playMethods: data.play_methods || [],
			// 用户相关
			likeByAuthUser: data.likeByAuthUser || false,
			dislikeByAuthUser: data.dislikeByAuthUser || false,
			reviewsCount: data.reviews_count || 0,
			authUserHasReviewed: data.authUserHasReviewed || false,
			userCanReview: data.user_can_review || false,
			canAccessWalkthrough: data.can_access_walkthough || false, // 注意API拼写错误
			hasChangelog: data.has_changelog || false,
			showGoVip: data.show_go_vip || false,
			userSubmittedDifficulty: data.user_submitted_difficulty || 0,
			released: data.released || 0,
			// 难度投票分布
			difficultyChart: data.difficulty_chart ? {
				counterCake: data.difficulty_chart.counterCake || 0,
				counterVeryEasy: data.difficulty_chart.counterVeryEasy || 0,
				counterEasy: data.difficulty_chart.counterEasy || 0,
				counterTooEasy: data.difficulty_chart.counterTooEasy || 0,
				counterMedium: data.difficulty_chart.counterMedium || 0,
				counterBitHard: data.difficulty_chart.counterBitHard || 0,
				counterHard: data.difficulty_chart.counterHard || 0,
				counterTooHard: data.difficulty_chart.counterTooHard || 0,
				counterExHard: data.difficulty_chart.counterExHard || 0,
				counterBrainFuck: data.difficulty_chart.counterBrainFuck || 0
			} : undefined
		};
		
		// 解析制作者（支持两种数据格式）
		// 格式1：creator_name/creator_id/creator_avatar 字段
		if (data.creator_name || data.creator_id) {
			challenge.maker.push({
				id: data.creator_id?.toString() || '',
				name: data.creator_name || '',
				avatar: data.creator_avatar || '',
				isRespected: data.isRespected || false
			});
		}
		// 格式2：maker 对象（旧格式）
		else if (data.maker) {
			challenge.maker.push({
				id: data.maker.id?.toString() || '',
				name: data.maker.name || '',
				avatar: data.maker.avatar || '',
				isRespected: data.maker.isRespected || false
			});
		}
		
		// 第二制作者（添加到 maker 数组中，同时保存到 creator2 对象）
		if (data.creator2_name || data.creator2_id) {
			const creator2Info = {
				id: data.creator2_id?.toString() || '',
				name: data.creator2_name || '',
				avatar: data.creator2_avatar || '',
				isRespected: data.isRespected2 || false
			};
			challenge.maker.push(creator2Info);
			challenge.creator2 = creator2Info;
		}
		
		// 解析标签
		if (data.labels && Array.isArray(data.labels)) {
			challenge.tags = data.labels.map((label: any) => label.name || '');
			challenge.labels = challenge.tags;
		} else if (data.tags && Array.isArray(data.tags)) {
			challenge.tags = data.tags;
			challenge.labels = data.tags;
		}
		
		// 解析首杀信息（支持两种数据格式）
		// 格式1：first_blood_user/first_blood_user_id/first_blood_time 字段
		if (data.first_blood_user || data.first_blood_user_id) {
			challenge.firstBlood = {
				user: data.first_blood_user || '',
				userId: data.first_blood_user_id?.toString() || '',
				userAvatar: data.first_blood_user_avatar || '',
				time: data.first_blood_time || ''  // 保留原始格式如 "0H 5M 59S"
			};
		}
		// 格式2：firstBlood 对象（旧格式）
		else if (data.firstBlood) {
			const fbTime = data.firstBlood.created_at ? new Date(data.firstBlood.created_at) : null;
			let timeStr = '';
			if (fbTime) {
				const duration = moment.duration(moment(fbTime).diff(releaseDate));
				const days = Math.floor(duration.asDays());
				const hours = duration.hours();
				const minutes = duration.minutes();
				timeStr = `${days}D ${hours}H ${minutes}M`;
			}
			
			challenge.firstBlood = {
				user: data.firstBlood.user?.name || '',
				userId: data.firstBlood.user?.id?.toString() || '',
				userAvatar: data.firstBlood.user?.avatar || '',
				time: timeStr
			};
		}
		
		// 退役日期
		if (data.retired_date) {
			challenge.retiredDate = new Date(data.retired_date);
		}
		
		// 完成时间（UTC+8）
		if (data.ownedAt) {
			challenge.ownedAt = new Date(data.ownedAt);
			challenge.completedAt = challenge.ownedAt;
		}
		// authUserSolveTime 是时长字符串（如 "1Y 2M 26D"），直接使用
		if (data.authUserSolveTime) {
			challenge.authUserSolveTime = data.authUserSolveTime;
		}
		
		// URL
		challenge.url = `https://app.hackthebox.com/challenges/${challenge.id}`;
		
		return challenge;
	}
	
	/**
	 * 获取 Challenge 列表
	 */
	async getChallengeList(retired: boolean = false): Promise<HTBChallenge[]> {
		const debug = this.plugin.settings.debug;
		if (debug) {
			console.log(`HTB Challenge 处理器: 获取 Challenge 列表 (retired: ${retired})`);
		}
		
		try {
			const headers = {
				'Authorization': `Bearer ${this.plugin.settings.apiToken}`
			};
			
			const apiUrl = HTBHttpUtil.buildApiUrl(HTB_API_ENDPOINTS.CHALLENGE_LIST);
			const queryString = HTBHttpUtil.buildQueryString({retired: retired ? 1 : 0});
			const fullUrl = apiUrl + queryString;
			
			const response = await HTBHttpUtil.get(fullUrl, headers, debug);
			
			if (response && response.data) {
				const challenges = response.data.map((item: any) => this.parseFromApi(item));
				if (debug) {
					console.log(`HTB Challenge 处理器: 获取到 ${challenges.length} 个 Challenge`);
				}
				return challenges;
			}
			
			return [];
		} catch (e) {
			log.error('获取 HTB Challenge 列表失败', e);
			throw e;
		}
	}
}

