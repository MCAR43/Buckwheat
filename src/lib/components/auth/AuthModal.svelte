<script lang="ts">
	import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { auth } from '$lib/stores/auth.svelte';
	import { toast } from 'svelte-sonner';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	let mode = $state<'login' | 'signup'>('login');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let isLoading = $state(false);

	async function handleSubmit() {
		if (mode === 'signup' && password !== confirmPassword) {
			toast.error('Passwords do not match');
			return;
		}

		if (password.length < 6) {
			toast.error('Password must be at least 6 characters');
			return;
		}

		isLoading = true;

		try {
			if (mode === 'login') {
				const result = await auth.signIn(email, password);
				if (result.success) {
					toast.success('Logged in successfully!');
					open = false;
					resetForm();
				} else {
					toast.error(result.error || 'Failed to log in');
				}
			} else {
				const result = await auth.signUp(email, password);
				if (result.success) {
					toast.success('Account created successfully!');
					open = false;
					resetForm();
				} else {
					toast.error(result.error || 'Failed to create account');
				}
			}
		} catch (error) {
			console.error('Auth error:', error);
			toast.error('An unexpected error occurred');
		} finally {
			isLoading = false;
		}
	}

	function resetForm() {
		email = '';
		password = '';
		confirmPassword = '';
	}

	function switchMode() {
		mode = mode === 'login' ? 'signup' : 'login';
		resetForm();
	}
</script>

<Dialog bind:open={open}>
	<DialogContent class="sm:max-w-md">
		<DialogHeader>
			<DialogTitle>{mode === 'login' ? 'Log In' : 'Sign Up'}</DialogTitle>
			<DialogDescription>
				{mode === 'login' 
					? 'Log in to access cloud storage and sync your recordings.' 
					: 'Create an account to get 5GB of free cloud storage.'}
			</DialogDescription>
		</DialogHeader>

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
			<div class="space-y-2">
				<Label for="email">Email</Label>
				<Input
					id="email"
					type="email"
					placeholder="your@email.com"
					bind:value={email}
					required
					disabled={isLoading}
				/>
			</div>

			<div class="space-y-2">
				<Label for="password">Password</Label>
				<Input
					id="password"
					type="password"
					placeholder="••••••••"
					bind:value={password}
					required
					disabled={isLoading}
				/>
			</div>

			{#if mode === 'signup'}
				<div class="space-y-2">
					<Label for="confirm-password">Confirm Password</Label>
					<Input
						id="confirm-password"
						type="password"
						placeholder="••••••••"
						bind:value={confirmPassword}
						required
						disabled={isLoading}
					/>
				</div>
			{/if}

			<div class="flex flex-col gap-3">
				<Button type="submit" class="w-full" disabled={isLoading}>
					{isLoading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
				</Button>

				<Button 
					type="button" 
					variant="ghost" 
					class="w-full" 
					onclick={switchMode}
					disabled={isLoading}
				>
					{mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
				</Button>
			</div>
		</form>
	</DialogContent>
</Dialog>

