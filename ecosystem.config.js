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
      error_file: "~/.pm2/logs/audit-monitoring-error.log",
      out_file: "~/.pm2/logs/audit-monitoring-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      min_uptime: "10s",
      max_restarts: 10,
    },
    {
      name: "audit-cron",
      script: "npm",
      args: "run cron",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
      error_file: "~/.pm2/logs/audit-cron-error.log",
      out_file: "~/.pm2/logs/audit-cron-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
