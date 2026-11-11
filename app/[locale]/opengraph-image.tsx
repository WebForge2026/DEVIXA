import { ImageResponse } from 'next/og';
import { DX_GRADIENT, DX_RIBBON_BOTTOM, DX_RIBBON_TOP, DX_STROKE, DX_VIEWBOX } from '@/components/ui/Wordmark';

export const alt = 'Devixa — We craft systems you can feel';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';


/** Social preview: obsidian card with the DX logo. */
const OpengraphImage = () =>
  new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          background: 'radial-gradient(60% 70% at 85% 15%, rgba(255,42,42,0.35), #050507 70%)',
          color: '#EEEEF2',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, letterSpacing: 6, color: '#9a9aa6' }}>
          <span>DEVIXA · DIGITAL ENGINEERING</span>
          <span style={{ color: '#FF2A2A' }}>DE · BG · PL</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', fontSize: 92, fontWeight: 900, lineHeight: 0.95, letterSpacing: -3 }}>
            <span>WE CRAFT</span>
            <span>SYSTEMS YOU</span>
            <span style={{ color: '#FF2A2A' }}>CAN FEEL.</span>
          </div>
          <svg width="380" height="270" viewBox={DX_VIEWBOX}>
            <defs>
              <clipPath id="og-clip">
                <rect width="45" height="32" />
              </clipPath>
              <linearGradient id="og-red" x1="0" y1="1" x2="1" y2="0">
                {DX_GRADIENT.map(([offset, color]) => (
                  <stop key={offset} offset={offset} stopColor={color} />
                ))}
              </linearGradient>
            </defs>
            <g clipPath="url(#og-clip)" fill="none" strokeWidth={DX_STROKE} strokeLinejoin="round">
              <path d={DX_RIBBON_TOP} stroke="#EEEEF2" />
              <path d={DX_RIBBON_BOTTOM} stroke="url(#og-red)" />
            </g>
          </svg>
        </div>
        <div style={{ display: 'flex', fontSize: 22, color: '#9a9aa6' }}>Websites · Webshops · Business systems — EU-hosted, fixed price</div>
      </div>
    ),
    size,
  );

export default OpengraphImage;
