import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    // Ortam değişkenleri (DATABASE_URL, JWT_SECRET) .env.local'den okunur;
    // veritabanına dokunan testler yerel PostgreSQL'e bağlanır.
    setupFiles: ["tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    // Veritabanı testleri aynı kayıtları paylaştığı için sırayla çalışır.
    fileParallelism: false,
  },
})
