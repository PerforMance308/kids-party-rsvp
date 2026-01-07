# Google OAuth 配置指南

## 步骤 1: 创建 Google Cloud Console 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API 或 Google People API

## 步骤 2: 创建 OAuth 2.0 凭据

1. 在 Google Cloud Console 中，转到 "API 和服务" → "凭据"
2. 点击 "创建凭据" → "OAuth 2.0 客户端 ID"
3. 选择应用程序类型为 "Web 应用程序"
4. 设置授权的重定向 URI：
   - 开发环境: `npm`
   - 生产环境: `https://yourdomain.com/api/auth/callback/google`
5. 复制客户端 ID 和客户端密钥

## 步骤 3: 更新环境变量

在 `.env` 文件中更新以下变量：

```env
# Google OAuth (从 Google Cloud Console 获取)
GOOGLE_CLIENT_ID="你的-google-客户端-id"
GOOGLE_CLIENT_SECRET="你的-google-客户端-密钥"
```

## 步骤 4: 更新 NextAuth 密钥

生成一个安全的随机字符串用于 NextAuth：

```bash
openssl rand -base64 32
```

将生成的字符串更新到 `.env` 文件：

```env
NEXTAUTH_SECRET="你生成的安全字符串"
```

## 测试 Google 登录

1. 重启开发服务器: `npm run dev`
2. 访问登录页面
3. 点击 "Continue with Google" 按钮
4. 完成 Google OAuth 流程

## 注意事项

- Google OAuth 需要 HTTPS 在生产环境中工作
- 确保在 Google Cloud Console 中正确配置了重定向 URI
- 第一次设置时可能需要配置 OAuth 同意屏幕