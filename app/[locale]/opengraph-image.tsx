import { ImageResponse } from 'next/og';
import { DX_CRIMSON, DX_D_PATH, DX_VIEWBOX, DX_X_PATH } from '@/components/ui/Wordmark';

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
          <svg width="360" height="216" viewBox={DX_VIEWBOX}>
            <path fill="#EEEEF2" fillRule="evenodd" d={DX_D_PATH} />
            <path fill={DX_CRIMSON} d={DX_X_PATH} />
          </svg>
        </div>
        <div style={{ display: 'flex', fontSize: 22, color: '#9a9aa6' }}>Websites · Webshops · Business systems — EU-hosted, fixed price</div>
      </div>
    ),
    size,
  );

export default OpengraphImage;
