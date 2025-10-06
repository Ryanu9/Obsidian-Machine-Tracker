/**
 * HTB 用户模型
 * 用于存储和管理 HackTheBox 用户信息
 */
export default class HTBUser {
	// 基本信息
	id?: string;           // 用户 ID
	name?: string;         // 用户名
	email?: string;        // 邮箱
	avatar?: string;       // 头像 URL
	
	// HTB 特有信息
	rank?: string;         // 排名
	rankId?: number;       // 排名 ID
	points?: number;       // 积分
	ownership?: number;    // 拥有数（完成的机器数量）
	respect?: number;      // 尊重值
	isVip?: boolean;       // 是否 VIP
	
	// 统计信息
	userOwns?: number;     // User flag 数量
	systemOwns?: number;   // Root/System flag 数量
	teamId?: number;       // 团队 ID
	teamName?: string;     // 团队名称
	
	// 认证状态
	login: boolean = false; // 登录状态
	authType?: 'token' | 'cookie'; // 认证方式
	
	// 附加信息
	url?: string;          // 个人主页 URL
	country?: string;      // 国家/地区
	university?: string;   // 大学
}
