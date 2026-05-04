import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export const alt = 'Vincent Juhel — Senior AI Architect';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * 1200×630 PNG generated at build time per locale. Layout: photo on the
 * left (cropped square), name + role + facts on the right with the orange
 * terminal accent. Loaded by LinkedIn / Twitter / Facebook on share.
 */
export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'hero' });

  const photoPath = join(process.cwd(), 'public', 'og-photo.jpeg');
  const photoBuffer = await readFile(photoPath);
  const photoSrc = `data:image/jpeg;base64,${photoBuffer.toString('base64')}`;

  const accent = '#f97316';
  const bg = '#0a0a0a';
  const textPrimary = '#fafafa';
  const textSecondary = '#a3a3a3';
  const textMuted = '#737373';
  const border = '#262626';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: bg,
          fontFamily: 'sans-serif',
        }}
      >
        {/* Left: photo cropped square */}
        <div
          style={{
            width: 630,
            height: 630,
            display: 'flex',
            position: 'relative',
            borderRight: `1px solid ${border}`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoSrc}
            alt=""
            width={630}
            height={630}
            style={{ width: 630, height: 630, objectFit: 'cover' }}
          />
        </div>

        {/* Right: typo block */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '60px 56px',
            gap: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontFamily: 'monospace',
              fontSize: 18,
              color: accent,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ display: 'flex' }}>$ amplyd --who</span>
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: 76,
              fontWeight: 700,
              color: textPrimary,
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            Vincent Juhel
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: 30,
              color: textPrimary,
              lineHeight: 1.2,
              marginTop: 6,
            }}
          >
            {t('role')}
          </div>

          <div
            style={{
              display: 'flex',
              fontFamily: 'monospace',
              fontSize: 18,
              color: textSecondary,
              marginTop: 8,
            }}
          >
            {t('facts')}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'monospace',
              fontSize: 16,
              color: textMuted,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginTop: 22,
              gap: 4,
            }}
          >
            <span style={{ display: 'flex' }}>{t('location')}</span>
            <span style={{ display: 'flex' }}>{t('remote')}</span>
          </div>

          <div
            style={{
              display: 'flex',
              marginTop: 24,
              alignSelf: 'flex-start',
              padding: '10px 18px',
              border: `1px solid ${accent}`,
              color: accent,
              fontFamily: 'monospace',
              fontSize: 16,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            amplyd.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
