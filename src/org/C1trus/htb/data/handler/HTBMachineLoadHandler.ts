import {HTBMachine, HTBMachineApiResponse, HTBSearchItem} from "../model/HTBMachine";
import {HTBHttpUtil} from "../../../utils/HTBHttpUtil";
import {HTB_API_ENDPOINTS, HTB_DEFAULT_TEMPLATE} from "../../../constant/HTB";
import {log} from "../../../utils/Logutil";
import {App, moment, Notice, normalizePath} from "obsidian";
import HTBPlugin from "../../../main";

/**
 * HTB 机器数据加载处理器
 */
export default class HTBMachineLoadHandler {
	private app: App;
	private plugin: HTBPlugin;
	
	constructor(app: App, plugin: HTBPlugin) {
		this.app = app;
		this.plugin = plugin;
	}
	
	/**
	 * 加载机器信息
	 * @param machineInput 机器 ID 或名称
	 */
	async loadMachine(machineInput: string): Promise<HTBMachine | null> {
		const debug = this.plugin.settings.debug;
		if (debug) {
			console.log(`HTB 机器处理器: 开始加载机器信息 ${machineInput}`);
		}
		
		try {
			// 构建认证头
			const headers = {
				'Authorization': `Bearer ${this.plugin.settings.apiToken}`
			};
			
			// 使用 HTB API 获取机器信息
			const apiUrl = HTBHttpUtil.buildApiUrl(HTB_API_ENDPOINTS.MACHINE_PROFILE, {id: machineInput});
			const response: HTBMachineApiResponse = await HTBHttpUtil.get(apiUrl, headers, debug);
			
			if (response && response.info) {
				const machine = this.parseFromApi(response.info);
				if (debug) {
					console.log(`HTB 机器处理器: 成功获取机器信息 ${machine.name}`);
				}
				return machine;
			}
			
			return null;
		} catch (e) {
			if (debug) {
				console.log(`HTB 机器处理器: 加载失败 - ${e.message}`);
			}
			// 错误消息已经在 HTBHttpUtil 中处理过，这里只需重新抛出
			throw e;
		}
	}
	
	/**
	 * 生成内容
	 * 优先级：文件夹专属模板 > 默认模板
	 */
	async generateContent(machine: HTBMachine, targetPath: string): Promise<string> {
		let template: string;
		
		// 1. 尝试匹配文件夹专属模板规则
		const matchedTemplate = await this.getMatchedTemplate(targetPath);
		if (matchedTemplate) {
			template = matchedTemplate;
		} else {
			// 2. 使用默认模板
			template = await this.getDefaultTemplate();
		}
		
		return this.fillTemplate(template, machine);
	}
	
	/**
	 * 获取类型特定的模板配置
	 * 优先使用新的 machineTemplate 配置，如果不存在则回退到旧配置以保持兼容性
	 */
	private getTemplateSettings() {
		if (this.plugin.settings.machineTemplate) {
			return this.plugin.settings.machineTemplate;
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
			
			// 2. 使用内置默认模板
			return HTB_DEFAULT_TEMPLATE;
		}
		
		// 如果未启用内置模板，仅使用外部模板文件
		if (settings.defaultTemplateFile && settings.defaultTemplateFile.trim() !== '') {
			const fileTemplate = await this.loadTemplate(settings.defaultTemplateFile);
			if (fileTemplate) {
				return fileTemplate;
			}
		}
		
		// 如果外部文件也没有，回退到内置模板
		return HTB_DEFAULT_TEMPLATE;
	}
	
	/**
	 * 根据文件路径获取匹配的模板
	 */
	private async getMatchedTemplate(filePath: string): Promise<string | null> {
		const settings = this.getTemplateSettings();
		
		// 如果未启用文件夹模板功能，直接返回
		if (!settings.enableFolderTemplates) {
			return null;
		}
		
		const rules = settings.folderTemplateRules;
		if (!rules || rules.length === 0) {
			return null;
		}
		
		// 标准化文件路径（移除前导和尾随斜杠）
		const normalizedPath = filePath.replace(/^\/+|\/+$/g, '');
		
		// 获取启用的规则并按优先级排序（高到低）
		const enabledRules = rules
			.filter(rule => rule.enabled)
			.sort((a, b) => b.priority - a.priority);
		
		// 遍历规则查找匹配项
		for (const rule of enabledRules) {
			if (!rule.folderPath) continue;
			
			// 标准化规则路径
			const ruleFolder = rule.folderPath.replace(/^\/+|\/+$/g, '');
			
			// 检查是否匹配
			let isMatch = false;
			if (rule.matchSubfolders) {
				// 匹配子文件夹：检查文件路径是否以规则路径开头
				isMatch = normalizedPath.startsWith(ruleFolder + '/') || normalizedPath === ruleFolder;
			} else {
				// 不匹配子文件夹：检查文件是否直接在该文件夹中
				const fileFolder = normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));
				isMatch = fileFolder === ruleFolder;
			}
			
		if (isMatch) {
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
	 * 加载模板文件
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
	private fillTemplate(template: string, machine: HTBMachine): string {
		const variables = this.buildVariables(machine);
		let content = template;
		
		variables.forEach((value, key) => {
			const regex = new RegExp(`{{${key}}}`, 'g');
			content = content.replace(regex, value);
		});
		
		return content;
	}
	
	/**
	 * 从 API 响应解析机器信息
	 */
	private parseFromApi(data: any): HTBMachine {
		// S3 头像存储前缀（不带尾部斜杠，因为 API 路径自带前导斜杠）
		const S3_AVATAR_PREFIX = 'https://htb-mp-prod-public-storage.s3.eu-central-1.amazonaws.com';
		
		// 解析制作者
		const makers = [];
		if (data.maker) {
			makers.push({
				id: data.maker.id?.toString(),
				name: data.maker.name,
				avatar: data.maker.avatar?.startsWith('http') ? data.maker.avatar : S3_AVATAR_PREFIX + data.maker.avatar,
				isRespected: data.maker.isRespected || false,
				profileUrl: data.maker.profile_url || ''
			});
		}
		
	// 第二制作者
	const makers2 = [];
	if (data.maker2) {
		makers2.push({
			id: data.maker2.id?.toString(),
			name: data.maker2.name,
			avatar: data.maker2.avatar ? (data.maker2.avatar.startsWith('http') ? data.maker2.avatar : S3_AVATAR_PREFIX + data.maker2.avatar) : '',
			isRespected: data.maker2.isRespected || false,
			profileUrl: data.maker2.profile_url || ''
		});
	}
		
		// 解析标签
		const tags = data.labels?.map((l: any) => l.name) || [];
		
		// 解析难度
		const difficultyMap: Record<number, string> = {
			10: 'Easy',
			20: 'Easy',
			30: 'Medium',
			40: 'Medium',
			50: 'Hard',
			60: 'Hard',
			70: 'Insane',
			80: 'Insane',
			90: 'Insane',
			100: 'Insane'
		};
		
		const difficulty = data.difficultyText || difficultyMap[data.difficulty] || 'Unknown';
		
		// 构建机器对象
		const machine: HTBMachine = {
			id: data.id?.toString(),
			name: data.name,
			os: data.os,
			
			difficulty: difficulty,
			difficultyNum: data.difficulty,
			
		rating: data.stars || 0,
		stars: data.stars || 0,
		
		// 为 avatar 添加 S3 前缀（如果不是完整 URL）
		avatar: data.avatar?.startsWith('http') ? data.avatar : S3_AVATAR_PREFIX + data.avatar,
		avatarThumb: data.avatar_thumb?.startsWith('http') ? data.avatar_thumb : S3_AVATAR_PREFIX + data.avatar_thumb,
			
		release: data.release ? new Date(data.release) : new Date(),
		releaseDate: data.release ? moment(data.release).utcOffset(8).format('YYYY-MM-DD HH:mm') : '',
		retiredDate: data.retired_date ? new Date(data.retired_date) : null,
		
		retired: data.retired === true || data.retired === 1,
		active: data.active === true || data.active === 1,
		free: data.free === true || data.free === 1,
			
			maker: makers,
			maker2: makers2.length > 0 ? makers2 : undefined,
			tags: tags,
			
		ip: data.ip || '',
		points: data.static_points || data.points || 0,
		userPoints: data.user_points || (data.static_points ? Math.floor(data.static_points * 0.4) : 20),
		rootPoints: data.root_points || (data.static_points ? Math.floor(data.static_points * 0.6) : 30),
		staticPoints: data.static_points || data.points || 0,
		
		isCompleted: data.isCompleted || false,
		isTodo: data.isTodo || false,
		isFavorite: data.isFavorite || false,
		isSpawned: data.playInfo?.isSpawned || false,
		ownedUser: data.authUserInUserOwns || false,
		ownedRoot: data.authUserInRootOwns || false,
			
			userOwns: data.userOwns || 0,
			rootOwns: data.rootOwns || 0,
			userOwnsCount: data.user_owns_count || data.userOwns || 0,
			rootOwnsCount: data.root_owns_count || data.rootOwns || 0,
			
			// 首杀信息
			userBlood: data.userBlood ? {
				user: {
					id: data.userBlood.user?.id?.toString() || '',
					name: data.userBlood.user?.name || '',
					avatar: data.userBlood.user?.avatar?.startsWith('http') ? data.userBlood.user.avatar : S3_AVATAR_PREFIX + data.userBlood.user?.avatar
				},
				created_at: data.userBlood.created_at,
				blood_difference: data.userBlood.blood_difference
			} : undefined,
			rootBlood: data.rootBlood ? {
				user: {
					id: data.rootBlood.user?.id?.toString() || '',
					name: data.rootBlood.user?.name || '',
					avatar: data.rootBlood.user?.avatar?.startsWith('http') ? data.rootBlood.user.avatar : S3_AVATAR_PREFIX + data.rootBlood.user?.avatar
				},
				created_at: data.rootBlood.created_at,
				blood_difference: data.rootBlood.blood_difference
			} : undefined,
			firstUserBloodTime: data.firstUserBloodTime || '',
			firstRootBloodTime: data.firstRootBloodTime || '',
			
			// 当前用户完成时间
			authUserFirstUserTime: data.authUserFirstUserTime || '',
			authUserFirstRootTime: data.authUserFirstRootTime || '',
			
		feedbackForChart: data.feedbackForChart,
		
		// 播放信息
		playInfo: data.playInfo ? {
			isSpawned: data.playInfo.isSpawned || null,
			isSpawning: data.playInfo.isSpawning || false,
			isActive: data.playInfo.isActive || false,
			activePlayerCount: data.playInfo.active_player_count || 0,
			expiresAt: data.playInfo.expires_at || null
		} : undefined,
		
		// 用户相关
		authUserInUserOwns: data.authUserInUserOwns || false,
		authUserInRootOwns: data.authUserInRootOwns || false,
		authUserHasReviewed: data.authUserHasReviewed || false,
		authUserHasSubmittedMatrix: data.authUserHasSubmittedMatrix || false,
		userCanReview: data.user_can_review || false,
		
		// 其他
		recommended: data.recommended,
		spFlag: data.sp_flag,
		synopsis: data.synopsis || '',
		infoStatus: data.info_status || '',
		seasonId: data.season_id,
		reviewsCount: data.reviews_count || 0,
		canAccessWalkthrough: data.can_access_walkthrough || false,
		hasChangelog: data.has_changelog || false,
		isGuidedEnabled: data.isGuidedEnabled || false,
		startMode: data.start_mode || '',
		showGoVip: data.show_go_vip || false,
		showGoVipServer: data.show_go_vip_server || false,
		ownRank: data.ownRank || 0,
		machineMode: data.machine_mode || null,
		priceTier: data.priceTier || 0,
		requiredSubscription: data.requiredSubscription || null,
		switchServerWarning: data.switchServerWarning || null,
		isSingleFlag: data.isSingleFlag || false,
		
		url: `https://app.hackthebox.com/machines/${data.id}`
	};
	
	return machine;
	}
	
	
	/**
	 * 构建模版变量
	 */
	private buildVariables(machine: HTBMachine): Map<string, string> {
		const now = new Date();
		
		// 生成星级评分
		const stars = machine.rating > 0 ? '⭐'.repeat(Math.round(machine.rating)) : '☆☆☆☆☆';
		
		// 格式化日期（UTC+8格式）
		const datePublished = machine.release ? 
			moment(machine.release).utcOffset(8).format('YYYY-MM-DD HH:mm') : '';
		const completedAt = machine.completedAt ? 
			moment(machine.completedAt).utcOffset(8).format('YYYY-MM-DD HH:mm') : '';
		const currentDate = moment(now).utcOffset(8).format('YYYY-MM-DD HH:mm');
		const currentTime = moment(now).utcOffset(8).format('YYYY-MM-DD HH:mm:ss');
		
		// 制作者 - 生成 YAML 数组格式
		const authorArray = machine.maker.map(m => `  - ${m.name}`).join('\n');
		const author = authorArray || '  - Unknown';
		
		// 标签
		const tags = machine.tags.join(', ');
		
		// 退役状态
		const retiredText = machine.retired ? '已退役' : '活跃中';
		
		// 第一制作者信息
		const maker1 = machine.maker && machine.maker.length > 0 ? machine.maker[0] : null;
		const creatorName = maker1?.name || '';
		const creatorId = maker1?.id || '';
		const creatorAvatar = maker1?.avatar || '';
		
		// 第二制作者信息
		const maker2 = machine.maker && machine.maker.length > 1 ? machine.maker[1] : 
		              (machine.maker2 && machine.maker2.length > 0 ? machine.maker2[0] : null);
		const creator2Name = maker2?.name || '';
		const creator2Id = maker2?.id || '';
		const creator2Avatar = maker2?.avatar || '';
		
		// 首杀信息 - User
		const userBlood = machine.userBlood;
		const userBloodUser = userBlood?.user?.name || '';
		const userBloodUserId = userBlood?.user?.id || '';
		const userBloodUserAvatar = userBlood?.user?.avatar || '';
		const firstUserBloodTime = machine.firstUserBloodTime || '';
		// userBloodTime 应该使用 blood_difference 字段（相对发布时间的用时）
		const userBloodTime = userBlood?.blood_difference || firstUserBloodTime;
		
		// 首杀信息 - Root
		const rootBlood = machine.rootBlood;
		const rootBloodUser = rootBlood?.user?.name || '';
		const rootBloodUserId = rootBlood?.user?.id || '';
		const rootBloodUserAvatar = rootBlood?.user?.avatar || '';
		const firstRootBloodTime = machine.firstRootBloodTime || '';
		// rootBloodTime 应该使用 blood_difference 字段（相对发布时间的用时）
		const rootBloodTime = rootBlood?.blood_difference || firstRootBloodTime;
		
		// 当前用户完成时间
		const authUserFirstUserTime = machine.authUserFirstUserTime || '';
		const authUserFirstRootTime = machine.authUserFirstRootTime || '';
		const authUserInUserOwns = machine.authUserInUserOwns?.toString() || 'false';
		const authUserInRootOwns = machine.authUserInRootOwns?.toString() || 'false';
		
		// 构建变量 Map
		const variables = new Map<string, string>([
			// 基本信息
			['id', machine.id],
			['title', machine.name],
			['name', machine.name],
			['type', 'Machine'],
			['OS', machine.os],
			['os', machine.os],
			['osSystem', machine.os],
			
			// 难度信息
			['difficulty', machine.difficulty],
			['difficultyText', machine.difficulty],
			['difficultyNum', machine.difficultyNum?.toString() || '0'],
			['avgDifficulty', machine.difficultyNum?.toString() || '0'],
			
			// 评分信息
			['score', machine.rating?.toString() || '0'],
			['rating', machine.rating?.toString() || '0'],
			['scoreStar', stars],
			['stars', stars],
			
			// 图片
			['image', machine.avatar || ''],
			['imageUrl', machine.avatar || ''],
			['avatar', machine.avatar || ''],
			
			// 时间信息
			['datePublished', datePublished],
			['release', datePublished],
			['releaseDate', datePublished],
			['currentDate', currentDate],
			['currentTime', currentTime],
			
			// 制作者信息
			['author', author],
			['maker', author],
			['creatorName', creatorName],
			['creatorId', creatorId],
			['creatorAvatar', creatorAvatar],
			['isRespected', maker1?.isRespected?.toString() || 'false'],
			['creator2Name', creator2Name],
			['creator2Id', creator2Id],
			['creator2Avatar', creator2Avatar],
			['isRespected2', maker2?.isRespected?.toString() || 'false'],
			
			// 积分
			['points', machine.points?.toString() || '0'],
			['userPoints', machine.userPoints?.toString() || '20'],
			['rootPoints', machine.rootPoints?.toString() || '30'],
			['staticPoints', machine.staticPoints?.toString() || '0'],
			
			// 统计信息
			['userOwns', machine.userOwns?.toString() || '0'],
			['rootOwns', machine.rootOwns?.toString() || '0'],
			['userOwnsCount', machine.userOwnsCount?.toString() || '0'],
			['rootOwnsCount', machine.rootOwnsCount?.toString() || '0'],
			
			// 状态
			['retired', retiredText],
			['retiredStatus', machine.retired.toString()],
			['isCompleted', machine.isCompleted?.toString() || 'false'],
			['isFree', machine.free?.toString() || 'false'],
			['free', machine.free?.toString() || 'false'],
			['isActive', machine.active?.toString() || 'false'],
			['active', machine.active?.toString() || 'false'],
			['isTodo', machine.isTodo?.toString() || 'false'],
			['isSpawned', machine.isSpawned?.toString() || 'false'],
			
			// 首杀信息 - User
			['userBloodUser', userBloodUser],
			['userBloodUserId', userBloodUserId],
			['userBloodUserAvatar', userBloodUserAvatar],
			['userBloodTime', userBloodTime],
			['firstUserBloodTime', firstUserBloodTime],
			
			// 首杀信息 - Root
			['rootBloodUser', rootBloodUser],
			['rootBloodUserId', rootBloodUserId],
			['rootBloodUserAvatar', rootBloodUserAvatar],
			['rootBloodTime', rootBloodTime],
			['firstRootBloodTime', firstRootBloodTime],
			
			// 当前用户完成时间
			['authUserFirstUserTime', authUserFirstUserTime],
			['authUserFirstRootTime', authUserFirstRootTime],
			['authUserInUserOwns', authUserInUserOwns],
			['authUserInRootOwns', authUserInRootOwns],
			
		// 其他
		['recommended', machine.recommended?.toString() || '0'],
		['favorite', machine.isFavorite?.toString() || 'false'],
		['ownedUser', machine.ownedUser?.toString() || 'false'],
		['ownedRoot', machine.ownedRoot?.toString() || 'false'],
		['completedAt', completedAt],
		['ip', machine.ip || ''],
		['tags', tags],
		['synopsis', machine.synopsis || ''],
		['infoStatus', machine.infoStatus || ''],
		['seasonId', machine.seasonId?.toString() || ''],
		['reviewsCount', machine.reviewsCount?.toString() || '0'],
		['url', machine.url || ''],
		
		// 播放信息
		['playInfoIsSpawned', machine.playInfo?.isSpawned?.toString() || 'null'],
		['playInfoIsSpawning', machine.playInfo?.isSpawning?.toString() || 'false'],
		['playInfoIsActive', machine.playInfo?.isActive?.toString() || 'false'],
		['playInfoActivePlayerCount', machine.playInfo?.activePlayerCount?.toString() || '0'],
		['playInfoExpiresAt', machine.playInfo?.expiresAt || ''],
		
		// 用户相关
		['authUserHasReviewed', machine.authUserHasReviewed?.toString() || 'false'],
		['authUserHasSubmittedMatrix', machine.authUserHasSubmittedMatrix?.toString() || 'false'],
		['userCanReview', machine.userCanReview?.toString() || 'false'],
		
		// 制作者Profile URL
		['creatorProfileUrl', maker1?.profileUrl || ''],
		['creator2ProfileUrl', maker2?.profileUrl || ''],
		
		// 反馈统计
		['feedbackCake', machine.feedbackForChart?.counterCake?.toString() || '0'],
		['feedbackVeryEasy', machine.feedbackForChart?.counterVeryEasy?.toString() || '0'],
		['feedbackEasy', machine.feedbackForChart?.counterEasy?.toString() || '0'],
		['feedbackTooEasy', machine.feedbackForChart?.counterTooEasy?.toString() || '0'],
		['feedbackMedium', machine.feedbackForChart?.counterMedium?.toString() || '0'],
		['feedbackBitHard', machine.feedbackForChart?.counterBitHard?.toString() || '0'],
		['feedbackHard', machine.feedbackForChart?.counterHard?.toString() || '0'],
		['feedbackTooHard', machine.feedbackForChart?.counterTooHard?.toString() || '0'],
		['feedbackExHard', machine.feedbackForChart?.counterExHard?.toString() || '0'],
		['feedbackBrainFuck', machine.feedbackForChart?.counterBrainFuck?.toString() || '0'],
		
		// 其他新增字段
		['spFlag', machine.spFlag?.toString() || '0'],
		['canAccessWalkthrough', machine.canAccessWalkthrough?.toString() || 'false'],
		['hasChangelog', machine.hasChangelog?.toString() || 'false'],
		['isGuidedEnabled', machine.isGuidedEnabled?.toString() || 'false'],
		['startMode', machine.startMode || ''],
		['showGoVip', machine.showGoVip?.toString() || 'false'],
		['showGoVipServer', machine.showGoVipServer?.toString() || 'false'],
		['ownRank', machine.ownRank?.toString() || '0'],
		['machineMode', machine.machineMode || ''],
		['priceTier', machine.priceTier?.toString() || '0'],
		['requiredSubscription', machine.requiredSubscription || ''],
		['switchServerWarning', machine.switchServerWarning || ''],
		['isSingleFlag', machine.isSingleFlag?.toString() || 'false'],
		
		// 搜索相关
		['tierId', machine.tierId?.toString() || ''],
		['isSp', machine.isSp?.toString() || 'false']
	]);
	
	return variables;
	}
	
	/**
	 * 获取机器列表
	 * @param retired 是否包含退役机器
	 */
	async getMachineList(retired: boolean = false): Promise<HTBMachine[]> {
		const debug = this.plugin.settings.debug;
		if (debug) {
			console.log(`HTB 机器处理器: 获取机器列表 (retired=${retired})`);
		}
		
		try {
			const headers = {
				'Authorization': `Bearer ${this.plugin.settings.apiToken}`
			};
			
			const apiUrl = HTBHttpUtil.buildApiUrl(HTB_API_ENDPOINTS.MACHINE_LIST);
			const response = await HTBHttpUtil.get(apiUrl, headers, debug);
			
			if (response && response.info) {
				const machines = response.info
					.filter((m: any) => retired || m.retired === 0)
					.map((m: any) => this.parseFromApi(m));
				
				if (debug) {
					console.log(`HTB 机器处理器: 获取到 ${machines.length} 个机器`);
				}
				return machines;
			}
			
			return [];
		} catch (e) {
			log.error('获取 HTB 机器列表失败', e);
			throw e;
		}
	}
	
	/**
	 * 搜索机器（返回简化结果，只包含 id、value、avatar）
	 * @param query 搜索关键词
	 */
	async searchMachines(query: string): Promise<HTBSearchItem[]> {
		const debug = this.plugin.settings.debug;
		if (debug) {
			console.log(`HTB 机器处理器: 搜索机器 "${query}"`);
		}
		
		try {
			const headers = {
				'Authorization': `Bearer ${this.plugin.settings.apiToken}`
			};
			
			const apiUrl = HTBHttpUtil.buildApiUrl(HTB_API_ENDPOINTS.SEARCH);
			const queryString = HTBHttpUtil.buildQueryString({query: query});
			const fullUrl = apiUrl + queryString;
			
			const response = await HTBHttpUtil.get(fullUrl, headers, debug);
			
			// 打印响应数据结构以便调试
			if (debug) {
				console.log('HTB 搜索 API 响应类型:', typeof response);
				console.log('HTB 搜索 API 响应数据:', JSON.stringify(response).substring(0, 500));
			}
			
			if (response && response.machines && Array.isArray(response.machines)) {
				// 只提取 machines 数组，忽略 users 和 teams
				const machines: HTBSearchItem[] = response.machines.map((item: any) => ({
					id: item.id,
					value: item.value,
					avatar: item.avatar
				}));
				
				if (debug) {
					console.log(`HTB 机器处理器: 搜索到 ${machines.length} 个机器`);
				}
				return machines;
			}
			
			return [];
		} catch (e) {
			log.error(`搜索 HTB 机器失败: ${query}`, e);
			throw e;
		}
	}
}
