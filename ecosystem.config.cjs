module.exports = {
  apps: [
    {
      name: "platinumvault-cms",
      cwd: "/home/terminal_ideas/platinumvault-cms",
      script: "./node_modules/.bin/vite",
      args: "preview --port 3002 --host 0.0.0.0",
      interpreter: "/home/terminal_ideas/.nvm/versions/node/v20.19.5/bin/node",
      watch: false,
      autorestart: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
      error_file: "/home/terminal_ideas/.pm2/logs/platinumvault-cms-error.log",
      out_file: "/home/terminal_ideas/.pm2/logs/platinumvault-cms-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};

