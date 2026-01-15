import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

// Template data for SEO pages
const templates: Record<string, {
  slug: string
  name: { en: string; zh: string }
  emoji: string
  description: { en: string; zh: string }
  whyChoose: { en: string; zh: string }
  templateId: string
}> = {
  'dinosaur-birthday-party': {
    slug: 'dinosaur-birthday-party',
    name: { en: 'Dinosaur Birthday Party', zh: '恐龙生日派对' },
    emoji: '🦖',
    description: {
      en: 'Create a dinosaur birthday party invitation with online RSVP, QR code access, and automatic guest tracking. Perfect for kids birthday parties.',
      zh: '创建恐龙主题生日派对邀请函，支持在线RSVP、二维码回复和自动宾客追踪。完美适合儿童生日派对。'
    },
    whyChoose: {
      en: `Dinosaurs have captivated children's imaginations for generations. A dinosaur-themed birthday party brings prehistoric adventures to life, creating unforgettable memories for your little paleontologist. From T-Rex to Triceratops, kids love learning about these magnificent creatures while celebrating their special day.

A dinosaur party theme works perfectly for children of all ages. Younger kids adore the colorful, friendly dinosaur characters they see in cartoons, while older children appreciate the scientific wonder of these ancient giants. The theme offers endless possibilities for decorations, games, and activities that keep party guests entertained throughout the celebration.

Whether you're planning an outdoor adventure in your backyard transformed into a Jurassic world, or an indoor celebration with dinosaur fossils and excavation activities, this theme provides the perfect backdrop for an exciting birthday party that your child and their friends will remember for years to come.`,
      zh: `恐龙一直是孩子们最喜爱的主题之一。恐龙主题的生日派对能够为您的小探险家带来史前冒险的体验，创造难忘的回忆。从霸王龙到三角龙，孩子们在庆祝特别日子的同时也能学习这些神奇的远古生物。

恐龙主题适合各个年龄段的孩子。年幼的孩子喜欢卡通片中可爱的恐龙形象，而大一点的孩子则对这些史前巨兽的科学奥秘充满好奇。这个主题提供了无限的装饰、游戏和活动可能性，让派对宾客全程都能尽兴。

无论您是计划将后院变成侏罗纪世界的户外冒险派对，还是室内的恐龙化石挖掘活动，这个主题都能为精彩的生日派对提供完美的背景，让您的孩子和小伙伴们留下美好的回忆。`
    },
    templateId: 'dinosaur'
  },
  'princess-birthday-party': {
    slug: 'princess-birthday-party',
    name: { en: 'Princess Birthday Party', zh: '公主生日派对' },
    emoji: '👸',
    description: {
      en: 'Create a magical princess birthday party invitation with online RSVP, QR code access, and automatic guest tracking. Perfect for your little royalty.',
      zh: '创建梦幻公主主题生日派对邀请函，支持在线RSVP、二维码回复和自动宾客追踪。完美适合您的小公主。'
    },
    whyChoose: {
      en: `Every child deserves to feel like royalty on their birthday. A princess-themed party transforms your celebration into a magical fairy tale experience that your little one and their guests will treasure forever. From elegant decorations to enchanting activities, a princess party creates a dream-come-true atmosphere.

Princess parties appeal to children who love sparkle, elegance, and fantasy. Whether inspired by classic fairy tales or modern princess stories, this theme allows for creative expression through dress-up, royal tea parties, and magical adventures. The versatility of the princess theme means you can customize it to match your child's favorite princess or create an entirely unique royal experience.

With beautiful tiaras, flowing gowns, and castle-themed decorations, a princess birthday party offers the perfect setting for your child to celebrate their special day surrounded by their royal court of friends and family.`,
      zh: `每个孩子都应该在生日这天感受到被当作皇室成员的待遇。公主主题派对将您的庆典变成一个神奇的童话体验，让您的小公主和宾客们终生难忘。从优雅的装饰到迷人的活动，公主派对营造出梦想成真的氛围。

公主派对适合喜欢闪亮、优雅和幻想的孩子。无论灵感来自经典童话还是现代公主故事，这个主题都能通过换装、皇家茶会和魔法冒险来展现创意。公主主题的多样性意味着您可以根据孩子最喜欢的公主来定制，或创造一个独特的皇室体验。

配上美丽的皇冠、飘逸的礼服和城堡主题的装饰，公主生日派对为您的孩子提供了完美的场景，让她在朋友和家人组成的"皇家宫廷"中庆祝自己的特别日子。`
    },
    templateId: 'princess'
  },
  'unicorn-birthday-party': {
    slug: 'unicorn-birthday-party',
    name: { en: 'Unicorn Birthday Party', zh: '独角兽生日派对' },
    emoji: '🦄',
    description: {
      en: 'Create a magical unicorn birthday party invitation with online RSVP, QR code access, and automatic guest tracking. Rainbow colors and sparkles await!',
      zh: '创建梦幻独角兽主题生日派对邀请函，支持在线RSVP、二维码回复和自动宾客追踪。彩虹色彩和闪耀等着您！'
    },
    whyChoose: {
      en: `Unicorns represent magic, wonder, and endless possibilities - making them the perfect theme for a child's birthday celebration. A unicorn-themed party brings together rainbow colors, sparkles, and enchantment to create a truly magical experience that captures the joy and imagination of childhood.

The unicorn theme is incredibly versatile and appeals to children who love colors, fantasy, and all things magical. From pastel rainbow decorations to glittery crafts and activities, unicorn parties offer endless opportunities for creativity and fun. The theme works beautifully for children of various ages and can be adapted to suit any party style.

With flowing manes, golden horns, and rainbow trails, unicorn decorations transform any space into a magical wonderland. Whether you're hosting an intimate gathering or a larger celebration, a unicorn birthday party creates an atmosphere of joy and wonder that makes your child's special day truly unforgettable.`,
      zh: `独角兽代表着魔法、奇迹和无限可能——这使它成为儿童生日庆祝的完美主题。独角兽主题派对将彩虹色彩、闪光和魔法融为一体，创造出真正神奇的体验，捕捉童年的欢乐和想象力。

独角兽主题极其百搭，吸引着喜爱色彩、幻想和一切神奇事物的孩子。从柔和的彩虹装饰到闪亮的手工艺品和活动，独角兽派对提供了无限的创意和乐趣机会。这个主题适合各个年龄段的孩子，可以根据任何派对风格进行调整。

飘逸的鬃毛、金色的角和彩虹尾迹，独角兽装饰将任何空间变成神奇的仙境。无论您举办的是小型聚会还是大型庆典，独角兽生日派对都能营造出欢乐和奇妙的氛围，让您孩子的特别日子真正难以忘怀。`
    },
    templateId: 'unicorn'
  },
  'superhero-birthday-party': {
    slug: 'superhero-birthday-party',
    name: { en: 'Superhero Birthday Party', zh: '超级英雄生日派对' },
    emoji: '🦸',
    description: {
      en: 'Create an action-packed superhero birthday party invitation with online RSVP, QR code access, and automatic guest tracking. Every child is a hero!',
      zh: '创建动感十足的超级英雄主题生日派对邀请函，支持在线RSVP、二维码回复和自动宾客追踪。每个孩子都是英雄！'
    },
    whyChoose: {
      en: `Superheroes inspire children to believe in their own power to make a difference. A superhero-themed birthday party celebrates courage, strength, and the hero within every child. This action-packed theme creates an exciting atmosphere where kids can embrace their inner superhero and save the day.

Superhero parties appeal to children who love adventure, action, and stories of good triumphing over challenges. Whether your child admires classic comic book heroes or modern movie characters, this theme allows for creative costume play, exciting games, and heroic activities that keep young guests engaged and entertained.

From superhero training courses to villain-defeating missions, a superhero birthday party offers endless possibilities for active fun. The theme encourages teamwork, bravery, and imagination while creating memories of an epic celebration that your child and their super friends will talk about long after the party ends.`,
      zh: `超级英雄激励孩子们相信自己有能力改变世界。超级英雄主题生日派对庆祝勇气、力量和每个孩子内心的英雄。这个充满动感的主题创造了一个令人兴奋的氛围，让孩子们可以拥抱内心的超级英雄，拯救世界。

超级英雄派对吸引着喜爱冒险、动作和正义战胜邪恶故事的孩子。无论您的孩子崇拜经典漫画英雄还是现代电影角色，这个主题都可以进行创意角色扮演、刺激的游戏和英雄活动，让小宾客们全程投入和享受。

从超级英雄训练营到击败反派任务，超级英雄生日派对提供了无限的活动乐趣。这个主题鼓励团队合作、勇敢和想象力，同时创造史诗般的庆典回忆，让您的孩子和他们的超级朋友们在派对结束后仍会津津乐道。`
    },
    templateId: 'superhero'
  }
}

type Props = {
  params: Promise<{ locale: string; theme: string }>
}

export async function generateStaticParams() {
  const themes = Object.keys(templates)
  const locales = ['en', 'zh']

  return locales.flatMap(locale =>
    themes.map(theme => ({
      locale,
      theme
    }))
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, theme } = await params
  const template = templates[theme]

  if (!template) {
    return { title: 'Not Found' }
  }

  const lang = locale === 'zh' ? 'zh' : 'en'
  const baseUrl = 'https://kidspartyrsvp.com'

  return {
    title: `${template.name[lang]} Invitation with Online RSVP | KidsPartyRSVP`,
    description: template.description[lang],
    alternates: {
      canonical: `${baseUrl}/${locale}/templates/${theme}`,
      languages: {
        'en': `${baseUrl}/en/templates/${theme}`,
        'zh': `${baseUrl}/zh/templates/${theme}`,
        'x-default': `${baseUrl}/en/templates/${theme}`
      }
    },
    openGraph: {
      title: `${template.name[lang]} Invitation with Online RSVP`,
      description: template.description[lang],
      url: `${baseUrl}/${locale}/templates/${theme}`,
      type: 'website'
    }
  }
}

export default async function TemplatePage({ params }: Props) {
  const { locale, theme } = await params
  const template = templates[theme]

  if (!template) {
    notFound()
  }

  const lang = locale === 'zh' ? 'zh' : 'en'
  const isZh = locale === 'zh'

  return (
    <main className="flex-1">
      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <header className="text-center mb-12">
          <div className="text-7xl mb-6">{template.emoji}</div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
            {template.name[lang]} {isZh ? '邀请函' : 'Invitation'} with RSVP
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            {template.description[lang]}
          </p>
        </header>

        {/* Why Choose This Theme */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-6">
            {isZh ? `为什么选择${template.name.zh}主题？` : `Why Choose a ${template.name.en.replace(' Birthday Party', '')} Theme for a Kids Birthday Party?`}
          </h2>
          <div className="prose prose-lg max-w-none text-neutral-700">
            {template.whyChoose[lang].split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </section>

        {/* Create Invitation Section */}
        <section className="mb-12 bg-primary-50 rounded-2xl p-8">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-6">
            {isZh ? `使用在线RSVP创建${template.name.zh}邀请函` : `Create a ${template.name.en.replace(' Birthday Party', '')} Invitation with Online RSVP`}
          </h2>
          <p className="text-neutral-700 mb-6">
            {isZh
              ? 'KidsPartyRSVP 帮助家长在一个地方创建邀请函并管理宾客回复。我们的平台提供：'
              : 'KidsPartyRSVP helps parents create invitations and manage RSVPs all in one place. Our platform offers:'}
          </p>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-3">
              <span className="text-primary-600">✓</span>
              <span>{isZh ? '二维码RSVP - 宾客扫码即可回复' : 'QR code RSVP access - guests scan to respond instantly'}</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-primary-600">✓</span>
              <span>{isZh ? '自动提醒 - 系统自动提醒未回复的宾客' : 'Automatic reminders - auto-notify guests who haven\'t responded'}</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-primary-600">✓</span>
              <span>{isZh ? '实时追踪 - 随时查看宾客回复状态' : 'Real-time guest tracking - see responses as they come in'}</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-primary-600">✓</span>
              <span>{isZh ? '无需下载APP - 宾客在浏览器中直接回复' : 'No app required - guests RSVP directly in their browser'}</span>
            </li>
          </ul>
        </section>

        {/* How It Works */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-6">
            {isZh ? '如何使用' : 'How It Works'}
          </h2>
          <ol className="space-y-6">
            <li className="flex gap-4">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-primary-600">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 mb-1">
                  {isZh ? `创建${template.name.zh}邀请函` : `Create your ${template.name.en.toLowerCase().replace(' birthday party', '-themed')} invitation`}
                </h3>
                <p className="text-neutral-600">
                  {isZh ? '选择模板，填写派对信息（日期、时间、地点）' : 'Choose your template and enter party details (date, time, location)'}
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-primary-600">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 mb-1">
                  {isZh ? '分享RSVP链接或二维码' : 'Share the RSVP link or QR code'}
                </h3>
                <p className="text-neutral-600">
                  {isZh ? '通过微信、短信或邮件发送给宾客' : 'Send to guests via text, email, or social media'}
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-primary-600">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 mb-1">
                  {isZh ? '自动追踪宾客回复' : 'Track guest responses automatically'}
                </h3>
                <p className="text-neutral-600">
                  {isZh ? '实时查看谁会参加，收集过敏信息和联系方式' : 'See who\'s coming in real-time, collect allergies and contact info'}
                </p>
              </div>
            </li>
          </ol>
        </section>

        {/* FAQ Section */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-6">
            {isZh ? '常见问题' : 'Frequently Asked Questions'}
          </h2>
          <div className="space-y-4">
            <details className="bg-neutral-50 rounded-lg p-4 group">
              <summary className="font-semibold text-neutral-900 cursor-pointer list-none flex justify-between items-center">
                {isZh ? '宾客需要下载APP吗？' : 'Do guests need to download an app?'}
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-neutral-600">
                {isZh ? '不需要。宾客可以直接在浏览器中回复邀请，无需下载任何应用。' : 'No. Guests can RSVP directly in their browser without downloading anything.'}
              </p>
            </details>
            <details className="bg-neutral-50 rounded-lg p-4 group">
              <summary className="font-semibold text-neutral-900 cursor-pointer list-none flex justify-between items-center">
                {isZh ? '我能看到谁会来参加吗？' : 'Can I see who is coming?'}
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-neutral-600">
                {isZh ? '是的。宾客回复会实时更新到您的仪表板，您可以随时查看参加人数和详细信息。' : 'Yes. Guest responses update in real-time on your dashboard. You can see headcount and details anytime.'}
              </p>
            </details>
            <details className="bg-neutral-50 rounded-lg p-4 group">
              <summary className="font-semibold text-neutral-900 cursor-pointer list-none flex justify-between items-center">
                {isZh ? '这个服务免费吗？' : 'Is this service free?'}
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-neutral-600">
                {isZh ? '是的，核心功能完全免费。您可以免费创建邀请函、使用二维码RSVP和追踪宾客回复。' : 'Yes, core features are completely free. You can create invitations, use QR code RSVP, and track guests at no cost.'}
              </p>
            </details>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            {isZh ? `创建您的${template.name.zh}邀请函` : `Create Your ${template.name.en} Invitation`}
          </h2>
          <p className="text-primary-100 mb-6">
            {isZh ? '几分钟内即可完成，完全免费' : 'Ready in minutes, completely free'}
          </p>
          <Link
            href={`/${locale}/party/new?theme=${template.templateId}`}
            className="inline-block bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            {isZh ? '立即创建' : 'Create This Invitation'}
          </Link>
        </section>

        {/* Related Links */}
        <section className="mt-12 pt-8 border-t border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            {isZh ? '探索更多功能' : 'Explore More Features'}
          </h3>
          <div className="flex flex-wrap gap-3">
            <Link href={`/${locale}/features/qr-code-rsvp`} className="text-primary-600 hover:underline">
              {isZh ? '二维码RSVP' : 'QR Code RSVP'}
            </Link>
            <span className="text-neutral-300">•</span>
            <Link href={`/${locale}/features/guest-tracking`} className="text-primary-600 hover:underline">
              {isZh ? '宾客追踪' : 'Guest Tracking'}
            </Link>
            <span className="text-neutral-300">•</span>
            <Link href={`/${locale}/features/automatic-reminders`} className="text-primary-600 hover:underline">
              {isZh ? '自动提醒' : 'Automatic Reminders'}
            </Link>
          </div>
        </section>
      </article>
    </main>
  )
}
