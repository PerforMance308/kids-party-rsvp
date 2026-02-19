# Kids Party RSVP - 全面产品审计报告

> **审计日期**: 2026-02-19
> **审计范围**: UI/UX设计、多设备适配、功能完整性与稳定性、性能优化、SEO
> **技术栈**: Next.js 15 + React 19 + Tailwind CSS 3 + Prisma + Stripe + Framer Motion

---

## 执行摘要

| 维度 | 评分 | 严重问题 | 中等问题 | 建议 |
|------|------|---------|---------|------|
| UI/UX 设计 | 7.5/10 | 6 | 16 | 5 |
| 多设备适配 | 8.5/10 | 2 | 5 | 4 |
| 功能与稳定性 | 6/10 | 5 | 15 | 7 |
| 性能 | 5.5/10 | 5 | 10 | 6 |
| SEO | 7/10 | 4 | 8 | 5 |
| **综合** | **6.9/10** | **22** | **54** | **27** |

### 最关键的 5 个问题（必须立即修复）

1. **JWT Edge 验证不验证签名** — 攻击者可伪造任意 token（安全漏洞）
2. **几乎所有页面都是 "use client"** — 完全丧失 Server Component 优势，严重影响性能和 SEO
3. **全局加载 13 款装饰字体** — 增加 500KB+ 页面负载，LCP 延迟 500ms-1s
4. **RSVP 核心流程要求注册** — 来宾摩擦过大，严重影响核心功能转化率
5. **邮件 HTML 模板存在 XSS 注入风险** — 用户输入未转义直接插入 HTML

---

# 第一部分：UI/UX 设计审计

## 一、视觉设计一致性

### 优势
- **颜色体系**: `tailwind.config.ts` 定义了完整的 `primary`（紫色系）、`neutral`（灰度）和 `party`（粉/蓝/黄/绿/珊瑚）色板，语义清晰
- **全局组件类**: `globals.css` 中定义了 `.btn`、`.btn-primary`、`.btn-secondary`、`.btn-danger`、`.input`、`.card` 等统一组件类
- **字体双层体系**: `font-sans`（Inter）用于正文，`font-display`（Nunito）用于标题

### 发现的问题

#### 🔴 UX-01: 字体加载过重 — 影响性能与视觉一致性
- **位置**: `src/app/globals.css:1`
- **问题**: 一次性导入 **13 款 Google Fonts**（Luckiest Guy、Fredoka、Bubblegum Sans、Chewy、Baloo 2 等），但 Tailwind 配置只使用 Inter 和 Nunito。这些为邀请函模板字体，不应全局加载
- **建议**: 将邀请函模板字体改为按需加载（`next/font` 动态导入），全局 CSS 仅保留 Inter 和 Nunito

#### 🟡 UX-02: 硬编码颜色值散落于组件中
- **位置**: `login/page.tsx:155`、`register/page.tsx:187` — `bg-[#fdf4ff]`；`rsvp/[token]/page.tsx:644` — 使用 `gray-` 而非自定义 `neutral-`
- **建议**: 将 `bg-[#fdf4ff]` 替换为 `bg-primary-50`，统一使用 `neutral-` 而非 `gray-`

#### 🟡 UX-03: 图标使用不一致 — Emoji vs Heroicons 混用
- **位置**: `HomePageClient.tsx:152`（📍 emoji 与 `ClockIcon` 混用）、`PhotoUpload.tsx:105`（📷 emoji）
- **建议**: 统一使用 Heroicons 24px outline 风格，仅在主题装饰场景使用 emoji

---

## 二、交互设计

### 优势
- **LoadingButton** 组件使用 spinner + 文字 + disabled 状态
- **ConfirmDialog** 使用 Framer Motion 动画、焦点锁定、Escape 关闭、完整 ARIA 属性
- **密码强度指示器**: 5 级进度条 + 4 项检查清单
- **表单错误动画**: shake 动画反馈

### 发现的问题

#### 🔴 UX-04: RSVP 页面用户旅程过于复杂
- **位置**: `src/app/[locale]/rsvp/[token]/page.tsx`（1228 行单文件！）
- **问题**: 未登录用户点"参加"后必须注册账号才能 RSVP。该文件约 75 个 state 变量，包含注册/登录/添加孩子/RSVP 四种表单在同一页面切换
- **影响**: 来宾因注册门槛放弃 RSVP，严重影响核心功能转化率
- **建议**:
  1. 允许来宾以匿名/仅邮箱方式提交 RSVP（可选注册）
  2. 将注册/登录流程分离为独立模态框
  3. 将 RSVP 表单拆分为多个子组件

#### 🔴 UX-05: PhotoUpload 组件完全缺少国际化
- **位置**: `src/components/PhotoUpload.tsx:107-131`
- **问题**: 所有文本硬编码英文（"Drag and drop a photo"、"Choose Photo" 等）
- **建议**: 使用 `useLanguage()` hook 国际化

#### 🔴 UX-06: ErrorDisplay 标题/按钮未国际化
- **位置**: `src/components/ErrorDisplay.tsx:45-49`
- **问题**: "Error"/"Warning"/"Try Again"/"Dismiss" 等硬编码英文

#### 🟡 UX-07: InviteGuests 组件空状态直接返回 null
- **位置**: `src/components/InviteGuests.tsx:95-97`
- **建议**: 使用 `EmptyState` 组件提示

#### 🟡 UX-08: Toast 通知可能被 Header 遮挡
- **位置**: `src/components/ToastContainer.tsx:12`
- **问题**: Toast `fixed top-4 z-50`，Header 也是 `fixed top-0 z-50 h-14`
- **建议**: 改为 `top-16 md:top-24` 或提升 z-index

#### 🟡 UX-09: 表单验证时机不统一
- RSVP 电话号码实时验证、创建派对用 HTML5 `required` + 提交验证，无统一方案
- **建议**: 全站采用 `blur` 触发 + 提交二次验证

---

## 三、信息架构与导航

#### 🟡 UX-10: 导航项缺少活跃状态指示
- **位置**: `src/components/UserNav.tsx:56-83`
- **建议**: 使用 `usePathname()` 高亮当前路由链接

#### 🟡 UX-11: 移动端缺少底部导航栏（Bottom Tab Bar）
- **位置**: 全局布局
- **建议**: 添加固定底部导航（Home/Dashboard/Create/Invitations）

#### 🟡 UX-12: 创建派对流程缺少进度指示器
- **位置**: `src/app/[locale]/party/new/page.tsx`
- **建议**: 添加 `Step 1 of 2` 步骤条

---

## 四、可访问性（WCAG 2.1）

### 优势
- 表单标签 `<label>` + `htmlFor` 关联完整
- ConfirmDialog ARIA 支持优秀
- `prefers-reduced-motion` 已实现
- 触摸目标最小高度 44px

### 发现的问题

#### 🔴 UX-13: Toast 关闭按钮缺少 aria-label
- **位置**: `src/components/ToastContainer.tsx:67-70`

#### 🟡 UX-14: 模板选择器缺少键盘导航
- **位置**: `src/components/TemplateSelector.tsx:281-413`
- **问题**: 模板卡片使用 `<div onClick>` 而非 `<button>`，无法 Tab 聚焦

#### 🟡 UX-15: 密码可见性切换按钮缺少 aria-label
- **位置**: `login/page.tsx:188-198`, `register/page.tsx:223-233`

#### 🟡 UX-16: Payment Modal 缺少关闭按钮、Escape 关闭和 ARIA 属性
- **位置**: `src/components/TemplateSelector.tsx:425-469`

---

## 五、微交互与动画

### 优势
- ScrollReveal 使用优质曲线 `[0.21, 0.47, 0.32, 0.98]`
- StaggerContainer 交错动画流畅
- Hero 浮动卡片深度感出色
- RSVP 成功 Confetti 效果优秀

#### 🟡 UX-17: Motion hover 效果在触摸设备上无意义
- **位置**: `HomePageClient.tsx` 多处 `whileHover`
- **建议**: 使用 `@media (hover: hover)` 条件或 `whileTap` 替代

---

# 第二部分：多设备响应式适配审计

**整体评分: 8.5/10** — 项目响应式设计质量很高

## 一、基础设施 ✅

- **Viewport**: 正确配置 `maximumScale: 5`，未禁用 `user-scalable`
- **断点**: 使用 Tailwind 默认断点，合理
- **全局组件**: `.btn` / `.input` 最小高度 44px，`.safe-area-bottom` 正确使用 `env(safe-area-inset-bottom)`

## 二、导航适配 ✅

- **Header**: `h-14 md:h-20` 自适应，`backdrop-blur-xl` 通透效果
- **UserNav**: 桌面水平链接 + 移动端汉堡菜单，外部点击关闭

## 三、关键页面布局分析 ✅

- **首页**: Hero `grid lg:grid-cols-2`，Bento `grid grid-cols-2 lg:grid-cols-4`，渐进式字号
- **Dashboard**: 统计卡 `grid grid-cols-2 md:grid-cols-4`，派对卡 `grid-cols-1 md:2 lg:3`
- **Party Dashboard**: **全项目最佳实践页面** — 移动端卡片 / 桌面端表格双布局，底部操作栏 `sticky bottom-0 lg:hidden safe-area-bottom`
- **RSVP**: `max-w-2xl mx-auto`，表单 `grid-cols-1 md:2`
- **Login/Register**: 双面板 `hidden lg:flex lg:w-1/2` + 移动端梯度替代

## 四、发现的问题

#### 🔴 RES-01: InviteGuests 表格在窄屏下无处理
- **位置**: `src/components/InviteGuests.tsx:108-154`
- **问题**: `<table className="w-full">` 在 320px 屏幕下三列严重挤压，无 `overflow-x-auto`
- **建议**: 添加 `overflow-x-auto` 或参照 Party Dashboard 用移动端卡片替代

#### 🔴 RES-02: PhotoSharingSection 完全无响应式处理
- **位置**: `src/components/PhotoSharingSection.tsx:53-60`
- **建议**: 改为 `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`

#### 🟡 RES-03: UserNav Logout 断点不一致（sm vs md）
- **位置**: `src/components/UserNav.tsx:61-104`
- **问题**: 640-768px 之间 Logout 不可见且移动菜单已隐藏
- **建议**: `hidden md:block` → `hidden sm:block`

#### 🟡 RES-04: PWA manifest 图标不完整
- **问题**: 缺少 192x192 和 512x512 标准 PWA 图标
- **建议**: 添加标准尺寸图标，拆分 `purpose` 为独立条目

#### 🟡 RES-05: next/image 使用不足
- 仅 Header 和 Footer 使用了 `next/image`，其他图片未优化

## 五、断点使用频率统计

| 断点 | 使用次数 | 主要用途 |
|------|---------|---------|
| `sm:` | ~35次 | 导航显隐、按钮文字 |
| `md:` | ~50次 | 网格列数、字号、padding |
| `lg:` | ~45次 | 桌面双列布局、侧边栏 |
| `xl:` | ~5次 | 模板/管理面板微调 |
| `2xl:` | 0次 | 未使用 |

## 六、触控交互评估

| 元素 | 最小尺寸 | 评估 |
|------|---------|------|
| `.btn` | min-height: 44px | ✅ |
| `.btn-sm` | min-height: 36px | 🟡 略小 |
| `.input` | min-height: 44px | ✅ |
| 导航链接 `px-3 py-2` | ~36px | 🟡 |
| 汉堡菜单 `p-2` | ~40px | ✅ |

---

# 第三部分：功能完整性与稳定性审计

## 一、安全性问题

#### 🔴 SEC-01: JWT Edge 验证不验证签名
- **位置**: `src/lib/jwt-edge.ts:1-25`
- **问题**: `verifyTokenEdge` 只解码 JWT payload 但**完全不验证签名**，攻击者可伪造任意 token
- **建议**: 使用 `jose` 库的 `jwtVerify()` 在 Edge Runtime 中验证签名

#### 🔴 SEC-02: 登录 API 存在时序攻击漏洞
- **位置**: `src/app/api/auth/login/route.ts:29-38`
- **问题**: 用户不存在时直接返回，未执行 bcrypt 对比，可通过响应时间泄露用户是否存在
- **建议**: 采用 `auth-config.ts` 的 dummyHash 策略

#### 🔴 SEC-03: 密码重置未验证密码强度
- **位置**: `src/app/api/auth/reset-password/route.ts:7-39`
- **问题**: 重置时直接接受新密码，无 `validatePassword()` 校验
- **建议**: 添加密码强度验证

#### 🔴 SEC-04: 邮件 HTML 模板存在 XSS 注入风险
- **位置**: `src/lib/email.ts` 多处
- **问题**: 用户输入（`childName`、`allergies`、`message`、`location`）直接插入 HTML 模板，无转义
- **建议**: 对所有用户输入使用 HTML entity 编码

#### 🔴 SEC-05: `allowDangerousEmailAccountLinking: true`
- **位置**: `src/lib/auth-config.ts:15`
- **问题**: 不同 OAuth 提供者自动关联同一 email 账户，可被利用
- **建议**: 移除此选项或添加手动确认流程

#### 🟡 SEC-06: Guest API 缺少输入验证
- **位置**: `src/app/api/guests/route.ts:16-49`
- **建议**: 添加 Zod schema + `sanitizeInput`

#### 🟡 SEC-07: 邀请邮件 API 无邮件地址验证和数量限制
- **位置**: `src/app/api/parties/[id]/invite/route.ts:36-38`
- **建议**: 验证邮件格式，限制单次最多 20 封

#### 🟡 SEC-08: Rate Limiting 使用内存 Map，多实例失效
- **位置**: `src/lib/security.ts:4`
- **建议**: 使用 Redis 等分布式存储

#### 🟡 SEC-09: 认证 Rate Limiting 过于宽松（50次/分钟）
- **位置**: `src/middleware.ts:70`
- **建议**: 降低到 10 次/分钟

#### 🟡 SEC-10: `sanitizeInput` 的 HTML 过滤可绕过
- **位置**: `src/lib/security.ts:60-66`
- **建议**: 使用 DOMPurify 或 sanitize-html

## 二、认证与授权

#### 🟡 AUTH-01: 双认证系统并存（NextAuth + 自定义 JWT）
- **位置**: `src/lib/auth.ts` + `src/lib/auth-config.ts`
- **问题**: `/api/auth/login` 设置独立 `token` cookie，与 NextAuth session token 不同
- **建议**: 统一使用 NextAuth 的 `signIn("credentials")` 流程

#### 🟡 AUTH-02: 中间件保护路由不完整
- **位置**: `src/middleware.ts:86-87`
- **问题**: 仅保护 `/party/new` 和 `/dashboard`，遗漏 `/children`、`/invitations`、`/party/[id]/edit` 等
- **建议**: 扩展 protectedRoutes 列表

## 三、数据库设计

#### 🟡 DB-01: Payment 与 Party 缺少外键关系
- **位置**: `prisma/schema.prisma:210-227`
- **问题**: `Payment.partyId` 无 `@relation`，删除 Party 不会级联删除 Payment
- **建议**: 添加关系定义

#### 🟡 DB-02: Party 删除事务有遗漏
- **位置**: `src/app/api/parties/[id]/route.ts:259-278`
- **问题**: 手动删除 RSVP/Guest 但遗漏 Reminder、Photo、EmailNotification
- **建议**: 依赖 Prisma `onDelete: Cascade` 或补全所有关联表

## 四、Stripe 支付集成

#### 🟡 PAY-01: Webhook 缺少幂等性处理
- **位置**: `src/app/api/webhooks/stripe/route.ts:6-91`
- **问题**: 未检查 `paymentIntent.id` 是否已处理，Stripe 重复发送可能导致重复操作
- **建议**: 处理前检查是否已处理

#### 🟡 PAY-02: 价格硬编码在多处
- **问题**: $2.99 硬编码在服务端和前端
- **建议**: 使用环境变量或配置文件统一管理

## 五、邮件通知

#### 🟡 MAIL-01: sendEmail 静默吞掉错误
- **位置**: `src/lib/email.ts:162-176`
- **问题**: 失败时仅 console 打印，调用者永远不知道是否发送成功
- **建议**: 关键邮件类型应让调用者知道发送失败

#### 🟡 MAIL-02: 邮件内容全部英文，未国际化
- **问题**: 用户数据库有 `language` 字段，但邮件模板硬编码英文

## 六、API 设计一致性

#### 🟡 API-01: 错误响应格式不一致
- 混合使用 `{ error }` / `{ error, details }` / `{ error, status }`，混合中英文

#### 🟡 API-02: Party PUT 路由缺少 Zod 输入验证
- **位置**: `src/app/api/parties/[id]/route.ts:119-137`

#### 🟡 API-03: RSVP POST 导入 Zod schema 但未使用
- **位置**: `src/app/api/rsvp/[token]/route.ts:143-163`

## 七、边界情况

#### 🟡 EDGE-01: 过期派对仍可 RSVP
- **位置**: `src/app/api/rsvp/[token]/route.ts`
- **建议**: 检查 `eventDatetime` 是否已过期

#### 🟡 EDGE-02: 环境变量缺少启动检查
- 多个关键环境变量使用 `|| ''` fallback，运行时才发现配置问题

---

# 第四部分：性能优化审计

**整体评分: 5.5/10** — 存在严重的架构性性能问题

## Web Vitals 预估

| 指标 | 当前预估 | 优化后预估 | 主要改进措施 |
|------|---------|-----------|------------|
| **LCP** | 3.5-5s | 1.5-2.5s | 首页 Server Component + 字体优化 |
| **FCP** | 2-3s | 0.8-1.5s | 移除 render-blocking 字体 |
| **INP** | 150-300ms | 50-150ms | 减少客户端 JS |
| **CLS** | 0.1-0.3 | <0.05 | 减少 FOUT |
| **TTFB** | 200-500ms | 100-300ms | 中间件优化 |

## 发现的问题

#### 🔴 PERF-01: 几乎所有页面都是 "use client"
- **详情**: 53 个文件标记 `'use client'`，包括几乎所有 page 组件（dashboard、party/new、rsvp、login、register、admin 等）
- **影响**:
  - 所有页面 JS 发送到客户端，FCP/LCP 显著延迟
  - 数据获取全部 `useEffect` + `fetch` waterfall（JS下载 → 执行 → API请求 → 渲染）
  - 搜索引擎无法看到动态内容
- **建议**: 将数据获取移至 Server Component + Prisma 直接查询，交互逻辑拆分为小 Client Component

#### 🔴 PERF-02: 首页整体作为 Client Component + framer-motion 全量加载
- **位置**: `src/components/HomePageClient.tsx`
- **影响**: framer-motion ~32KB gzipped 首次加载必须下载，首页静态文本全部客户端渲染
- **建议**: 静态内容 Server Component，动画部分 `next/dynamic` 懒加载

#### 🔴 PERF-03: 字体加载双重开销
- **位置**: `src/app/layout.tsx:7-17`（next/font）+ `src/app/globals.css:1`（CSS @import 12个字体）
- **影响**: ~500KB+ 字体文件，render-blocking CSS 请求
- **建议**: 移除 globals.css @import，装饰字体按需加载

#### 🔴 PERF-04: LanguageContext 巨大翻译对象内嵌在客户端 Bundle
- **位置**: `src/contexts/LanguageContext.tsx`（~725 行）
- **问题**: 全部翻译字典（400+ key）硬编码在 `'use client'` 文件中。`next-intl` 已安装但未使用
- **影响**: ~15-20KB 纯文本增加到每个页面 JS
- **建议**: 迁移到 `next-intl`，按语言分割加载

#### 🔴 PERF-05: 中间件对所有请求执行 JWT 验证
- **位置**: `src/middleware.ts:94`
- **问题**: `getToken()` 对每个页面请求执行（包括首页、terms 等公开页面）
- **影响**: 每请求增加 10-50ms JWT 验证开销
- **建议**: 仅在 `isProtectedRoute` 条件内执行 `getToken()`

#### 🟡 PERF-06: framer-motion 未做 Tree-shaking 优化
- 10 个组件使用但 `optimizePackageImports` 未包含
- **建议**: 添加到 `next.config.js` 的 `optimizePackageImports`

#### 🟡 PERF-07: Stripe SDK 在多个 API 路由中重复实例化
- 6 个文件中重复 `new Stripe()`
- **建议**: 创建共享单例

#### 🟡 PERF-08: 客户端数据获取 useEffect + fetch waterfall
- **影响**: 用户看到 loading spinner 时间 = JS下载 + 解析 + API请求 + 响应（500ms-2s）
- **建议**: 迁移到 Server Component 直接查询

#### 🟡 PERF-09: 生产配置 `images.unoptimized: true`
- **位置**: `next.config.production.js:11`
- **影响**: 所有图片原始大小发送，无 WebP/AVIF 转换
- **建议**: 移除 `unoptimized: true` 或使用外部图片 CDN

#### 🟡 PERF-10: html2canvas + jspdf 大型库未做懒加载
- **位置**: `src/components/InvitationCard.tsx`
- **影响**: ~500KB 库可能同步加载
- **建议**: 使用 `await import()` 动态导入

#### 🟡 PERF-11: SessionProvider 会话轮询过于频繁
- **位置**: `src/components/SessionProvider.tsx:13-14`
- **问题**: 每 5 分钟轮询 + 窗口聚焦刷新
- **建议**: 增加到 15-30 分钟

#### 🟡 PERF-12: Prisma 连接池生产环境未缓存
- **位置**: `src/lib/prisma.ts:17`
- **问题**: 生产环境没有将 prisma 实例缓存到 globalThis
- **建议**: 始终缓存 `globalForPrisma.prisma = prisma`

#### 🟡 PERF-13: `backdrop-blur` 移动端性能影响
- **位置**: Header、HomePageClient 多处
- **建议**: 移动端用半透明纯色替代

### 优先行动计划

**第一优先（LCP 改善 40-60%）**:
1. 移除 globals.css 的 12 个字体 @import，按需加载
2. 首页拆分为 Server + Client 混合渲染
3. 中间件仅在保护路由执行 `getToken()`

**第二优先（JS bundle 减少 30-50%）**:
4. framer-motion 添加到 `optimizePackageImports`
5. html2canvas + jspdf 动态导入
6. 关键页面迁移到 Server Component

**第三优先（架构改进）**:
7. 迁移到 next-intl
8. Stripe 单例化
9. Prisma 连接池修复

---

# 第五部分：SEO 审计

## 一、Meta 标签完整性

### 优势
- 根布局有完整 metadata（title template、description、keywords、OG、Twitter）
- Locale 布局动态 `generateMetadata`
- 功能页和模板页动态 metadata 含 canonical、alternates

### 发现的问题

#### 🔴 SEO-01: Privacy/Terms 页面 canonical 硬编码为 `/en/`
- **位置**: `src/app/[locale]/privacy/page.tsx:19`, `terms/page.tsx:19`
- **问题**: 中文页面 canonical 仍指向 `/en/privacy`，被 Google 视为重复内容
- **建议**: 改用 `generateMetadata` 动态设置

#### 🟡 SEO-02: 多个页面缺少 `x-default` hreflang
- Privacy、Terms、Contact、Login、Register 的 alternates.languages 缺少 `x-default`

#### 🟢 SEO-03: SITE_NAME 不一致
- `seo.ts:5` 用 'Kid Party RSVP'（无s），首页用 'Kids Party RSVP'（有s）

## 二、结构化数据

#### 🔴 SEO-04: FAQ schema 在所有页面加载
- **位置**: `src/app/[locale]/layout.tsx:57-62`
- **问题**: `generateFAQSchema` 在 locale layout 中渲染，每个页面（dashboard、login 等）都有 FAQ 结构化数据
- **建议**: 移到实际有 FAQ 内容的首页或模板页

#### 🟡 SEO-05: 模板页和功能页缺少结构化数据
- 这些是 SEO 最重要的着陆页，但没有 JSON-LD
- **建议**: 模板页添加 Product/CreativeWork schema + BreadcrumbList + FAQPage

#### 🟡 SEO-06: LocalBusiness schema 有空字段
- **位置**: `src/lib/seo.ts:410-411`
- **问题**: `telephone: ''`, `streetAddress: ''` 空字符串，Google 视为无效
- **建议**: 使用 Organization schema 替代

## 三、URL 结构与国际化 SEO

#### 🔴 SEO-07: middleware 语言检测硬编码
- **位置**: `middleware.ts:15`
- **问题**: `const locale = 'en'` 硬编码，中文用户始终重定向到 `/en/`
- **建议**: 添加 Accept-Language 检测或 cookie 记忆

#### 🟡 SEO-08: `<html lang>` 可能不准确
- 中文页面可能显示 `lang="en"`，依赖 middleware 设置的 `x-locale` header

## 四、内容与语义化

#### 🔴 SEO-09: 首页缺少"产品定义区"
- **问题**: seo.md 要求 "What is KidsPartyRSVP?" 纯文本描述区（120-200 词），当前缺失
- **建议**: 在 Hero 和 Bento 之间添加产品描述区

#### 🟡 SEO-10: 首页缺少 section id 属性
- seo.md 要求 `id="what-is-kidspartyrsvp"` 等锚点

#### 🟡 SEO-11: Header 缺少到模板页/功能页的导航
- 这些是 SEO 最重要着陆页，应从全站导航可达

#### 🟡 SEO-12: Footer 模板链接只指向恐龙主题
- **建议**: 添加模板索引页或列出多个模板

## 五、404 页面

#### 🔴 SEO-13: 404 页面硬编码 `/zh` 链接
- **位置**: `src/app/not-found.tsx:8`
- **问题**: 英文用户 404 也被链接到中文首页
- **建议**: 改为 `/` 让 middleware 重定向

#### 🟡 SEO-14: 404 页面无 metadata 和国际化
- 缺少 title，文本硬编码英文

## 六、其他

#### 🟡 SEO-15: Dashboard 等私有页面无 noindex meta
- 虽然 robots.txt 已 disallow，但页面本身无 `noindex` 双重保护

#### 🟡 SEO-16: 模板页缺少专属 OG 图片生成器
- 社交分享时回退到通用图片
- **建议**: 为高优先级着陆页添加专属 `opengraph-image.tsx`

---

# 第六部分：综合改进优先级

## P0 — 必须立即修复（安全漏洞 + 核心功能）

| # | 问题 | 类别 | 预估影响 |
|---|------|------|---------|
| SEC-01 | JWT Edge 不验证签名 | 安全 | 认证可被完全绕过 |
| SEC-04 | 邮件模板 XSS 注入 | 安全 | 用户数据可被窃取 |
| SEC-03 | 密码重置无强度验证 | 安全 | 账户可被设置弱密码 |
| SEC-05 | 危险的邮件账户关联 | 安全 | 账户可被劫持 |
| SEC-02 | 登录时序攻击 | 安全 | 用户名可被枚举 |

## P1 — 高优先级（性能 + 核心体验）

| # | 问题 | 类别 | 预估影响 |
|---|------|------|---------|
| PERF-01 | 页面全部 "use client" | 性能 | LCP 延迟 2-3s |
| PERF-03 | 13 款字体全局加载 | 性能 | FCP 延迟 500ms-1s |
| UX-04 | RSVP 要求注册 | 体验 | 核心转化率下降 |
| PERF-04 | 翻译字典内嵌 Bundle | 性能 | 每页多 15-20KB JS |
| PERF-05 | 中间件全量 JWT 验证 | 性能 | 每请求多 10-50ms |
| SEO-04 | FAQ schema 全站加载 | SEO | Google 结构化数据警告 |
| SEO-01 | canonical 硬编码 | SEO | 中文页面被视为重复内容 |
| SEO-09 | 首页缺产品定义区 | SEO | 关键词密度不足 |

## P2 — 中优先级（体验一致性 + 稳定性）

| # | 问题 | 类别 |
|---|------|------|
| RES-01 | InviteGuests 窄屏溢出 | 适配 |
| RES-02 | PhotoSharingSection 无响应式 | 适配 |
| UX-05/06 | PhotoUpload/ErrorDisplay 未国际化 | 国际化 |
| UX-10 | 导航无活跃状态 | 导航 |
| UX-11 | 缺少移动端底部导航 | 导航 |
| AUTH-01 | 双认证系统并存 | 架构 |
| AUTH-02 | 路由保护不完整 | 安全 |
| PAY-01 | Webhook 无幂等性 | 支付 |
| API-01/02/03 | API 设计不一致 | 质量 |
| PERF-06-13 | 各项性能优化 | 性能 |
| SEO-02/05/07/08 | SEO 细节优化 | SEO |
| SEO-13 | 404 硬编码中文链接 | SEO |

## P3 — 建议改进（锦上添花）

| # | 问题 | 类别 |
|---|------|------|
| - | 暗色模式支持 | 设计 |
| - | 骨架屏升级为 Shimmer | 设计 |
| - | 创建派对成功 Confetti 动画 | 体验 |
| - | 主题色动态切换 | 体验 |
| - | 实现 /blog、/pricing、/faq 页面 | SEO |
| - | 专属模板页 OG 图片 | SEO |
| - | Bundle Analyzer 持续监控 | 工具 |

---

# 附录：正面发现

项目做得好的方面值得肯定：

- **设计系统基础扎实**: Tailwind tokens + 组件类 + 字体层次完善
- **动画系统优雅**: Framer Motion 运用熟练，ScrollReveal/Confetti/SuccessCheckmark 效果出色
- **Party Dashboard 响应式最佳实践**: 移动端卡片/桌面端表格双布局 + sticky 底部操作栏
- **ConfirmDialog 实现质量高**: ARIA 完整、焦点锁定、键盘支持、动画流畅
- **密码强度指示器**: 5 级进度条 + 检查清单
- **robots.txt / sitemap.xml**: 配置正确
- **OG 图片动态生成**: Edge Runtime、双语支持
- **安全头部配置**: CSP + 各类安全头完善
- **`prefers-reduced-motion` 支持**: CSS 层面已实现
- **触摸目标标准**: 按钮/输入框 44px 最小高度
- **Safe area 处理**: 正确使用 `env(safe-area-inset-bottom)`
