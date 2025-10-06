import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import HTBPlugin from "../../main";
import { i18nHelper } from "../../lang/helper";
import { FileSuggest } from "./FileSuggest";
import { FolderSuggest } from "./FolderSuggest";
import { 
	FolderTemplateRule, 
	TEMPLATE_FIELDS, 
	TypeTemplateSettings,
	DEFAULT_MACHINE_TEMPLATE_CONTENT,
	DEFAULT_CHALLENGE_TEMPLATE_CONTENT,
	DEFAULT_SHERLOCK_TEMPLATE_CONTENT
} from "../../constant/HTBSettings";

export class HTBSettingTab extends PluginSettingTab {
	plugin: HTBPlugin;
	private activeTab: 'general' | 'templates' | 'fields' = 'general';
	private activeTemplateType: 'machine' | 'challenge' | 'sherlock' = 'machine';
	private activeFieldsType: 'machine' | 'challenge' | 'sherlock' = 'machine';

	constructor(app: App, plugin: HTBPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 * 调整 Setting 的布局为上下结构
	 * 上面是描述说明，下面是输入框
	 */
	private swapNameAndDesc(setting: Setting): void {
		const settingEl = setting.settingEl;
		const infoEl = settingEl.querySelector('.setting-item-info') as HTMLElement;
		const controlEl = settingEl.querySelector('.setting-item-control') as HTMLElement;
		
		if (infoEl && controlEl) {
			// 调整整体布局为垂直方向
			settingEl.style.display = 'flex';
			settingEl.style.flexDirection = 'column';
			settingEl.style.alignItems = 'stretch';
			settingEl.style.gap = '8px';
			
			// info 部分（名称+描述）在上面
			infoEl.style.flex = '0 0 auto';
			infoEl.style.maxWidth = '100%';
			infoEl.style.paddingTop = '0';
			
			// control 部分（输入框）在下面
			controlEl.style.flex = '0 0 auto';
			controlEl.style.justifyContent = 'flex-start';
			
			// 让输入框宽度适中
			const inputEl = controlEl.querySelector('input') as HTMLInputElement;
			if (inputEl) {
				inputEl.style.width = '100%';
				inputEl.style.maxWidth = '600px';
				inputEl.style.minWidth = '300px';
			}
			
			// 调整名称和描述的样式
			const nameEl = infoEl.querySelector('.setting-item-name') as HTMLElement;
			const descEl = infoEl.querySelector('.setting-item-description') as HTMLElement;
			
			if (nameEl && descEl) {
				// 描述使用正常字体（上方，作为主要说明）
				descEl.style.fontSize = '0.95em';
				descEl.style.color = 'var(--text-normal)';
				descEl.style.fontWeight = '500';
				descEl.style.marginTop = '0';
				descEl.style.marginBottom = '4px';
				
				// 名称使用小字体（上方，作为辅助说明）
				nameEl.style.fontSize = '0.85em';
				nameEl.style.color = 'var(--text-muted)';
				nameEl.style.fontWeight = 'normal';
			}
		}
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: i18nHelper.getMessage('htb_settings_title') });

		// 创建标签页导航
		this.createTabNavigation(containerEl);

		// 创建标签页容器
		const tabContent = containerEl.createDiv({ cls: 'htb-tab-content' });
		
		// 根据当前活动标签页显示内容
		if (this.activeTab === 'general') {
			this.displayGeneralSettings(tabContent);
		} else if (this.activeTab === 'templates') {
			this.displayTemplateSettings(tabContent);
		} else {
			this.displayFieldsReference(tabContent);
		}
	}

	/**
	 * 创建标签页导航
	 */
	private createTabNavigation(containerEl: HTMLElement): void {
		const tabNav = containerEl.createDiv({ cls: 'htb-tab-navigation' });
		tabNav.style.cssText = `
			display: flex;
			gap: 10px;
			margin-bottom: 20px;
			border-bottom: 2px solid var(--background-modifier-border);
		`;

		const tabs = [
			{ id: 'general', icon: '⚙️', label: i18nHelper.getMessage('htb_tab_general') },
			{ id: 'templates', icon: '📄', label: i18nHelper.getMessage('htb_tab_templates') },
			{ id: 'fields', icon: '📝', label: i18nHelper.getMessage('htb_tab_fields') }
		];

		tabs.forEach(tab => {
			const tabButton = tabNav.createEl('button', {
				text: `${tab.icon} ${tab.label}`,
				cls: this.activeTab === tab.id ? 'htb-tab-active' : 'htb-tab'
			});
			tabButton.style.cssText = `
				padding: 10px 20px;
				border: none;
				background: ${this.activeTab === tab.id ? 'var(--interactive-accent)' : 'transparent'};
				color: ${this.activeTab === tab.id ? 'var(--text-on-accent)' : 'var(--text-normal)'};
				cursor: pointer;
				font-weight: ${this.activeTab === tab.id ? 'bold' : 'normal'};
				border-radius: 5px 5px 0 0;
				transition: all 0.2s;
			`;
			tabButton.addEventListener('click', () => {
				this.activeTab = tab.id as any;
				this.display();
			});
		});
	}

	/**
	 * 显示基本设置
	 */
	private displayGeneralSettings(containerEl: HTMLElement): void {

		// API Settings Section
		containerEl.createEl("h3", { text: i18nHelper.getMessage('htb_settings_api') });

		new Setting(containerEl)
			.setName(i18nHelper.getMessage('htb_settings_api_token_name'))
			.setDesc(i18nHelper.getMessage('htb_settings_api_token_desc'))
			.addText((text) =>
				text
					.setPlaceholder(i18nHelper.getMessage('htb_settings_api_token_placeholder'))
					.setValue(this.plugin.settings.apiToken)
					.onChange(async (value) => {
						this.plugin.settings.apiToken = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(i18nHelper.getMessage('htb_settings_api_base_url_name'))
			.setDesc(i18nHelper.getMessage('htb_settings_api_base_url_desc'))
			.addText((text) =>
				text
					.setPlaceholder(i18nHelper.getMessage('htb_settings_api_base_url_placeholder'))
					.setValue(this.plugin.settings.apiBaseUrl)
					.onChange(async (value) => {
						this.plugin.settings.apiBaseUrl = value;
						await this.plugin.saveSettings();
					})
			);

		// UI Settings Section
		containerEl.createEl("h3", { text: i18nHelper.getMessage('htb_settings_ui') });

		new Setting(containerEl)
			.setName(i18nHelper.getMessage('htb_settings_status_bar_name'))
			.setDesc(i18nHelper.getMessage('htb_settings_status_bar_desc'))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.statusBar)
					.onChange(async (value) => {
						this.plugin.settings.statusBar = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(i18nHelper.getMessage('htb_settings_open_after_create_name'))
			.setDesc(i18nHelper.getMessage('htb_settings_open_after_create_desc'))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.openAfterCreate)
					.onChange(async (value) => {
						this.plugin.settings.openAfterCreate = value;
						await this.plugin.saveSettings();
					})
			);

		// Advanced Settings Section
		containerEl.createEl("h3", { text: i18nHelper.getMessage('htb_settings_advanced') });

		new Setting(containerEl)
			.setName(i18nHelper.getMessage('htb_settings_debug_name'))
			.setDesc(i18nHelper.getMessage('htb_settings_debug_desc'))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.debug)
					.onChange(async (value) => {
						this.plugin.settings.debug = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(i18nHelper.getMessage('htb_settings_timeout_name'))
			.setDesc(i18nHelper.getMessage('htb_settings_timeout_desc'))
			.addText((text) =>
				text
					.setPlaceholder(i18nHelper.getMessage('htb_settings_timeout_placeholder'))
					.setValue(this.plugin.settings.timeout.toString())
					.onChange(async (value) => {
						const timeout = parseInt(value);
						if (!isNaN(timeout) && timeout > 0) {
							this.plugin.settings.timeout = timeout;
							await this.plugin.saveSettings();
						}
					})
			);
	}

	/**
	 * 显示模板设置
	 */
	private displayTemplateSettings(containerEl: HTMLElement): void {
		containerEl.createEl("h3", { text: i18nHelper.getMessage('htb_templates_title') });
		
		const intro = containerEl.createDiv({ cls: "htb-template-intro" });
		intro.style.cssText = `
			padding: 15px;
			margin: 15px 0;
			border: 1px solid var(--background-modifier-border);
			border-radius: 8px;
			background: var(--background-secondary);
		`;
		intro.innerHTML = `
			<p><strong>${i18nHelper.getMessage('htb_templates_intro_title')}</strong>${i18nHelper.getMessage('htb_templates_intro_desc')}</p>
			<ul>
				<li>${i18nHelper.getMessage('htb_templates_intro_default')}</li>
				<li>${i18nHelper.getMessage('htb_templates_intro_folder')}</li>
			</ul>
		`;

		// 创建类型选择导航
		this.createTypeNavigation(containerEl);

		// 显示对应类型的模板设置
		const typeContent = containerEl.createDiv({ cls: 'htb-type-content' });
		this.displayTypeTemplateSettings(typeContent);
	}

	/**
	 * 创建类型选择导航
	 */
	private createTypeNavigation(containerEl: HTMLElement): void {
		const typeNav = containerEl.createDiv({ cls: 'htb-type-navigation' });
		typeNav.style.cssText = `
			display: flex;
			gap: 10px;
			margin: 20px 0;
			flex-wrap: wrap;
		`;

		const types = [
			{ id: 'machine', icon: '🖥️', label: i18nHelper.getMessage('htb_type_machine_template'), color: '#4caf50' },
			{ id: 'challenge', icon: '🎯', label: i18nHelper.getMessage('htb_type_challenge_template'), color: '#ff9800' },
			{ id: 'sherlock', icon: '🔍', label: i18nHelper.getMessage('htb_type_sherlock_template'), color: '#2196f3' }
		];

		types.forEach(type => {
			const typeButton = typeNav.createEl('button', {
				text: `${type.icon} ${type.label}`,
				cls: this.activeTemplateType === type.id ? 'htb-type-active' : 'htb-type'
			});
			const isActive = this.activeTemplateType === type.id;
			typeButton.style.cssText = `
				padding: 12px 24px;
				border: 2px solid ${type.color};
				background: ${isActive ? type.color : 'transparent'};
				color: ${isActive ? 'white' : type.color};
				cursor: pointer;
				font-weight: ${isActive ? 'bold' : 'normal'};
				border-radius: 8px;
				transition: all 0.2s;
				font-size: 14px;
			`;
			typeButton.addEventListener('mouseenter', () => {
				if (!isActive) {
					typeButton.style.background = type.color + '20';
				}
			});
			typeButton.addEventListener('mouseleave', () => {
				if (!isActive) {
					typeButton.style.background = 'transparent';
				}
			});
			typeButton.addEventListener('click', () => {
				this.activeTemplateType = type.id as any;
				this.display();
			});
		});
	}

	/**
	 * 显示特定类型的模板设置
	 */
	private displayTypeTemplateSettings(containerEl: HTMLElement): void {
		// 确保模板配置存在
		this.ensureTemplateSettings();

		const typeMap = {
			machine: { key: 'machineTemplate', title: 'Machine', defaultContent: DEFAULT_MACHINE_TEMPLATE_CONTENT },
			challenge: { key: 'challengeTemplate', title: 'Challenge', defaultContent: DEFAULT_CHALLENGE_TEMPLATE_CONTENT },
			sherlock: { key: 'sherlockTemplate', title: 'Sherlock', defaultContent: DEFAULT_SHERLOCK_TEMPLATE_CONTENT }
		};

		const typeInfo = typeMap[this.activeTemplateType];
		const templateSettings = this.plugin.settings[typeInfo.key as keyof typeof this.plugin.settings] as TypeTemplateSettings;

		// 默认模板设置
		containerEl.createEl("h4", { text: i18nHelper.getMessage('htb_default_template_title', typeInfo.title) });
		containerEl.createEl("p", { 
			text: i18nHelper.getMessage('htb_default_template_desc', typeInfo.title),
			cls: "setting-item-description"
		});

		this.renderDefaultTemplateSettings(containerEl, templateSettings, typeInfo.defaultContent);

		// 文件夹模板规则
		containerEl.createEl("h4", { text: i18nHelper.getMessage('htb_folder_template_title', typeInfo.title) });
		containerEl.createEl("p", { 
			text: i18nHelper.getMessage('htb_folder_template_desc'),
			cls: "setting-item-description"
		});

		new Setting(containerEl)
			.setName(i18nHelper.getMessage('htb_folder_enable_name'))
			.setDesc(i18nHelper.getMessage('htb_folder_enable_desc'))
			.addToggle((toggle) =>
				toggle
					.setValue(templateSettings.enableFolderTemplates)
					.onChange(async (value) => {
						templateSettings.enableFolderTemplates = value;
						await this.plugin.saveSettings();
						this.display();
					})
			);

		if (templateSettings.enableFolderTemplates) {
			this.renderFolderTemplateRules(containerEl, templateSettings);
		}
	}

	/**
	 * 确保模板设置存在
	 */
	private ensureTemplateSettings(): void {
		const { createDefaultTypeTemplateSettings } = require("../../constant/HTBSettings");
		
		if (!this.plugin.settings.machineTemplate) {
			this.plugin.settings.machineTemplate = createDefaultTypeTemplateSettings('Machine');
		}
		if (!this.plugin.settings.challengeTemplate) {
			this.plugin.settings.challengeTemplate = createDefaultTypeTemplateSettings('Challenge');
		}
		if (!this.plugin.settings.sherlockTemplate) {
			this.plugin.settings.sherlockTemplate = createDefaultTypeTemplateSettings('Sherlock');
		}
	}

	/**
	 * 渲染默认模板设置
	 */
	private renderDefaultTemplateSettings(
		containerEl: HTMLElement, 
		templateSettings: TypeTemplateSettings,
		defaultContent: string
	): void {
		// 默认数据文件夹路径
		const dataFolderSetting = new Setting(containerEl)
			.setName(i18nHelper.getMessage('htb_default_data_folder_name'))
			.setDesc(i18nHelper.getMessage('htb_default_data_folder_desc'))
			.addText((text) => {
				text
					.setPlaceholder("HTB/Machines")
					.setValue(templateSettings.defaultDataFilePath)
					.onChange(async (value) => {
						templateSettings.defaultDataFilePath = value;
						await this.plugin.saveSettings();
					});
				
				new FolderSuggest(this.app, text);
			});
		this.swapNameAndDesc(dataFolderSetting);

		// 默认文件名模板
		new Setting(containerEl)
			.setName(i18nHelper.getMessage('htb_default_filename_name'))
			.setDesc(i18nHelper.getMessage('htb_default_filename_desc'))
			.addText((text) =>
				text
					.setPlaceholder("{{name}}")
					.setValue(templateSettings.defaultFileNameTemplate)
					.onChange(async (value) => {
						templateSettings.defaultFileNameTemplate = value;
						await this.plugin.saveSettings();
					})
			);

		// 默认附件路径
		const attachmentPathSetting = new Setting(containerEl)
			.setName(i18nHelper.getMessage('htb_default_attachment_name'))
			.setDesc(i18nHelper.getMessage('htb_default_attachment_desc'))
			.addText((text) => {
				text
					.setPlaceholder("HTB/Attachments")
					.setValue(templateSettings.defaultAttachmentPath)
					.onChange(async (value) => {
						templateSettings.defaultAttachmentPath = value;
						await this.plugin.saveSettings();
					});
				
				new FolderSuggest(this.app, text);
			});
		this.swapNameAndDesc(attachmentPathSetting);

		// 默认模板文件
		const templateFileSetting = new Setting(containerEl)
			.setName(i18nHelper.getMessage('htb_default_template_file_name'))
			.setDesc(i18nHelper.getMessage('htb_default_template_file_desc'))
			.addText((text) => {
				text
					.setPlaceholder("Templates/HTB-Default.md")
					.setValue(templateSettings.defaultTemplateFile)
					.onChange(async (value) => {
						templateSettings.defaultTemplateFile = value;
						await this.plugin.saveSettings();
					});
				
				new FileSuggest(this.app, text);
			});
		this.swapNameAndDesc(templateFileSetting);

		// 使用内置模板开关
		new Setting(containerEl)
			.setName(i18nHelper.getMessage('htb_use_builtin_template_name'))
			.setDesc(i18nHelper.getMessage('htb_use_builtin_template_desc'))
			.addToggle((toggle) =>
				toggle
					.setValue(templateSettings.useDefaultBuiltInTemplate)
					.onChange(async (value) => {
						templateSettings.useDefaultBuiltInTemplate = value;
						await this.plugin.saveSettings();
						this.display();
					})
			);

		// 内置模板内容编辑器
		if (templateSettings.useDefaultBuiltInTemplate) {
			containerEl.createEl("h5", { text: i18nHelper.getMessage('htb_template_content_title') });
			
			const helpNotice = containerEl.createDiv({ cls: "setting-item-description" });
			helpNotice.style.cssText = `
				padding: 10px;
				margin: 10px 0;
				border: 1px solid var(--background-modifier-border);
				border-radius: 5px;
				background: var(--background-secondary);
			`;
			helpNotice.innerHTML = i18nHelper.getMessage('htb_template_content_help');

			new Setting(containerEl)
				.setName(i18nHelper.getMessage('htb_template_content_name'))
				.setDesc(i18nHelper.getMessage('htb_template_content_desc'))
				.setClass("htb-template-setting");
			
			const textAreaContainer = containerEl.createDiv({ cls: "htb-template-editor-container" });
			const textArea = textAreaContainer.createEl("textarea", {
				cls: "htb-template-editor",
				attr: {
					rows: "20",
					placeholder: i18nHelper.getMessage('htb_template_content_placeholder')
				}
			});
			textArea.style.width = "100%";
			textArea.style.minHeight = "300px";
			textArea.style.fontFamily = "monospace";
			textArea.style.fontSize = "13px";
			textArea.style.padding = "10px";
			textArea.style.border = "1px solid var(--background-modifier-border)";
			textArea.style.borderRadius = "5px";
			textArea.style.backgroundColor = "var(--background-primary)";
			textArea.style.color = "var(--text-normal)";
			textArea.value = templateSettings.defaultTemplateContent;
			
			textArea.addEventListener("change", async () => {
				templateSettings.defaultTemplateContent = textArea.value;
				await this.plugin.saveSettings();
			});
			
			// 按钮容器
			const buttonContainer = containerEl.createDiv({ cls: "htb-template-buttons" });
			buttonContainer.style.marginTop = "10px";
			buttonContainer.style.display = "flex";
			buttonContainer.style.gap = "10px";
			
			const resetButton = buttonContainer.createEl("button", {
				text: i18nHelper.getMessage('htb_button_reset_template'),
			});
			resetButton.addEventListener("click", async () => {
				textArea.value = defaultContent;
				templateSettings.defaultTemplateContent = defaultContent;
				await this.plugin.saveSettings();
				new Notice(i18nHelper.getMessage('htb_notice_template_reset'));
			});
			
			const clearButton = buttonContainer.createEl("button", {
				text: i18nHelper.getMessage('htb_button_clear_template'),
			});
			clearButton.addEventListener("click", async () => {
				textArea.value = "";
				templateSettings.defaultTemplateContent = "";
				await this.plugin.saveSettings();
				new Notice(i18nHelper.getMessage('htb_notice_template_cleared'));
			});
		}
	}

	/**
	 * 渲染文件夹模板规则列表
	 */
	private renderFolderTemplateRules(containerEl: HTMLElement, templateSettings: TypeTemplateSettings): void {
		const rulesContainer = containerEl.createDiv({ cls: "htb-folder-template-rules" });
		
		// 添加新规则按钮
		new Setting(rulesContainer)
			.setName(i18nHelper.getMessage('htb_folder_add_rule_name'))
			.setDesc(i18nHelper.getMessage('htb_folder_add_rule_desc'))
			.addButton((button) =>
				button
					.setButtonText(i18nHelper.getMessage('htb_folder_add_rule_button'))
					.setCta()
					.onClick(async () => {
						const newRule: FolderTemplateRule = {
							id: Date.now().toString(),
							name: i18nHelper.getMessage('htb_rule_new_name'),
							enabled: true,
							priority: templateSettings.folderTemplateRules.length + 1,
							folderPath: "",
							matchSubfolders: true,
							useBuiltInTemplate: true,
							templateContent: ""
						};
						templateSettings.folderTemplateRules.push(newRule);
						await this.plugin.saveSettings();
						this.display();
					})
			);

		// 显示现有规则
		const sortedRules = [...templateSettings.folderTemplateRules].sort((a, b) => b.priority - a.priority);
		
		sortedRules.forEach((rule, index) => {
			this.renderFolderTemplateRule(rulesContainer, rule, templateSettings);
		});
	}

	/**
	 * 渲染单个文件夹模板规则
	 */
	private renderFolderTemplateRule(
		container: HTMLElement, 
		rule: FolderTemplateRule, 
		templateSettings: TypeTemplateSettings
	): void {
		const ruleContainer = container.createDiv({ cls: "htb-folder-template-rule" });
		ruleContainer.style.cssText = `
			border: 1px solid var(--background-modifier-border);
			border-radius: 8px;
			padding: 15px;
			margin: 15px 0;
			background: var(--background-secondary);
		`;

		// 规则标题
		const header = ruleContainer.createDiv({ cls: "htb-rule-header" });
		header.style.cssText = `
			display: flex;
			align-items: center;
			margin-bottom: 10px;
			font-size: 1.1em;
			font-weight: 600;
		`;
		
		const enableToggle = header.createEl("input", { type: "checkbox" });
		enableToggle.checked = rule.enabled;
		enableToggle.style.marginRight = "10px";
		enableToggle.addEventListener("change", async () => {
			rule.enabled = enableToggle.checked;
			await this.plugin.saveSettings();
		});

		const titleSpan = header.createSpan({ text: `${rule.name} (优先级: ${rule.priority})` });
		titleSpan.style.flex = "1";

		const deleteBtn = header.createEl("button", { text: i18nHelper.getMessage('htb_rule_delete_button') });
		deleteBtn.style.cssText = "margin-left: auto; padding: 4px 8px;";
		deleteBtn.addEventListener("click", async () => {
			templateSettings.folderTemplateRules = templateSettings.folderTemplateRules.filter(r => r.id !== rule.id);
			await this.plugin.saveSettings();
			new Notice(i18nHelper.getMessage('htb_rule_deleted_notice'));
			this.display();
		});

		// 规则名称
		new Setting(ruleContainer)
			.setName(i18nHelper.getMessage('htb_rule_name_label'))
			.addText((text) =>
				text
					.setPlaceholder(i18nHelper.getMessage('htb_rule_name_placeholder'))
					.setValue(rule.name)
					.onChange(async (value) => {
						rule.name = value;
						await this.plugin.saveSettings();
					})
			);

		// 优先级
		new Setting(ruleContainer)
			.setName(i18nHelper.getMessage('htb_rule_priority_label'))
			.setDesc(i18nHelper.getMessage('htb_rule_priority_desc'))
			.addText((text) =>
				text
					.setPlaceholder("1")
					.setValue(rule.priority.toString())
					.onChange(async (value) => {
						const priority = parseInt(value);
						if (!isNaN(priority)) {
							rule.priority = priority;
							await this.plugin.saveSettings();
							this.display();
						}
					})
			);

		// 文件夹路径
		const folderPathSetting = new Setting(ruleContainer)
			.setName(i18nHelper.getMessage('htb_rule_folder_path_name'))
			.setDesc(i18nHelper.getMessage('htb_rule_folder_path_desc'))
			.addText((text) => {
				text
					.setPlaceholder("HTB/Machines/Easy")
					.setValue(rule.folderPath)
					.onChange(async (value) => {
						rule.folderPath = value;
						await this.plugin.saveSettings();
					});
				
				new FolderSuggest(this.app, text);
			});
		this.swapNameAndDesc(folderPathSetting);

		// 是否匹配子文件夹
		new Setting(ruleContainer)
			.setName(i18nHelper.getMessage('htb_rule_match_subfolders_name'))
			.setDesc(i18nHelper.getMessage('htb_rule_match_subfolders_desc'))
			.addToggle((toggle) =>
				toggle
					.setValue(rule.matchSubfolders)
					.onChange(async (value) => {
						rule.matchSubfolders = value;
						await this.plugin.saveSettings();
					})
			);

		// 文件名模板
		new Setting(ruleContainer)
			.setName(i18nHelper.getMessage('htb_rule_filename_template_name'))
			.setDesc(i18nHelper.getMessage('htb_rule_filename_template_desc'))
			.addText((text) =>
				text
					.setPlaceholder("{{name}} - {{difficulty}}")
					.setValue(rule.fileNameTemplate || "")
					.onChange(async (value) => {
						rule.fileNameTemplate = value;
						await this.plugin.saveSettings();
					})
			);

		// 模板配置
		ruleContainer.createEl("h4", { text: i18nHelper.getMessage('htb_rule_template_config_title') });

		// 使用内置模板开关
		new Setting(ruleContainer)
			.setName(i18nHelper.getMessage('htb_rule_use_builtin_name'))
			.setDesc(i18nHelper.getMessage('htb_rule_use_builtin_desc'))
			.addToggle((toggle) =>
				toggle
					.setValue(rule.useBuiltInTemplate)
					.onChange(async (value) => {
						rule.useBuiltInTemplate = value;
						await this.plugin.saveSettings();
						this.display();
					})
			);

		// 外部模板文件
		const ruleTemplateFileSetting = new Setting(ruleContainer)
			.setName(i18nHelper.getMessage('htb_rule_template_file_name'))
			.setDesc(i18nHelper.getMessage('htb_rule_template_file_desc'))
			.addText((text) => {
				text
					.setPlaceholder("Templates/HTB.md")
					.setValue(rule.templateFile || "")
					.onChange(async (value) => {
						rule.templateFile = value;
						await this.plugin.saveSettings();
					});
				
				new FileSuggest(this.app, text);
			});
		this.swapNameAndDesc(ruleTemplateFileSetting);

		// 内置模板内容编辑器
		if (rule.useBuiltInTemplate) {
			ruleContainer.createEl("div", { 
				text: i18nHelper.getMessage('htb_rule_template_content_name'),
				cls: "setting-item-name"
			});
			ruleContainer.createEl("div", { 
				text: i18nHelper.getMessage('htb_rule_template_content_desc'),
				cls: "setting-item-description"
			});
			
			const textArea = ruleContainer.createEl("textarea", {
				cls: "htb-template-editor",
				attr: {
					rows: "10",
					placeholder: i18nHelper.getMessage('htb_rule_template_content_placeholder')
				}
			});
			textArea.style.cssText = `
				width: 100%;
				min-height: 150px;
				font-family: monospace;
				font-size: 13px;
				padding: 10px;
				border: 1px solid var(--background-modifier-border);
				border-radius: 5px;
				background-color: var(--background-primary);
				color: var(--text-normal);
				margin-top: 5px;
			`;
			textArea.value = rule.templateContent || "";
			
			textArea.addEventListener("change", async () => {
				rule.templateContent = textArea.value;
				await this.plugin.saveSettings();
			});
		}
	}

	/**
	 * 显示模板字段说明表格
	 */
	private displayFieldsReference(containerEl: HTMLElement): void {
		// 页面标题和说明
		containerEl.createEl("h3", { text: i18nHelper.getMessage('htb_fields_title') });
		
		const intro = containerEl.createDiv({ cls: "htb-fields-intro" });
		intro.style.cssText = `
			padding: 15px;
			margin: 15px 0;
			border: 1px solid var(--background-modifier-border);
			border-radius: 8px;
			background: var(--background-secondary);
		`;
		intro.innerHTML = `
			<p><strong>${i18nHelper.getMessage('htb_fields_intro_title')}</strong></p>
			<ul>
				<li>${i18nHelper.getMessage('htb_fields_intro_usage')}</li>
				<li>${i18nHelper.getMessage('htb_fields_intro_copy')}</li>
				<li>${i18nHelper.getMessage('htb_fields_intro_switch')}</li>
			</ul>
		`;

		// 创建类型选择导航
		this.createFieldsTypeNavigation(containerEl);

		// 显示对应类型的字段表格
		const typeContent = containerEl.createDiv({ cls: 'htb-fields-type-content' });
		this.displayTypeFieldsTable(typeContent);
	}

	/**
	 * 创建字段类型选择导航
	 */
	private createFieldsTypeNavigation(containerEl: HTMLElement): void {
		const typeNav = containerEl.createDiv({ cls: 'htb-fields-type-navigation' });
		typeNav.style.cssText = `
			display: flex;
			gap: 10px;
			margin: 20px 0;
			flex-wrap: wrap;
		`;

		const types = [
			{ id: 'machine', icon: '🖥️', label: i18nHelper.getMessage('htb_fields_machine'), color: '#4caf50' },
			{ id: 'challenge', icon: '🎯', label: i18nHelper.getMessage('htb_fields_challenge'), color: '#ff9800' },
			{ id: 'sherlock', icon: '🔍', label: i18nHelper.getMessage('htb_fields_sherlock'), color: '#2196f3' }
		];

		types.forEach(type => {
			const typeButton = typeNav.createEl('button', {
				text: `${type.icon} ${type.label}`,
				cls: this.activeFieldsType === type.id ? 'htb-type-active' : 'htb-type'
			});
			
			const isActive = this.activeFieldsType === type.id;
			typeButton.style.cssText = `
				flex: 1;
				min-width: 150px;
				padding: 12px 20px;
				border: 2px solid ${isActive ? type.color : 'var(--background-modifier-border)'};
				background: ${isActive ? type.color : 'var(--background-primary)'};
				color: ${isActive ? 'white' : 'var(--text-normal)'};
				border-radius: 8px;
				cursor: pointer;
				font-weight: ${isActive ? 'bold' : 'normal'};
				transition: all 0.3s ease;
				font-size: 14px;
			`;
			
			typeButton.addEventListener('mouseenter', () => {
				if (this.activeFieldsType !== type.id) {
					typeButton.style.borderColor = type.color;
					typeButton.style.transform = 'translateY(-2px)';
					typeButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
				}
			});
			
			typeButton.addEventListener('mouseleave', () => {
				if (this.activeFieldsType !== type.id) {
					typeButton.style.borderColor = 'var(--background-modifier-border)';
					typeButton.style.transform = 'translateY(0)';
					typeButton.style.boxShadow = 'none';
				}
			});
			
			typeButton.addEventListener('click', () => {
				this.activeFieldsType = type.id as 'machine' | 'challenge' | 'sherlock';
				this.display();
			});
		});
	}

	/**
	 * 显示特定类型的字段表格
	 */
	private displayTypeFieldsTable(containerEl: HTMLElement): void {
		// 根据当前活动类型筛选字段
		const typeFields = TEMPLATE_FIELDS.filter(field => 
			field.applicableTo.toLowerCase().includes(this.activeFieldsType.toLowerCase())
		);

		// 统计信息
		const statsDiv = containerEl.createDiv({ cls: "htb-fields-stats" });
		statsDiv.style.cssText = `
			margin: 15px 0;
			padding: 12px 15px;
			border-radius: 5px;
			background: var(--background-secondary);
			font-size: 14px;
			color: var(--text-muted);
			display: flex;
			align-items: center;
			gap: 15px;
		`;
		
		let typeIcon = '🖥️';
		let typeName = 'Machine';
		let typeColor = '#4caf50';
		if (this.activeFieldsType === 'challenge') {
			typeIcon = '🎯';
			typeName = 'Challenge';
			typeColor = '#ff9800';
		} else if (this.activeFieldsType === 'sherlock') {
			typeIcon = '🔍';
			typeName = 'Sherlock';
			typeColor = '#2196f3';
		}
		
		statsDiv.innerHTML = `
			<span style="font-size: 24px;">${typeIcon}</span>
			<strong style="color: ${typeColor};">${typeName}</strong>
			<span>${i18nHelper.getMessage('htb_fields_count', typeFields.length.toString())}</span>
		`;

		// 搜索过滤器
		const searchContainer = containerEl.createDiv({ cls: "htb-fields-search" });
		searchContainer.style.cssText = `
			margin: 15px 0;
		`;
		
		const searchLabel = searchContainer.createEl("label", { text: i18nHelper.getMessage('htb_fields_search_label') });
		searchLabel.style.cssText = `
			font-weight: bold;
			margin-right: 10px;
		`;
		
		const searchInput = searchContainer.createEl("input", {
			type: "text",
			placeholder: i18nHelper.getMessage('htb_fields_search_placeholder')
		});
		searchInput.style.cssText = `
			width: 100%;
			max-width: 500px;
			padding: 8px 12px;
			border: 1px solid var(--background-modifier-border);
			border-radius: 5px;
			background: var(--background-primary);
			color: var(--text-normal);
		`;

		// 创建表格容器
		const tableContainer = containerEl.createDiv({ cls: "htb-fields-table-container" });
		tableContainer.style.cssText = `
			margin: 20px 0;
			overflow-x: auto;
			border: 1px solid var(--background-modifier-border);
			border-radius: 8px;
			max-height: 600px;
			overflow-y: auto;
		`;

		// 创建表格
		const table = tableContainer.createEl("table", { cls: "htb-fields-table" });
		table.style.cssText = `
			width: 100%;
			border-collapse: collapse;
			background: var(--background-primary);
		`;

		// 表头
		const thead = table.createEl("thead");
		const headerRow = thead.createEl("tr");
		headerRow.style.cssText = `
			background: var(--background-secondary);
			border-bottom: 2px solid var(--background-modifier-border);
		`;

		const headers = [
			{ text: i18nHelper.getMessage('htb_fields_table_field'), width: "30%" },
			{ text: i18nHelper.getMessage('htb_fields_table_desc'), width: "35%" },
			{ text: i18nHelper.getMessage('htb_fields_table_example'), width: "35%" }
		];

		headers.forEach(header => {
			const th = headerRow.createEl("th", { text: header.text });
			th.style.cssText = `
				padding: 12px;
				text-align: left;
				font-weight: bold;
				width: ${header.width};
				position: sticky;
				top: 0;
				background: var(--background-secondary);
				z-index: 10;
			`;
		});

		// 表体
		const tbody = table.createEl("tbody");

		// 渲染所有字段行
		const renderRows = (filter: string = '') => {
			tbody.empty();
			
			const filteredFields = typeFields.filter(field => {
				if (!filter) return true;
				const searchLower = filter.toLowerCase();
				return (
					field.field.toLowerCase().includes(searchLower) ||
					field.description.toLowerCase().includes(searchLower) ||
					field.example.toLowerCase().includes(searchLower)
				);
			});

			if (filteredFields.length === 0) {
				const noResultRow = tbody.createEl("tr");
				const noResultCell = noResultRow.createEl("td", {
					text: i18nHelper.getMessage('htb_fields_no_results'),
					attr: { colspan: "3" }
				});
				noResultCell.style.cssText = `
					padding: 20px;
					text-align: center;
					color: var(--text-muted);
					font-style: italic;
				`;
				return;
			}

			filteredFields.forEach((field, index) => {
				const row = tbody.createEl("tr");
				row.style.cssText = `
					border-bottom: 1px solid var(--background-modifier-border);
					transition: background-color 0.2s;
				`;
				
				row.addEventListener('mouseenter', () => {
					row.style.backgroundColor = 'var(--background-secondary)';
				});
				row.addEventListener('mouseleave', () => {
					row.style.backgroundColor = 'transparent';
				});

				// 创建可复制的单元格
				const createCopyableCell = (content: string, isCode: boolean = false) => {
					const td = row.createEl("td");
					td.style.cssText = `
						padding: 12px;
						cursor: pointer;
						position: relative;
					`;
					
					if (isCode) {
						const code = td.createEl("code", { text: content });
						code.style.cssText = `
							background: var(--background-secondary);
							padding: 2px 6px;
							border-radius: 3px;
							font-family: monospace;
						`;
					} else {
						td.textContent = content;
					}

					td.addEventListener('click', async () => {
						await navigator.clipboard.writeText(content);
						
						const tooltip = td.createEl("span", { text: `✓ ${i18nHelper.getMessage('htb_fields_copied')}` });
						tooltip.style.cssText = `
							position: absolute;
							top: 50%;
							right: 10px;
							transform: translateY(-50%);
							background: var(--interactive-accent);
							color: var(--text-on-accent);
							padding: 4px 8px;
							border-radius: 4px;
							font-size: 12px;
							font-weight: bold;
							pointer-events: none;
							animation: fadeIn 0.2s;
						`;
						
						setTimeout(() => {
							tooltip.remove();
						}, 1500);
						
						new Notice(i18nHelper.getMessage('htb_fields_copied_notice', content));
					});

					return td;
				};
				
				createCopyableCell(field.field, true);
				createCopyableCell(field.description);
				createCopyableCell(field.example, true);
			});
		};

		// 初始渲染
		renderRows();

		// 搜索功能
		searchInput.addEventListener('input', (e) => {
			const target = e.target as HTMLInputElement;
			renderRows(target.value);
		});
	}
}
