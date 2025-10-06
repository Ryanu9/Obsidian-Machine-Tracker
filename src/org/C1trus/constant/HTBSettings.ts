/**
 * 文件夹模板规则 - 为不同文件夹指定不同的模板
 */
export interface FolderTemplateRule {
	id: string;                   // 规则 ID
	name: string;                 // 规则名称（便于识别）
	enabled: boolean;             // 是否启用
	priority: number;             // 优先级 (数字越大优先级越高)
	
	// 文件夹路径匹配规则
	folderPath: string;           // 目标文件夹路径，例如: "HTB/Easy" 或 "HTB/Linux/Hard"
	matchSubfolders: boolean;     // 是否匹配子文件夹（默认 true）
	
	// 文件名模板
	fileNameTemplate?: string;    // 文件名模板，例如: "{{name}}" 或 "{{name}}-{{difficulty}}"
	
	// 模板配置
	useBuiltInTemplate: boolean;  // 是否使用内置模板（默认 true）
	templateFile?: string;        // 外部模板文件路径
	templateContent?: string;     // 内置模板内容（优先于 templateFile）
}

/**
 * 类型特定的默认模板配置
 */
export interface TypeTemplateSettings {
	defaultDataFilePath: string;      // 默认数据文件夹路径
	defaultFileNameTemplate: string;  // 默认文件名模板
	defaultAttachmentPath: string;    // 默认附件路径
	useDefaultBuiltInTemplate: boolean; // 是否使用内置默认模板（默认 true）
	defaultTemplateFile: string;      // 外部默认模板文件路径
	defaultTemplateContent: string;   // 内置默认模板内容
	
	// 文件夹模板规则
	folderTemplateRules: FolderTemplateRule[];
	enableFolderTemplates: boolean;  // 是否启用文件夹模板
}

/**
 * HTB Plugin Settings
 */
export interface HTBPluginSettings {
	// API Settings
	apiToken: string;
	apiBaseUrl: string;

	// 默认模板设置（旧版兼容，用于 Machine）
	defaultDataFilePath: string;      // 默认数据文件夹路径
	defaultFileNameTemplate: string;  // 默认文件名模板
	defaultAttachmentPath: string;    // 默认附件路径
	useDefaultBuiltInTemplate: boolean; // 是否使用内置默认模板（默认 true）
	defaultTemplateFile: string;      // 外部默认模板文件路径
	defaultTemplateContent: string;   // 内置默认模板内容
	
	// 文件夹模板规则（旧版兼容）
	folderTemplateRules: FolderTemplateRule[];
	enableFolderTemplates: boolean;  // 是否启用文件夹模板

	// 各类型独立的模板配置
	machineTemplate?: TypeTemplateSettings;
	challengeTemplate?: TypeTemplateSettings;
	sherlockTemplate?: TypeTemplateSettings;

	// Sherlock 缓存数据
	sherlockCache?: any[];            // 缓存的 Sherlock 列表
	sherlockCacheTime?: number;       // 缓存时间戳

	// Challenge 缓存数据
	challengeCache?: any[];           // 缓存的 Challenge 列表
	challengeCacheTime?: number;      // 缓存时间戳

	// UI Settings
	statusBar: boolean;
	openAfterCreate: boolean;

	// Advanced Settings
	debug: boolean;
	timeout: number;
}

/**
 * 默认模板内容 - Machine
 */
export const DEFAULT_MACHINE_TEMPLATE_CONTENT = `---
id: {{id}}
name: {{name}}
os: {{os}}
difficulty: {{difficultyText}}
difficultyNum: {{difficultyNum}}
rating: {{rating}}
stars: {{stars}}
avatar: {{avatar}}
release: {{release}}
creatorName: {{creatorName}}
creatorId: {{creatorId}}
creatorAvatar: {{creatorAvatar}}
creatorProfileUrl: {{creatorProfileUrl}}
isRespected: {{isRespected}}
creator2Name: {{creator2Name}}
creator2Id: {{creator2Id}}
creator2Avatar: {{creator2Avatar}}
creator2ProfileUrl: {{creator2ProfileUrl}}
isRespected2: {{isRespected2}}
points: {{points}}
staticPoints: {{staticPoints}}
userOwnsCount: {{userOwnsCount}}
rootOwnsCount: {{rootOwnsCount}}
reviewsCount: {{reviewsCount}}
retired: {{retired}}
isFree: {{isFree}}
isActive: {{isActive}}
isTodo: {{isTodo}}
isSpawned: {{isSpawned}}
ip: {{ip}}
userBloodUser: {{userBloodUser}}
userBloodUserId: {{userBloodUserId}}
userBloodUserAvatar: {{userBloodUserAvatar}}
userBloodTime: {{userBloodTime}}
firstUserBloodTime: {{firstUserBloodTime}}
rootBloodUser: {{rootBloodUser}}
rootBloodUserId: {{rootBloodUserId}}
rootBloodUserAvatar: {{rootBloodUserAvatar}}
rootBloodTime: {{rootBloodTime}}
firstRootBloodTime: {{firstRootBloodTime}}
authUserFirstUserTime: {{authUserFirstUserTime}}
authUserFirstRootTime: {{authUserFirstRootTime}}
authUserInUserOwns: {{authUserInUserOwns}}
authUserInRootOwns: {{authUserInRootOwns}}
authUserHasReviewed: {{authUserHasReviewed}}
authUserHasSubmittedMatrix: {{authUserHasSubmittedMatrix}}
userCanReview: {{userCanReview}}
recommended: {{recommended}}
isFavorite: {{favorite}}
seasonId: {{seasonId}}
spFlag: {{spFlag}}
canAccessWalkthrough: {{canAccessWalkthrough}}
hasChangelog: {{hasChangelog}}
isGuidedEnabled: {{isGuidedEnabled}}
startMode: {{startMode}}
showGoVip: {{showGoVip}}
showGoVipServer: {{showGoVipServer}}
ownRank: {{ownRank}}
machineMode: {{machineMode}}
priceTier: {{priceTier}}
requiredSubscription: {{requiredSubscription}}
switchServerWarning: {{switchServerWarning}}
isSingleFlag: {{isSingleFlag}}
playInfoIsSpawned: {{playInfoIsSpawned}}
playInfoIsSpawning: {{playInfoIsSpawning}}
playInfoIsActive: {{playInfoIsActive}}
playInfoActivePlayerCount: {{playInfoActivePlayerCount}}
playInfoExpiresAt: {{playInfoExpiresAt}}
feedbackCake: {{feedbackCake}}
feedbackVeryEasy: {{feedbackVeryEasy}}
feedbackEasy: {{feedbackEasy}}
feedbackTooEasy: {{feedbackTooEasy}}
feedbackMedium: {{feedbackMedium}}
feedbackBitHard: {{feedbackBitHard}}
feedbackHard: {{feedbackHard}}
feedbackTooHard: {{feedbackTooHard}}
feedbackExHard: {{feedbackExHard}}
feedbackBrainFuck: {{feedbackBrainFuck}}
tierId: {{tierId}}
isSp: {{isSp}}
url: {{url}}
---

![300]({{avatar}})

# {{name}}

## 📋 基本信息

| 项目 | 内容 |
|------|------|
| **机器名称** | {{name}} |
| **机器ID** | {{id}} |
| **操作系统** | {{os}} |
| **难度** | {{difficultyText}} (难度值: {{difficultyNum}}) |
| **评分** | {{rating}} / 5.0 |
| **发布日期** | {{release}} |
| **状态** | {{retired}} |
| **免费/VIP** | {{isFree}} |
| **IP地址** | {{ip}} |
| **HTB URL** | {{url}} |

## 👥 制作者信息

### 主要制作者
- **姓名**: {{creatorName}}
- **ID**: {{creatorId}}
- **头像**: ![]({{creatorAvatar}})
- **Profile**: {{creatorProfileUrl}}
- **受尊敬**: {{isRespected}}

### 第二制作者
- **姓名**: {{creator2Name}}
- **ID**: {{creator2Id}}
- **头像**: ![]({{creator2Avatar}})
- **Profile**: {{creator2ProfileUrl}}
- **受尊敬**: {{isRespected2}}

## 📊 统计数据

| 项目 | 数值 |
|------|------|
| **积分** | {{points}} (静态: {{staticPoints}}) |
| **User Owns** | {{userOwnsCount}} |
| **Root Owns** | {{rootOwnsCount}} |
| **评论数** | {{reviewsCount}} |
| **推荐度** | {{recommended}} |
| **赛季ID** | {{seasonId}} |
| **自己的排名** | {{ownRank}} |

## 🩸 首杀记录

### User Flag 首杀
- **用户**: {{userBloodUser}} (ID: {{userBloodUserId}})
- **头像**: ![]({{userBloodUserAvatar}})
- **用时**: {{userBloodTime}}
- **绝对时间**: {{firstUserBloodTime}}

### Root Flag 首杀
- **用户**: {{rootBloodUser}} (ID: {{rootBloodUserId}})
- **头像**: ![]({{rootBloodUserAvatar}})
- **用时**: {{rootBloodTime}}
- **绝对时间**: {{firstRootBloodTime}}

## 👤 个人进度

| 项目 | 状态 |
|------|------|
| **User完成用时** | {{authUserFirstUserTime}} |
| **Root完成用时** | {{authUserFirstRootTime}} |
| **拥有User Flag** | {{authUserInUserOwns}} |
| **拥有Root Flag** | {{authUserInRootOwns}} |
| **是否收藏** | {{favorite}} |
| **是否待办** | {{isTodo}} |
| **已评论** | {{authUserHasReviewed}} |
| **已提交Matrix** | {{authUserHasSubmittedMatrix}} |
| **可以评论** | {{userCanReview}} |

## 🎮 播放信息

| 项目 | 状态 |
|------|------|
| **已生成实例** | {{playInfoIsSpawned}} |
| **正在生成** | {{playInfoIsSpawning}} |
| **已激活** | {{playInfoIsActive}} |
| **活跃玩家数** | {{playInfoActivePlayerCount}} |
| **过期时间** | {{playInfoExpiresAt}} |
| **启动模式** | {{startMode}} |

## 📈 难度反馈统计

| 难度评价 | 数量 |
|---------|------|
| 🍰 Piece of Cake | {{feedbackCake}} |
| 😊 Very Easy | {{feedbackVeryEasy}} |
| 🟢 Easy | {{feedbackEasy}} |
| 🟡 Too Easy | {{feedbackTooEasy}} |
| 🟠 Medium | {{feedbackMedium}} |
| 🔶 A Bit Hard | {{feedbackBitHard}} |
| 🔴 Hard | {{feedbackHard}} |
| ⚫ Too Hard | {{feedbackTooHard}} |
| 💀 Extremely Hard | {{feedbackExHard}} |
| 🧠 Brain Fuck | {{feedbackBrainFuck}} |

## 📝 机器简介

{{synopsis}}

## 🔑 初始状态说明

{{infoStatus}}

## ⚙️ 其他信息

| 项目 | 值 |
|------|------|
| **SP标记** | {{spFlag}} |
| **可访问攻略** | {{canAccessWalkthrough}} |
| **有更新日志** | {{hasChangelog}} |
| **启用引导** | {{isGuidedEnabled}} |
| **显示VIP提示** | {{showGoVip}} |
| **显示VIP服务器** | {{showGoVipServer}} |
| **机器模式** | {{machineMode}} |
| **价格等级** | {{priceTier}} |
| **需要订阅** | {{requiredSubscription}} |
| **切换服务器警告** | {{switchServerWarning}} |
| **单Flag模式** | {{isSingleFlag}} |
| **等级ID** | {{tierId}} |
| **是否SP** | {{isSp}} |
`;

/**
 * 默认模板内容 - Challenge
 */
export const DEFAULT_CHALLENGE_TEMPLATE_CONTENT = `---
id: {{id}}
name: {{name}}
category: {{category}}
difficulty: {{difficulty}}
avgDifficulty: {{avgDifficulty}}
rating: {{rating}}
stars: {{stars}}
release: {{release}}
authUserSolveTime: {{authUserSolveTime}}
creatorName: {{creatorName}}
creatorId: {{creatorId}}
creatorAvatar: {{creatorAvatar}}
isRespected: {{isRespected}}
creator2Name: {{creator2Name}}
creator2Id: {{creator2Id}}
creator2Avatar: {{creator2Avatar}}
isRespected2: {{isRespected2}}
firstBloodUser: {{firstBloodUser}}
firstBloodUserId: {{firstBloodUserId}}
firstBloodUserAvatar: {{firstBloodUserAvatar}}
firstBloodTime: {{firstBloodTime}}
download: {{download}}
fileName: {{fileName}}
fileSize: {{fileSize}}
sha256: {{sha256}}
docker: {{docker}}
dockerIp: {{dockerIp}}
dockerPorts: {{dockerPorts}}
dockerStatus: {{dockerStatus}}
playInfoStatus: {{playInfoStatus}}
playInfoExpiresAt: {{playInfoExpiresAt}}
playInfoIp: {{playInfoIp}}
playInfoPorts: {{playInfoPorts}}
points: {{points}}
staticPoints: {{staticPoints}}
solves: {{solves}}
likes: {{likes}}
dislikes: {{dislikes}}
likeByAuthUser: {{likeByAuthUser}}
dislikeByAuthUser: {{dislikeByAuthUser}}
reviewsCount: {{reviewsCount}}
retired: {{retired}}
state: {{state}}
released: {{released}}
authUserSolve: {{authUserSolve}}
isActive: {{isActive}}
isTodo: {{isTodo}}
recommended: {{recommended}}
authUserHasReviewed: {{authUserHasReviewed}}
userCanReview: {{userCanReview}}
canAccessWalkthrough: {{canAccessWalkthrough}}
hasChangelog: {{hasChangelog}}
showGoVip: {{showGoVip}}
userSubmittedDifficulty: {{userSubmittedDifficulty}}
playMethods: {{playMethods}}
feedbackCake: {{feedbackCake}}
feedbackVeryEasy: {{feedbackVeryEasy}}
feedbackEasy: {{feedbackEasy}}
feedbackTooEasy: {{feedbackTooEasy}}
feedbackMedium: {{feedbackMedium}}
feedbackBitHard: {{feedbackBitHard}}
feedbackHard: {{feedbackHard}}
feedbackTooHard: {{feedbackTooHard}}
feedbackExHard: {{feedbackExHard}}
feedbackBrainFuck: {{feedbackBrainFuck}}
tags: {{tags}}
url: {{url}}
---

# {{name}}

## 📋 基本信息

| 项目 | 内容 |
|------|------|
| **挑战名称** | {{name}} |
| **挑战ID** | {{id}} |
| **类别** | {{category}} |
| **难度** | {{difficulty}} (平均难度: {{avgDifficulty}}) |
| **评分** | {{rating}} / 5.0 ({{stars}} 星) |
| **发布日期** | {{release}} |
| **状态** | {{retired}} |
| **HTB URL** | {{url}} |

## 👥 制作者信息

### 主要制作者
- **姓名**: {{creatorName}}
- **ID**: {{creatorId}}
- **头像**: ![]({{creatorAvatar}})
- **受尊敬**: {{isRespected}}

### 第二制作者
- **姓名**: {{creator2Name}}
- **ID**: {{creator2Id}}
- **头像**: ![]({{creator2Avatar}})
- **受尊敬**: {{isRespected2}}

## 📊 统计数据

| 项目 | 数值 |
|------|------|
| **积分** | {{points}} (静态: {{staticPoints}}) |
| **完成人数** | {{solves}} |
| **点赞数** | {{likes}} |
| **点踩数** | {{dislikes}} |
| **评论数** | {{reviewsCount}} |
| **推荐度** | {{recommended}} |

## 🩸 首杀记录

- **首杀用户**: {{firstBloodUser}} (ID: {{firstBloodUserId}})
- **首杀头像**: ![]({{firstBloodUserAvatar}})
- **首杀用时**: {{firstBloodTime}}

## 📝 挑战描述

{{description}}

## 🔧 技术信息

### 文件信息
- **支持下载**: {{download}}
- **文件名**: {{fileName}}
- **文件大小**: {{fileSize}}
- **SHA256**: {{sha256}}

### Docker 信息
- **Docker环境**: {{docker}}
- **Docker IP**: {{dockerIp}}
- **Docker端口**: {{dockerPorts}}
- **Docker状态**: {{dockerStatus}}

### 播放信息
- **状态**: {{playInfoStatus}}
- **过期时间**: {{playInfoExpiresAt}}
- **IP地址**: {{playInfoIp}}
- **端口**: {{playInfoPorts}}
- **启动方式**: {{playMethods}}

## 👤 个人进度

| 项目 | 状态 |
|------|------|
| **已解决** | {{authUserSolve}} |
| **解题用时** | {{authUserSolveTime}} |
| **已点赞** | {{likeByAuthUser}} |
| **已点踩** | {{dislikeByAuthUser}} |
| **是否待办** | {{isTodo}} |
| **已评论** | {{authUserHasReviewed}} |
| **可以评论** | {{userCanReview}} |

## 📈 难度反馈统计

| 难度评价 | 数量 |
|---------|------|
| 🍰 Piece of Cake | {{feedbackCake}} |
| 😊 Very Easy | {{feedbackVeryEasy}} |
| 🟢 Easy | {{feedbackEasy}} |
| 🟡 Too Easy | {{feedbackTooEasy}} |
| 🟠 Medium | {{feedbackMedium}} |
| 🔶 A Bit Hard | {{feedbackBitHard}} |
| 🔴 Hard | {{feedbackHard}} |
| ⚫ Too Hard | {{feedbackTooHard}} |
| 💀 Extremely Hard | {{feedbackExHard}} |
| 🧠 Brain Fuck | {{feedbackBrainFuck}} |

## 🏷️ 标签

{{tags}}

## ⚙️ 其他信息

| 项目 | 值 |
|------|------|
| **活跃状态** | {{isActive}} |
| **状态** | {{state}} |
| **已发布** | {{released}} |
| **可访问攻略** | {{canAccessWalkthrough}} |
| **有更新日志** | {{hasChangelog}} |
| **显示VIP提示** | {{showGoVip}} |
| **用户提交难度** | {{userSubmittedDifficulty}} |
`;

/**
 * 默认模板内容 - Sherlock
 */
export const DEFAULT_SHERLOCK_TEMPLATE_CONTENT = `---
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

/**
 * 默认模板内容（旧版兼容，默认指向 Machine）
 */
export const DEFAULT_TEMPLATE_CONTENT = DEFAULT_MACHINE_TEMPLATE_CONTENT;

/**
 * 模板字段数据结构
 */
export interface TemplateField {
	field: string;
	description: string;
	example: string;
	applicableTo: string; // "All", "Machine", "Challenge", "Sherlock"
}

/**
 * 模板字段列表（用于表格展示）
 */
export const TEMPLATE_FIELDS: TemplateField[] = [
	// ==================== Machine 字段 ====================
	// 基本信息
	{ field: "{{id}}", description: "机器 ID", example: "298", applicableTo: "Machine" },
	{ field: "{{name}}", description: "机器名称", example: "Laboratory", applicableTo: "Machine" },
	{ field: "{{title}}", description: "机器名称（同 name）", example: "Laboratory", applicableTo: "Machine" },
	{ field: "{{type}}", description: "类型（固定值）", example: "Machine", applicableTo: "Machine" },
	{ field: "{{url}}", description: "机器详情页 URL", example: "https://app.hackthebox.com/machines/298", applicableTo: "Machine" },
	{ field: "{{OS}}", description: "操作系统", example: "Linux / Windows / FreeBSD", applicableTo: "Machine" },
	{ field: "{{os}}", description: "操作系统（同 OS）", example: "Linux", applicableTo: "Machine" },
	
	// 难度与评分
	{ field: "{{difficulty}}", description: "难度等级文本", example: "Easy / Medium / Hard / Insane", applicableTo: "Machine" },
	{ field: "{{difficultyText}}", description: "难度等级文本（同 difficulty）", example: "Easy", applicableTo: "Machine" },
	{ field: "{{difficultyNum}}", description: "难度数值（社区评分）", example: "50（范围：10-100）", applicableTo: "Machine" },
	{ field: "{{rating}}", description: "用户评分", example: "4.2（范围：0-5）", applicableTo: "Machine" },
	{ field: "{{score}}", description: "用户评分（同 rating）", example: "4.2", applicableTo: "Machine" },
	{ field: "{{stars}}", description: "星级评分（原始数值）", example: "4.2", applicableTo: "Machine" },
	{ field: "{{scoreStar}}", description: "星级评分（星星图标）", example: "⭐⭐⭐⭐", applicableTo: "Machine" },
	
	// 状态信息
	{ field: "{{active}}", description: "是否为活跃机器", example: "true / false", applicableTo: "Machine" },
	{ field: "{{retired}}", description: "退役状态文本", example: "已退役 / 活跃中", applicableTo: "Machine" },
	{ field: "{{retiredStatus}}", description: "退役状态布尔值", example: "true / false", applicableTo: "Machine" },
	{ field: "{{free}}", description: "是否免费（VIP 限制）", example: "true / false", applicableTo: "Machine" },
	{ field: "{{isCompleted}}", description: "当前用户是否已完成", example: "true / false", applicableTo: "Machine" },
	{ field: "{{favorite}}", description: "是否已完成（同 isCompleted）", example: "true / false", applicableTo: "Machine" },
	
	// 所有权信息
	{ field: "{{ownedUser}}", description: "是否拥有 User Flag", example: "true / false", applicableTo: "Machine" },
	{ field: "{{ownedRoot}}", description: "是否拥有 Root Flag", example: "true / false", applicableTo: "Machine" },
	{ field: "{{completedAt}}", description: "完成时间（如果已完成）", example: "2025-10-06 14:30", applicableTo: "Machine" },
	
	// 积分与统计
	{ field: "{{points}}", description: "总积分", example: "20", applicableTo: "Machine" },
	{ field: "{{staticPoints}}", description: "固定积分", example: "20", applicableTo: "Machine" },
	{ field: "{{userPoints}}", description: "User Flag 积分", example: "20", applicableTo: "Machine" },
	{ field: "{{rootPoints}}", description: "Root Flag 积分", example: "30", applicableTo: "Machine" },
	{ field: "{{userOwns}}", description: "User Flag 拥有者数量", example: "218", applicableTo: "Machine" },
	{ field: "{{rootOwns}}", description: "Root Flag 拥有者数量", example: "196", applicableTo: "Machine" },
	
	// 时间信息
	{ field: "{{release}}", description: "发布时间（完整时间戳）", example: "2020-11-14T17:00:00.000000Z", applicableTo: "Machine" },
	{ field: "{{releaseDate}}", description: "发布日期", example: "2020-11-14", applicableTo: "Machine" },
	{ field: "{{datePublished}}", description: "发布日期（同 releaseDate）", example: "2020-11-14", applicableTo: "Machine" },
	{ field: "{{currentDate}}", description: "当前日期时间（UTC+8）", example: "2025-10-06 14:30", applicableTo: "Machine" },
	{ field: "{{currentTime}}", description: "当前完整时间（UTC+8）", example: "2025-10-06 14:30:45", applicableTo: "Machine" },
	
	// 制作者信息
	{ field: "{{author}}", description: "制作者（YAML 链接格式）", example: "- [0xc45](https://app.hackthebox.com/profile/73268)", applicableTo: "Machine" },
	{ field: "{{maker}}", description: "制作者（同 author）", example: "- [0xc45](https://app.hackthebox.com/profile/73268)", applicableTo: "Machine" },
	
	// 图片与网络
	{ field: "{{avatar}}", description: "机器封面图片 URL", example: "https://htb-mp-prod-public-storage.s3.eu-central-1.amazonaws.com/avatars/...", applicableTo: "Machine" },
	{ field: "{{image}}", description: "封面图片 URL（同 avatar）", example: "https://...", applicableTo: "Machine" },
	{ field: "{{imageUrl}}", description: "封面图片 URL（同 avatar）", example: "https://...", applicableTo: "Machine" },
	{ field: "{{ip}}", description: "机器 IP 地址（需先启动）", example: "10.10.10.216", applicableTo: "Machine" },
	
	// 标签
	{ field: "{{tags}}", description: "标签列表（逗号分隔）", example: "Linux, Web, SSH", applicableTo: "Machine" },
	
	
	// ==================== Challenge 字段 ====================
	// 基本信息
	{ field: "{{id}}", description: "挑战 ID", example: "70", applicableTo: "Challenge" },
	{ field: "{{name}}", description: "挑战名称", example: "Crooked Crockford", applicableTo: "Challenge" },
	{ field: "{{title}}", description: "挑战名称（同 name）", example: "Crooked Crockford", applicableTo: "Challenge" },
	{ field: "{{type}}", description: "类型（固定值）", example: "Challenge", applicableTo: "Challenge" },
	{ field: "{{url}}", description: "挑战详情页 URL", example: "https://app.hackthebox.com/challenges/70", applicableTo: "Challenge" },
	{ field: "{{category}}", description: "挑战分类", example: "Reversing / Crypto / Stego / Pwn / Web / Misc / Forensics / Mobile / OSINT / Hardware", applicableTo: "Challenge" },
	{ field: "{{categoryName}}", description: "分类名称（同 category）", example: "Misc", applicableTo: "Challenge" },
	
	// 难度与评分
	{ field: "{{difficulty}}", description: "难度等级", example: "Easy / Medium / Hard", applicableTo: "Challenge" },
	{ field: "{{difficultyText}}", description: "难度等级（同 difficulty）", example: "Medium", applicableTo: "Challenge" },
	{ field: "{{difficultyNum}}", description: "平均难度投票", example: "37（范围：0-100）", applicableTo: "Challenge" },
	{ field: "{{avgDifficulty}}", description: "平均难度投票（同 difficultyNum）", example: "37", applicableTo: "Challenge" },
	{ field: "{{rating}}", description: "用户评分", example: "4.5（范围：0-5）", applicableTo: "Challenge" },
	{ field: "{{score}}", description: "用户评分（同 rating）", example: "4.5", applicableTo: "Challenge" },
	{ field: "{{stars}}", description: "星级评分（原始数值）", example: "4.5", applicableTo: "Challenge" },
	{ field: "{{scoreStar}}", description: "星级评分（星星图标）", example: "⭐⭐⭐⭐⭐", applicableTo: "Challenge" },
	
	// 状态信息
	{ field: "{{retired}}", description: "是否已退役", example: "true / false", applicableTo: "Challenge" },
	{ field: "{{retiredStatus}}", description: "退役状态（同 retired）", example: "true / false", applicableTo: "Challenge" },
	{ field: "{{isCompleted}}", description: "当前用户是否已完成", example: "true / false", applicableTo: "Challenge" },
	{ field: "{{solved}}", description: "是否已解决（同 isCompleted）", example: "true / false", applicableTo: "Challenge" },
	{ field: "{{authUserSolve}}", description: "当前用户是否已解决", example: "true / false", applicableTo: "Challenge" },
	{ field: "{{favorite}}", description: "是否已收藏", example: "true / false", applicableTo: "Challenge" },
	{ field: "{{isActive}}", description: "是否活跃", example: "true / false", applicableTo: "Challenge" },
	{ field: "{{isTodo}}", description: "是否在待办列表", example: "true / false", applicableTo: "Challenge" },
	
	// 积分与统计
	{ field: "{{points}}", description: "挑战积分", example: "30 / 60 / 80", applicableTo: "Challenge" },
	{ field: "{{solves}}", description: "解题人数", example: "2260", applicableTo: "Challenge" },
	{ field: "{{likes}}", description: "点赞数", example: "699", applicableTo: "Challenge" },
	{ field: "{{dislikes}}", description: "点踩数", example: "93", applicableTo: "Challenge" },
	{ field: "{{likeByAuthUser}}", description: "当前用户是否点赞", example: "true / false", applicableTo: "Challenge" },
	{ field: "{{dislikeByAuthUser}}", description: "当前用户是否点踩", example: "true / false", applicableTo: "Challenge" },
	
	// 时间信息
	{ field: "{{releaseDate}}", description: "发布日期", example: "2019-06-13", applicableTo: "Challenge" },
	{ field: "{{release}}", description: "发布日期（同 releaseDate）", example: "2019-06-13", applicableTo: "Challenge" },
	{ field: "{{datePublished}}", description: "发布日期（同 releaseDate）", example: "2019-06-13", applicableTo: "Challenge" },
	{ field: "{{currentDate}}", description: "当前日期时间（UTC+8）", example: "2025-10-06 14:30", applicableTo: "Challenge" },
	{ field: "{{currentTime}}", description: "当前完整时间（UTC+8）", example: "2025-10-06 14:30:45", applicableTo: "Challenge" },
	{ field: "{{authUserSolveTime}}", description: "当前用户解题时间", example: "2025-10-06 14:30:45", applicableTo: "Challenge" },
	
	// 制作者信息
	{ field: "{{author}}", description: "制作者（YAML 链接格式）", example: "- [sx02089](https://app.hackthebox.com/profile/7383)", applicableTo: "Challenge" },
	{ field: "{{maker}}", description: "制作者（同 author）", example: "- [sx02089](https://app.hackthebox.com/profile/7383)", applicableTo: "Challenge" },
	{ field: "{{creatorId}}", description: "制作者 ID", example: "7383", applicableTo: "Challenge" },
	{ field: "{{creatorName}}", description: "制作者名称", example: "sx02089", applicableTo: "Challenge" },
	{ field: "{{creatorAvatar}}", description: "制作者头像 URL", example: "/storage/avatars/...", applicableTo: "Challenge" },
	{ field: "{{isRespected}}", description: "制作者是否受尊敬", example: "true / false", applicableTo: "Challenge" },
	
	// 首杀信息
	{ field: "{{firstBloodUser}}", description: "首杀用户名", example: "xct", applicableTo: "Challenge" },
	{ field: "{{firstBloodUserId}}", description: "首杀用户 ID", example: "13569", applicableTo: "Challenge" },
	{ field: "{{firstBloodTime}}", description: "首杀用时", example: "01D 21H 52M", applicableTo: "Challenge" },
	{ field: "{{firstBloodUserAvatar}}", description: "首杀用户头像 URL", example: "/storage/avatars/...", applicableTo: "Challenge" },
	
	// 图片与描述
	{ field: "{{avatar}}", description: "挑战封面图片 URL", example: "https://...", applicableTo: "Challenge" },
	{ field: "{{image}}", description: "封面图片 URL（同 avatar）", example: "https://...", applicableTo: "Challenge" },
	{ field: "{{imageUrl}}", description: "封面图片 URL（同 avatar）", example: "https://...", applicableTo: "Challenge" },
	{ field: "{{description}}", description: "挑战描述", example: "Some bits are missing", applicableTo: "Challenge" },
	
	// 下载信息
	{ field: "{{download}}", description: "是否可下载", example: "true / false", applicableTo: "Challenge" },
	{ field: "{{sha256}}", description: "下载文件 SHA256", example: "41a427e48b765325d40be361b312e1a727e8266b...", applicableTo: "Challenge" },
	
	// Docker 信息
	{ field: "{{docker}}", description: "Docker 配置", example: "null 或配置对象", applicableTo: "Challenge" },
	{ field: "{{dockerIp}}", description: "Docker IP", example: "10.10.10.1", applicableTo: "Challenge" },
	{ field: "{{dockerPort}}", description: "Docker 端口", example: "1337", applicableTo: "Challenge" },
	
	// 其他
	{ field: "{{recommended}}", description: "推荐标记", example: "0 / 1", applicableTo: "Challenge" },
	
	
	// ==================== Sherlock 字段 ====================
	// 基本信息
	{ field: "{{id}}", description: "Sherlock ID", example: "631", applicableTo: "Sherlock" },
	{ field: "{{name}}", description: "Sherlock 名称", example: "Brutus", applicableTo: "Sherlock" },
	{ field: "{{title}}", description: "Sherlock 名称（同 name）", example: "Brutus", applicableTo: "Sherlock" },
	{ field: "{{type}}", description: "类型（固定值）", example: "Sherlock", applicableTo: "Sherlock" },
	{ field: "{{url}}", description: "Sherlock 详情页 URL", example: "https://app.hackthebox.com/sherlocks/631", applicableTo: "Sherlock" },
	{ field: "{{category}}", description: "类别名称", example: "DFIR / Threat Intelligence / SOC", applicableTo: "Sherlock" },
	{ field: "{{categoryName}}", description: "类别名称（同 category）", example: "DFIR", applicableTo: "Sherlock" },
	{ field: "{{categoryId}}", description: "类别 ID", example: "14", applicableTo: "Sherlock" },
	
	// 难度与评分
	{ field: "{{difficulty}}", description: "难度等级", example: "Very Easy / Easy / Medium / Hard / Insane", applicableTo: "Sherlock" },
	{ field: "{{difficultyText}}", description: "难度等级（同 difficulty）", example: "Very Easy", applicableTo: "Sherlock" },
	{ field: "{{rating}}", description: "用户评分", example: "4.657（范围：0-5）", applicableTo: "Sherlock" },
	{ field: "{{score}}", description: "用户评分（同 rating）", example: "4.657", applicableTo: "Sherlock" },
	{ field: "{{stars}}", description: "星级评分（原始数值）", example: "4.657", applicableTo: "Sherlock" },
	{ field: "{{scoreStar}}", description: "星级评分（星星图标）", example: "⭐⭐⭐⭐⭐", applicableTo: "Sherlock" },
	{ field: "{{ratingCount}}", description: "评分人数", example: "1520", applicableTo: "Sherlock" },
	
	// 状态信息
	{ field: "{{retired}}", description: "是否已退役", example: "true / false", applicableTo: "Sherlock" },
	{ field: "{{retiredStatus}}", description: "退役状态（同 retired）", example: "true / false", applicableTo: "Sherlock" },
	{ field: "{{state}}", description: "状态", example: "active / retired / retired_free", applicableTo: "Sherlock" },
	{ field: "{{isOwned}}", description: "当前用户是否已完成", example: "true / false", applicableTo: "Sherlock" },
	{ field: "{{isCompleted}}", description: "是否已完成（同 isOwned）", example: "true / false", applicableTo: "Sherlock" },
	{ field: "{{solved}}", description: "是否已解决（同 isOwned）", example: "true / false", applicableTo: "Sherlock" },
	{ field: "{{favorite}}", description: "是否已收藏", example: "true / false", applicableTo: "Sherlock" },
	{ field: "{{isTodo}}", description: "是否在待办列表", example: "true / false", applicableTo: "Sherlock" },
	{ field: "{{pinned}}", description: "是否置顶", example: "true / false", applicableTo: "Sherlock" },
	
	// 统计信息
	{ field: "{{solves}}", description: "完成人数", example: "23907", applicableTo: "Sherlock" },
	{ field: "{{userOwnsCount}}", description: "完成人数（同 solves）", example: "23907", applicableTo: "Sherlock" },
	{ field: "{{points}}", description: "积分", example: "100", applicableTo: "Sherlock" },
	{ field: "{{progress}}", description: "当前用户进度", example: "0 / 1", applicableTo: "Sherlock" },
	
	// 时间信息
	{ field: "{{releaseAt}}", description: "发布时间（完整时间戳）", example: "2024-04-04T17:00:00.000000Z", applicableTo: "Sherlock" },
	{ field: "{{releaseDate}}", description: "发布日期", example: "2024-04-04", applicableTo: "Sherlock" },
	{ field: "{{release}}", description: "发布日期（同 releaseDate）", example: "2024-04-04", applicableTo: "Sherlock" },
	{ field: "{{datePublished}}", description: "发布日期（同 releaseDate）", example: "2024-04-04", applicableTo: "Sherlock" },
	{ field: "{{currentDate}}", description: "当前日期时间（UTC+8）", example: "2025-10-06 14:30", applicableTo: "Sherlock" },
	{ field: "{{currentTime}}", description: "当前完整时间（UTC+8）", example: "2025-10-06 14:30:45", applicableTo: "Sherlock" },
	
	// 图片与描述
	{ field: "{{avatar}}", description: "Sherlock 封面图片 URL", example: "/challenges/b7bb35b9c6ca2aee2df08cf09d7016c2.png", applicableTo: "Sherlock" },
	{ field: "{{image}}", description: "封面图片 URL（同 avatar）", example: "https://...", applicableTo: "Sherlock" },
	{ field: "{{imageUrl}}", description: "封面图片 URL（同 avatar）", example: "https://...", applicableTo: "Sherlock" },
	{ field: "{{description}}", description: "场景描述（详细）", example: "In this very easy Sherlock, you will familiarize yourself with...", applicableTo: "Sherlock" },
	{ field: "{{scenario}}", description: "场景描述（同 description）", example: "In this very easy Sherlock...", applicableTo: "Sherlock" },
	
	// 标签与资源
	{ field: "{{tags}}", description: "标签列表（逗号分隔）", example: "Forensics, Incident Response, SSH, Linux", applicableTo: "Sherlock" },
	{ field: "{{playMethods}}", description: "获取方式", example: "download", applicableTo: "Sherlock" },
	
	// 审查与VIP
	{ field: "{{authUserHasReviewed}}", description: "当前用户是否已评价", example: "true / false", applicableTo: "Sherlock" },
	{ field: "{{userCanReview}}", description: "当前用户是否可评价", example: "true / false", applicableTo: "Sherlock" },
	{ field: "{{writeupVisible}}", description: "是否可查看 Writeup", example: "true / false", applicableTo: "Sherlock" },
	{ field: "{{showGoVip}}", description: "是否显示 VIP 引导", example: "true / false", applicableTo: "Sherlock" },
	
	// 其他
	{ field: "{{recommended}}", description: "推荐标记", example: "0 / 1", applicableTo: "Sherlock" },
];

/**
 * 旧版文本格式的模板字段说明（保留兼容）
 */
export const TEMPLATE_FIELDS_HELP = `
## 📝 可用的模板字段

### 🔹 基本信息
- {{id}} - 项目 ID
- {{title}} / {{name}} - 项目名称
- {{type}} - 类型 (Machine/Challenge/Sherlock)
- {{OS}} / {{os}} - 操作系统 (适用: Machine, Fortress)
- {{url}} - 项目详情页 URL

### 🔹 难度信息
- {{difficulty}} - 难度文本 (Easy/Medium/Hard/Insane)
- {{difficultyNum}} - 难度数值 (10-100)

### 🔹 评分信息
- {{score}} / {{rating}} - 用户评分 (0-5)
- {{scoreStar}} / {{stars}} - 星级评分 (⭐⭐⭐⭐⭐)

### 🔹 图片
- {{image}} / {{imageUrl}} / {{avatar}} - 封面图片 URL

### 🔹 时间信息
- {{datePublished}} / {{release}} / {{releaseDate}} - 发布日期 (YYYY-MM-DD)
- {{currentDate}} - 当前日期 (YYYY-MM-DD)
- {{currentTime}} - 当前时间 (YYYY-MM-DD HH:mm:ss)
- {{completedAt}} - 完成时间 (如果已完成)

### 🔹 制作者信息
- {{author}} / {{maker}} - 制作者列表 (YAML 数组格式)

### 🔹 标签与分类
- {{tags}} - 标签列表 (逗号分隔)
- {{category}} - 挑战分类 (适用: Challenge)

### 🔹 状态信息
- {{retired}} - 退役状态文本 (已退役/活跃中) (适用: Machine)
- {{retiredStatus}} - 退役状态布尔值 (true/false) (适用: Machine)
- {{favorite}} / {{isCompleted}} - 是否已完成 (true/false)
- {{free}} - 是否免费 (适用: Machine)
- {{active}} - 是否活跃 (适用: Machine)
- {{solved}} - 是否已解决 (适用: Challenge, Sherlock)

### 🔹 所有权信息
- {{ownedUser}} - 是否拥有 User Flag (适用: Machine)
- {{ownedRoot}} - 是否拥有 Root Flag (适用: Machine)

### 🔹 积分与统计
- {{points}} - 完成后获得的积分
- {{userPoints}} - User Flag 积分 (适用: Machine)
- {{rootPoints}} - Root Flag 积分 (适用: Machine)
- {{userOwns}} - User Flag 拥有者数量 (适用: Machine)
- {{rootOwns}} - Root Flag 拥有者数量 (适用: Machine)
- {{solves}} - 解题数量 (适用: Challenge, Sherlock)

### 🔹 网络信息
- {{ip}} - IP 地址 (适用: Machine)

### 🔹 Sherlock 专用字段
- {{scenario}} - 场景描述
- {{tasks}} - 任务列表
`;

/**
 * 创建类型特定的默认模板设置
 */
export function createDefaultTypeTemplateSettings(
	type: 'Machine' | 'Challenge' | 'Sherlock'
): TypeTemplateSettings {
	const baseFolder = `HTB/${type}s`;
	let templateContent = DEFAULT_MACHINE_TEMPLATE_CONTENT;
	
	switch (type) {
		case 'Machine':
			templateContent = DEFAULT_MACHINE_TEMPLATE_CONTENT;
			break;
		case 'Challenge':
			templateContent = DEFAULT_CHALLENGE_TEMPLATE_CONTENT;
			break;
		case 'Sherlock':
			templateContent = DEFAULT_SHERLOCK_TEMPLATE_CONTENT;
			break;
	}
	
	return {
		defaultDataFilePath: baseFolder,
		defaultFileNameTemplate: "{{name}}",
		defaultAttachmentPath: `${baseFolder}/Attachments`,
		useDefaultBuiltInTemplate: true,
		defaultTemplateFile: "",
		defaultTemplateContent: templateContent,
		folderTemplateRules: [],
		enableFolderTemplates: false,
	};
}

/**
 * Default HTB Plugin Settings
 */
export const DEFAULT_HTB_SETTINGS: HTBPluginSettings = {
	// API Settings
	apiToken: "",
	apiBaseUrl: "https://www.hackthebox.com/api/v4",

	// 默认模板设置（旧版兼容）
	defaultDataFilePath: "HTB/Machines",
	defaultFileNameTemplate: "{{name}}",
	defaultAttachmentPath: "HTB/Attachments",
	useDefaultBuiltInTemplate: true,
	defaultTemplateFile: "",
	defaultTemplateContent: DEFAULT_TEMPLATE_CONTENT,
	
	// 文件夹模板规则（旧版兼容）
	folderTemplateRules: [],
	enableFolderTemplates: false,

	// 各类型独立的模板配置
	machineTemplate: createDefaultTypeTemplateSettings('Machine'),
	challengeTemplate: createDefaultTypeTemplateSettings('Challenge'),
	sherlockTemplate: createDefaultTypeTemplateSettings('Sherlock'),

	// Sherlock 缓存数据
	sherlockCache: [],
	sherlockCacheTime: 0,

	// Challenge 缓存数据
	challengeCache: [],
	challengeCacheTime: 0,

	// UI Settings
	statusBar: true,
	openAfterCreate: true,

	// Advanced Settings
	debug: false,
	timeout: 30000,
};

