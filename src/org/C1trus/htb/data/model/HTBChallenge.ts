/**
 * HTB Challenge 数据模型
 * 对应挑战模版中的字段
 */
export interface HTBChallenge {
	// 基本信息
	id: string;                    // 挑战 ID
	name: string;                  // 挑战名称
	category: string;              // 分类名称 (Web/Pwn/Crypto/Reversing/Forensics/Hardware/OSINT/Misc)
	challenge_category_id?: number; // 分类 ID
	
	// 难度信息
	difficulty: string;            // 难度文本 (Easy/Medium/Hard/Insane)
	difficultyNum: number;         // 难度数值 (10-100)
	
	// 评分信息
	rating: number;                // 用户评分 (0-5)
	stars: number;                 // 星级评分
	likes?: number;                // 点赞数
	dislikes?: number;             // 不喜欢数
	
	// 图片
	avatar: string;                // 挑战图标/封面
	avatarThumb?: string;          // 缩略图
	
	// 时间信息
	release: Date;                 // 发布日期
	releaseDate?: string;          // 格式化的发布日期
	retiredDate?: Date;            // 退役日期
	
	// 状态
	retired: boolean;              // 是否已退役
	active?: boolean;              // 是否为活跃挑战
	state?: string;                // 挑战状态（如 "active", "retired" 等）
	
	// 制作者信息
	maker: {
		id: string;
		name: string;
		avatar: string;
		isRespected?: boolean;     // 是否受尊敬
	}[];
	
	// 第二制作者（某些挑战有两个制作者）
	creator2?: {
		id: string;
		name: string;
		avatar: string;
		isRespected?: boolean;
	};
	
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
	authUserSolve?: boolean;       // 认证用户是否已解决（来自API）
	authUserSolveTime?: string;    // 认证用户解决用时（如 "1Y 2M 26D"）
	
	// 首杀信息
	firstBlood?: {                 // 首杀
		user: string;
		userId: string;
		userAvatar?: string;       // 首杀用户头像
		time: Date | string;       // 首杀时间
	};
	
	// 统计信息
	solves?: number;               // 解题数量
	downloads?: number;            // 下载次数
	
	// 文件信息
	hasDownload?: boolean;         // 是否有下载文件
	downloadUrl?: string;          // 下载链接
	fileName?: string;             // 文件名
	fileSize?: string;             // 文件大小
	sha256?: string;               // SHA256 哈希值
	
	// Docker 信息
	docker?: boolean;              // 是否为 Docker 挑战
	dockerUrl?: string;            // Docker 实例链接
	dockerIp?: string;             // Docker IP
	dockerPorts?: string;          // Docker 端口
	dockerStatus?: string;         // Docker 状态
	
	// 播放信息 (play_info)
	playInfoStatus?: string;       // 播放状态
	playInfoExpiresAt?: string;    // 过期时间
	playInfoIp?: string;           // 播放 IP
	playInfoPorts?: string;        // 播放端口
	
	// 描述信息
	description?: string;          // 挑战描述
	synopsis?: string;             // 挑战概要/详细说明
	
	// 难度反馈统计
	difficultyChart?: {
		counterCake?: number;
		counterVeryEasy?: number;
		counterEasy?: number;
		counterTooEasy?: number;
		counterMedium?: number;
		counterBitHard?: number;
		counterHard?: number;
		counterTooHard?: number;
		counterExHard?: number;
		counterBrainFuck?: number;
	};
	
	// 其他
	recommended?: number;          // 推荐度
	released?: number;             // 是否已发布（1=是，0=否）
	likeByAuthUser?: boolean;      // 当前用户是否点赞
	dislikeByAuthUser?: boolean;   // 当前用户是否不喜欢
	reviewsCount?: number;         // 评论数量
	authUserHasReviewed?: boolean; // 当前用户是否已评论
	userCanReview?: boolean;       // 当前用户是否可评论
	canAccessWalkthrough?: boolean;// 可以访问攻略
	hasChangelog?: boolean;        // 有更新日志
	showGoVip?: boolean;           // 显示 VIP 引导
	userSubmittedDifficulty?: number; // 用户提交的难度
	playMethods?: string[];        // 游戏方式
	
	// URL 信息
	url?: string;                  // 挑战页面 URL
}

/**
 * HTB Challenge 搜索结果
 */
export interface HTBChallengeSearchResult {
	id: string;
	name: string;
	category: string;
	difficulty: string;
	avatar: string;
	retired: boolean;
	points: number;
	rating: number;
}

/**
 * HTB Challenge API 响应类型
 */
export interface HTBChallengeApiResponse {
	info: {
		id: number;
		name: string;
		category: string;
		category_name: string;
		challenge_category_id?: number;
		avatar: string;
		avatar_thumb?: string;
		difficulty: number;
		difficultyText: string;
		static_points: number;
		stars: number;
		release: string;
		retired_date: string | null;
		active: number;
		retired: number;
		state?: string;
		maker: {
			id: number;
			name: string;
			avatar: string;
		};
		labels?: Array<{
			id: number;
			name: string;
		}>;
		points?: number;
		solves?: number;
		isCompleted?: boolean;
		isTodo?: boolean;
		isSolved?: boolean;
		downloads?: number;
		hasDownload?: boolean;
		docker?: boolean;
		recommended?: number;
		description?: string;
		synopsis?: string;
		likes?: number;
		dislikes?: number;
		firstBlood?: {
			user: {
				id: number;
				name: string;
			};
			created_at: string;
		};
	};
}

