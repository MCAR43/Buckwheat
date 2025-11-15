interface Env {
	B2_ENDPOINT: string;
	B2_CLIPS_BUCKET: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
					'Access-Control-Allow-Headers': 'Range',
					'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
				},
			});
		}

		// Extract share code from URL path (e.g., /ABC12345)
		const pathParts = url.pathname.split('/').filter(Boolean);
		const shareCode = pathParts[0];

		if (!shareCode || shareCode.length !== 8) {
			return new Response('Invalid share code', { status: 404 });
		}

		// Check if requesting specific file or just the clip page
		const fileName = pathParts[1];

		if (!fileName) {
			// Return HTML page for viewing the clip
			return new Response(getClipViewerHTML(shareCode), {
				headers: {
					'Content-Type': 'text/html',
					'Cache-Control': 'public, max-age=300', // 5 minutes
				},
			});
		}

		try {
			// Construct B2 URL
			const b2Url = `${env.B2_ENDPOINT}/${env.B2_CLIPS_BUCKET}/clips/${shareCode}/${fileName}`;

			// Check cache first (Cloudflare Cache API)
			const cacheKey = new Request(b2Url, request);
			const cache = caches.default;
			const cachedResponse = await cache.match(cacheKey);

			// Handle Range requests for video streaming
			const rangeHeader = request.headers.get('Range');
			
			if (rangeHeader) {
				// Fetch from B2 with Range header
				const b2Request = new Request(b2Url, {
					headers: {
						'Range': rangeHeader,
					},
				});

				const b2Response = await fetch(b2Request);

				if (!b2Response.ok && b2Response.status !== 206) {
					return new Response('Clip not found', { status: 404 });
				}

				// Extract range info from response
				const contentRange = b2Response.headers.get('Content-Range');
				const contentLength = b2Response.headers.get('Content-Length');
				const contentType = b2Response.headers.get('Content-Type') || 'video/mp4';

				// Return with proper Range response headers
				return new Response(b2Response.body, {
					status: b2Response.status === 206 ? 206 : 200,
					headers: {
						'Content-Type': contentType,
						'Content-Range': contentRange || '',
						'Content-Length': contentLength || '',
						'Accept-Ranges': 'bytes',
						'Cache-Control': 'public, max-age=31536000, immutable', // 1 year (immutable content)
						'Access-Control-Allow-Origin': '*',
						'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
					},
				});
			}

			// For non-range requests, check cache first
			if (cachedResponse) {
				return cachedResponse;
			}

			// Fetch from B2
			const b2Response = await fetch(b2Url, {
				headers: {
					// Only fetch what we need for HEAD requests
					...(request.method === 'HEAD' ? {} : {}),
				},
			});

			if (!b2Response.ok) {
				return new Response('Clip not found', { status: 404 });
			}

			// Get content length and type
			const contentLength = b2Response.headers.get('Content-Length');
			const contentType = b2Response.headers.get('Content-Type') || 'video/mp4';

			// Create response with proper headers
			const response = new Response(b2Response.body, {
				status: b2Response.status,
				headers: {
					'Content-Type': contentType,
					'Content-Length': contentLength || '',
					'Accept-Ranges': 'bytes',
					'Cache-Control': 'public, max-age=31536000, immutable', // 1 year (immutable content)
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
				},
			});

			// Cache the response (for non-range requests)
			ctx.waitUntil(cache.put(cacheKey, response.clone()));

			return response;
		} catch (error) {
			console.error('Error fetching from B2:', error);
			return new Response('Error loading clip', { status: 500 });
		}
	},
};

function getClipViewerHTML(shareCode: string): string {
	return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Peppi Clip - ${shareCode}</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background: #0a0a0a;
			color: #fff;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			min-height: 100vh;
			padding: 20px;
		}
		.container {
			max-width: 1200px;
			width: 100%;
		}
		h1 {
			text-align: center;
			margin-bottom: 20px;
			font-size: 24px;
		}
		.code {
			font-family: 'Courier New', monospace;
			background: #1a1a1a;
			padding: 4px 8px;
			border-radius: 4px;
		}
		video {
			width: 100%;
			max-height: 80vh;
			background: #000;
			border-radius: 8px;
		}
		.error {
			text-align: center;
			color: #ff6b6b;
			padding: 20px;
		}
		.footer {
			margin-top: 20px;
			text-align: center;
			opacity: 0.6;
			font-size: 14px;
		}
	</style>
</head>
<body>
	<div class="container">
		<h1>Peppi Clip <span class="code">${shareCode}</span></h1>
		<div id="content">
			<p style="text-align: center;">Loading clip...</p>
		</div>
		<div class="footer">
			<p>Powered by Peppi</p>
		</div>
	</div>

	<script>
		async function loadClip() {
			try {
				// Fetch clip metadata from Supabase (you'll need to add this)
				// For now, just attempt to load the video
				const videoElement = document.createElement('video');
				videoElement.controls = true;
				videoElement.autoplay = false;
				
				// Try common video file names (you should fetch this from your database)
				const possibleNames = ['video.mp4', 'clip.mp4', 'recording.mp4'];
				
				for (const name of possibleNames) {
					const videoUrl = '/${shareCode}/' + name;
					try {
						const response = await fetch(videoUrl, { method: 'HEAD' });
						if (response.ok) {
							videoElement.src = videoUrl;
							document.getElementById('content').innerHTML = '';
							document.getElementById('content').appendChild(videoElement);
							return;
						}
					} catch (e) {
						continue;
					}
				}
				
				throw new Error('Clip not found');
			} catch (error) {
				document.getElementById('content').innerHTML = 
					'<div class="error">Clip not found or unable to load.</div>';
			}
		}

		loadClip();
	</script>
</body>
</html>
	`;
}
