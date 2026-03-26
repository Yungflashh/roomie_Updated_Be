module.exports = {
  apps: [
    {
      name: 'roomie-api',
      script: 'dist/index.js',
      instances: 'max',        // use all available CPU cores
      exec_mode: 'cluster',    // run in cluster mode
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        RATE_LIMIT_MAX_REQUESTS: 100000,
      },
    },
  ],
};
