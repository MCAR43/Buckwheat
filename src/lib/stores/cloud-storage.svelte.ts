import { readFile, writeFile } from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';
import { auth } from './auth.svelte';

export interface Upload {
	id: string;
	user_id: string;
	filename: string;
	b2_file_id: string | null;
	b2_file_name: string | null;
	file_size: number;
	duration_seconds: number | null;
	uploaded_at: string;
	metadata: any | null;
}

export interface Clip {
	id: string;
	user_id: string | null;
	device_id: string | null;
	filename: string;
	b2_file_id: string | null;
	b2_file_name: string | null;
	file_size: number;
	duration_seconds: number | null;
	share_code: string;
	uploaded_at: string;
	metadata: any | null;
}

export interface UploadQueueItem {
	id: string;
	videoPath: string;
	status: 'pending' | 'uploading' | 'completed' | 'error';
	progress: number;
	error?: string;
}

class CloudStorageStore {
	uploads = $state<Upload[]>([]);
	clips = $state<Clip[]>([]);
	uploadQueue = $state<UploadQueueItem[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);

	async refreshUploads() {
		if (!auth.isAuthenticated || !auth.user) {
			this.uploads = [];
			return;
		}

		try {
			this.loading = true;
			this.error = null;

			const { data, error } = await auth.supabase
				.from('uploads')
				.select('*')
				.eq('user_id', auth.user.id)
				.order('uploaded_at', { ascending: false });

			if (error) throw error;

			this.uploads = data || [];
		} catch (err) {
			console.error('Error fetching uploads:', err);
			this.error = err instanceof Error ? err.message : 'Failed to fetch uploads';
		} finally {
			this.loading = false;
		}
	}

	async uploadVideo(videoPath: string, metadata?: any) {
		if (!auth.isAuthenticated || !auth.user) {
			throw new Error('Must be authenticated to upload');
		}

		const token = auth.getToken();
		if (!token) {
			throw new Error('No auth token available');
		}

		// Add to queue
		const queueItem: UploadQueueItem = {
			id: crypto.randomUUID(),
			videoPath,
			status: 'pending',
			progress: 0,
		};
		this.uploadQueue.push(queueItem);

		try {
			queueItem.status = 'uploading';
			console.log('📤 Starting upload for:', videoPath);

			// Read file
			console.log('📖 Reading file...');
			const fileBuffer = await readFile(videoPath);
			const fileName = videoPath.split(/[\\/]/).pop()!;
			const fileSize = fileBuffer.length;
			console.log(`📊 File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

			queueItem.progress = 5;

			// Call Edge Function to get signed upload URL
			console.log('🔐 Getting signed URL from Edge Function...');
			const { data: signedData, error: signedError } = await auth.supabase.functions.invoke('generate-upload-url', {
				body: { fileName, fileSize, metadata }
			});

			if (signedError) {
				console.error('❌ Edge Function error:', signedError);
				throw signedError;
			}

			console.log('✅ Got signed URL:', signedData.uploadUrl.substring(0, 100) + '...');
			queueItem.progress = 10;

			// Upload directly to B2 using XMLHttpRequest for progress tracking
			console.log('⬆️  Starting B2 upload with progress tracking...');
			await new Promise<void>((resolve, reject) => {
				const xhr = new XMLHttpRequest();

				// Track upload progress
				xhr.upload.addEventListener('progress', (e) => {
					if (e.lengthComputable) {
						const percentComplete = (e.loaded / e.total) * 100;
						// Map 10% to 90% for upload progress
						queueItem.progress = 10 + (percentComplete * 0.8);
						console.log(`📊 Upload progress: ${percentComplete.toFixed(1)}% (${e.loaded}/${e.total} bytes)`);
					}
				});

				xhr.addEventListener('load', () => {
					if (xhr.status >= 200 && xhr.status < 300) {
						console.log('✅ Upload completed successfully!', xhr.status);
						queueItem.progress = 90;
						resolve();
					} else {
						console.error('❌ Upload failed with status:', xhr.status, xhr.statusText);
						console.error('Response:', xhr.responseText);
						reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
					}
				});

				xhr.addEventListener('error', () => {
					console.error('❌ Network error during upload');
					reject(new Error('Network error during upload'));
				});

				xhr.addEventListener('abort', () => {
					console.error('❌ Upload aborted');
					reject(new Error('Upload aborted'));
				});

				xhr.open('PUT', signedData.uploadUrl);
				xhr.setRequestHeader('Content-Type', 'video/mp4');
				xhr.send(fileBuffer);
			});

			console.log('💾 Updating database and profile...');

			// Update storage usage in profile
			await auth.loadProfile();

			queueItem.status = 'completed';
			queueItem.progress = 100;

			console.log('🎉 Upload fully completed!');

			// Refresh uploads list
			await this.refreshUploads();

			return signedData.upload;
		} catch (err) {
			console.error('❌ Error uploading video:', err);
			queueItem.status = 'error';
			queueItem.error = err instanceof Error ? err.message : 'Upload failed';
			throw err;
		}
	}

	async downloadVideo(uploadId: string, destPath: string) {
		if (!auth.isAuthenticated || !auth.user) {
			throw new Error('Must be authenticated to download');
		}

		const token = auth.getToken();
		if (!token) {
			throw new Error('No auth token available');
		}

		try {
			// Call Edge Function to get signed download URL
			const { data, error } = await auth.supabase.functions.invoke('generate-download-url', {
				body: { uploadId }
			});

			if (error) throw error;

			// Download from B2 using signed URL
			const response = await fetch(data.downloadUrl);
			if (!response.ok) {
				throw new Error(`Download failed: ${response.statusText}`);
			}

			const blob = await response.blob();
			const arrayBuffer = await blob.arrayBuffer();
			const uint8Array = new Uint8Array(arrayBuffer);

			// Write to destination using Tauri fs
			await writeFile(destPath, uint8Array);

		} catch (err) {
			console.error('Error downloading video:', err);
			throw err;
		}
	}

	async deleteUpload(uploadId: string) {
		if (!auth.isAuthenticated || !auth.user) {
			throw new Error('Must be authenticated to delete');
		}

		try {
			// Get upload info first
			const { data: upload, error: fetchError } = await auth.supabase
				.from('uploads')
				.select('*')
				.eq('id', uploadId)
				.eq('user_id', auth.user.id)
				.single();

			if (fetchError || !upload) {
				throw new Error('Upload not found or unauthorized');
			}

			// Delete from database (RLS will enforce user ownership)
			const { error: deleteError } = await auth.supabase
				.from('uploads')
				.delete()
				.eq('id', uploadId);

			if (deleteError) throw deleteError;

			// TODO: Delete from B2 via Edge Function (future enhancement)
			// For now, files remain in B2 but are inaccessible via database

			// Update storage usage
			const newUsage = (auth.profile?.storage_used || 0) - upload.file_size;
			await auth.supabase
				.from('profiles')
				.update({ storage_used: Math.max(0, newUsage) })
				.eq('id', auth.user.id);

			// Refresh uploads list and profile
			await this.refreshUploads();
			await auth.loadProfile();
		} catch (err) {
			console.error('Error deleting upload:', err);
			throw err;
		}
	}

	async createPublicClip(videoPath: string, deviceId: string, metadata?: any) {
		try {
			// Read file and convert to base64
			const fileBuffer = await readFile(videoPath);
			const fileName = videoPath.split(/[\\/]/).pop()!;
			
			// Convert to base64 for transfer
			const base64 = btoa(String.fromCharCode(...fileBuffer));

			// Call Edge Function
			const { data, error } = await auth.supabase.functions.invoke('create-public-clip', {
				body: {
					fileName,
					fileData: base64,
					deviceId,
					metadata: metadata || null
				}
			});

			if (error) throw error;

			return data.clip;
		} catch (err) {
			console.error('Error creating public clip:', err);
			throw err;
		}
	}

	async getClipByCode(shareCode: string) {
		try {
			const { data, error } = await auth.supabase
				.from('clips')
				.select('*')
				.eq('share_code', shareCode.toUpperCase())
				.single();

			if (error) throw error;

			return data;
		} catch (err) {
			console.error('Error fetching clip:', err);
			throw err;
		}
	}

	removeFromQueue(id: string) {
		this.uploadQueue = this.uploadQueue.filter(item => item.id !== id);
	}

	clearCompletedQueue() {
		this.uploadQueue = this.uploadQueue.filter(
			item => item.status !== 'completed' && item.status !== 'error'
		);
	}
	
	clearErrorQueue() {
		this.uploadQueue = this.uploadQueue.filter(item => item.status !== 'error');
	}
}

export const cloudStorage = new CloudStorageStore();
