# Hyperswitch生产环境配置指南

## 1. 账号设置

### 1.1 注册Hyperswitch账号
1. 访问 https://app.hyperswitch.io/register
2. 填写企业信息：
   - 公司名称：Kid Party RSVP
   - 业务类型：Event Management/Software Services  
   - 预期交易量：$X/月
3. 完成KYB验证

### 1.2 支付处理器连接

#### Stripe设置
1. 登录 Stripe Dashboard (https://dashboard.stripe.com)
2. 获取API密钥：
   - 可发布密钥 (pk_live_xxx)
   - 秘钥 (sk_live_xxx)
3. 在Hyperswitch中添加Stripe连接器
4. 启用原始卡数据处理（联系Stripe支持）

#### PayPal设置  
1. 注册PayPal Business账号
2. 创建PayPal应用获取：
   - Client ID
   - Client Secret
3. 在Hyperswitch中配置PayPal连接器

## 2. 域名和证书配置

### 2.1 Apple Pay域名验证
```bash
# 1. 下载Apple Pay域名验证文件
wget https://apple-pay-gateway-cert.apple.com/apple-developer-merchantid-domain-association

# 2. 放置在网站根目录
mkdir -p .well-known
mv apple-developer-merchantid-domain-association .well-known/

# 3. 验证访问：https://yourdomain.com/.well-known/apple-developer-merchantid-domain-association
```

### 2.2 SSL证书要求
- 必须使用HTTPS (TLS 1.2+)
- 推荐使用Let's Encrypt或付费SSL证书

## 3. 环境变量配置

```bash
# 生产环境配置
NEXT_PUBLIC_HYPERSWITCH_PUBLISHABLE_KEY="pk_prd_your_publishable_key"
NEXT_PUBLIC_HYPERSWITCH_CLIENT_URL="https://checkout.hyperswitch.io"
HYPERSWITCH_SECRET_KEY="sk_prd_your_secret_key"  
HYPERSWITCH_SERVER_URL="https://api.hyperswitch.io"

# Webhook配置
HYPERSWITCH_WEBHOOK_SECRET="whsec_your_webhook_secret"
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
```

## 4. Webhook端点

### 4.1 创建Webhook处理器
文件：`/api/webhooks/hyperswitch/route.ts`

```typescript
import { NextRequest } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-webhook-signature')
  const body = await request.text()
  
  // 验证Webhook签名
  const expectedSignature = crypto
    .createHmac('sha256', process.env.HYPERSWITCH_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')
    
  if (signature !== expectedSignature) {
    return new Response('Invalid signature', { status: 400 })
  }
  
  const event = JSON.parse(body)
  
  // 处理支付事件
  switch (event.type) {
    case 'payment_succeeded':
      await handlePaymentSuccess(event.data)
      break
    case 'payment_failed': 
      await handlePaymentFailure(event.data)
      break
  }
  
  return new Response('OK')
}
```

### 4.2 在Hyperswitch控制中心配置Webhook
- 端点URL：`https://yourdomain.com/api/webhooks/hyperswitch`
- 事件：选择所需事件类型

## 5. 支付方式配置

### 5.1 Apple Pay配置
1. 在Apple Developer账号中：
   - 创建Merchant ID
   - 生成Payment Processing证书
   - 验证域名

2. 在代码中配置：
```typescript
const applePayConfig = {
  merchantIdentifier: 'merchant.com.kidparty.payments',
  displayName: 'Kid Party RSVP',
  supportedNetworks: ['visa', 'masterCard', 'amex'],
  merchantCapabilities: ['supports3DS']
}
```

### 5.2 Google Pay配置
1. 在Google Pay & Wallet Console中：
   - 创建Business Profile
   - 获取Merchant ID

2. 配置：
```typescript
const googlePayConfig = {
  merchantId: 'your_google_merchant_id',
  merchantName: 'Kid Party RSVP',
  allowedCardNetworks: ['VISA', 'MASTERCARD'],
  allowedCardAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS']
}
```

## 6. 安全配置

### 6.1 CSP (Content Security Policy)
```typescript
// next.config.js
const csp = \`
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://checkout.hyperswitch.io;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.hyperswitch.io;
  frame-src https://checkout.hyperswitch.io;
\`
```

### 6.2 环境变量安全
- 使用环境变量管理服务（如Vercel Secrets）
- 定期轮换API密钥
- 监控API使用情况

## 7. 监控和日志

### 7.1 支付事件日志
```typescript
// lib/payment-logger.ts
export function logPaymentEvent(event: string, data: any) {
  console.log(\`[PAYMENT] \${event}\`, {
    timestamp: new Date().toISOString(),
    event,
    data
  })
}
```

### 7.2 错误监控
- 集成Sentry或其他错误监控服务
- 设置支付失败告警

## 8. 测试清单

### 8.1 支付方式测试
- [ ] 信用卡支付 (Visa, MasterCard, Amex)
- [ ] Apple Pay (在iOS设备/Safari上)
- [ ] Google Pay (在Chrome/Android上) 
- [ ] PayPal支付

### 8.2 业务流程测试
- [ ] 照片分享功能购买
- [ ] 支付成功后功能启用
- [ ] 支付失败处理
- [ ] Webhook事件处理
- [ ] 退款流程

### 8.3 安全测试
- [ ] HTTPS强制重定向
- [ ] CSP策略生效
- [ ] Webhook签名验证
- [ ] 敏感信息不暴露

## 9. 上线步骤

1. **Pre-production测试**：
   - 在沙盒环境完整测试
   - 验证所有支付方式
   - 确认Webhook正常工作

2. **DNS和域名配置**：
   - 配置生产域名
   - 申请SSL证书
   - 验证Apple Pay域名

3. **生产部署**：
   - 更新环境变量
   - 部署到生产环境
   - 监控支付流程

4. **Go-live测试**：
   - 进行小额真实交易测试
   - 验证所有功能正常
   - 监控错误和性能

## 10. 维护和支持

### 10.1 定期维护
- 每月检查API密钥有效性
- 监控交易成功率
- 更新依赖包版本

### 10.2 客服支持
- 设置支付问题处理流程
- 建立退款政策
- 客服培训支付问题处理

### 10.3 合规要求
- 遵守PCI DSS标准
- 定期安全审计
- 保留交易记录

---

**重要提醒**：
- 在处理真实支付前，确保完成所有测试
- 保护好API密钥和敏感信息
- 建立支付监控和告警机制
- 准备客服支持流程