import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const raw = Number(request.nextUrl.searchParams.get('size')) || 512
  const size = Math.min(Math.max(raw, 64), 1024)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1d4ed8',
          color: '#ffffff',
          fontSize: size * 0.34,
          fontWeight: 700,
        }}
      >
        CP
        <div
          style={{
            width: size * 0.28,
            height: size * 0.04,
            marginTop: size * 0.03,
            background: '#facc15',
            borderRadius: size * 0.02,
          }}
        />
      </div>
    ),
    { width: size, height: size }
  )
}