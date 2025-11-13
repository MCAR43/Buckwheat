<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { auth } from '$lib/stores/auth.svelte';
	import { toast } from 'svelte-sonner';
	import { LogOut, HardDrive, User } from '@lucide/svelte';

	async function handleLogout() {
		const result = await auth.signOut();
		if (result.success) {
			toast.success('Logged out successfully');
		} else {
			toast.error(result.error || 'Failed to log out');
		}
	}

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
</script>

{#if auth.isAuthenticated && auth.user}
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<User class="size-5" />
					<CardTitle>Account</CardTitle>
				</div>
				<Button variant="ghost" size="sm" onclick={handleLogout}>
					<LogOut class="size-4 mr-2" />
					Log Out
				</Button>
			</div>
			<CardDescription>{auth.user.email}</CardDescription>
		</CardHeader>

		{#if auth.profile}
			<CardContent class="space-y-4">
				<div class="space-y-2">
					<div class="flex items-center justify-between text-sm">
						<div class="flex items-center gap-2">
							<HardDrive class="size-4" />
							<span class="font-medium">Cloud Storage</span>
						</div>
						<span class="text-muted-foreground">
							{formatBytes(auth.profile.storage_used)} / {formatBytes(auth.profile.storage_limit)}
						</span>
					</div>

					<div class="w-full bg-secondary rounded-full h-2 overflow-hidden">
						<div 
							class="h-full bg-primary transition-all duration-300"
							class:bg-yellow-500={auth.storageUsedPercent > 80}
							class:bg-red-500={auth.storageUsedPercent > 95}
							style="width: {auth.storageUsedPercent}%"
						></div>
					</div>

					<p class="text-xs text-muted-foreground">
						{auth.storageUsedPercent.toFixed(1)}% used ({auth.storageUsedGB.toFixed(2)} GB / {auth.storageLimitGB} GB)
					</p>

					{#if auth.storageUsedPercent > 90}
						<p class="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
							⚠️ Storage almost full! Consider deleting old recordings.
						</p>
					{/if}
				</div>
			</CardContent>
		{/if}
	</Card>
{/if}

