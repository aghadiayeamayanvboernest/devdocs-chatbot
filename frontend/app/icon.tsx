import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

export default function Icon() {
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
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: 'white',
            position: 'absolute',
          }}
        />

        {/* React-style orbits - simplified for small size */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          style={{ position: 'absolute' }}
        >
          <ellipse
            cx="14"
            cy="14"
            rx="11"
            ry="4.5"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            opacity="0.9"
          />
          <ellipse
            cx="14"
            cy="14"
            rx="11"
            ry="4.5"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            opacity="0.8"
            transform="rotate(60 14 14)"
          />
          <ellipse
            cx="14"
            cy="14"
            rx="11"
            ry="4.5"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            opacity="0.9"
            transform="rotate(-60 14 14)"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
