import HTBUser from "./HTBUser";
import {log} from "../../utils/Logutil";
import {Notice, requestUrl} from "obsidian";
import { HTBPluginSettings } from "../../constant/HTBSettings";

/**
 * HTB 认证组件
 * 负责管理 HTB 用户登录、认证状态
 */
export default class HTBAuthComponent {
	private settings: HTBPluginSettings;
	private user: HTBUser;
	
	// HTB API 基础地址
	private readonly HTB_API_BASE = 'https://labs.hackthebox.com/api/v4';
	private readonly HTB_WEB_BASE = 'https://app.hackthebox.com';
	
	constructor(settings: HTBPluginSettings) {
		this.settings = settings;
	}
	
	/**
	 * 获取当前用户
	 */
	getUser(): HTBUser {
		return this.user;
	}
	
	/**
	 * 获取用户 ID
	 */
	getUserId(): string {
		return this.user?.id || null;
	}
	
	/**
	 * 检查是否已登录
	 */
	isLogin(): boolean {
		return this.user && this.user.login;
	}
	
	/**
	 * 检查是否已认证
	 */
	isAuthenticated(): boolean {
		return !!(this.settings.apiToken || this.user?.login);
	}
	
	/**
	 * 检查是否需要登录
	 */
	needLogin(): boolean {
		const token = this.settings.apiToken;
		
		if (!token) {
			return true;
		}
		return !this.isLogin();
	}
	
	/**
	 * 通过 API Token 登录
	 * @param token HTB API Token
	 */
	async loginWithToken(token: string): Promise<HTBUser> {
		if (!token || token.trim() === '') {
			throw new Error('API Token 不能为空');
		}
		
		if (this.settings.debug) {
			console.log('HTB 认证: 开始使用 API Token 登录');
		}
		
		const headers = {
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json',
			'User-Agent': 'Obsidian HTB Plugin'
		};
		
		try {
			// 验证 token 并获取用户信息
			const response = await requestUrl({
				url: `${this.HTB_API_BASE}/user/info`,
				method: 'GET',
				headers: headers
			});
			
			if (response.status === 200 && response.json) {
				const data = response.json;
				
				if (data.info) {
					this.user = this.parseUserFromApi(data.info);
					this.user.login = true;
					this.user.authType = 'token';
					
					// 保存 token
					this.settings.apiToken = token;
					
					if (this.settings.debug) {
						console.log(`HTB 认证: 登录成功, 用户: ${this.user.name} (${this.user.id})`);
					}
					log.info(`HTB 用户 ${this.user.name} 登录成功`);
					
					return this.user;
				}
			}
			
			throw new Error(`认证失败: ${response.status}`);
			
		} catch (e) {
			if (this.settings.debug) {
				console.log(`HTB 认证失败: ${e.message}`);
			}
			log.error('HTB Token 验证失败', e);
			
			if (e.message.includes('401')) {
				throw new Error('API Token 无效或已过期');
			} else if (e.message.includes('429')) {
				throw new Error('请求过于频繁，请稍后再试');
			} else if (e.message.includes('network') || e.message.includes('ENOTFOUND')) {
				throw new Error('网络连接失败，请检查网络');
			}
			
			throw new Error(`登录失败: ${e.message}`);
		}
	}
	
	/**
	 * 自动登录（从保存的凭证）
	 */
	async autoLogin(): Promise<HTBUser> {
		const token = this.settings.apiToken;
		
		if (token) {
			if (this.settings.debug) {
				console.log('HTB 认证: 尝试使用保存的 Token 自动登录');
			}
			try {
				return await this.loginWithToken(token);
			} catch (e) {
				if (this.settings.debug) {
					console.log(`HTB 认证: Token 自动登录失败: ${e.message}`);
				}
				// Token 失效，清除
				this.settings.apiToken = '';
			}
		}
		
		return null;
	}
	
	/**
	 * 登出
	 */
	logout(): void {
		if (this.user) {
			const userName = this.user.name;
			this.user.login = false;
			this.user = null;
			
			// 清除保存的凭证
			this.settings.apiToken = '';
			
			if (this.settings.debug) {
				console.log(`HTB 认证: 用户 ${userName} 已登出`);
			}
			new Notice('已登出 HTB 账号');
		}
	}
	
	/**
	 * 获取认证请求头
	 */
	getAuthHeaders(): any {
		const token = this.settings.apiToken;
		
		if (token) {
			return {
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'application/json',
				'User-Agent': 'Obsidian HTB Plugin'
			};
		}
		
		return null;
	}
	
	/**
	 * 检查是否为 VIP
	 */
	isVip(): boolean {
		return this.user?.isVip || false;
	}
	
	/**
	 * 从 API 响应解析用户信息
	 */
	private parseUserFromApi(data: any): HTBUser {
		const user = new HTBUser();
		
		user.id = data.id?.toString();
		user.name = data.name;
		user.email = data.email;
		user.avatar = data.avatar;
		user.rank = data.rank;
		user.rankId = data.rank_id;
		user.points = data.points;
		user.ownership = data.user_owns;
		user.respect = data.respects;
		user.isVip = data.isVip || false;
		user.userOwns = data.user_owns;
		user.systemOwns = data.system_owns;
		user.teamId = data.team_id;
		user.teamName = data.team_name;
		user.country = data.country_name;
		user.university = data.university_name;
		user.url = `${this.HTB_WEB_BASE}/profile/${data.id}`;
		
		return user;
	}
}