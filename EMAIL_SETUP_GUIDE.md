# 📧 邮件配置指南

本指南帮助你配置真实的邮件发送功能，让Kid Party RSVP可以发送真实邮件。

## 🚀 快速开始（推荐：Gmail）

### 第一步：启用两步验证
1. 访问 [Google账户安全设置](https://myaccount.google.com/security)
2. 开启"两步验证"

### 第二步：生成应用专用密码
1. 访问 [应用专用密码](https://myaccount.google.com/apppasswords)
2. 选择"邮件"和"其他（自定义名称）"
3. 输入名称："Kid Party RSVP"
4. 复制生成的16位密码（格式：xxxx xxxx xxxx xxxx）

### 第三步：更新.env文件
```env
# 真实Gmail SMTP配置
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="你的邮箱@gmail.com"
SMTP_PASS="你的16位应用专用密码"
SMTP_FROM="Kid Party RSVP <你的邮箱@gmail.com>"
```

### 第四步：测试
1. 重启开发服务器：`npm run dev`
2. 访问 `/admin/notifications`
3. 点击"🧪 Test Email"按钮
4. 检查你的邮箱是否收到测试邮件

## 📋 其他邮件服务配置

### SendGrid（生产环境推荐）

**优势：** 专业邮件服务，免费100封/月，高送达率

```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="你的SendGrid_API_Key"
SMTP_FROM="Kid Party RSVP <noreply@yourdomain.com>"
```

**设置步骤：**
1. 注册 [SendGrid](https://sendgrid.com) 账户
2. 验证发件人身份（Settings > Sender Authentication）
3. 创建API Key（Settings > API Keys）
4. 使用"apikey"作为用户名，API Key作为密码

### Outlook/Hotmail

```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT="587"
SMTP_USER="你的邮箱@outlook.com"
SMTP_PASS="你的邮箱密码"
SMTP_FROM="Kid Party RSVP <你的邮箱@outlook.com>"
```

### 自定义SMTP服务器

```env
SMTP_HOST="your-smtp-server.com"
SMTP_PORT="587"  # 或 465 (SSL)
SMTP_USER="username"
SMTP_PASS="password"
SMTP_FROM="Kid Party RSVP <noreply@yourdomain.com>"
```

## 🔧 故障排除

### 1. Gmail "Less secure app access" 错误
- **解决方案：** 使用应用专用密码，不要用邮箱密码
- 确保已开启两步验证

### 2. "Invalid login" 错误
- 检查SMTP_USER和SMTP_PASS是否正确
- 确保没有多余的空格
- Gmail用户确认使用的是16位应用密码

### 3. "Connection timeout" 错误
- 检查网络连接
- 确保SMTP_HOST和SMTP_PORT正确
- 某些企业网络可能屏蔽SMTP端口

### 4. 邮件进入垃圾箱
- 添加SPF记录（如有自己的域名）
- 使用认证的发件人地址
- 避免垃圾邮件关键词

## ⚡ 高级配置

### 生产环境优化

1. **使用专业邮件服务**
   - SendGrid、AWS SES、Mailgun等
   - 更好的送达率和统计数据

2. **配置发件人域名**
   - 使用自己的域名发送邮件
   - 设置SPF、DKIM、DMARC记录

3. **监控邮件发送**
   - 定期检查 `/admin/notifications`
   - 设置邮件发送失败的警报

### 环境变量说明

| 变量 | 说明 | 示例 |
|------|------|------|
| `SMTP_HOST` | SMTP服务器地址 | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP端口 | `587` (STARTTLS) 或 `465` (SSL) |
| `SMTP_USER` | SMTP用户名 | 邮箱地址或用户名 |
| `SMTP_PASS` | SMTP密码 | 应用专用密码或API Key |
| `SMTP_FROM` | 发件人信息 | `"App Name <noreply@domain.com>"` |

## 🧪 测试功能

项目内置了完整的邮件测试功能：

1. **配置检查** - 自动检测邮件配置状态
2. **发送测试** - 发送测试邮件验证配置
3. **多provider支持** - 自动选择可用的邮件服务
4. **失败回退** - 配置失败时显示在控制台

访问 `/admin/notifications` 查看详细的配置状态和测试工具。

## 🔐 安全注意事项

1. **永远不要**把真实密码提交到代码仓库
2. **使用应用专用密码**而不是主密码
3. **考虑使用环境变量管理服务**（如Vercel、Heroku的配置面板）
4. **定期轮换**邮件服务密钥

配置完成后，所有自动邮件功能都将正常工作：
- 📷 派对后照片分享提醒
- 🎂 生日前派对预约提醒
- ✅ RSVP确认邮件
- 📧 派对更新通知