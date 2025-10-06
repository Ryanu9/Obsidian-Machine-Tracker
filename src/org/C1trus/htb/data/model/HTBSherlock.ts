/**
 * HTB Sherlock 数据模型
 * Sherlock 是 HTB 的数字取证挑战
 */
export interface HTBSherlock {
	// 基本信息
	id: string;                    // Sherlock ID
	name: string;                  // Sherlock 名称
	category: string;              // 分类 (通常是 Forensics 或 DFIR)
	categoryId?: number;           // 分类ID
	
	// 难度信息
	difficulty: string;            // 难度文本 (Very Easy/Easy/Medium/Hard)
	difficultyNum: number;         // 难度数值 (10-100)
	
	// 评分信息
	rating: number;                // 用户评分 (0-5)
	stars: number;                 // 星级评分
	likes?: number;                // 点赞数
	dislikes?: number;             // 不喜欢数
	ratingCount?: number;          // 评分人数
	
	// 图片
	avatar: string;                // Sherlock 图标/封面
	avatarThumb?: string;          // 缩略图
	
	// 时间信息
	release: Date;                 // 发布日期
	releaseDate?: string;          // 格式化的发布日期
	retiredDate?: Date;            // 退役日期
	
	// 状态
	state?: string;                // 状态（active / retired_free 等）
	retired: boolean;              // 是否已退役
	active?: boolean;              // 是否为活跃 Sherlock
	
	// 制作者信息
	maker: {
		id: string;
		name: string;
		avatar: string;
	}[];
	
	// 标签和分类
	tags: string[];                // 标签
	labels?: string[];             // 标签（别名）
	
	// 积分
	points: number;                // 完成后获得的积分
	staticPoints?: number;         // 静态积分
	
	// 用户完成信息（需要登录）
	isCompleted?: boolean;         // 是否已完成
	isTodo?: boolean;              // 是否在 Todo 列表
	ownedAt?: Date;                // 完成时间
	completedAt?: Date;            // 完成时间（别名）
	isSolved?: boolean;            // 是否已解决
	progress?: number;             // 进度（0-100）
	
	// 首杀信息
	firstBlood?: {                 // 首杀
		user: string;
		userId: string;
		time: Date;
	};
	
	// 统计信息
	solves?: number;               // 解题数量
	downloads?: number;            // 下载次数
	
	// 文件信息
	hasDownload?: boolean;         // 是否有下载文件
	downloadUrl?: string;          // 下载链接
	playMethods?: string[];        // 游戏方式（download / container 等）
	
	// 描述信息
	description?: string;          // Sherlock 描述
	scenario?: string;             // 场景描述
	
	// 用户状态
	authUserHasReviewed?: boolean; // 当前用户是否已评价
	userCanReview?: boolean;       // 当前用户是否可评价
	writeupVisible?: boolean;      // 是否可查看 writeup
	showGoVip?: boolean;           // 是否显示VIP购买引导
	favorite?: boolean;            // 是否收藏
	pinned?: boolean;              // 是否置顶
	
	// 其他
	recommended?: number;          // 推荐度
	retires?: string | null;       // 退役信息（null 或相关信息）
	
	// URL 信息
	url?: string;                  // Sherlock 页面 URL
}

/**
 * HTB Sherlock 搜索结果（用于列表显示）
 */
export interface HTBSherlockSearchResult {
	id: number;                    // Sherlock ID
	name: string;                  // Sherlock 名称
	category_name: string;         // 分类名称
	difficulty: string;            // 难度文本
	avatar: string;                // 头像/图标
	release_date: string;          // 发布时间（ISO 格式）
	is_owned: boolean;             // 当前用户是否已完成
	state: string;                 // 状态
	rating: number;                // 评分
	rating_count: number;          // 评分人数
	solves?: number;               // 完成人数
}

/**
 * HTB Sherlock API 响应类型（详情接口）
 * 基于真实 API: GET /api/v4/sherlocks/:id/info
 */
export interface HTBSherlockApiResponse {
	data: {
		id: number;
		name: string;
		description: string;           // Sherlock 描述（任务场景、目标、考点）
		difficulty: string;
		retired: boolean;
		release_at: string;
		state: string;
		category_id: number;
		category_name: string;
		show_go_vip: boolean;
		isTodo: boolean;
		rating: number;
		rating_count: number;
		auth_user_has_reviewed: boolean;
		user_can_review: boolean;
		writeup_visible: boolean;
		avatar: string;
		favorite: boolean;
		user_owns_count: number;       // 已完成人数
		tags: Array<{
			id: number;
			name: string;
			tag_category_id: number;
		}>;
		play_methods: string[];
		academyModules?: Array<{       // 相关学习模块
			id: number;
			name: string;
			logo: string;
			avatar: string;
			difficulty: {
				id: number;
				text: string;
				title: string;
				color: string;
				level: number;
			};
			tier: {
				id: number;
				name: string;
				number: number;
				color: string;
			};
			url: string;
		}>;
	};
}

/**
 * HTB Sherlock 列表 API 响应类型
 */
export interface HTBSherlockListApiResponse {
	data: HTBSherlockSearchResult[];
	links: {
		first: string;
		last: string;
		prev: string | null;
		next: string | null;
	};
	meta: {
		current_page: number;
		from: number;
		last_page: number;
		path: string;
		per_page: number;
		to: number;
		total: number;
	};
}

