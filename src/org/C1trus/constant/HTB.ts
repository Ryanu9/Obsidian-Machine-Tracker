/**
 * HTB 常量配置
 * HackTheBox API 端点和配置常量
 */

// HTB API 地址
export const HTB_API_BASE = 'https://labs.hackthebox.com/api/v4';
export const HTB_WEB_BASE = 'https://app.hackthebox.com';

// HTB API 端点
export const HTB_API_ENDPOINTS = {
	// 用户相关
	USER_INFO: '/user/info',                    // 获取用户信息
	USER_ACTIVITY: '/user/activity',            // 用户活动
	USER_PROFILE: '/user/profile/:id',          // 用户资料
	
	// 机器相关
	MACHINE_LIST: '/machine/list',              // 机器列表
	MACHINE_PROFILE: '/machine/profile/:id',    // 机器详情
	MACHINE_ACTIVE: '/machine/active',          // 活跃机器
	MACHINE_OWNS: '/machine/owns',              // 已完成机器
	MACHINE_TODO: '/machine/todo',              // 待完成机器
	MACHINE_SPAWN: '/vm/spawn',                 // 启动机器
	MACHINE_TERMINATE: '/vm/terminate',         // 终止机器
	MACHINE_RESET: '/vm/reset',                 // 重置机器
	
	// 挑战相关
	CHALLENGE_LIST: '/challenge/list',          // 挑战列表（活跃）
	CHALLENGE_LIST_RETIRED: '/challenge/list/retired', // 挑战列表（已退役）
	CHALLENGE_INFO: '/challenge/info/:id',      // 挑战详情
	CHALLENGE_OWNS: '/challenge/owns',          // 已完成挑战
	
	// Sherlock 相关
	SHERLOCK_LIST: '/sherlocks',                // Sherlock 列表（支持分页）
	SHERLOCK_INFO: '/sherlocks/:id/info',       // Sherlock 详情（包含 description）
	SHERLOCK_OWNS: '/sherlock/owns',            // 已完成 Sherlock
	
	// 搜索相关
	SEARCH: '/search/fetch',                    // 搜索
	
	// 排行榜
	LEADERBOARD: '/rankings/users',             // 用户排行榜
	
	// 其他
	NOTIFICATIONS: '/notifications',             // 通知
};

// HTB 机器难度
export enum HTBDifficulty {
	EASY = 'Easy',
	MEDIUM = 'Medium',
	HARD = 'Hard',
	INSANE = 'Insane'
}

// HTB 机器难度数值映射
export const HTBDifficultyMap = {
	Easy: 20,
	Medium: 40,
	Hard: 60,
	Insane: 90
};

// HTB 操作系统
export enum HTBOperatingSystem {
	LINUX = 'Linux',
	WINDOWS = 'Windows',
	FREEBSD = 'FreeBSD',
	OPENBSD = 'OpenBSD',
	ANDROID = 'Android',
	SOLARIS = 'Solaris',
	OTHER = 'Other'
}

// HTB 默认请求头
export const HTB_DEFAULT_HEADERS = {
	'Content-Type': 'application/json',
	'User-Agent': 'Obsidian HTB Plugin/1.0.0',
	'Accept': 'application/json',
	'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7'
};

// HTB 机器状态
export enum HTBMachineStatus {
	ACTIVE = 'active',      // 活跃
	RETIRED = 'retired',    // 退役
	TODO = 'todo',          // 待做
	COMPLETED = 'completed' // 已完成
}

// HTB 默认模版
export const HTB_DEFAULT_TEMPLATE = `---
created: {{currentTime}}
tags:
  - HTB
title: "{{title}}"
OS: {{OS}}
difficulty: {{difficulty}}
datePublished: {{datePublished}}
image: {{imageUrl}}
author:
{{author}}
comment: 
aliases:
score: {{score}}
scoreStar: {{scoreStar}}
favorite: {{favorite}}
updated: {{currentTime}}
locked: false
---

![]({{imageUrl}})
`;

// HTB 支持的导入类型
export enum HTBImportType {
	MACHINE = 'machine',
	CHALLENGE = 'challenge',
	SHERLOCK = 'sherlock',
	ENDGAME = 'endgame'
}

// HTB 同步类型
export enum HTBSyncType {
	COMPLETED_MACHINES = 'completed_machines',   // 已完成的机器
	TODO_MACHINES = 'todo_machines',             // 待完成的机器
	ACTIVE_MACHINES = 'active_machines',         // 活跃机器
	COMPLETED_CHALLENGES = 'completed_challenges', // 已完成的挑战
	COMPLETED_SHERLOCKS = 'completed_sherlocks' // 已完成的 Sherlock
}

// HTB 图片存储方式
export enum HTBImageStorage {
	LOCAL = 'local',      // 本地存储
	URL = 'url',          // 使用 URL
	BASE64 = 'base64'     // Base64 编码
}

// HTB 错误消息
export const HTB_ERROR_MESSAGES = {
	AUTH_FAILED: '认证失败，请检查 API Token 或 Cookie',
	TOKEN_EXPIRED: 'API Token 已过期，请重新登录',
	RATE_LIMIT: '请求过于频繁，请稍后再试',
	NETWORK_ERROR: '网络连接失败，请检查网络',
	MACHINE_NOT_FOUND: '未找到该机器',
	PERMISSION_DENIED: '权限不足，该机器可能需要 VIP 访问',
	INVALID_RESPONSE: '服务器响应无效'
};

// HTB 成功消息
export const HTB_SUCCESS_MESSAGES = {
	LOGIN_SUCCESS: '登录成功！欢迎 {name}',
	LOGOUT_SUCCESS: '已登出 HTB 账号',
	MACHINE_CREATED: '已创建机器笔记: {name}',
	SYNC_STARTED: '开始同步 HTB 数据...',
	SYNC_COMPLETED: '同步完成！共处理 {count} 条数据'
};

