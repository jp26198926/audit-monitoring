module.exports = {
  apps: [
    {
      name: "audit-monitoring",
      script: "npm",
      args: "start",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "audit-cron",
      script: "npm",
      args: "run cron",
      cwd: "./",
      instances: 1,
      autorestart: false,
      cron_restart: "0 8 * * *", // Run daily at 8:00 AM
      watch: false,
    },
  ],
};
