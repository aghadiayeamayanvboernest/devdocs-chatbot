import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2563EB 0%, #0891B2 100%)',
          borderRadius: '50%',
          position: 'relative',
        }}
      >
        {/* Center dot */}
        <div
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: 'white',
            position: 'absolute',
          }}
        />

        {/* React-style orbits */}
        <svg
          width="140"
          height="140"
          viewBox="0 0 140 140"
          style={{ position: 'absolute' }}
        >
          {/* Horizontal ellipse */}
          <ellipse
            cx="70"
            cy="70"
            rx="56"
            ry="22"
            fill="none"
            stroke="white"
            strokeWidth="5"
            opacity="0.9"
          />
          {/* 60 degree ellipse */}
          <ellipse
            cx="70"
            cy="70"
            rx="56"
            ry="22"
            fill="none"
            stroke="white"
            strokeWidth="5"
            opacity="0.8"
            transform="rotate(60 70 70)"
          />
          {/* -60 degree ellipse */}
          <ellipse
            cx="70"
            cy="70"
            rx="56"
            ry="22"
            fill="none"
            stroke="white"
            strokeWidth="5"
            opacity="0.9"
            transform="rotate(-60 70 70)"
          />

          {/* Electron dots */}
          <circle cx="126" cy="70" r="6" fill="white"/>
          <circle cx="98" cy="118" r="6" fill="white"/>
          <circle cx="42" cy="118" r="6" fill="white"/>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
