import { Editor, Notice, Plugin } from "obsidian";
import HTBAuthComponent from "./htb/auth/HTBAuthComponent";
import HTBMachineLoadHandler from "./htb/data/handler/HTBMachineLoadHandler";
import HTBChallengeLoadHandler from "./htb/data/handler/HTBChallengeLoadHandler";
import HTBSherlockLoadHandler from "./htb/data/handler/HTBSherlockLoadHandler";
import { HTBMachine } from "./htb/data/model/HTBMachine";
import { HTBChallenge } from "./htb/data/model/HTBChallenge";
import { HTBSherlock } from "./htb/data/model/HTBSherlock";
import FileHandler from "./file/FileHandler";
import { HTBPluginSettings, DEFAULT_HTB_SETTINGS } from "./constant/HTBSettings";
import { HTBSettingTab } from "./htb/setting/HTBSettingTab";
import { FolderSuggest } from "./htb/setting/FolderSuggest";
import { HTBSearchModal, HTBItemType, HTBItem } from "./htb/ui/HTBSearchModal";
import { log } from "./utils/Logutil";
import { i18nHelper } from "./lang/helper";

export default class HTBPlugin extends Plugin {
	public settings: HTBPluginSettings;
	public fileHandler: FileHandler;
	public authComponent: HTBAuthComponent;
	public machineHandler: HTBMachineLoadHandler;
	public challengeHandler: HTBChallengeLoadHandler;
	public sherlockHandler: HTBSherlockLoadHandler;
	public statusBar: HTMLElement;

	async onload() {
		console.log("----HTB Plugin Loading------");
		await this.loadSettings();

		// Initialize components
		this.fileHandler = new FileHandler(this.app);
		this.authComponent = new HTBAuthComponent(this.settings);
		this.machineHandler = new HTBMachineLoadHandler(this.app, this);
		this.challengeHandler = new HTBChallengeLoadHandler(this.app, this);
		this.sherlockHandler = new HTBSherlockLoadHandler(this.app, this);

		// Add status bar
		if (this.settings.statusBar) {
			this.statusBar = this.addStatusBarItem();
		}

		// Add command: Import HTB Machine
		this.addCommand({
			id: "htb-import-machine",
			name: i18nHelper.getMessage('htb_import_machine'),
			callback: async () => {
				await this.importMachine();
			},
		});

		// Add command: Import HTB Challenge
		this.addCommand({
			id: "htb-import-challenge",
			name: i18nHelper.getMessage('htb_import_challenge'),
			callback: async () => {
				await this.importChallenge();
			},
		});

		// Add command: Import HTB Sherlock
		this.addCommand({
			id: "htb-import-sherlock",
			name: i18nHelper.getMessage('htb_import_sherlock'),
			callback: async () => {
				await this.importSherlock();
			},
		});

		// Add settings tab
		this.addSettingTab(new HTBSettingTab(this.app, this));

		console.log("----HTB Plugin Loaded------");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_HTB_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async onunload() {
		console.log("----HTB Plugin Unloading------");
	}

	/**
	 * Import HTB machine and create a new note
	 */
	async importMachine() {
		try {
			// Check authentication
			if (!this.authComponent.isAuthenticated()) {
				new Notice(i18nHelper.getMessage('htb_configure_token'));
				return;
			}

			// Open search modal to select machine
			const machine = await this.promptForItemSelection<HTBMachine>('machine');
			if (!machine) {
				return; // User cancelled
			}

			this.showStatus(i18nHelper.getMessage('htb_loading'));

			// Prompt user for save location
			const fileName = this.generateFileName(machine);
			const saveLocation = await this.promptForSaveLocation(this.settings.defaultDataFilePath, fileName);
			if (!saveLocation) {
				return; // User cancelled
			}
			
			// Generate content from template (需要目标路径以匹配文件夹模板)
			const content = await this.machineHandler.generateContent(machine, saveLocation);
			
			await this.fileHandler.createNewNoteWithData(saveLocation, content, this.settings.openAfterCreate);

			this.showStatus(i18nHelper.getMessage('htb_created', machine.name));
			new Notice(i18nHelper.getMessage('htb_created', machine.name));

		} catch (error) {
			log.error("Error importing HTB machine:", error);
			new Notice(i18nHelper.getMessage('htb_create_failed', error.message));
		} finally {
			this.clearStatusBarDelay();
		}
	}


	/**
	 * Import HTB challenge and create a new note
	 */
	async importChallenge() {
		try {
			// Check authentication
			if (!this.authComponent.isAuthenticated()) {
				new Notice(i18nHelper.getMessage('htb_configure_token'));
				return;
			}

			// Open search modal to select challenge
			const challenge = await this.promptForItemSelection<HTBChallenge>('challenge');
			if (!challenge) {
				return; // User cancelled
			}

			this.showStatus(i18nHelper.getMessage('htb_loading'));

			// Prompt user for save location
			const fileName = this.generateChallengeFileName(challenge);
			const saveLocation = await this.promptForSaveLocation(this.settings.defaultDataFilePath, fileName);
			if (!saveLocation) {
				return; // User cancelled
			}
			
			// Generate content from template (需要目标路径以匹配文件夹模板)
			const content = await this.challengeHandler.generateContent(challenge, saveLocation);
			
			await this.fileHandler.createNewNoteWithData(saveLocation, content, this.settings.openAfterCreate);

			this.showStatus(i18nHelper.getMessage('htb_created', challenge.name));
			new Notice(i18nHelper.getMessage('htb_created', challenge.name));

		} catch (error) {
			log.error("Error importing HTB challenge:", error);
			new Notice(i18nHelper.getMessage('htb_create_failed', error.message));
		} finally {
			this.clearStatusBarDelay();
		}
	}


	/**
	 * Import HTB Sherlock and create a new note
	 */
	async importSherlock() {
		try {
			// Check authentication
			if (!this.authComponent.isAuthenticated()) {
				new Notice(i18nHelper.getMessage('htb_configure_token'));
				return;
			}

			// Open search modal to select sherlock
			const sherlock = await this.promptForItemSelection<HTBSherlock>('sherlock');
			if (!sherlock) {
				return; // User cancelled
			}

			this.showStatus(i18nHelper.getMessage('htb_loading'));

			// Prompt user for save location
			const fileName = this.generateSherlockFileName(sherlock);
			const saveLocation = await this.promptForSaveLocation(this.settings.defaultDataFilePath, fileName);
			if (!saveLocation) {
				return; // User cancelled
			}
			
			// Generate content from template
			const content = await this.sherlockHandler.generateContent(sherlock, saveLocation);
			
			await this.fileHandler.createNewNoteWithData(saveLocation, content, this.settings.openAfterCreate);

			this.showStatus(i18nHelper.getMessage('htb_created', sherlock.name));
			new Notice(i18nHelper.getMessage('htb_created', sherlock.name));

		} catch (error) {
			log.error("Error importing HTB Sherlock:", error);
			new Notice(i18nHelper.getMessage('htb_create_failed', error.message));
		} finally {
			this.clearStatusBarDelay();
		}
	}


	/**
	 * Prompt user to search and select an HTB item
	 */
	async promptForItemSelection<T extends HTBItem>(itemType: HTBItemType): Promise<T | null> {
		return new Promise((resolve) => {
			const modal = new HTBSearchModal(this.app, this, itemType, (item) => {
				resolve(item as T);
			});
			modal.open();
		});
	}

	/**
	 * Prompt user for save location
	 */
	async promptForSaveLocation(defaultFolder: string, fileName: string): Promise<string | null> {
		return new Promise((resolve) => {
			const modal = new FolderSelectorModal(this.app, defaultFolder, fileName, (location) => {
				resolve(location);
			});
			modal.open();
		});
	}

	/**
	 * Generate file name for machine (without .md extension)
	 */
	generateFileName(machine: HTBMachine): string {
		const template = this.settings.defaultFileNameTemplate || "{{name}}";
		return template
			.replace(/{{name}}/g, machine.name)
			.replace(/{{id}}/g, machine.id.toString())
			.replace(/{{os}}/g, machine.os || "")
			.replace(/{{difficulty}}/g, machine.difficulty || "");
	}

	/**
	 * Generate file name for challenge (without .md extension)
	 */
	generateChallengeFileName(challenge: HTBChallenge): string {
		const template = this.settings.defaultFileNameTemplate || "{{name}}";
		return template
			.replace(/{{name}}/g, challenge.name)
			.replace(/{{id}}/g, challenge.id.toString())
			.replace(/{{category}}/g, challenge.category || "")
			.replace(/{{difficulty}}/g, challenge.difficulty || "");
	}

	/**
	 * Generate file name for sherlock (without .md extension)
	 */
	generateSherlockFileName(sherlock: HTBSherlock): string {
		const template = this.settings.defaultFileNameTemplate || "{{name}}";
		return template
			.replace(/{{name}}/g, sherlock.name)
			.replace(/{{id}}/g, sherlock.id.toString())
			.replace(/{{category}}/g, sherlock.category || "Forensics")
			.replace(/{{difficulty}}/g, sherlock.difficulty || "");
	}

	/**
	 * Show status in status bar
	 */
	showStatus(message: string) {
		if (!this.settings.statusBar || !this.statusBar) {
			return;
		}
		this.statusBar.empty();
		this.statusBar.setText(message);
	}

	/**
	 * Clear status bar
	 */
	clearStatusBar() {
		if (!this.settings.statusBar || !this.statusBar) {
			return;
		}
		this.statusBar.empty();
	}

	/**
	 * Clear status bar with delay
	 */
	clearStatusBarDelay() {
		if (!this.settings.statusBar || !this.statusBar) {
			return;
		}
		setTimeout(() => this.statusBar.empty(), 3000);
	}

}

/**
 * Modal for selecting save location
 */
import { App, Modal, Setting, TFolder, TAbstractFile } from "obsidian";
class FolderSelectorModal extends Modal {
	private onSubmit: (location: string) => void;
	private folderPath: string;
	private fileName: string;
	private previewEl: HTMLElement;
	private folderSuggest: FolderSuggest;

	constructor(app: App, defaultFolder: string, fileName: string, onSubmit: (location: string) => void) {
		super(app);
		this.folderPath = defaultFolder || "";
		this.fileName = fileName;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: i18nHelper.getMessage('htb_folder_select_title') });

		// File name preview
		new Setting(contentEl)
			.setName("文件名")
			.setDesc("将要创建的文件名称")
			.addText((text) => {
				text.setValue(this.fileName)
					.setDisabled(true);
			});

		// Folder path input with FolderSuggest
		new Setting(contentEl)
			.setName("保存到文件夹")
			.setDesc("输入或选择文件夹路径（如果文件夹不存在将自动创建）")
			.addText((text) => {
				text.setPlaceholder("例如：HTB/Machines/Easy")
					.setValue(this.folderPath)
					.onChange((value) => {
						this.folderPath = value;
						this.updatePreview();
					});
				
				// 创建 FolderSuggest 实例
				this.folderSuggest = new FolderSuggest(this.app, text);
				
				// 添加 Enter 键处理
				text.inputEl.addEventListener("keydown", (event) => {
					if (event.key === "Enter" && !this.folderSuggest.isVisible()) {
						event.preventDefault();
						this.submit();
					}
				});
				
				// 自动聚焦
				setTimeout(() => text.inputEl.focus(), 10);
			});

		// Full path preview
		this.previewEl = contentEl.createDiv("folder-selector-preview");
		this.updatePreview();
		this.previewEl.style.marginTop = "1em";
		this.previewEl.style.marginBottom = "1em";
		this.previewEl.style.padding = "0.5em";
		this.previewEl.style.backgroundColor = "var(--background-secondary)";
		this.previewEl.style.borderRadius = "4px";

		// Buttons
		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText(i18nHelper.getMessage('htb_folder_create_button'))
					.setCta()
					.onClick(() => {
						this.submit();
					})
			)
			.addButton((btn) =>
				btn
					.setButtonText(i18nHelper.getMessage('110005'))
					.onClick(() => {
						this.close();
						this.onSubmit(null);
					})
			);
	}

	updatePreview() {
		if (!this.previewEl) return;
		
		this.previewEl.empty();
		const fullPath = this.folderPath ? `${this.folderPath}/${this.fileName}` : this.fileName;
		this.previewEl.createEl("strong", { text: "完整路径: " });
		this.previewEl.createEl("code", { text: fullPath });
	}

	submit() {
		const fullPath = this.folderPath ? `${this.folderPath}/${this.fileName}` : this.fileName;
		this.close();
		this.onSubmit(fullPath);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
		// 清理 FolderSuggest
		if (this.folderSuggest) {
			this.folderSuggest.destroy();
		}
	}
}