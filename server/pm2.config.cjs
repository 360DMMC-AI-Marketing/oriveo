module.exports = {
  apps: [
    {
      name: "oriveo-server",
      script: "index.js",
      cwd: __dirname,
      instances: process.env.WEB_CONCURRENCY || 4,
      exec_mode: "cluster",
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
