# 部署指南

## 1. 数据库设置 (Neon)

### 步骤 1: 创建 Neon 数据库
1. 访问 [neon.tech](https://neon.tech) 注册账号
2. 创建新项目，选择区域（建议选择离用户近的区域）
3. 获取数据库连接字符串，格式如下：
   ```
   postgresql://[user]:[password]@[hostname]/[dbname]?sslmode=require
   ```

### 步骤 2: 配置数据库
```bash
# 更新 .env 文件中的数据库URL
DATABASE_URL="postgresql://[user]:[password]@[hostname]/[dbname]?sslmode=require"

# 推送数据库结构到 Neon
npm run db:push
```

## 2. 环境变量配置

### 生产环境变量模板
```env
# Database
DATABASE_URL="postgresql://[neon-connection-string]"

# JWT & NextAuth
JWT_SECRET="[generate-secure-32-char-string]"
NEXTAUTH_SECRET="[generate-secure-32-char-string]"
NEXTAUTH_URL="https://[your-domain].pages.dev"

# Base URL
NEXT_PUBLIC_BASE_URL="https://[your-domain].pages.dev"

# CORS
ALLOWED_ORIGINS="https://[your-domain].pages.dev,https://[custom-domain]"

# Email (Gmail)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="[your-gmail]"
SMTP_PASS="[gmail-app-password]"
SMTP_FROM="Kid Party RSVP <[your-gmail]>"

# Google OAuth
GOOGLE_CLIENT_ID="[google-client-id]"
GOOGLE_CLIENT_SECRET="[google-client-secret]"

# Payment (Hyperswitch)
NEXT_PUBLIC_HYPERSWITCH_PUBLISHABLE_KEY="[publishable-key]"
NEXT_PUBLIC_HYPERSWITCH_CLIENT_URL="[client-url]"
HYPERSWITCH_SECRET_KEY="[secret-key]"
HYPERSWITCH_SERVER_URL="[server-url]"
```

## 3. Zeabur 部署配置

### 方法 A: 使用 Zeabur 作为主要部署平台

#### 步骤 1: 项目准备
```bash
# 添加 Zeabur 构建配置
touch zeabur.yaml
```

#### 步骤 2: 配置 zeabur.yaml
```yaml
name: kidparty
services:
  - name: kidparty-app
    source:
      type: git
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - JWT_SECRET=${JWT_SECRET}
      - NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
      - SMTP_FROM=${SMTP_FROM}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
```

#### 步骤 3: 部署到 Zeabur
1. 访问 [zeabur.com](https://zeabur.com)
2. 连接你的 GitHub 仓库
3. 设置环境变量
4. 部署应用

### 方法 B: 使用 Cloudflare Pages (推荐)

#### 步骤 1: 添加构建配置
```json
// 在 package.json 中确保有构建脚本
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "export": "next build && next export"
  }
}
```

#### 步骤 2: Cloudflare Pages 设置
1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 Pages 选项卡
3. 连接 GitHub 仓库
4. 构建设置：
   - 构建命令: `npm run build`
   - 输出目录: `.next`
   - Root 目录: `/`
   - 环境变量: 添加上述所有变量

## 4. 域名和 SSL 配置

### Cloudflare Pages 域名配置
1. 在 Cloudflare Pages 项目中添加自定义域名
2. 更新 DNS 记录指向 Cloudflare
3. SSL 将自动配置

### 更新 OAuth 回调 URL
1. Google OAuth Console:
   - 授权重定向 URI: `https://[your-domain]/api/auth/callback/google`
2. 更新环境变量中的 NEXTAUTH_URL

## 5. 数据库迁移

### 初始化生产数据库
```bash
# 连接到生产数据库
DATABASE_URL="[neon-connection-string]" npx prisma db push

# 可选：导入种子数据
DATABASE_URL="[neon-connection-string]" npm run db:seed
```

## 6. 监控和维护

### 日志监控
- Cloudflare Pages: 在 Functions 标签页查看日志
- Zeabur: 在项目仪表板查看实时日志

### 数据库监控
- Neon Console: 查看数据库性能和连接状态
- 定期备份: Neon 提供自动备份功能

## 7. 性能优化

### CDN 配置
Cloudflare Pages 自动提供全球 CDN，无需额外配置

### 缓存策略
```javascript
// next.config.js 中添加缓存配置
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, max-age=0, must-revalidate'
          }
        ]
      }
    ]
  }
}
```

## 8. 安全性检查清单

- [ ] 所有敏感信息存储在环境变量中
- [ ] HTTPS 已启用
- [ ] CORS 已正确配置
- [ ] Google OAuth 回调 URL 已更新
- [ ] 数据库连接使用 SSL
- [ ] API 端点有适当的验证
- [ ] 文件上传有大小限制

## 9. 故障排除

### 常见问题
1. **数据库连接失败**: 检查 Neon 连接字符串和 SSL 配置
2. **OAuth 错误**: 确认回调 URL 和客户端密钥正确
3. **构建失败**: 检查所有依赖项和环境变量

### 调试命令
```bash
# 本地测试生产构建
npm run build
npm start

# 检查数据库连接
npx prisma db push --preview-feature
```

## 10. 成本估算

- **Neon**: 免费层包含足够的资源用于小型应用
- **Cloudflare Pages**: 免费层提供无限请求
- **域名**: 如需自定义域名，约 $10-15/年

总成本: **$0-15/年** (取决于是否需要自定义域名)