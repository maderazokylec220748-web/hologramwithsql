// PM2 ecosystem configuration
require('dotenv').config();

module.exports = {
  apps: [{
    name: 'wis-ai-hologram',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 5001,
      DATABASE_URL: process.env.DATABASE_URL,
      DATABASE_HOST: process.env.DATABASE_HOST,
      DATABASE_PORT: process.env.DATABASE_PORT,
      DATABASE_USER: process.env.DATABASE_USER,
      DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
      DATABASE_NAME: process.env.DATABASE_NAME,
      GROQ_API_KEY: process.env.GROQ_API_KEY,
      SESSION_SECRET: process.env.SESSION_SECRET
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
