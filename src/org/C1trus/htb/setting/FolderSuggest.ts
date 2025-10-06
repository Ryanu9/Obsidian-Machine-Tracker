import { App, TFolder } from "obsidian";
import { TextComponent } from "obsidian";

/**
 * 文件夹路径自动补全建议器
 * 为文本输入框提供文件夹路径的自动补全功能（仅文件夹，不包括文件）
 */
export class FolderSuggest {
	private app: App;
	private inputEl: HTMLInputElement;
	private suggestEl: HTMLElement;
	private suggestions: string[] = [];
	private selectedIndex: number = -1;
	private _isVisible: boolean = false;

	constructor(app: App, textComponent: TextComponent) {
		this.app = app;
		this.inputEl = textComponent.inputEl;
		this.createSuggestEl();
		this.attachEventListeners();
	}

	/**
	 * 创建建议列表元素
	 */
	private createSuggestEl() {
		this.suggestEl = document.createElement("div");
		this.suggestEl.addClass("suggestion-container");
		this.suggestEl.style.cssText = `
			position: absolute;
			z-index: 9999;
			background: var(--background-primary);
			border: 1px solid var(--background-modifier-border);
			border-radius: 4px;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
			max-height: 200px;
			min-width: 400px;
			max-width: 600px;
			overflow-y: auto;
			display: none;
		`;
		document.body.appendChild(this.suggestEl);
	}

	/**
	 * 附加事件监听器
	 */
	private attachEventListeners() {
		// 输入事件 - 显示建议
		this.inputEl.addEventListener("input", () => {
			this.updateSuggestions();
		});

		// 焦点事件
		this.inputEl.addEventListener("focus", () => {
			this.updateSuggestions();
		});

		this.inputEl.addEventListener("blur", () => {
			// 延迟隐藏，以便点击建议项
			setTimeout(() => this.hideSuggestions(), 200);
		});

		// 键盘导航
		this.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
			if (!this._isVisible) return;

			switch (e.key) {
				case "ArrowDown":
					e.preventDefault();
					this.selectNext();
					break;
				case "ArrowUp":
					e.preventDefault();
					this.selectPrevious();
					break;
				case "Enter":
					if (this.selectedIndex >= 0) {
						e.preventDefault();
						this.applySuggestion(this.suggestions[this.selectedIndex]);
					}
					break;
				case "Escape":
					e.preventDefault();
					this.hideSuggestions();
					break;
			}
		});
	}

	/**
	 * 更新建议列表
	 */
	private updateSuggestions() {
		const inputValue = this.inputEl.value;
		this.suggestions = this.getFolderSuggestions(inputValue);

		if (this.suggestions.length > 0) {
			this.renderSuggestions();
			this.showSuggestions();
		} else {
			this.hideSuggestions();
		}
	}

	/**
	 * 获取文件夹建议
	 */
	private getFolderSuggestions(input: string): string[] {
		// 获取所有文件夹
		const allFolders = this.getAllFolders();
		
		if (!input || input.trim() === "") {
			// 如果输入为空，返回顶层文件夹和最近使用的文件夹
			return allFolders.slice(0, 20);
		}

		// 过滤匹配的文件夹
		const lowerInput = input.toLowerCase();
		const matches = allFolders.filter(folderPath => 
			folderPath.toLowerCase().includes(lowerInput)
		);

		// 排序：优先显示完全匹配的，然后是开头匹配的
		matches.sort((a, b) => {
			const aLower = a.toLowerCase();
			const bLower = b.toLowerCase();

			// 完全匹配优先
			if (aLower === lowerInput) return -1;
			if (bLower === lowerInput) return 1;

			// 开头匹配优先
			const aStartsWith = aLower.startsWith(lowerInput);
			const bStartsWith = bLower.startsWith(lowerInput);
			if (aStartsWith && !bStartsWith) return -1;
			if (!aStartsWith && bStartsWith) return 1;

			// 路径深度浅的优先（顶层文件夹优先）
			const aDepth = a.split("/").length;
			const bDepth = b.split("/").length;
			if (aDepth !== bDepth) return aDepth - bDepth;

			// 字母顺序
			return a.localeCompare(b);
		});

		return matches.slice(0, 30);
	}

	/**
	 * 递归获取所有文件夹路径
	 */
	private getAllFolders(): string[] {
		const folders: string[] = [];
		const rootFolder = this.app.vault.getRoot();
		
		const collectFolders = (folder: TFolder) => {
			folder.children.forEach(child => {
				if (child instanceof TFolder) {
					folders.push(child.path);
					collectFolders(child);
				}
			});
		};
		
		collectFolders(rootFolder);
		return folders;
	}

	/**
	 * 渲染建议列表
	 */
	private renderSuggestions() {
		this.suggestEl.empty();
		this.selectedIndex = -1;

		this.suggestions.forEach((suggestion, index) => {
			const item = this.suggestEl.createDiv({
				cls: "suggestion-item",
			});
			
			// 样式
			item.style.cssText = `
				padding: 6px 12px;
				cursor: pointer;
				border-bottom: 1px solid var(--background-modifier-border-hover);
				display: flex;
				align-items: center;
				white-space: nowrap;
				overflow: hidden;
			`;
			
			// 设置 title 属性以显示完整路径的 tooltip
			item.setAttribute("title", suggestion);

			// 文件夹图标
			const iconSpan = item.createSpan({ cls: "suggestion-icon" });
			iconSpan.textContent = "📁 ";
			iconSpan.style.cssText = `
				margin-right: 6px;
				flex-shrink: 0;
			`;

			// 显示文件夹路径
			const pathSpan = item.createSpan({ cls: "suggestion-path" });
			pathSpan.textContent = suggestion;
			pathSpan.style.cssText = `
				font-weight: 500;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			`;

			// 鼠标事件
			item.addEventListener("mouseenter", () => {
				this.selectedIndex = index;
				this.highlightSelected();
			});

			item.addEventListener("click", () => {
				this.applySuggestion(suggestion);
			});
		});

		this.highlightSelected();
	}

	/**
	 * 高亮选中的建议
	 */
	private highlightSelected() {
		const items = this.suggestEl.querySelectorAll(".suggestion-item");
		items.forEach((item, index) => {
			if (index === this.selectedIndex) {
				(item as HTMLElement).style.backgroundColor = "var(--background-modifier-hover)";
			} else {
				(item as HTMLElement).style.backgroundColor = "";
			}
		});
	}

	/**
	 * 选择下一个建议
	 */
	private selectNext() {
		if (this.selectedIndex < this.suggestions.length - 1) {
			this.selectedIndex++;
			this.highlightSelected();
			this.scrollToSelected();
		}
	}

	/**
	 * 选择上一个建议
	 */
	private selectPrevious() {
		if (this.selectedIndex > 0) {
			this.selectedIndex--;
			this.highlightSelected();
			this.scrollToSelected();
		}
	}

	/**
	 * 滚动到选中的建议
	 */
	private scrollToSelected() {
		const items = this.suggestEl.querySelectorAll(".suggestion-item");
		if (this.selectedIndex >= 0 && this.selectedIndex < items.length) {
			(items[this.selectedIndex] as HTMLElement).scrollIntoView({
				block: "nearest",
			});
		}
	}

	/**
	 * 应用选中的建议
	 */
	private applySuggestion(suggestion: string) {
		this.inputEl.value = suggestion;
		this.inputEl.dispatchEvent(new Event("input"));
		this.inputEl.dispatchEvent(new Event("change"));
		this.hideSuggestions();
		this.inputEl.focus();
	}

	/**
	 * 显示建议列表
	 */
	private showSuggestions() {
		// 获取输入框位置
		const rect = this.inputEl.getBoundingClientRect();
		this.suggestEl.style.top = `${rect.bottom + window.scrollY}px`;
		this.suggestEl.style.left = `${rect.left + window.scrollX}px`;
		this.suggestEl.style.width = `${rect.width}px`;
		this.suggestEl.style.display = "block";
		this._isVisible = true;
	}

	/**
	 * 隐藏建议列表
	 */
	private hideSuggestions() {
		this.suggestEl.style.display = "none";
		this._isVisible = false;
		this.selectedIndex = -1;
	}

	/**
	 * 检查建议列表是否可见
	 */
	public isVisible(): boolean {
		return this._isVisible;
	}

	/**
	 * 清理资源
	 */
	destroy() {
		if (this.suggestEl && this.suggestEl.parentNode) {
			this.suggestEl.parentNode.removeChild(this.suggestEl);
		}
	}
}

