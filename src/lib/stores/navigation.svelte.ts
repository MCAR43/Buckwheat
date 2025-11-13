type Page = "home" | "settings" | "replay" | "cloud" | "profile";

class NavigationStore {
	currentPage = $state<Page>("home");
	replayId = $state<string | null>(null);

	navigateTo(page: Page): void {
		this.currentPage = page;
		if (page !== "replay") {
			this.replayId = null;
		}
	}

	navigateToReplay(id: string): void {
		this.replayId = id;
		this.currentPage = "replay";
	}

	navigateBack(): void {
		this.currentPage = "home";
		this.replayId = null;
	}
}

export const navigation = new NavigationStore();

