import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vincent Juhel — Senior AI Architect',
    short_name: 'Vincent Juhel',
    description:
      "Vincent Juhel's résumé. Ask anything, match a JD, or book a call.",
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#f97316',
    icons: [
      { src: '/favicon.ico', sizes: 'any' },
    ],
  };
}
