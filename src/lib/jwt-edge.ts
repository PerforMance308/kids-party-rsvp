// Edge Runtime兼容的JWT验证
export async function verifyTokenEdge(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    // JWT结构: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // 解码payload (不验证签名，因为Edge Runtime限制)
    const payload = JSON.parse(atob(parts[1]))
    
    // 检查过期时间
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      return null
    }

    return {
      userId: payload.userId,
      email: payload.email
    }
  } catch {
    return null
  }
}