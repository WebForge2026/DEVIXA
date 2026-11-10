import { ImageResponse } from 'next/og';

export const alt = 'Devixa — We craft systems you can feel';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const star = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
  const r = i % 2 === 0 ? 120 : 44;
  return `${(130 + Math.cos(a) * r).toFixed(1)},${(130 + Math.sin(a) * r).toFixed(1)}`;
}).join(' ');

/** Social preview: obsidian darkroom card with the crimson spike-star. */
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
          <svg width="260" height="260" viewBox="0 0 260 260">
            <polygon points={star} fill="#FF2A2A" />
          </svg>
        </div>
        <div style={{ display: 'flex', fontSize: 22, color: '#9a9aa6' }}>Websites · Webshops · Business systems — EU-hosted, fixed price</div>
      </div>
    ),
    size,
  );

export default OpengraphImage;
