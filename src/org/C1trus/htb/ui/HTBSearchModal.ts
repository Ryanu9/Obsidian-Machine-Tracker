import { App, Modal, Setting, Notice } from "obsidian";
import { HTBMachine, HTBSearchItem } from "../data/model/HTBMachine";
import { HTBChallenge } from "../data/model/HTBChallenge";
import { HTBSherlock } from "../data/model/HTBSherlock";
import HTBPlugin from "../../main";
import { i18nHelper } from "../../lang/helper";
import HTBChallengeLoadHandler from "../data/handler/HTBChallengeLoadHandler";
import HTBSherlockLoadHandler from "../data/handler/HTBSherlockLoadHandler";

/**
 * HTB 项目类型
 */
export type HTBItemType = 'machine' | 'challenge' | 'sherlock';

/**
 * HTB 项目联合类型
 */
export type HTBItem = HTBMachine | HTBChallenge | HTBSherlock;

/**
 * HTB 搜索和选择模态框
 * 用户输入搜索词 -> 显示搜索结果 -> 选择项目 -> 返回选中的项目
 */
export class HTBSearchModal extends Modal {
	private plugin: HTBPlugin;
	private itemType: HTBItemType;
	private onSubmit: (item: HTBItem | null) => void;
	
	private searchInput: string = "";
	private searchResults: HTBSearchItem[] = [];  // 搜索结果（简化版）
	private selectedItem: HTBItem | null = null;   // 选中的完整项目
	private isSearching: boolean = false;
	private isLoadingDetails: boolean = false;     // 是否正在加载详情
	
	// 缓存所有项目列表（用于本地过滤）
	private allItems: HTBSearchItem[] = [];
	private itemsLoaded: boolean = false;
	
	// UI 元素
	private searchInputEl: HTMLInputElement;
	private resultsContainerEl: HTMLElement;
	private searchStatusEl: HTMLElement;
	private detailsContainerEl: HTMLElement;
	private buttonsEl: HTMLElement;
	private currentSelectedItemEl: HTMLElement | null = null;  // 当前选中的搜索结果元素
	
	// 搜索防抖定时器
	private searchDebounceTimer: NodeJS.Timeout | null = null;
	
	constructor(app: App, plugin: HTBPlugin, itemType: HTBItemType, onSubmit: (item: HTBItem | null) => void) {
		super(app);
		this.plugin = plugin;
		this.itemType = itemType;
		this.onSubmit = onSubmit;
	}
	
	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('htb-search-modal');
		
		// 标题
		const title = this.getTypeTitle();
		contentEl.createEl("h2", { text: title });
		
	// 说明文字
	const descEl = contentEl.createDiv({ cls: 'htb-search-desc' });
	descEl.textContent = i18nHelper.getMessage('htb_search_desc');
	descEl.style.cssText = `
		color: var(--text-muted);
		margin-bottom: 15px;
		font-size: 0.9em;
	`;
	
// 搜索输入框容器
const searchContainer = contentEl.createDiv({ cls: 'htb-search-input-container' });
	searchContainer.style.cssText = `
		display: flex;
		gap: 10px;
		margin-bottom: 15px;
		align-items: center;
	`;
	
	// 搜索输入框
	const searchSetting = new Setting(searchContainer)
		.setName(i18nHelper.getMessage('htb_search_input_name'))
		.setDesc(i18nHelper.getMessage('htb_search_input_desc'))
		.addText((text) => {
			text.setPlaceholder(i18nHelper.getMessage('htb_search_input_example'))
				.onChange((value) => {
					this.searchInput = value;
				});
		text.inputEl.addEventListener("keydown", (event) => {
			if (event.key === "Enter") {
				event.preventDefault();
				// 当焦点在搜索框时，按 Enter 只执行搜索，不创建模版
				if (this.searchInput.trim()) {
					this.performSearch();
				}
			}
		});
			this.searchInputEl = text.inputEl;
			// 扩大输入框
			text.inputEl.style.width = '400px';
			// 自动聚焦
			setTimeout(() => text.inputEl.focus(), 10);
		});
	
	// 搜索按钮
	const searchBtnContainer = searchContainer.createDiv({ cls: 'htb-search-button-container' });
	searchBtnContainer.style.cssText = `
		display: flex;
		align-items: center;
		margin-top: 10px;
	`;
	
	const searchBtn = searchBtnContainer.createEl('button');
	searchBtn.textContent = i18nHelper.getMessage('htb_search_button');
	searchBtn.style.cssText = `
		padding: 6px 16px;
		border-radius: 4px;
		border: none;
		background: var(--interactive-accent);
		color: var(--text-on-accent);
		cursor: pointer;
		font-weight: 500;
		white-space: nowrap;
	`;
	searchBtn.addEventListener('click', () => {
		if (this.searchInput.trim()) {
			this.performSearch();
		}
	});
		
		// 搜索状态提示
		this.searchStatusEl = contentEl.createDiv({ cls: 'htb-search-status' });
		this.searchStatusEl.style.cssText = `
			padding: 10px;
			margin: 10px 0;
			border-radius: 4px;
			display: none;
		`;
		
		// 搜索结果容器
		this.resultsContainerEl = contentEl.createDiv({ cls: 'htb-search-results' });
		this.resultsContainerEl.style.cssText = `
			max-height: 400px;
			overflow-y: auto;
			margin: 15px 0;
			border: 1px solid var(--background-modifier-border);
			border-radius: 4px;
		`;
		
		// 详情容器
		this.detailsContainerEl = contentEl.createDiv({ cls: 'htb-item-details' });
		this.detailsContainerEl.style.cssText = `
			margin: 15px 0;
			padding: 15px;
			border: 1px solid var(--background-modifier-border);
			border-radius: 4px;
			background: var(--background-secondary);
			display: none;
		`;
		
	// 按钮容器
	this.buttonsEl = contentEl.createDiv({ cls: 'htb-search-buttons' });
	this.buttonsEl.style.cssText = `
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 20px;
	`;
	
	this.renderButtons();
	
	// 应用样式
	this.applyStyles();
	
	// 对于 Sherlock，在所有 UI 元素创建完成后预加载完整列表
	if (this.itemType === 'sherlock' && !this.itemsLoaded) {
		this.loadAllSherlocks();
	}
}
	
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
		
		// 清理定时器
		if (this.searchDebounceTimer) {
			clearTimeout(this.searchDebounceTimer);
		}
	}
	
	/**
	 * 获取类型标题
	 */
	private getTypeTitle(): string {
		switch (this.itemType) {
			case 'machine': return i18nHelper.getMessage('htb_search_title_machine');
			case 'challenge': return i18nHelper.getMessage('htb_search_title_challenge');
			case 'sherlock': return i18nHelper.getMessage('htb_search_title_sherlock');
			default: return i18nHelper.getMessage('htb_type_item');
		}
	}
	
	/**
	 * 预加载所有 Sherlock（用于本地过滤）
	 */
	private async loadAllSherlocks() {
		try {
			console.log('[HTBSearchModal] 开始加载所有 Sherlock...');
			this.showSearchStatus(i18nHelper.getMessage('htb_search_loading_list'), 'loading');
			
			const sherlocks = await this.plugin.sherlockHandler.getAllSherlocks();
			this.allItems = sherlocks.map(s => ({
				id: parseInt(s.id),
				value: s.name,
				avatar: s.avatar || null
			}));
			this.itemsLoaded = true;
			
			console.log(`[HTBSearchModal] 加载完成: ${this.allItems.length} 个 Sherlock`);
			this.showSearchStatus(`已加载 ${this.allItems.length} 个 Sherlock，输入关键词进行搜索`, 'success');
		} catch (error) {
			console.error('[HTBSearchModal] 加载失败:', error);
			this.showSearchStatus(`加载失败: ${error.message}`, 'error');
		}
	}
	
	/**
	 * 执行搜索
	 */
	private async performSearch() {
		if (!this.searchInput.trim()) {
			return;
		}
		
		this.isSearching = true;
		this.showSearchStatus('正在搜索...', 'loading');
		
		try {
			console.log(`[HTBSearchModal] 开始搜索: 类型=${this.itemType}, 关键词="${this.searchInput}"`);
			
			// 根据类型调用不同的搜索方法（返回简化结果）
			let results: HTBSearchItem[] = [];
			
			switch (this.itemType) {
				case 'machine':
					results = await this.plugin.machineHandler.searchMachines(this.searchInput);
					break;
				case 'challenge':
					const challenges = await this.plugin.challengeHandler.searchChallenges(this.searchInput);
					results = challenges.map(c => ({
						id: parseInt(c.id),
						value: c.name,
						avatar: c.avatar || null,
						// 扩展字段用于显示
						difficulty: c.difficulty,
						isCompleted: c.isCompleted,
						category_name: c.category,
						challenge_category_id: c.challenge_category_id,
						authUserSolve: c.authUserSolve
					}));
					break;
			case 'sherlock':
				// 使用新的缓存搜索逻辑
				const sherlockResults = await this.plugin.sherlockHandler.searchSherlocks(this.searchInput);
				// 转换为 HTBSearchItem 格式（扩展字段）
				results = sherlockResults.map(s => ({
					id: s.id,
					value: s.name,
					avatar: s.avatar || null,
					// 扩展字段用于显示
					difficulty: s.difficulty,
					release_date: s.release_date,
					is_owned: s.is_owned,
					category_name: s.category_name,
					rating: s.rating
				}));
				console.log(`[HTBSearchModal] Sherlock 搜索: 找到 ${results.length} 个结果`);
				break;
			}
			
			console.log(`[HTBSearchModal] 搜索完成: 找到 ${results.length} 个结果`);
			this.searchResults = results;
			
			// 如果是 Challenge 搜索且结果为 0，提示用户刷新缓存
			if (results.length === 0 && this.itemType === 'challenge') {
				await this.handleChallengeNoResults();
			} else if (results.length === 0 && this.itemType === 'sherlock') {
				// Sherlock 搜索无结果时的处理
				await this.handleSherlockNoResults();
			} else if (results.length === 0) {
				this.showSearchStatus(i18nHelper.getMessage('htb_search_no_match'), 'empty');
			} else {
				this.showSearchStatus(`找到 ${results.length} 个结果`, 'success');
			}
			
			this.renderResults();
			
		} catch (error) {
			console.error('[HTBSearchModal] 搜索失败:', error);
			this.showSearchStatus(`搜索失败: ${error.message}`, 'error');
			this.searchResults = [];
			this.renderResults();
		} finally {
			this.isSearching = false;
		}
	}
	
	/**
	 * 处理 Sherlock 搜索无结果的情况
	 * 显示一个友好的提示界面，带有重新请求列表的按钮
	 */
	private async handleSherlockNoResults() {
		// 显示提示信息和刷新按钮
		this.searchStatusEl.style.display = 'block';
		this.searchStatusEl.innerHTML = '';
		this.searchStatusEl.style.backgroundColor = 'var(--background-secondary)';
		this.searchStatusEl.style.color = 'var(--text-muted)';
		this.searchStatusEl.style.border = '1px solid var(--background-modifier-border)';
		this.searchStatusEl.style.padding = '12px';
		this.searchStatusEl.style.display = 'flex';
		this.searchStatusEl.style.alignItems = 'center';
		this.searchStatusEl.style.gap = '10px';
		
		// 创建提示文本
		const messageSpan = this.searchStatusEl.createSpan({
			text: i18nHelper.getMessage('htb_search_refresh_cache'),
			cls: 'htb-search-no-result-message'
		});
		
		// 创建刷新按钮
		const refreshBtn = this.searchStatusEl.createEl('button', {
			text: '重新请求 Sherlock 列表',
			cls: 'htb-refresh-cache-btn'
		});
		refreshBtn.style.cssText = `
			padding: 6px 12px;
			background-color: var(--interactive-accent);
			color: var(--text-on-accent);
			border: none;
			border-radius: 4px;
			cursor: pointer;
			font-size: 13px;
			font-weight: 500;
		`;
		
		refreshBtn.addEventListener('click', async () => {
			try {
				// 显示加载状态
				refreshBtn.disabled = true;
				refreshBtn.textContent = '正在请求...';
				
				// 调用刷新缓存方法
				const sherlockHandler = new HTBSherlockLoadHandler(this.app, this.plugin);
				await sherlockHandler.refreshCache();
				
				// 刷新完成后，重新搜索之前的关键字
				refreshBtn.textContent = '缓存完成';
				setTimeout(async () => {
					this.hideSearchStatus();
					
					// 重新执行搜索
					await this.performSearch();
					
					// 如果搜索后仍然没有结果，显示最终提示
					if (this.searchResults.length === 0) {
						this.showSearchStatus(`新的 Sherlock 列表中没有对应的 Sherlock：${this.searchInput}`, 'empty');
					}
				}, 1000);
			} catch (error) {
				console.error('[HTBSearchModal] 刷新缓存失败:', error);
				refreshBtn.textContent = '请求失败';
				setTimeout(() => {
					refreshBtn.disabled = false;
					refreshBtn.textContent = '重新请求 Sherlock 列表';
				}, 2000);
			}
		});
	}
	
	/**
	 * 处理 Challenge 搜索无结果的情况
	 */
	private async handleChallengeNoResults() {
		// 显示提示信息和刷新按钮
		this.searchStatusEl.style.display = 'block';
		this.searchStatusEl.innerHTML = '';
		this.searchStatusEl.style.backgroundColor = 'var(--background-secondary)';
		this.searchStatusEl.style.color = 'var(--text-muted)';
		this.searchStatusEl.style.border = '1px solid var(--background-modifier-border)';
		this.searchStatusEl.style.padding = '12px';
		this.searchStatusEl.style.display = 'flex';
		this.searchStatusEl.style.alignItems = 'center';
		this.searchStatusEl.style.gap = '10px';
		
		// 创建提示文本
		const messageSpan = this.searchStatusEl.createSpan({
			text: i18nHelper.getMessage('htb_search_may_refresh'),
			cls: 'htb-search-no-result-message'
		});
		
		// 创建刷新按钮
		const refreshBtn = this.searchStatusEl.createEl('button', {
			text: '刷新缓存',
			cls: 'htb-refresh-cache-btn'
		});
		
		refreshBtn.style.padding = '4px 12px';
		refreshBtn.style.backgroundColor = 'var(--interactive-accent)';
		refreshBtn.style.color = 'var(--text-on-accent)';
		refreshBtn.style.border = 'none';
		refreshBtn.style.borderRadius = '4px';
		refreshBtn.style.cursor = 'pointer';
		refreshBtn.style.fontSize = '13px';
		refreshBtn.style.fontWeight = '500';
		
		refreshBtn.addEventListener('click', async () => {
			try {
				// 显示加载状态
				refreshBtn.disabled = true;
				refreshBtn.textContent = '刷新中...';
				
				// 调用刷新缓存方法
				const challengeHandler = new HTBChallengeLoadHandler(this.app, this.plugin);
				await challengeHandler.refreshCache();
				
				// 刷新完成后，重新搜索
				refreshBtn.textContent = '刷新成功';
				setTimeout(() => {
					this.hideSearchStatus();
					// 重新执行搜索
					this.performSearch();
				}, 1000);
				
			} catch (error) {
				console.error('[HTBSearchModal] 刷新缓存失败:', error);
				refreshBtn.textContent = '刷新失败';
				refreshBtn.style.backgroundColor = 'var(--text-error)';
				setTimeout(() => {
					refreshBtn.disabled = false;
					refreshBtn.textContent = '刷新缓存';
					refreshBtn.style.backgroundColor = 'var(--interactive-accent)';
				}, 2000);
			}
		});
	}
	
	/**
	 * 显示搜索状态
	 */
	private showSearchStatus(message: string, type: 'loading' | 'success' | 'error' | 'empty') {
		this.searchStatusEl.style.display = 'block';
		this.searchStatusEl.textContent = message;
		
		// 根据类型设置样式
		switch (type) {
			case 'loading':
				this.searchStatusEl.style.backgroundColor = 'var(--background-secondary)';
				this.searchStatusEl.style.color = 'var(--text-normal)';
				this.searchStatusEl.style.border = '1px solid var(--background-modifier-border)';
				break;
			case 'success':
				this.searchStatusEl.style.backgroundColor = 'var(--background-secondary)';
				this.searchStatusEl.style.color = 'var(--text-success)';
				this.searchStatusEl.style.border = '1px solid var(--text-success)';
				// 3秒后自动隐藏
				setTimeout(() => this.hideSearchStatus(), 3000);
				break;
			case 'error':
				// 使用淡雅的错误样式，而不是红色背景
				this.searchStatusEl.style.backgroundColor = 'var(--background-secondary)';
				this.searchStatusEl.style.color = 'var(--text-error)';
				this.searchStatusEl.style.border = '1px solid var(--text-error)';
				this.searchStatusEl.style.fontWeight = '500';
				break;
			case 'empty':
				this.searchStatusEl.style.backgroundColor = 'var(--background-secondary)';
				this.searchStatusEl.style.color = 'var(--text-muted)';
				this.searchStatusEl.style.border = '1px solid var(--background-modifier-border)';
				break;
		}
	}
	
	/**
	 * 隐藏搜索状态
	 */
	private hideSearchStatus() {
		this.searchStatusEl.style.display = 'none';
	}
	
	/**
	 * 渲染搜索结果
	 */
	private renderResults() {
		this.resultsContainerEl.empty();
		
		if (this.searchResults.length === 0) {
			if (this.searchInput.trim()) {
				const emptyEl = this.resultsContainerEl.createDiv({ cls: 'htb-search-empty' });
				emptyEl.textContent = '没有找到匹配的结果';
				emptyEl.style.cssText = `
					padding: 20px;
					text-align: center;
					color: var(--text-muted);
				`;
			}
			return;
		}
		
		// 渲染结果列表（简化版）
		this.searchResults.forEach((item) => {
			const itemEl = this.resultsContainerEl.createDiv({ cls: 'htb-search-result-item' });
			itemEl.style.cssText = `
				padding: 14px;
				border-bottom: 1px solid var(--background-modifier-border);
				cursor: pointer;
				transition: background-color 0.2s;
				display: flex;
				align-items: center;
				gap: 12px;
			`;
			
			// 鼠标悬停效果
			itemEl.addEventListener('mouseenter', () => {
				if (this.currentSelectedItemEl !== itemEl) {
					itemEl.style.backgroundColor = 'var(--background-secondary)';
				}
			});
			itemEl.addEventListener('mouseleave', () => {
				if (this.currentSelectedItemEl !== itemEl) {
					itemEl.style.backgroundColor = '';
				}
			});
			
			// 点击加载详情
			itemEl.addEventListener('click', async () => {
				// 清除之前选中的高亮
				if (this.currentSelectedItemEl) {
					this.currentSelectedItemEl.style.backgroundColor = '';
				}
				
				// 高亮当前选中项
				this.currentSelectedItemEl = itemEl;
				itemEl.style.backgroundColor = 'var(--background-modifier-hover)';
				
				await this.loadItemDetails(item, itemEl);
			});
			
			// 渲染项目简化信息
			this.renderSearchItem(itemEl, item);
		});
	}
	
	/**
	 * 渲染搜索结果项
	 */
	private renderSearchItem(containerEl: HTMLElement, item: HTBSearchItem) {
		// 头像（如果有）
		if (item.avatar) {
			const imgEl = containerEl.createEl('img');
			imgEl.src = item.avatar;
			imgEl.alt = item.value;
			imgEl.style.cssText = `
				width: 50px;
				height: 50px;
				border-radius: 6px;
				object-fit: cover;
				flex-shrink: 0;
			`;
		}
		
		// 信息容器
		const infoEl = containerEl.createDiv({ cls: 'htb-search-item-info' });
		infoEl.style.cssText = `
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 4px;
		`;
		
		// 名称和 ID
		const nameRowEl = infoEl.createDiv({ cls: 'htb-search-item-name-row' });
		nameRowEl.style.cssText = `
			display: flex;
			align-items: center;
			gap: 8px;
		`;
		
		const nameEl = nameRowEl.createSpan({ cls: 'htb-search-item-name' });
		nameEl.textContent = item.value;
		nameEl.style.cssText = `
			font-weight: 600;
			font-size: 1.05em;
			color: var(--text-normal);
		`;
		
		const idEl = nameRowEl.createSpan({ cls: 'htb-search-item-id' });
		idEl.textContent = `#${item.id}`;
		idEl.style.cssText = `
			font-size: 0.85em;
			color: var(--text-muted);
		`;
		
		// Challenge 专属信息
		if (this.itemType === 'challenge' && item.difficulty) {
			const detailsEl = infoEl.createDiv({ cls: 'htb-challenge-details' });
			detailsEl.style.cssText = `
				display: flex;
				flex-wrap: wrap;
				gap: 12px;
				font-size: 0.9em;
				color: var(--text-muted);
			`;
			
			// 难度
			const difficultyColor = this.getDifficultyColor(item.difficulty);
			const difficultyEl = detailsEl.createSpan();
			difficultyEl.innerHTML = `<span style="color: ${difficultyColor}; font-weight: bold;">${item.difficulty}</span>`;
			
			// 分类（来自 challenge_category_id）
			if (item.category_name) {
				const categoryEl = detailsEl.createSpan();
				categoryEl.textContent = `📂 ${item.category_name}`;
			}
			
			// 完成状态（isCompleted）
			if (item.isCompleted !== undefined) {
				const completedEl = detailsEl.createSpan();
				completedEl.textContent = item.isCompleted ? '✅ 已完成' : '⏳ 未完成';
				completedEl.style.color = item.isCompleted ? 'var(--text-success)' : 'var(--text-muted)';
			}
			
			// 用户解决状态（authUserSolve）
			if (item.authUserSolve !== undefined && item.authUserSolve) {
				const solvedEl = detailsEl.createSpan();
				solvedEl.textContent = '🎯 已解决';
				solvedEl.style.color = 'var(--text-accent)';
			}
		}
		
		// Sherlock 专属信息
		if (this.itemType === 'sherlock' && item.difficulty) {
			const detailsEl = infoEl.createDiv({ cls: 'htb-sherlock-details' });
			detailsEl.style.cssText = `
				display: flex;
				flex-wrap: wrap;
				gap: 12px;
				font-size: 0.9em;
				color: var(--text-muted);
			`;
			
			// 难度（不显示闪电图标）
			const difficultyColor = this.getDifficultyColor(item.difficulty);
			const difficultyEl = detailsEl.createSpan();
			difficultyEl.innerHTML = `<span style="color: ${difficultyColor}; font-weight: bold;">${item.difficulty}</span>`;
			
			// 分类
			if (item.category_name) {
				const categoryEl = detailsEl.createSpan();
				categoryEl.textContent = `📂 ${item.category_name}`;
			}
			
			// 完成状态
			if (item.is_owned !== undefined) {
				const ownedEl = detailsEl.createSpan();
				ownedEl.textContent = item.is_owned ? '✅ 已完成' : '⏳ 未完成';
				ownedEl.style.color = item.is_owned ? 'var(--text-success)' : 'var(--text-muted)';
			}
		}
	}
	
	/**
	 * 获取难度对应的颜色
	 */
	private getDifficultyColor(difficulty: string): string {
		switch (difficulty) {
			case 'Very Easy':
			case 'Easy':
				return '#4CAF50';  // 绿色
			case 'Medium':
				return '#FF9800';  // 橙色
			case 'Hard':
				return '#F44336';  // 红色
			case 'Insane':
				return '#9C27B0';  // 紫色
			default:
				return 'var(--text-muted)';
		}
	}
	
	/**
	 * 格式化日期为 UTC+8
	 * 格式：2025-1-1 10:10
	 */
	private formatToUTC8(dateString: string): string {
		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) {
				return dateString; // 如果解析失败，返回原始字符串
			}
			
			// 加 8 小时转换为北京时间
			const utc8Date = new Date(date.getTime() + (8 * 60 * 60 * 1000));
			
			// 格式化为 YYYY-M-D HH:MM
			const year = utc8Date.getUTCFullYear();
			const month = utc8Date.getUTCMonth() + 1;
			const day = utc8Date.getUTCDate();
			const hours = utc8Date.getUTCHours().toString().padStart(2, '0');
			const minutes = utc8Date.getUTCMinutes().toString().padStart(2, '0');
			
			return `${year}-${month}-${day} ${hours}:${minutes}`;
		} catch (e) {
			return dateString;
		}
	}
	
	/**
	 * 加载项目详细信息
	 */
	private async loadItemDetails(searchItem: HTBSearchItem, itemEl: HTMLElement) {
		if (this.isLoadingDetails) return;
		
		try {
			this.isLoadingDetails = true;
			this.showSearchStatus('加载详细信息中...', 'loading');
			
			// 根据类型加载详细信息
			let item: HTBItem | null = null;
			
			switch (this.itemType) {
				case 'machine':
					item = await this.plugin.machineHandler.loadMachine(searchItem.id.toString());
					break;
				case 'challenge':
					item = await this.plugin.challengeHandler.loadChallenge(searchItem.id.toString());
					break;
				case 'sherlock':
					item = await this.plugin.sherlockHandler.loadSherlock(searchItem.id.toString());
					break;
			}
			
			if (item) {
				this.selectedItem = item;
				this.hideSearchStatus();
				this.renderDetailsUnderItem(itemEl);  // 在选中项下方渲染详情
				this.renderButtons();  // 显示按钮
			} else {
				this.showSearchStatus('加载失败，请重试', 'error');
			}
		} catch (error) {
			console.error('[HTBSearchModal] 加载详情失败:', error);
			this.showSearchStatus(`加载失败: ${error.message}`, 'error');
		} finally {
			this.isLoadingDetails = false;
		}
	}
	
	/**
	 * 渲染项目摘要信息（旧方法，保留用于详情显示）
	 */
	private renderItemSummary(containerEl: HTMLElement, item: HTBItem) {
		const headerEl = containerEl.createDiv({ cls: 'htb-item-header' });
		headerEl.style.cssText = `
			display: flex;
			align-items: flex-start;
			gap: 12px;
		`;
		
		// 图片（只在有头像时显示）
		if (item.avatar) {
			const imgEl = headerEl.createEl('img');
			imgEl.src = item.avatarThumb || item.avatar;
			imgEl.alt = item.name;
			imgEl.style.cssText = `
				width: 50px;
				height: 50px;
				border-radius: 6px;
				object-fit: cover;
				flex-shrink: 0;
			`;
		}
		
		// 基本信息容器
		const infoEl = headerEl.createDiv({ cls: 'htb-item-info' });
		infoEl.style.cssText = `
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 6px;
		`;
		
		// 第一行：名称
		const nameEl = infoEl.createDiv({ cls: 'htb-item-name' });
		nameEl.textContent = item.name;
		nameEl.style.cssText = `
			font-weight: 600;
			font-size: 1.05em;
			color: var(--text-normal);
		`;
		
		// 第二行：详细信息
		const detailsEl = infoEl.createDiv({ cls: 'htb-item-details-row' });
		detailsEl.style.cssText = `
			display: flex;
			gap: 12px;
			flex-wrap: wrap;
			align-items: center;
			font-size: 0.9em;
			color: var(--text-muted);
		`;
		
		// 系统/类型信息
		let typeInfo = '';
		if ('os' in item && item.os) {
			// Machine - 显示操作系统
			typeInfo = `📦 ${item.os}`;
		} else if ('category' in item && item.category) {
			// Challenge/Sherlock - 显示分类
			typeInfo = `🏷️ ${item.category}`;
		} else if ('type' in item && item.type) {
			// Fortress - 显示类型
			typeInfo = `🏰 ${item.type}`;
		}
		if (typeInfo) {
			this.createDetailItem(detailsEl, typeInfo);
		}
		
		// 难度
		const difficultyColor = this.getDifficultyColor(item.difficulty);
		const difficultyEl = detailsEl.createSpan();
		difficultyEl.innerHTML = `<span style="color: ${difficultyColor};">⚡ ${item.difficulty}</span>`;
		
	// 创建时间
	if (item.releaseDate) {
		const releaseDate = this.formatToUTC8(item.releaseDate);
		this.createDetailItem(detailsEl, `📅 ${releaseDate}`);
	}
		
		// 作者
		if (item.maker && item.maker.length > 0) {
			const authorNames = item.maker.map(m => m.name).join(', ');
			this.createDetailItem(detailsEl, `👤 ${authorNames}`);
		}
		
		// 第三行：状态标签
		const statusEl = infoEl.createDiv({ cls: 'htb-item-status' });
		statusEl.style.cssText = `
			display: flex;
			gap: 6px;
			flex-wrap: wrap;
		`;
		
		// 退役状态
		if (item.retired) {
			this.createStatusBadge(statusEl, '已退役', '#757575');
		} else {
			this.createStatusBadge(statusEl, '活跃', '#4caf50');
		}
		
		// 完成状态
		if (item.isCompleted) {
			this.createStatusBadge(statusEl, '✓ 已完成', '#2196f3');
		}
		
		// 评分
		if (item.rating && item.rating > 0) {
			this.createStatusBadge(statusEl, `⭐ ${item.rating.toFixed(1)}`, '#ffc107');
		}
		
		// 积分
		if (item.points) {
			this.createStatusBadge(statusEl, `${item.points} pts`, '#9c27b0');
		}
	}
	
	/**
	 * 创建详情项
	 */
	private createDetailItem(containerEl: HTMLElement, text: string) {
		const itemEl = containerEl.createSpan();
		itemEl.textContent = text;
		itemEl.style.cssText = `
			color: var(--text-muted);
		`;
	}
	
	/**
	 * 创建状态徽章
	 */
	private createStatusBadge(containerEl: HTMLElement, text: string, color: string) {
		const badgeEl = containerEl.createSpan();
		badgeEl.textContent = text;
		badgeEl.style.cssText = `
			display: inline-block;
			padding: 2px 8px;
			border-radius: 3px;
			font-size: 0.9em;
			color: ${color};
			font-weight: bold;
		`;
	}
	
	
	
	
	/**
	 * 渲染项目详情
	 */
	private renderDetails() {
		this.detailsContainerEl.empty();
		
		if (!this.selectedItem) {
			this.detailsContainerEl.style.display = 'none';
			return;
		}
		
		this.detailsContainerEl.style.display = 'block';
		
		const item = this.selectedItem;
		
		// 标题
		const titleEl = this.detailsContainerEl.createEl('h3');
		titleEl.textContent = `已选择: ${item.name}`;
		titleEl.style.cssText = `
			margin-top: 0;
			margin-bottom: 12px;
			color: var(--text-normal);
		`;
		
		// 详细信息容器（允许选中文本）
		const detailsEl = this.detailsContainerEl.createDiv();
		detailsEl.style.cssText = `
			display: grid;
			grid-template-columns: auto 1fr;
			gap: 8px 16px;
			font-size: 0.95em;
			user-select: text;
			cursor: text;
		`;
		
		// 基本信息
		this.addDetailRow(detailsEl, 'ID', item.id);
		
	// 难度 - 使用正常字体显示（加粗+颜色+描边）
	const difficultyLabel = detailsEl.createEl('div');
	difficultyLabel.textContent = '难度:';
	difficultyLabel.style.cssText = `
		font-weight: 600;
		color: var(--text-muted);
	`;
	const difficultyValue = detailsEl.createEl('div');
	const difficultyColor = this.getDifficultyColor(item.difficulty);
	difficultyValue.textContent = item.difficulty;
	difficultyValue.style.cssText = `
		color: ${difficultyColor};
		font-weight: bold;
		text-shadow: 
			-1px -1px 0 var(--background-primary),
			1px -1px 0 var(--background-primary),
			-1px 1px 0 var(--background-primary),
			1px 1px 0 var(--background-primary);
	`;
		
		// 类型特定信息
		if ('os' in item && item.os) {
			this.addDetailRow(detailsEl, '操作系统', item.os);
		}
		if ('category' in item && item.category) {
			this.addDetailRow(detailsEl, '分类', item.category);
		}
		
		// Challenge 特定字段：状态
		if ('state' in item && item.state) {
			this.addDetailRow(detailsEl, '状态', item.state);
		}
		
		// Challenge 特定字段：解题数
		if ('solves' in item && typeof item.solves === 'number') {
			this.addDetailRow(detailsEl, '解题数', item.solves.toString());
		}
		
		// 评分
		this.addDetailRow(detailsEl, '评分', item.rating ? `${item.rating.toFixed(1)} / 5.0` : 'N/A');
		
		// 发布日期 - 转换为 UTC+8 格式
		if (item.releaseDate) {
			const releaseDate = this.formatToUTC8(item.releaseDate);
			this.addDetailRow(detailsEl, '发布日期', releaseDate);
		}
		
		// 制作者
		if (item.maker && item.maker.length > 0) {
			const makerNames = item.maker.map(m => m.name).join(', ');
			this.addDetailRow(detailsEl, '制作者', makerNames);
		}
		
		// Challenge 特定字段：标签
		if ('tags' in item && item.tags && item.tags.length > 0) {
			this.addDetailRow(detailsEl, '标签', item.tags.join(', '));
		}
		
		// User/Root 完成状态标签
		if ('authUserInUserOwns' in item || 'authUserInRootOwns' in item) {
			const statusLabel = detailsEl.createEl('div');
			statusLabel.textContent = '完成状态:';
			statusLabel.style.cssText = `
				font-weight: 600;
				color: var(--text-muted);
			`;
			const statusValue = detailsEl.createEl('div');
			statusValue.style.cssText = `
				display: flex;
				gap: 6px;
				align-items: center;
			`;
			
			if (item.authUserInUserOwns) {
				this.createStatusBadge(statusValue, '已User', '#2196f3');
			}
			if (item.authUserInRootOwns) {
				this.createStatusBadge(statusValue, '已Root', '#4caf50');
			}
			if (!item.authUserInUserOwns && !item.authUserInRootOwns) {
				const noneSpan = statusValue.createSpan();
				noneSpan.textContent = '未完成';
				noneSpan.style.color = 'var(--text-muted)';
			}
		}
		
		// Challenge Description（挑战描述）- 折叠显示
		if ('description' in item && item.description) {
			this.renderCollapsibleSection(
				this.detailsContainerEl,
				'挑战描述 (Description)',
				item.description,
				false // 默认折叠
			);
		}
		
		// Synopsis（机器/挑战概要）- 折叠显示
		if ('synopsis' in item && item.synopsis) {
			const title = this.itemType === 'machine' ? '机器概要 (Synopsis)' : '挑战概要 (Synopsis)';
			this.renderCollapsibleSection(
				this.detailsContainerEl,
				title,
				item.synopsis,
				false // 默认折叠
			);
		}
	}
	
	/**
	 * 在选中项下方渲染详情（插入到结果列表内部）
	 */
	private renderDetailsUnderItem(itemEl: HTMLElement) {
		if (!this.selectedItem) return;
		
		// 先移除之前的详情容器（如果存在）
		const oldDetailsInList = this.resultsContainerEl.querySelector('.htb-details-inline');
		if (oldDetailsInList) {
			oldDetailsInList.remove();
		}
		
		// 创建内嵌的详情容器
		const inlineDetailsEl = document.createElement('div');
		inlineDetailsEl.addClass('htb-details-inline');
		inlineDetailsEl.style.cssText = `
			margin: 0;
			padding: 15px;
			border-bottom: 1px solid var(--background-modifier-border);
			background: var(--background-secondary);
			animation: slideDown 0.2s ease-out;
		`;
		
		const item = this.selectedItem;
		
		// 标题
		const titleEl = inlineDetailsEl.createEl('h3');
		titleEl.textContent = `已选择: ${item.name}`;
		titleEl.style.cssText = `
			margin-top: 0;
			margin-bottom: 12px;
			color: var(--text-normal);
			font-size: 1em;
		`;
		
		// 详细信息容器
		const detailsEl = inlineDetailsEl.createDiv();
		detailsEl.style.cssText = `
			display: grid;
			grid-template-columns: auto 1fr;
			gap: 8px 16px;
			font-size: 0.9em;
			user-select: text;
			cursor: text;
		`;
		
	// 基本信息
	this.addDetailRow(detailsEl, 'ID', item.id);
	
	// 难度 - 使用正常字体显示（加粗+颜色+描边）
	const difficultyLabel = detailsEl.createEl('div');
	difficultyLabel.textContent = '难度:';
	difficultyLabel.style.cssText = `
		font-weight: 600;
		color: var(--text-muted);
	`;
	const difficultyValue = detailsEl.createEl('div');
	const difficultyColor = this.getDifficultyColor(item.difficulty);
	difficultyValue.textContent = item.difficulty;
	difficultyValue.style.cssText = `
		color: ${difficultyColor};
		font-weight: bold;
		text-shadow: 
			-1px -1px 0 var(--background-primary),
			1px -1px 0 var(--background-primary),
			-1px 1px 0 var(--background-primary),
			1px 1px 0 var(--background-primary);
	`;
		
		// 类型特定信息
		if (this.itemType === 'challenge') {
			// Challenge 特定字段 - 显示：name, difficulty, isCompleted, category, authUserSolve, release_date
			
			// 分类 (category)
			if ('category' in item && item.category) {
				this.addDetailRow(detailsEl, '分类', item.category);
			}
			
			// 发布日期 (release_date)
			if (item.releaseDate) {
				const releaseDate = this.formatToUTC8(item.releaseDate);
				this.addDetailRow(detailsEl, '发布日期', releaseDate);
			} else if (item.release) {
				const releaseDate = (window as any).moment(item.release).utcOffset(8).format('YYYY-MM-DD HH:mm');
				this.addDetailRow(detailsEl, '发布日期', releaseDate);
			}
			
			// 完成状态 (isCompleted)
			if ('isCompleted' in item) {
				const isCompleted = (item as any).isCompleted || false;
				this.addDetailRow(detailsEl, '完成状态', isCompleted ? '✅ 已完成' : '❌ 未完成');
			}
			
			// 用户解决状态 (authUserSolve)
			if ('authUserSolve' in item) {
				const authUserSolve = (item as any).authUserSolve || false;
				this.addDetailRow(detailsEl, '解决状态', authUserSolve ? '🎯 已解决' : '⏳ 未解决');
			}
			
			// 解题数 (solves)
			if ('solves' in item && typeof item.solves === 'number') {
				this.addDetailRow(detailsEl, '解题数', item.solves.toString());
			}
		} else if (this.itemType === 'sherlock') {
			// Sherlock 特定字段 - 只显示：id, name, difficulty, release_at, category_name, is_owned
			
			// 分类 (category_name)
			if ('category' in item && item.category) {
				this.addDetailRow(detailsEl, '分类', item.category);
			}
			
			// 发布日期 (release_at)
			if (item.releaseDate) {
				const releaseDate = this.formatToUTC8(item.releaseDate);
				this.addDetailRow(detailsEl, '发布日期', releaseDate);
			} else if (item.release) {
				// 如果 releaseDate 不存在，尝试从 release (Date 对象) 转换
				const releaseDate = (window as any).moment(item.release).utcOffset(8).format('YYYY-MM-DD HH:mm');
				this.addDetailRow(detailsEl, '发布日期', releaseDate);
			}
			
			// 完成状态 (is_owned)
			if ('isCompleted' in item) {
				const isOwned = (item as any).isCompleted || (item as any).isSolved || false;
				this.addDetailRow(detailsEl, '完成状态', isOwned ? '✅ 已完成' : '❌ 未完成');
			}
		} else {
			// Machine 和 Challenge 字段
			if ('os' in item && item.os) {
				this.addDetailRow(detailsEl, '操作系统', item.os);
			}
			if ('category' in item && item.category) {
				this.addDetailRow(detailsEl, '分类', item.category);
			}
			if ('state' in item && item.state) {
				this.addDetailRow(detailsEl, '状态', item.state);
			}
			if ('solves' in item && typeof item.solves === 'number') {
				this.addDetailRow(detailsEl, '解题数', item.solves.toString());
			}
			
			// 评分
			this.addDetailRow(detailsEl, '评分', item.rating ? `${item.rating.toFixed(1)} / 5.0` : 'N/A');
			
			// 发布日期
			if (item.releaseDate) {
				const releaseDate = this.formatToUTC8(item.releaseDate);
				this.addDetailRow(detailsEl, '发布日期', releaseDate);
			}
			
			// 制作者
			if (item.maker && item.maker.length > 0) {
				const makerNames = item.maker.map(m => m.name).join(', ');
				this.addDetailRow(detailsEl, '制作者', makerNames);
			}
			
			// Challenge 标签
			if ('tags' in item && item.tags && item.tags.length > 0) {
				this.addDetailRow(detailsEl, '标签', item.tags.join(', '));
			}
			
			// 完成状态
			if ('authUserInUserOwns' in item || 'authUserInRootOwns' in item) {
				const statusLabel = detailsEl.createEl('div');
				statusLabel.textContent = '完成状态:';
				statusLabel.style.cssText = `
					font-weight: 600;
					color: var(--text-muted);
				`;
				const statusValue = detailsEl.createEl('div');
				statusValue.style.cssText = `
					display: flex;
					gap: 6px;
					align-items: center;
				`;
				
				if (item.authUserInUserOwns) {
					this.createStatusBadge(statusValue, '已User', '#2196f3');
				}
				if (item.authUserInRootOwns) {
					this.createStatusBadge(statusValue, '已Root', '#4caf50');
				}
				if (!item.authUserInUserOwns && !item.authUserInRootOwns) {
					const noneSpan = statusValue.createSpan();
					noneSpan.textContent = '未完成';
					noneSpan.style.color = 'var(--text-muted)';
				}
			}
		}
		
		// 折叠部分 - Challenge 和 Sherlock 的 description
		if (this.itemType === 'challenge' && 'description' in item && item.description) {
			this.renderCollapsibleSection(
				inlineDetailsEl,
				'挑战描述 (Description)',
				item.description,
				false // 默认折叠
			);
		} else if (this.itemType === 'sherlock' && 'description' in item && item.description) {
			this.renderCollapsibleSection(
				inlineDetailsEl,
				'场景描述 (Description)',
				item.description,
				false // 默认折叠
			);
		} else if ('description' in item && item.description) {
			this.renderCollapsibleSection(
				inlineDetailsEl,
				'描述 (Description)',
				item.description,
				false
			);
		}
		if ('synopsis' in item && item.synopsis) {
			this.renderCollapsibleSection(
				inlineDetailsEl,
				'概要 (Synopsis)',
				item.synopsis,
				false
			);
		}
		
		// 插入到选中项的后面
		itemEl.insertAdjacentElement('afterend', inlineDetailsEl);
		
		// 平滑滚动到详情部分
		setTimeout(() => {
			inlineDetailsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}, 100);
	}
	
	/**
	 * 添加详情行
	 */
	private addDetailRow(containerEl: HTMLElement, label: string, value: string) {
		const labelEl = containerEl.createEl('div');
		labelEl.textContent = label + ':';
		labelEl.style.cssText = `
			font-weight: 600;
			color: var(--text-muted);
		`;
		
		const valueEl = containerEl.createEl('div');
		valueEl.textContent = value;
		valueEl.style.cssText = `
			color: var(--text-normal);
		`;
	}
	
	/**
	 * 渲染可折叠区域
	 */
	private renderCollapsibleSection(containerEl: HTMLElement, title: string, content: string, defaultExpanded: boolean = false) {
		const sectionContainer = containerEl.createDiv();
		sectionContainer.style.cssText = `
			margin-top: 16px;
			padding-top: 12px;
			border-top: 1px solid var(--background-modifier-border);
		`;
		
		// 折叠标题（可点击）
		const sectionHeader = sectionContainer.createDiv();
		sectionHeader.style.cssText = `
			display: flex;
			align-items: center;
			gap: 6px;
			cursor: pointer;
			user-select: none;
			padding: 4px 0;
		`;
		
		const arrowIcon = sectionHeader.createSpan();
		arrowIcon.textContent = '▶';
		arrowIcon.style.cssText = `
			font-size: 0.8em;
			transition: transform 0.2s;
			transform: ${defaultExpanded ? 'rotate(90deg)' : 'rotate(0deg)'};
		`;
		
		const sectionTitle = sectionHeader.createEl('strong');
		sectionTitle.textContent = title;
		
		// 折叠内容
		const sectionContent = sectionContainer.createDiv();
		sectionContent.style.cssText = `
			margin-top: 8px;
			padding: 8px;
			background: var(--background-secondary);
			border-radius: 4px;
			color: var(--text-muted);
			line-height: 1.5;
			display: ${defaultExpanded ? 'block' : 'none'};
			user-select: text;
			white-space: pre-wrap;
		`;
		sectionContent.textContent = content;
		
		// 点击切换折叠状态
		let isExpanded = defaultExpanded;
		sectionHeader.addEventListener('click', () => {
			isExpanded = !isExpanded;
			sectionContent.style.display = isExpanded ? 'block' : 'none';
			arrowIcon.style.transform = isExpanded ? 'rotate(90deg)' : 'rotate(0deg)';
		});
	}
	
	
	/**
	 * 渲染按钮
	 */
	private renderButtons() {
		this.buttonsEl.empty();
		
		// 取消按钮
		const cancelBtn = this.buttonsEl.createEl('button');
		cancelBtn.textContent = i18nHelper.getMessage('htb_search_cancel');
		cancelBtn.style.cssText = `
			padding: 8px 16px;
			border-radius: 4px;
			border: 1px solid var(--background-modifier-border);
			background: var(--background-primary);
			color: var(--text-normal);
			cursor: pointer;
		`;
		cancelBtn.addEventListener('click', () => {
			this.close();
			this.onSubmit(null);
		});
		
		// 确定按钮
		const confirmBtn = this.buttonsEl.createEl('button');
		confirmBtn.textContent = i18nHelper.getMessage('htb_folder_create_button');
		confirmBtn.disabled = !this.selectedItem;
		confirmBtn.style.cssText = `
			padding: 8px 16px;
			border-radius: 4px;
			border: none;
			background: var(--interactive-accent);
			color: var(--text-on-accent);
			cursor: pointer;
			font-weight: 600;
		`;
		
		if (!this.selectedItem) {
			confirmBtn.style.opacity = '0.5';
			confirmBtn.style.cursor = 'not-allowed';
		}
		
		confirmBtn.addEventListener('click', () => {
			if (this.selectedItem) {
				this.submit();
			}
		});
	}
	
	/**
	 * 提交选择
	 */
	private submit() {
		if (this.selectedItem) {
			this.close();
			this.onSubmit(this.selectedItem);
		}
	}
	
	/**
	 * 应用样式
	 */
	private applyStyles() {
		// 添加全局样式
		const styleEl = document.createElement('style');
		styleEl.textContent = `
			.htb-search-modal .modal-content {
				padding: 20px;
				max-width: 800px;
			}
			
			.htb-search-results::-webkit-scrollbar {
				width: 8px;
			}
			
			.htb-search-results::-webkit-scrollbar-track {
				background: var(--background-primary);
			}
			
			.htb-search-results::-webkit-scrollbar-thumb {
				background: var(--background-modifier-border);
				border-radius: 4px;
			}
			
			.htb-search-results::-webkit-scrollbar-thumb:hover {
				background: var(--text-muted);
			}
			
			/* 详情展开动画 */
			@keyframes slideDown {
				from {
					opacity: 0;
					max-height: 0;
					transform: translateY(-10px);
				}
				to {
					opacity: 1;
					max-height: 1000px;
					transform: translateY(0);
				}
			}
		`;
		document.head.appendChild(styleEl);
	}
}

