/**
 * HTB 靶机数据模型
 * 对应模版中的字段
 */
export interface HTBMachine {
	// 基本信息
	id: string;                    // 机器 ID
	name: string;                  // 机器名称
	os: string;                    // 操作系统 (Linux/Windows/FreeBSD/Android/...)
	
	// 难度信息
	difficulty: string;            // 难度文本 (Easy/Medium/Hard/Insane)
	difficultyNum: number;         // 难度数值 (10-100)
	
	// 评分信息
	rating: number;                // 用户评分 (0-5)
	stars: number;                 // 星级评分
	
	// 图片
	avatar: string;                // 机器图标/封面
	avatarThumb?: string;          // 缩略图
	
	// 时间信息
	release: Date;                 // 发布日期
	releaseDate?: string;          // 格式化的发布日期
	retiredDate?: Date;            // 退役日期
	
	// 状态
	retired: boolean;              // 是否已退役
	active?: boolean;              // 是否为活跃机器
	free?: boolean;                // 是否免费（非 VIP）
	
	// 制作者信息
	maker: {
		id: string;
		name: string;
		avatar: string;
		isRespected?: boolean;
		profileUrl?: string;
	}[];
	maker2?: {                     // 合作者（如果有）
		id: string;
		name: string;
		avatar: string;
		isRespected?: boolean;
		profileUrl?: string;
	}[];
	
	// 标签和分类
	tags: string[];                // 标签
	labels?: string[];             // 标签（别名）
	
	// 网络信息
	ip: string;                    // IP 地址（活跃机器时可用）
	
	// 积分
	points: number;                // 完成后获得的积分
	userPoints?: number;           // User flag 积分
	rootPoints?: number;           // Root flag 积分
	staticPoints?: number;         // 静态积分
	
	// 用户完成信息（需要登录）
	isCompleted?: boolean;         // 是否已完成
	isTodo?: boolean;              // 是否在 Todo 列表
	ownedUser?: boolean;           // 是否拥有 user flag
	ownedRoot?: boolean;           // 是否拥有 root flag
	ownedAt?: Date;                // 完成时间
	completedAt?: Date;            // 完成时间（别名）
	
	// 首杀信息
	userBlood?: {                  // User flag 首杀
		user: {
			id: string;
			name: string;
			avatar: string;
		};
		created_at?: string;
		blood_difference?: string;
	};
	rootBlood?: {                  // Root flag 首杀
		user: {
			id: string;
			name: string;
			avatar: string;
		};
		created_at?: string;
		blood_difference?: string;
	};
	firstUserBloodTime?: string;   // User 首杀用时
	firstRootBloodTime?: string;   // Root 首杀用时
	authUserFirstUserTime?: string; // 当前用户 User 完成时间
	authUserFirstRootTime?: string; // 当前用户 Root 完成时间
	
	// 统计信息
	userOwns?: number;             // User flag 拥有者数量
	rootOwns?: number;             // Root flag 拥有者数量
	userOwnsCount?: number;        // User flag 拥有者数量（别名）
	rootOwnsCount?: number;        // Root flag 拥有者数量（别名）
	reviewsCount?: number;         // 评论数量
	
	// 反馈数据（完整的难度反馈统计）
	feedbackForChart?: {
		counterCake?: number;           // Piece of Cake
		counterVeryEasy?: number;       // Very Easy
		counterEasy?: number;           // Easy
		counterTooEasy?: number;        // Too Easy
		counterMedium?: number;         // Medium
		counterBitHard?: number;        // A Bit Hard
		counterHard?: number;           // Hard
		counterTooHard?: number;        // Too Hard
		counterExHard?: number;         // Extremely Hard
		counterBrainFuck?: number;      // Brain Fuck
	};
	
	// 播放信息
	playInfo?: {
		isSpawned?: boolean;       // 是否已生成
		isSpawning?: boolean;      // 是否正在生成
		isActive?: boolean;        // 是否激活
		activePlayerCount?: number; // 活跃玩家数
		expiresAt?: string;        // 过期时间
	};
	
	// 用户相关
	authUserInUserOwns?: boolean;  // 当前用户是否拥有User flag
	authUserInRootOwns?: boolean;  // 当前用户是否拥有Root flag
	authUserHasReviewed?: boolean; // 当前用户是否已评论
	authUserHasSubmittedMatrix?: boolean; // 当前用户是否已提交matrix
	userCanReview?: boolean;       // 用户是否可以评论
	
	// 其他
	recommended?: number;          // 推荐度
	spFlag?: number;               // 特殊标记
	synopsis?: string;             // 机器概要描述
	infoStatus?: string;           // 初始凭证/状态说明
	seasonId?: number;             // 赛季 ID
	isFavorite?: boolean;          // 是否收藏
	isSpawned?: boolean;           // 是否已生成实例（简化版）
	canAccessWalkthrough?: boolean; // 是否可以访问攻略
	hasChangelog?: boolean;        // 是否有更新日志
	isGuidedEnabled?: boolean;     // 是否启用引导
	startMode?: string;            // 启动模式 (spawn)
	showGoVip?: boolean;           // 是否显示VIP提示
	showGoVipServer?: boolean;     // 是否显示VIP服务器提示
	ownRank?: number;              // 自己的排名
	machineMode?: string;          // 机器模式
	priceTier?: number;            // 价格等级
	requiredSubscription?: string; // 需要的订阅
	switchServerWarning?: string;  // 切换服务器警告
	isSingleFlag?: boolean;        // 是否单flag
	
	// 搜索相关（接口2）
	tierId?: number;               // 等级ID
	isSp?: boolean;                // 是否为SP
	
	// URL 信息
	url?: string;                  // 机器页面 URL
}

/**
 * HTB 搜索 API 返回的简化结果（搜索列表用）
 */
export interface HTBSearchItem {
	id: number;
	value: string;         // 靶机/挑战/Sherlock 名称
	avatar: string | null; // 头像URL
	// Sherlock 扩展字段（可选）
	difficulty?: string;
	release_date?: string;
	is_owned?: boolean;
	category_name?: string;
	rating?: number;
	// Challenge 扩展字段（可选）
	isCompleted?: boolean;
	authUserSolve?: boolean;
	challenge_category_id?: number;
}

/**
 * HTB 机器搜索结果（已弃用，保留用于兼容）
 */
export interface HTBSearchResult {
	id: string;
	name: string;
	os: string;
	difficulty: string;
	avatar: string;
	retired: boolean;
	points: number;
	rating: number;
}

/**
 * HTB API 响应类型
 */
export interface HTBMachineApiResponse {
	info: {
		id: number;
		name: string;
		os: string;
		avatar: string;
		avatar_thumb: string;
		difficulty: number;
		difficultyText: string;
		static_points: number;
		stars: number;
		release: string;
		retired_date: string | null;
		active: number;
		retired: number;
		free: number;
		maker: {
			id: number;
			name: string;
			avatar: string;
			isRespected?: boolean;
		};
		maker2?: {
			id: number;
			name: string;
			avatar: string;
			isRespected?: boolean;
		};
		labels?: Array<{
			id: number;
			name: string;
		}>;
		ip?: string;
		points?: number;
		isCompleted?: boolean;
		isTodo?: boolean;
		authUserInUserOwns?: boolean;
		authUserInRootOwns?: boolean;
		authUserFirstUserTime?: string;
		authUserFirstRootTime?: string;
		user_owns_count?: number;
		root_owns_count?: number;
		userOwns?: number;
		rootOwns?: number;
		recommended?: number;
		sp_flag?: number;
		feedbackForChart?: any;
		userBlood?: {
			user: {
				id: number;
				name: string;
				avatar: string;
			};
			created_at?: string;
			blood_difference?: string;
		};
		rootBlood?: {
			user: {
				id: number;
				name: string;
				avatar: string;
			};
			created_at?: string;
			blood_difference?: string;
		};
		firstUserBloodTime?: string;
		firstRootBloodTime?: string;
		playInfo?: {
			isSpawned?: boolean;
			isSpawning?: boolean;
			isActive?: boolean;
		};
	};
}
