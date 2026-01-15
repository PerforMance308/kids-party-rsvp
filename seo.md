KidsPartyRSVP
SEO × 功能导向架构设计文档（Implementation-Ready）

目标受众

工程 AI（Codex / Cursor / Devin）

不需要理解 SEO 原理，只需按规范实现

核心目标

强调 KidsPartyRSVP 是一个 功能型 RSVP 工具

通过 主题模板页 扩展 SEO 覆盖面

实现“模板是入口，功能是核心”的信息架构

可扩展、可程序化生成（Programmatic SEO Friendly）

1. 全站信息架构（必须严格遵守）
1.1 URL 结构规范（不可随意更改）
/
├─ /en
│  ├─ /features
│  │  ├─ /qr-code-rsvp
│  │  ├─ /guest-tracking
│  │  ├─ /automatic-reminders
│  │  └─ /no-app-required
│  ├─ /templates
│  │  ├─ /dinosaur-birthday-party
│  │  ├─ /princess-birthday-party
│  │  ├─ /unicorn-birthday-party
│  │  ├─ /superhero-birthday-party
│  │  └─ /kids-birthday-qr-code-invitation
│  ├─ /blog
│  │  └─ /how-to-write-kids-birthday-invitation
│  ├─ /pricing
│  └─ /faq
└─ /zh
   └─ （与 /en 完全镜像，URL slug 可中文或英文但结构一致）

2. 首页（Home Page）实现规范
2.1 Banner 区（已有，可保留）

要求

必须有 <h1>

<h1> 文本必须包含关键词：
kids party RSVP 或 kids birthday RSVP

示例：

<h1>Create Kids Birthday Party Invitations with Easy Online RSVP</h1>

2.2 Banner 下方：产品定义区（SEO 关键）

这是目前最重要的补齐点

<section id="what-is-kidspartyrsvp">
  <h2>What is KidsPartyRSVP?</h2>
  <p>
    KidsPartyRSVP is an online tool that helps parents create kids birthday party
    invitations and manage RSVPs easily.
  </p>
  <p>
    With QR code RSVPs, automatic reminders, and real-time guest tracking,
    parents can plan birthday parties without messy group chats or paper invitations.
  </p>
</section>


硬性要求

纯文本（不要放在图片里）

至少 120–200 英文单词

不可折叠（不要 hidden）

2.3 Popular Themes（模板入口区）
<section id="popular-themes">
  <h2>Popular Kids Birthday Party Themes</h2>
  <ul>
    <li><a href="/en/templates/dinosaur-birthday-party">Dinosaur Birthday Party Invitation</a></li>
    <li><a href="/en/templates/princess-birthday-party">Princess Birthday Party Invitation</a></li>
    <li><a href="/en/templates/unicorn-birthday-party">Unicorn Birthday Party Invitation</a></li>
    <li><a href="/en/templates/superhero-birthday-party">Superhero Birthday Party Invitation</a></li>
  </ul>
</section>


要求

<a> 必须是标准链接（不是 button + JS）

不可 lazy render（必须 SSR 或 SSG）

2.4 Features 内链区
<section id="features">
  <h2>Key RSVP Features for Kids Parties</h2>
  <ul>
    <li><a href="/en/features/qr-code-rsvp">QR Code RSVP</a></li>
    <li><a href="/en/features/guest-tracking">Guest Tracking</a></li>
    <li><a href="/en/features/automatic-reminders">Automatic RSVP Reminders</a></li>
    <li><a href="/en/features/no-app-required">No App Required for Guests</a></li>
  </ul>
</section>

3. 模板页（Template Page）实现规范（最关键）

模板页不是“卖模板”，而是 功能场景化解释页

3.1 URL
/en/templates/dinosaur-birthday-party

3.2 <head> 规范（必须）
<title>Dinosaur Birthday Party Invitation with Online RSVP</title>

<meta name="description"
  content="Create a dinosaur birthday party invitation with online RSVP, QR code access, and automatic guest tracking. Perfect for kids birthday parties." />

<link rel="canonical" href="https://kidspartyrsvp.com/en/templates/dinosaur-birthday-party" />
<link rel="alternate" hreflang="en" href="https://kidspartyrsvp.com/en/templates/dinosaur-birthday-party" />
<link rel="alternate" hreflang="zh" href="https://kidspartyrsvp.com/zh/templates/dinosaur-birthday-party" />
<link rel="alternate" hreflang="x-default" href="https://kidspartyrsvp.com/en/templates/dinosaur-birthday-party" />

3.3 页面结构（HTML 语义必须一致）
<article>
  <h1>Dinosaur Birthday Party Invitation with RSVP</h1>

  <section>
    <h2>Why Choose a Dinosaur Theme for a Kids Birthday Party?</h2>
    <p>（200–300 字，讲场景，不讲功能）</p>
  </section>

  <section>
    <h2>Create a Dinosaur Invitation with Online RSVP</h2>
    <p>
      Explain how KidsPartyRSVP helps parents create invitations
      and manage RSVPs in one place.
    </p>
    <ul>
      <li>QR code RSVP access</li>
      <li>Automatic reminders</li>
      <li>Real-time guest tracking</li>
    </ul>
  </section>

  <section>
    <h2>How It Works</h2>
    <ol>
      <li>Create your dinosaur-themed invitation</li>
      <li>Share the RSVP link or QR code</li>
      <li>Track guest responses automatically</li>
    </ol>
  </section>

  <section>
    <h2>Frequently Asked Questions</h2>
    <details>
      <summary>Do guests need to download an app?</summary>
      <p>No. Guests can RSVP directly in their browser.</p>
    </details>
    <details>
      <summary>Can I see who is coming?</summary>
      <p>Yes. Guest responses update in real time.</p>
    </details>
  </section>

  <section>
    <a href="/en/create?theme=dinosaur" class="cta">
      Create This Dinosaur Invitation
    </a>
  </section>
</article>

4. 功能页（Feature Page）规范
示例：/en/features/qr-code-rsvp
<h1>QR Code RSVP for Kids Birthday Parties</h1>

<p>
  QR code RSVP allows parents to collect guest responses instantly
  without downloading any app.
</p>

<h2>Why Use QR Code RSVP?</h2>
<ul>
  <li>No app required</li>
  <li>Easy for grandparents and kids</li>
  <li>Faster response rates</li>
</ul>

<h2>Use QR Code RSVP with Party Invitations</h2>
<p>
  All KidsPartyRSVP templates support QR code RSVP,
  including dinosaur, princess, and unicorn birthday parties.
</p>

<ul>
  <li><a href="/en/templates/dinosaur-birthday-party">Dinosaur Birthday Party</a></li>
  <li><a href="/en/templates/princess-birthday-party">Princess Birthday Party</a></li>
</ul>

5. Programmatic SEO 要求

模板页数据结构统一（JSON / DB）

页面通过同一个模板渲染

只替换：

主题名

示例图

描述文本

URL、meta、heading 规则不可变

6. 技术 SEO 强制要求（不可跳过）
6.1 robots.txt
User-agent: *
Allow: /en/
Allow: /zh/
Disallow: /api/

6.2 sitemap.xml

必须包含：

所有 /en/templates/*

所有 /en/features/*

/zh 镜像页面

每次新增模板自动更新

7. 核心设计原则

模板页 = SEO 入口

功能页 = 产品核心

所有模板页必须链接到 ≥1 功能页

所有功能页必须链接回 ≥2 模板页

首页必须能 crawl 到模板页和功能页

8. 成功标准（Definition of Done）

Google Search Console 能索引模板页

site:kidspartyrsvp.com/templates 能看到多页

首页不再是唯一流量入口

模板页自然流量 > 首页流量（长期）