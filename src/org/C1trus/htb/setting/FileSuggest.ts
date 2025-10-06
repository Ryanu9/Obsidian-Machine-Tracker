import { App, TAbstractFile, TFile, TFolder } from "obsidian";
import { TextComponent } from "obsidian";

/**
 * 文件路径自动补全建议器
 * 为文本输入框提供文件路径的自动补全功能
 */
export class FileSuggest {
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
		this.suggestions = this.getFileSuggestions(inputValue);

		if (this.suggestions.length > 0) {
			this.renderSuggestions();
			this.showSuggestions();
		} else {
			this.hideSuggestions();
		}
	}

	/**
	 * 获取文件建议
	 */
	private getFileSuggestions(input: string): string[] {
		const allFiles = this.app.vault.getFiles();
		const mdFiles = allFiles.filter(file => file.extension === "md");
		
		if (!input || input.trim() === "") {
			// 如果输入为空，返回前20个文件
			return mdFiles.slice(0, 20).map(f => f.path);
		}

		// 过滤匹配的文件
		const lowerInput = input.toLowerCase();
		const matches = mdFiles.filter(file => 
			file.path.toLowerCase().includes(lowerInput) ||
			file.basename.toLowerCase().includes(lowerInput)
		);

		// 排序：优先显示文件名匹配的，然后是路径匹配的
		matches.sort((a, b) => {
			const aBasename = a.basename.toLowerCase();
			const bBasename = b.basename.toLowerCase();
			const aPath = a.path.toLowerCase();
			const bPath = b.path.toLowerCase();

			// 完全匹配优先
			if (aBasename === lowerInput) return -1;
			if (bBasename === lowerInput) return 1;

			// 开头匹配优先
			const aStartsWith = aBasename.startsWith(lowerInput);
			const bStartsWith = bBasename.startsWith(lowerInput);
			if (aStartsWith && !bStartsWith) return -1;
			if (!aStartsWith && bStartsWith) return 1;

			// 字母顺序
			return aPath.localeCompare(bPath);
		});

		return matches.slice(0, 30).map(f => f.path);
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
				flex-direction: column;
				overflow: hidden;
			`;
			
			// 设置 title 属性以显示完整路径的 tooltip
			item.setAttribute("title", suggestion);

			// 显示文件路径
			const pathParts = suggestion.split("/");
			const filename = pathParts[pathParts.length - 1];
			const directory = pathParts.slice(0, -1).join("/");

			const filenameSpan = item.createSpan({ cls: "suggestion-filename" });
			filenameSpan.textContent = filename;
			filenameSpan.style.cssText = `
				font-weight: 500;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			`;

			if (directory) {
				const dirSpan = item.createSpan({ cls: "suggestion-directory" });
				dirSpan.textContent = directory;
				dirSpan.style.cssText = `
					color: var(--text-muted);
					font-size: 0.9em;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
					margin-top: 2px;
				`;
			}

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

