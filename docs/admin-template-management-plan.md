# 模板管理后台系统实现计划

## 目标
为管理员创建一个简洁的模板管理后台，支持：
1. **管理员权限控制** - 只有管理员可访问
2. **模板上传** - 上传图片+JSON文件
3. **在线JSON编辑** - 文本编辑器编辑JSON配置
4. **实时预览** - Canvas渲染预览效果
5. **模板管理** - 列表、删除

---

## 一、数据库改动

### 修改文件：`prisma/schema.prisma`

```prisma
enum UserRole {
  USER
  ADMIN
}

model User {
  // ... 现有字段
  role  UserRole  @default(USER)  // 新增
}
```

### 迁移命令
```bash
npx prisma migrate dev --name add_user_role
```

---

## 二、权限系统

### 新建文件：`src/lib/admin.ts`

```typescript
// 管理员权限检查工具
export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { authorized: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
  if (user?.role !== 'ADMIN') {
    return { authorized: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { authorized: true, userId: session.user.id }
}
```

### 修改文件：`src/lib/auth-config.ts`
- 在JWT callback中添加role到token
- 在session callback中添加role到session

### 修改文件：`src/types/next-auth.d.ts`
- 扩展Session和User类型，添加role字段

---

## 三、API端点

### 文件结构
```
src/app/api/admin/templates/
├── route.ts                    # GET:列表, POST:创建
├── [templateId]/
│   └── route.ts               # GET:详情, PUT:更新, DELETE:删除
└── upload/
    └── route.ts               # POST:上传图片
```

### API说明

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/admin/templates` | GET | 获取所有模板（含主题分组） |
| `/api/admin/templates` | POST | 创建新模板（图片+JSON） |
| `/api/admin/templates/[id]` | GET | 获取单个模板详情 |
| `/api/admin/templates/[id]` | PUT | 更新模板JSON配置 |
| `/api/admin/templates/[id]` | DELETE | 删除模板（图片+JSON） |
| `/api/admin/templates/upload` | POST | 上传并处理图片（调整为1000x1400） |

---

## 四、前端页面

### 路由结构（简化）
```
src/app/[locale]/admin/
├── layout.tsx              # 管理后台布局
├── page.tsx                # 首页（重定向到templates）
└── templates/
    ├── page.tsx            # 模板列表+上传+编辑（单页面）
    └── [templateId]/
        └── page.tsx        # 编辑单个模板JSON
```

### 组件结构（简化）
```
src/components/admin/
├── TemplateCard.tsx         # 模板卡片（预览+操作按钮）
├── TemplateUploader.tsx     # 上传图片+JSON
└── JsonEditor.tsx           # JSON文本编辑器+实时预览
```

---

## 五、JSON编辑器设计

### 简单方案
- **编辑器**：`<textarea>` 或 Monaco Editor（可选）
- **预览**：复用现有 CanvasInvitation 组件
- **布局**：左侧JSON编辑，右侧实时预览

### 核心功能
1. **JSON编辑区**
   - 语法高亮（可选）
   - JSON格式验证
   - 错误提示

2. **实时预览**
   - 输入示例数据（姓名、年龄等）
   - Canvas渲染预览效果

---

## 六、实施步骤

### Phase 1: 数据库和权限
- [ ] 修改 `prisma/schema.prisma` 添加 UserRole 枚举
- [ ] 运行数据库迁移
- [ ] 创建 `src/lib/admin.ts`
- [ ] 修改 `src/lib/auth-config.ts` 添加role到session
- [ ] 更新 `src/types/next-auth.d.ts`
- [ ] 手动设置管理员：`UPDATE users SET role='ADMIN' WHERE email='your@email.com'`

### Phase 2: 管理API
- [ ] 创建 `/api/admin/templates` - GET/POST
- [ ] 创建 `/api/admin/templates/[templateId]` - GET/PUT/DELETE
- [ ] 安装 `sharp` 用于图片处理（调整尺寸）

### Phase 3: 管理后台页面
- [ ] 创建 `admin/layout.tsx` 布局
- [ ] 创建模板列表页 `admin/templates/page.tsx`
- [ ] 创建 `TemplateCard.tsx` 模板卡片
- [ ] 创建 `TemplateUploader.tsx` 上传组件

### Phase 4: JSON编辑功能
- [ ] 创建 `admin/templates/[templateId]/page.tsx` 编辑页
- [ ] 创建 `JsonEditor.tsx` JSON编辑器
- [ ] 集成 CanvasInvitation 实时预览

### Phase 5: 测试验证
- [ ] 测试管理员权限控制
- [ ] 测试模板上传流程
- [ ] 测试JSON编辑和保存
- [ ] 测试预览效果

---

## 七、关键文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `prisma/schema.prisma` | 修改 | 添加UserRole枚举和role字段 |
| `src/lib/admin.ts` | 新建 | 管理员权限检查工具 |
| `src/lib/auth-config.ts` | 修改 | session中添加role |
| `src/types/next-auth.d.ts` | 修改 | 类型定义添加role |
| `src/app/api/admin/templates/route.ts` | 新建 | 模板列表和上传API |
| `src/app/api/admin/templates/[templateId]/route.ts` | 新建 | 模板GET/PUT/DELETE |
| `src/app/[locale]/admin/layout.tsx` | 新建 | 管理后台布局 |
| `src/app/[locale]/admin/templates/page.tsx` | 新建 | 模板列表+上传页 |
| `src/app/[locale]/admin/templates/[templateId]/page.tsx` | 新建 | JSON编辑页 |
| `src/components/admin/TemplateCard.tsx` | 新建 | 模板卡片组件 |
| `src/components/admin/JsonEditor.tsx` | 新建 | JSON编辑器+预览 |

---

## 八、验证方案

1. **权限测试**
   - 普通用户访问 `/admin` → 重定向到登录或dashboard
   - 管理员访问 `/admin` → 正常显示

2. **上传测试**
   - 上传图片+JSON文件 → 成功创建模板
   - 图片自动调整为1000x1400

3. **JSON编辑测试**
   - 修改JSON → 实时预览更新
   - 保存 → JSON文件更新
   - 无效JSON → 显示错误提示

4. **端到端测试**
   - 上传新模板 → 编辑JSON → 保存
   - 前端模板选择器显示新模板
