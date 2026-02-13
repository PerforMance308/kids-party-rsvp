目标定义（必须满足）

  1. 创建派对改为两步：Step 1 填信息，Step 2 选模板。
  2. 页面保持当前简洁风格，不新增复杂导航栏。
  3. 模板按 party 单独收费，不做账号级已购复用。
  4. 免费模板可直接创建；付费模板必须先支付再创建。
  5. 创建后直接进入 dashboard，行为与现在一致。

  ———

  现有代码基线（给无上下文 AI 的起点）

  1. 创建页：src/app/[locale]/party/new/page.tsx
  2. 创建 API：src/app/api/parties/route.ts
  3. 模板数据 API：src/app/api/templates/route.ts
  4. 支付组件：src/components/PaymentForm.tsx
  5. 模板升级 API（可复用支付校验逻辑）：src/app/api/parties/[id]/upgrade-template/route.ts
  6. 支付 intent API：src/app/api/payment/create-intent/route.ts
  7. 数据模型：prisma/schema.prisma（Party.template、Party.paidTemplates 已存在）

  ———

  实现总策略

  1. 不改数据库 schema。
  2. 把模板选择从“创建后 dashboard 升级”前移到“创建流程第二步”。
  3. POST /api/parties 接口改为支持 templateId + paymentId(可选)。
  4. 默认模板逻辑删除，不再按性别自动指定。
  5. 支付仅用于本次创建，不做用户全局模板购买状态。

  ———

  详细执行计划

  ### 1. 前端：把创建页改为两步向导

  1. 在 src/app/[locale]/party/new/page.tsx 新增状态：

  - currentStep: 1 | 2（默认 1）
  - selectedTemplateId: string | null
  - selectedTemplateMeta（名称、价格、currency、isFree）
  - showPaymentModal: boolean
  - pendingSubmit: boolean

  2. Step 1（保留原表单字段和校验）：

  - 继续使用现有字段：
      - child 选择/手填
      - gender
      - date/time/endTime
      - location/theme/notes
      - contacts 选择
  - 原 onSubmit 改为：
      - 先做前端校验
      - 通过后仅 setCurrentStep(2)，不调用 /api/parties

  3. Step 2（模板选择）：

  - 从 /api/templates 拉模板数据（可直接复用现有 fetch 逻辑）
  - 用简化版 UI：
      - 主题筛选 chips（可选）
      - 模板卡片列表
      - 每张卡展示：缩略图、模板名、Free 或价格
      - 当前选择高亮
  - 选择模板后写入 selectedTemplateId 与 selectedTemplateMeta
  - 页面不引入新顶栏，只在当前卡片容器内切换步骤内容

  4. Step 2 操作按钮：

  - Back：setCurrentStep(1)
  - 主按钮文案：
      - 免费模板：Create Party
      - 付费模板：Pay & Create Party
  - 点击主按钮逻辑：
      - 未选模板：提示错误，不继续
      - 免费：直接走 createParty({ templateId, paymentId: undefined })
      - 付费：打开支付弹窗，支付成功后拿 paymentId 再 createParty({ templateId, paymentId })

  5. 支付集成：

  - 复用 PaymentForm，metadata 至少包含：
      - feature: 'template'
      - templateId
      - flow: 'party_create'
  - 支付成功回调：
      - 调创建 API
      - 成功后跳 /${locale}/party/${party.id}/dashboard
  - 支付取消回调：仅关闭弹窗，不丢失 Step 2 选择状态

  6. 联系人自动添加逻辑：

  - 保留现有 selectedContacts 创建后批量调用 /api/guests
  - 触发时机改为：party 创建成功后再执行（与当前一致）

  ———

  ### 2. 后端：改创建接口支持模板与支付

  1. 修改 src/app/api/parties/route.ts POST 入参约定：

  - 新增：
      - templateId: string（必填）
      - paymentId?: string（付费模板时必填）
  - 其余 party 字段保持现状兼容

  2. 删除默认模板逻辑：

  - 删除 getDefaultTemplate 函数和 defaultTemplate 赋值路径
  - 创建时不再使用 childGender -> default_boy/default_girl

  3. 在创建前读取模板配置并判断价格：

  - 新增本地函数（可参考 upgrade-template）：
      - 根据 templateId 找到 public/invitations/<theme>/<templateId>.json
      - 读取 pricing，用 getEffectivePrice 得到是否免费
  - 模板不存在返回 404

  4. 免费模板路径：

  - 直接创建 party，template = templateId
  - 不写入 paidTemplates

  5. 付费模板路径：

  - 要求 paymentId，否则返回 400
  - 用 Stripe retrieve paymentIntent 校验：
      - status === 'succeeded'
      - amount > 0
      - metadata.feature === 'template'
      - metadata.templateId === templateId
      - metadata.userId === session.user.id（强制同一用户）
  - 校验通过后创建 party，数据：
      - template = templateId
      - paidTemplates: { push: templateId }
  - 可补写 payment 记录（沿用你现有容错逻辑：已存在则跳过）

  6. 返回结构不变：

  - 保持前端当前依赖的 party 返回字段，避免连锁改动

  ———

  ### 3. 支付 intent 安全改造（强烈建议，同步做）

  1. 修改 src/app/api/payment/create-intent/route.ts：

  - 不再完全信任前端传入 amount
  - 对模板支付请求增加服务端定价逻辑：
      - 入参可为：feature='template', templateId
      - 服务端读取模板配置，算出真实金额
      - 按真实金额创建 intent
  - metadata 强制写入：
      - feature
      - templateId
      - userId（已有）
      - flow='party_create'（可选）

  2. 前端调用 PaymentForm 时：

  - amount 仅用于 UI 展示
  - 真正收费金额以后端计算为准

  ———

  ### 4. 组件复用与拆分建议（降低改动风险）

  1. 新建组件（推荐）：

  - src/components/PartyTemplateStep.tsx
  - 职责：只负责模板展示与选择，不负责“已创建 party 的切换升级”

  2. 不直接复用 TemplateSelector 原版的原因：

  - TemplateSelector 强依赖 partyId、upgrade-template 接口
  - 你现在需要的是“创建前选择”，职责不同，硬复用会让逻辑混乱

  3. 可复用的代码块：

  - 模板拉取与排序逻辑
  - 卡片渲染样式片段
  - PaymentForm 弹窗容器模式

  ———

  ### 5. 国际化文案补充

  1. 在 src/contexts/LanguageContext.tsx 增加键值（zh/en）：

  - newParty.step1Title
  - newParty.step2Title
  - newParty.nextStep
  - newParty.backStep
  - newParty.selectTemplateRequired
  - newParty.payAndCreate
  - newParty.createWithTemplate
  - newParty.templateStepHint

  2. 保持现有文案风格，不引入 marketing 风格的复杂说明

  ———

  ### 6. 接口契约（给无上下文 AI 直接照做）

  1. POST /api/parties 请求体（新）：

  {
    "childId": "string or omitted for legacy path",
    "childName": "string for legacy path",
    "childAge": 7,
    "childGender": "boy|girl",
    "eventDatetime": "ISO string",
    "eventEndDatetime": "ISO string optional",
    "location": "string",
    "theme": "string optional",
    "notes": "string optional",
    "targetAge": 8,
    "templateId": "dinosaur_1",
    "paymentId": "pi_xxx optional but required for paid template"
  }

  2. POST /api/parties 响应：

  - 成功：201 + party 对象（至少含 id）
  - 失败：
      - 400 参数缺失/支付缺失
      - 401 未登录
      - 404 child 或 template 不存在
      - 500 服务错误

  3. POST /api/payment/create-intent（建议改造后）请求：

  {
    "feature": "template",
    "templateId": "dinosaur_2",
    "currency": "USD"
  }

  - 金额服务端计算，不接收前端任意 amount

  ———

  ### 7. 验收用例（必须全过）

  1. 免费模板创建：

  - Step1 填完 -> Step2 选免费模板 -> Create
  - 结果：创建成功，party.template = 所选模板，paidTemplates 不含该模板

  2. 付费模板创建成功：

  - Step2 选付费模板 -> 支付成功 -> 创建
  - 结果：创建成功，party.template = 所选模板，paidTemplates 包含该模板

  3. 付费模板未支付：

  - 直接调创建接口且无 paymentId
  - 结果：400

  4. 跨 party 不复用购买：

  - Party A 买了 template_1
  - 创建 Party B 再选 template_1
  - 结果：仍需支付（无 party 级 paid 记录时不能直接用）

  5. 页面体验：

  - 没有新增复杂导航
  - 仍是当前页面风格，仅多了步骤切换

  ———

  ### 8. 回归检查清单

  1. dashboard 现有模板切换功能不受影响。
  2. 联系人自动添加仍执行。
  3. 旧的手动 child（legacy form）路径仍可创建。
  4. Stripe webhook 记录支付逻辑不报错。
  5. TypeScript/ESLint 通过。

  ———

  建议实施顺序（避免大改炸锅）

  1. 先改前端两步 UI（用 mock 模板选择状态，不接支付）
  2. 再改 /api/parties 支持 templateId/paymentId，跑通免费路径
  3. 再接付费路径与 payment 校验
  4. 最后做 i18n + 回归测试