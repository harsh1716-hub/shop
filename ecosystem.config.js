module.exports = {
  apps: [
    {
      name: 'bakery-backend',
      script: 'server.js',
      cwd: './backend',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'bakery-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: './frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 5173
      }
    }
  ]
};
