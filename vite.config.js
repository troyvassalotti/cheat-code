import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  if (mode === "docs") {
    return {
      base: "/cheat-code/",
      build: {
        outDir: "docs",
      },
    };
  }

  return {
    build: {
      lib: {
        entry: "src/cheat-code.js",
        formats: ["es"],
        fileName: "cheat-code",
      },
    },
  };
});
