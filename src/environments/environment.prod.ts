export const environment = {
  production: true,
  // В проде Nginx/Traefik тоже проксируют /api → memeup-api
  apiBaseUrl: 'https://memeup-api.kuzmenko.dev/api',
};
