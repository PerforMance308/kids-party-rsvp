import { jwtVerify } from 'jose'

// Edge Runtime 兼容的 JWT 验证（使用 jose，支持签名校验）
export async function verifyTokenEdge(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      console.error('JWT_SECRET is not set')
      return null
    }

    const key = new TextEncoder().encode(secret)
    const { payload } = await jwtVerify(token, key)

    if (!payload.userId || !payload.email) {
      return null
    }

    return {
      userId: payload.userId as string,
      email: payload.email as string,
    }
  } catch {
    return null
  }
}
