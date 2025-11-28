import 'dotenv/config';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { initSocketServer } from './src/lib/server/socket';

export default defineConfig(() => {
	return {
		plugins: [
			tailwindcss(),
			sveltekit(),
			{
				name: 'socket-io',
				configureServer(server) {
					if (!server.httpServer) return;
					// Cast to any to accommodate Vite's dev server http implementation (http/https/http2)
					initSocketServer(server.httpServer as any);
					console.log('[dev] Socket server initialized using shared implementation');
				}
			}
		]
	};
});
