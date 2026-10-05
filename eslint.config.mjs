import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      /*
       * Optimasi gambar dimatikan secara global pada `next.config.ts`
       * (`images.unoptimized: true`) karena cover postingan dan foto profil
       * berasal dari host dinamis milik API Delcom. Elemen `<img>` juga dipakai
       * untuk pratinjau berkas lokal (`URL.createObjectURL` → `blob:`), yang
       * memang tidak dapat diproses oleh `next/image`. Karena itu aturan ini
       * tidak memberikan manfaat pada proyek ini.
       */
      "@next/next/no-img-element": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Hasil pengukuran coverage.
    "coverage/**",
  ]),
]);

export default eslintConfig;
