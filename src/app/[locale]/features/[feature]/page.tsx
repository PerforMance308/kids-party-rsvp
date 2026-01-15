import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

// Feature data for SEO pages
const features: Record<string, {
  slug: string
  name: { en: string; zh: string }
  emoji: string
  description: { en: string; zh: string }
  content: { en: string; zh: string }
  benefits: { en: string[]; zh: string[] }
}> = {
  'qr-code-rsvp': {
    slug: 'qr-code-rsvp',
    name: { en: 'QR Code RSVP', zh: '二维码RSVP' },
    emoji: '📱',
    description: {
      en: 'QR code RSVP for kids birthday parties. Guests scan to respond instantly without downloading any app. Fast, easy, and convenient.',
      zh: '儿童生日派对二维码RSVP功能。宾客扫码即可回复，无需下载APP。快速、简单、方便。'
    },
    content: {
      en: `QR code RSVP revolutionizes how parents collect guest responses for kids birthday parties. Instead of chasing responses through group chats or waiting for paper RSVPs to be returned, parents can simply share a QR code that guests scan with their phone camera.

When a guest scans the QR code, they're taken directly to a mobile-friendly RSVP form. In seconds, they can confirm attendance, add the number of children attending, note any allergies or dietary restrictions, and provide contact information. The entire process takes less than a minute.

This technology is particularly valuable for kids' birthday parties because it removes barriers for busy parents. Grandparents, aunts, uncles, and other family members can easily respond without needing to navigate complicated apps or remember passwords. The simplicity of scan-and-respond means higher response rates and less time spent following up with guests.`,
      zh: `二维码RSVP彻底改变了家长收集儿童生日派对宾客回复的方式。不再需要在群聊中追问回复，也不用等待纸质邀请函的回执，家长只需分享一个二维码，宾客用手机扫一扫即可。

当宾客扫描二维码时，他们会直接进入一个移动端友好的RSVP表单。几秒钟内，他们就可以确认是否参加、填写参加的孩子人数、注明任何过敏或饮食限制，并提供联系方式。整个过程不到一分钟。

这项技术对儿童生日派对特别有价值，因为它为忙碌的家长消除了障碍。爷爷奶奶、叔叔阿姨和其他家庭成员都可以轻松回复，无需使用复杂的应用程序或记住密码。扫码即回复的简单性意味着更高的回复率和更少的跟进时间。`
    },
    benefits: {
      en: [
        'No app download required for guests',
        'Works on any smartphone with a camera',
        'Easy for grandparents and less tech-savvy guests',
        'Higher response rates than traditional methods',
        'Instant confirmation to party hosts'
      ],
      zh: [
        '宾客无需下载任何APP',
        '任何带摄像头的智能手机都可使用',
        '对老年人和不太懂技术的宾客很友好',
        '比传统方式有更高的回复率',
        '派对主人可即时收到确认'
      ]
    }
  },
  'guest-tracking': {
    slug: 'guest-tracking',
    name: { en: 'Guest Tracking', zh: '宾客追踪' },
    emoji: '👥',
    description: {
      en: 'Real-time guest tracking for kids birthday parties. See who\'s coming, collect allergy info, and manage your guest list effortlessly.',
      zh: '儿童生日派对实时宾客追踪功能。查看谁会参加，收集过敏信息，轻松管理宾客名单。'
    },
    content: {
      en: `Managing guest responses for a kids birthday party can be overwhelming. Between tracking RSVPs, noting dietary restrictions, and keeping count of how many children will attend, there's a lot to keep track of. KidsPartyRSVP's guest tracking feature brings all this information together in one easy-to-use dashboard.

As guests respond to your invitation, their information automatically appears in your dashboard. You can see at a glance how many guests have confirmed, how many have declined, and who hasn't responded yet. The system tracks important details like the number of children each guest is bringing, any food allergies or dietary restrictions, and emergency contact information.

This real-time tracking eliminates the need for spreadsheets, sticky notes, or mental gymnastics. Before the party, you'll know exactly how many goodie bags to prepare, how much food to order, and whether you need to accommodate any special dietary needs. The peace of mind that comes from having accurate, up-to-date guest information is invaluable for party planning.`,
      zh: `管理儿童生日派对的宾客回复可能让人应接不暇。在追踪RSVP、记录饮食限制和统计将参加的儿童人数之间，有很多事情需要跟踪。KidsPartyRSVP的宾客追踪功能将所有这些信息集中在一个易于使用的仪表板中。

当宾客回复您的邀请时，他们的信息会自动出现在您的仪表板中。您可以一目了然地看到有多少宾客已确认、有多少人已拒绝，以及谁还没有回复。系统追踪重要细节，如每位宾客带来的儿童数量、任何食物过敏或饮食限制，以及紧急联系信息。

这种实时追踪消除了对电子表格、便签或脑力记忆的需要。在派对之前，您将确切知道要准备多少份礼品袋、订购多少食物，以及是否需要满足任何特殊的饮食需求。拥有准确、最新的宾客信息所带来的安心感对于派对策划来说是无价的。`
    },
    benefits: {
      en: [
        'Real-time updates as guests respond',
        'Automatic headcount tracking',
        'Allergy and dietary restriction collection',
        'Contact information management',
        'Export guest list for party planning'
      ],
      zh: [
        '宾客回复时实时更新',
        '自动统计人数',
        '收集过敏和饮食限制信息',
        '联系信息管理',
        '导出宾客名单用于派对策划'
      ]
    }
  },
  'automatic-reminders': {
    slug: 'automatic-reminders',
    name: { en: 'Automatic Reminders', zh: '自动提醒' },
    emoji: '🔔',
    description: {
      en: 'Automatic RSVP reminders for kids birthday parties. Never chase responses again - the system reminds guests who haven\'t replied.',
      zh: '儿童生日派对自动RSVP提醒功能。再也不用追问回复了 - 系统自动提醒未回复的宾客。'
    },
    content: {
      en: `One of the most time-consuming aspects of party planning is following up with guests who haven't responded to invitations. It's awkward to send multiple reminder messages, and easy to forget who you've already contacted. KidsPartyRSVP's automatic reminder system handles this for you.

When you set up your party invitation, you can configure automatic reminders to be sent to guests who haven't responded. The system tracks who has and hasn't replied, and sends polite reminder notifications at intervals you choose. This might be a week before the party, three days before, or whatever timeline works best for your event.

These reminders are sent via email and are designed to be friendly and non-intrusive. They simply remind guests that a response is needed and provide an easy link to the RSVP form. For party hosts, this means higher response rates without the social discomfort of personally chasing responses.`,
      zh: `派对策划中最耗时的方面之一就是跟进那些没有回复邀请的宾客。发送多条提醒消息很尴尬，而且很容易忘记你已经联系过谁。KidsPartyRSVP的自动提醒系统为您处理这一切。

当您设置派对邀请时，您可以配置自动提醒，发送给那些尚未回复的宾客。系统追踪谁已经回复、谁还没有回复，并按您选择的时间间隔发送礼貌的提醒通知。这可能是派对前一周、前三天，或任何最适合您活动的时间线。

这些提醒通过电子邮件发送，设计得友好且不打扰。它们只是提醒宾客需要回复，并提供一个方便的RSVP表单链接。对于派对主人来说，这意味着更高的回复率，而不必承受亲自追问回复的社交不适感。`
    },
    benefits: {
      en: [
        'Set-and-forget reminder system',
        'Customizable reminder schedule',
        'Polite, professional reminder messages',
        'Only sent to non-responders',
        'Higher response rates without awkward follow-ups'
      ],
      zh: [
        '设置后自动运行的提醒系统',
        '可自定义提醒时间表',
        '礼貌、专业的提醒消息',
        '只发送给未回复者',
        '无需尴尬跟进即可获得更高回复率'
      ]
    }
  },
  'no-app-required': {
    slug: 'no-app-required',
    name: { en: 'No App Required', zh: '无需下载APP' },
    emoji: '✨',
    description: {
      en: 'No app download required for guests to RSVP to kids birthday parties. Works in any web browser on any device.',
      zh: '宾客回复儿童生日派对邀请无需下载APP。在任何设备的任何网页浏览器中都可使用。'
    },
    content: {
      en: `In a world full of apps demanding to be downloaded, KidsPartyRSVP takes a refreshingly simple approach: guests never need to download anything. Everything works directly in the web browser they already have on their phone, tablet, or computer.

This browser-first approach removes the biggest barrier to getting RSVP responses. When grandparents receive a party invitation, they don't need to figure out how to download an app from the App Store. When busy parents get the invite during their lunch break, they can respond immediately without installing anything. When tech-shy family members receive the QR code, they simply scan and respond.

The RSVP form is designed to be mobile-responsive, meaning it looks great and works perfectly whether accessed on a smartphone, tablet, or desktop computer. Forms load quickly, even on slower connections, and the interface is intuitive enough that users of all ages and technical abilities can complete their response without confusion.`,
      zh: `在一个充满各种要求下载的APP的世界里，KidsPartyRSVP采用了一种清新简单的方式：宾客永远不需要下载任何东西。一切都直接在他们手机、平板电脑或电脑上已有的网页浏览器中运行。

这种浏览器优先的方式消除了获取RSVP回复的最大障碍。当爷爷奶奶收到派对邀请时，他们不需要弄清楚如何从应用商店下载APP。当忙碌的父母在午休时间收到邀请时，他们可以立即回复而无需安装任何东西。当不太懂技术的家庭成员收到二维码时，他们只需扫描并回复。

RSVP表单设计为移动响应式，这意味着无论是在智能手机、平板电脑还是台式电脑上访问，它看起来都很棒并且运行完美。表单加载快速，即使在较慢的网络连接上也是如此，界面足够直观，让各个年龄和技术能力的用户都能毫无困惑地完成回复。`
    },
    benefits: {
      en: [
        'Works in any web browser',
        'No app store downloads needed',
        'Perfect for less tech-savvy guests',
        'Fast loading on any connection',
        'Works on phones, tablets, and computers'
      ],
      zh: [
        '在任何网页浏览器中都可使用',
        '无需从应用商店下载',
        '非常适合不太懂技术的宾客',
        '在任何网络连接上都能快速加载',
        '可在手机、平板和电脑上使用'
      ]
    }
  }
}

type Props = {
  params: Promise<{ locale: string; feature: string }>
}

export async function generateStaticParams() {
  const featureKeys = Object.keys(features)
  const locales = ['en', 'zh']

  return locales.flatMap(locale =>
    featureKeys.map(feature => ({
      locale,
      feature
    }))
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, feature } = await params
  const featureData = features[feature]

  if (!featureData) {
    return { title: 'Not Found' }
  }

  const lang = locale === 'zh' ? 'zh' : 'en'
  const baseUrl = 'https://kidspartyrsvp.com'

  return {
    title: `${featureData.name[lang]} for Kids Birthday Parties | KidsPartyRSVP`,
    description: featureData.description[lang],
    alternates: {
      canonical: `${baseUrl}/${locale}/features/${feature}`,
      languages: {
        'en': `${baseUrl}/en/features/${feature}`,
        'zh': `${baseUrl}/zh/features/${feature}`,
        'x-default': `${baseUrl}/en/features/${feature}`
      }
    },
    openGraph: {
      title: `${featureData.name[lang]} for Kids Birthday Parties`,
      description: featureData.description[lang],
      url: `${baseUrl}/${locale}/features/${feature}`,
      type: 'website'
    }
  }
}

export default async function FeaturePage({ params }: Props) {
  const { locale, feature } = await params
  const featureData = features[feature]

  if (!featureData) {
    notFound()
  }

  const lang = locale === 'zh' ? 'zh' : 'en'
  const isZh = locale === 'zh'

  return (
    <main className="flex-1">
      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <header className="text-center mb-12">
          <div className="text-7xl mb-6">{featureData.emoji}</div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
            {featureData.name[lang]} {isZh ? '- 儿童生日派对' : 'for Kids Birthday Parties'}
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            {featureData.description[lang]}
          </p>
        </header>

        {/* Main Content */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-6">
            {isZh ? `为什么使用${featureData.name.zh}？` : `Why Use ${featureData.name.en}?`}
          </h2>
          <div className="prose prose-lg max-w-none text-neutral-700">
            {featureData.content[lang].split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="mb-12 bg-primary-50 rounded-2xl p-8">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-6">
            {isZh ? '主要优势' : 'Key Benefits'}
          </h2>
          <ul className="space-y-3">
            {featureData.benefits[lang].map((benefit, index) => (
              <li key={index} className="flex items-center gap-3">
                <span className="text-primary-600 text-xl">✓</span>
                <span className="text-neutral-700">{benefit}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Use with Templates Section */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-6">
            {isZh ? `将${featureData.name.zh}用于派对邀请` : `Use ${featureData.name.en} with Party Invitations`}
          </h2>
          <p className="text-neutral-700 mb-6">
            {isZh
              ? `所有KidsPartyRSVP模板都支持${featureData.name.zh}功能，包括：`
              : `All KidsPartyRSVP templates support ${featureData.name.en}, including:`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href={`/${locale}/templates/dinosaur-birthday-party`} className="flex items-center gap-3 p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
              <span className="text-3xl">🦖</span>
              <span className="font-medium text-neutral-900">{isZh ? '恐龙生日派对' : 'Dinosaur Birthday Party'}</span>
            </Link>
            <Link href={`/${locale}/templates/princess-birthday-party`} className="flex items-center gap-3 p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
              <span className="text-3xl">👸</span>
              <span className="font-medium text-neutral-900">{isZh ? '公主生日派对' : 'Princess Birthday Party'}</span>
            </Link>
            <Link href={`/${locale}/templates/unicorn-birthday-party`} className="flex items-center gap-3 p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
              <span className="text-3xl">🦄</span>
              <span className="font-medium text-neutral-900">{isZh ? '独角兽生日派对' : 'Unicorn Birthday Party'}</span>
            </Link>
            <Link href={`/${locale}/templates/superhero-birthday-party`} className="flex items-center gap-3 p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
              <span className="text-3xl">🦸</span>
              <span className="font-medium text-neutral-900">{isZh ? '超级英雄生日派对' : 'Superhero Birthday Party'}</span>
            </Link>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            {isZh ? '立即体验' : 'Try It Now'}
          </h2>
          <p className="text-primary-100 mb-6">
            {isZh ? '创建您的第一个派对邀请，完全免费' : 'Create your first party invitation, completely free'}
          </p>
          <Link
            href={`/${locale}/register`}
            className="inline-block bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            {isZh ? '免费开始' : 'Get Started Free'}
          </Link>
        </section>

        {/* Other Features */}
        <section className="mt-12 pt-8 border-t border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            {isZh ? '探索其他功能' : 'Explore Other Features'}
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(features)
              .filter(([key]) => key !== feature)
              .map(([key, f]) => (
                <Link key={key} href={`/${locale}/features/${key}`} className="text-primary-600 hover:underline">
                  {f.name[lang]}
                </Link>
              ))
              .reduce((acc: React.ReactNode[], curr, index, arr) => {
                acc.push(curr)
                if (index < arr.length - 1) {
                  acc.push(<span key={`sep-${index}`} className="text-neutral-300">•</span>)
                }
                return acc
              }, [])}
          </div>
        </section>
      </article>
    </main>
  )
}
