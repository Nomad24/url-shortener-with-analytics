module.exports = {
  apps: [{
    name: 'url-shortener',
    script: 'src/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      BASE_URL: 'https://your-domain.com',
    },
  }],
};
