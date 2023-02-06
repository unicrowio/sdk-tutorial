(async () => {
  const isPrepare = process.env.NODE_ENV === "prepare";
  if (isPrepare) {
    console.log("Finished! 🚀 You can run `yarn start`");
    process.exit(0);
  }

  const isDev = process.env.NODE_ENV === "development";
  require("fs-extra").copySync("public", "build");
  require("esbuild")
    .build({
      entryPoints: ["src/index.js"],
      outdir: "build",
      minify: true,
      watch: isDev,
      sourcemap: false,
      bundle: true,
      define: { "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV) },
      // logLevel: "silent",
    })
    .catch(() => process.exit(1));
  if (isDev) {
    require("live-server").start({
      root: "build",
      open: true,
      host: "localhost",
      port: 8081,
      // logLevel: 0,
    });

    console.log("Let's Crow! 🦅");
  }
})();
