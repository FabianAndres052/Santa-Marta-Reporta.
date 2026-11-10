module.exports = {
  apps: [
    {
      name: 'santa-marta-reporta',
      script: 'server.js',
      cwd: '/var/www/santa-marta-reporta',
      instances: 1, // 1 instancia para compatibilidad óptima con SQLite
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/santa-marta-reporta/error.log',
      out_file: '/var/log/santa-marta-reporta/combined.log',
      time: true
    }
  ]
};

