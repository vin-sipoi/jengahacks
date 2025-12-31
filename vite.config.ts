import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  // Configure source maps - use inline in development to avoid loading issues
  esbuild: {
    sourcemap: mode === 'development' ? 'inline' : true,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'framer-motion',
      'lucide-react',
    ],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react(),
    // Put the Sentry vite plugin after all other plugins
    ...(process.env.SENTRY_AUTH_TOKEN
      ? [
          sentryVitePlugin({
            authToken: process.env.SENTRY_AUTH_TOKEN,
            org: "visana",
            project: "javascript-react",
          }),
        ]
      : []),
  ],
  build: {
    target: ["es2015", "edge88", "firefox78", "chrome87", "safari14"],
    cssTarget: ["chrome64", "firefox67", "safari12"],
    minify: "esbuild",
    sourcemap: true, // Source map generation must be turned on
    modulePreload: {
      polyfill: true,
    },
    // Generate manifest for better caching
    manifest: true,
    rollupOptions: {
      output: {
        // Add content hash to filenames for better caching
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo: { name?: string }) => {
          // Different cache strategies for different asset types
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/[name]-[hash].css';
          }
          if (/\.(png|jpg|jpeg|gif|svg|ico|webp)$/.test(assetInfo.name || '')) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/\.(woff|woff2|ttf|eot)$/.test(assetInfo.name || '')) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        manualChunks: {
          "vendor-core": ["react", "react-dom", "react-router-dom"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-ui": ["lucide-react", "framer-motion", "clsx", "tailwind-merge"],
          "vendor-utils": ["@tanstack/react-query", "date-fns", "i18next", "react-i18next"],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    testTimeout: 15000, // Increase timeout for integration tests
    // Exclude E2E tests (Playwright) and Deno tests from Vitest
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/e2e/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*",
      "**/supabase/functions/**/*.test.ts", // Deno tests use Deno.test() syntax
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData",
        "**/*.test.*",
        "**/*.spec.*",
        "e2e/**",
      ],
    },
  },
}));
