import { createClient, type User, type Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export interface Profile {
	id: string;
	device_id: string | null;
	storage_used: number;
	storage_limit: number;
	created_at: string;
	updated_at: string;
}

class AuthStore {
	user = $state<User | null>(null);
	session = $state<Session | null>(null);
	profile = $state<Profile | null>(null);
	loading = $state(true);
	error = $state<string | null>(null);
	supabase = createClient(supabaseUrl, supabaseAnonKey);

	constructor() {
		this.init();
	}

	async init() {
		try {
			// Get initial session
			const { data: { session } } = await this.supabase.auth.getSession();
			this.session = session;
			this.user = session?.user ?? null;

			if (this.user) {
				await this.loadProfile();
			}

			// Listen for auth changes
			this.supabase.auth.onAuthStateChange(async (_event, session) => {
				console.log('Auth state changed:', _event, session?.user?.email);
				this.session = session;
				this.user = session?.user ?? null;
				
				if (this.user) {
					await this.loadProfile();
				} else {
					this.profile = null;
				}
			});
		} catch (err) {
			console.error('Auth init error:', err);
			this.error = err instanceof Error ? err.message : 'Failed to initialize auth';
		} finally {
			this.loading = false;
		}
	}

	async loadProfile() {
		if (!this.user) return;

		try {
			const { data, error } = await this.supabase
				.from('profiles')
				.select('*')
				.eq('id', this.user.id)
				.single();

			if (error) {
				console.error('Error loading profile:', error);
				return;
			}

			this.profile = data;
		} catch (err) {
			console.error('Error loading profile:', err);
		}
	}

	async signUp(email: string, password: string) {
		try {
			this.loading = true;
			this.error = null;

			const { data, error } = await this.supabase.auth.signUp({
				email,
				password,
			});

			if (error) {
				this.error = error.message;
				return { success: false, error: error.message };
			}

			// Profile will be created automatically by database trigger
			return { success: true, data };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to sign up';
			this.error = message;
			return { success: false, error: message };
		} finally {
			this.loading = false;
		}
	}

	async signIn(email: string, password: string) {
		try {
			this.loading = true;
			this.error = null;

			const { data, error } = await this.supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (error) {
				this.error = error.message;
				return { success: false, error: error.message };
			}

			return { success: true, data };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to sign in';
			this.error = message;
			return { success: false, error: message };
		} finally {
			this.loading = false;
		}
	}

	async signOut() {
		try {
			this.loading = true;
			this.error = null;

			const { error } = await this.supabase.auth.signOut();

			if (error) {
				this.error = error.message;
				return { success: false, error: error.message };
			}

			this.user = null;
			this.session = null;
			this.profile = null;

			return { success: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to sign out';
			this.error = message;
			return { success: false, error: message };
		} finally {
			this.loading = false;
		}
	}

	getToken(): string | undefined {
		return this.session?.access_token;
	}

	get isAuthenticated(): boolean {
		return this.user !== null;
	}

	get storageUsedPercent(): number {
		if (!this.profile) return 0;
		return (this.profile.storage_used / this.profile.storage_limit) * 100;
	}

	get storageUsedGB(): number {
		if (!this.profile) return 0;
		return this.profile.storage_used / (1024 ** 3);
	}

	get storageLimitGB(): number {
		if (!this.profile) return 0;
		return this.profile.storage_limit / (1024 ** 3);
	}
}

export const auth = new AuthStore();

