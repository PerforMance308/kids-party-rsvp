'use client'

import { createContext, useContext, ReactNode } from 'react'

type Locale = 'zh' | 'en'

interface LanguageContextType {
  locale: Locale
  t: (key: string, params?: Record<string, any>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// 完整的翻译函数
const translations = {
  zh: {
    // 导航
    'nav.dashboard': '仪表板',
    'nav.invitations': '邀请函',
    'nav.myChildren': '我的孩子',
    'nav.newParty': '新建派对',
    'nav.logout': '退出登录',
    'nav.login': '登录',
    'nav.signUp': '注册',

    // 主页
    'home.title': 'Kid Party RSVP',
    'home.subtitle': '简单、精美的儿童派对邀请函和RSVP管理系统。管理客人的回复从未如此轻松！',
    'home.loading': '加载中...',
    'home.goToDashboard': '前往仪表板',
    'home.createNewParty': '创建新派对',
    'home.startPlanning': '开始规划',
    'home.haveAccount': '我有账户',
    'home.getStartedFree': '免费开始',
    'home.featuresTitle': '您需要的一切',
    'home.featuresSubtitle': '为忙碌的父母打造，让派对规划变得美丽、无压力',

    // 功能介绍
    'features.qrCode.title': '二维码邀请函',
    'features.qrCode.desc': '为您的纸质邀请函生成精美的二维码。客人只需扫描即可回复！',
    'features.noLogin.title': '安全管理',
    'features.noLogin.desc': '客人通过简单的验证即可回复，确保派对信息的私密与安全。',
    'features.dashboard.title': '实时仪表板',
    'features.dashboard.desc': '实时跟踪RSVP。查看谁来参加、饮食限制和家长联系信息。',
    'features.contacts.title': '重复使用联系人',
    'features.contacts.desc': '规划另一个派对？一键邀请相同的朋友群体。',
    'features.reminders.title': '智能提醒',
    'features.reminders.desc': '自动发送友好提醒，分别在派对前7天、2天和当天上午。',
    'features.privacy.title': '私密安全',
    'features.privacy.desc': '您的派对完全私密。客人无法看到其他参与者的信息。',

    // CTA部分
    'cta.title': '准备规划您的派对了吗？',
    'cta.subtitle': '加入数千名让派对规划变得简单无压力的父母。',

    // Dashboard
    'dashboard.title': '我的仪表板',
    'dashboard.subtitle': '管理您的派对邀请函和RSVP',
    'dashboard.noParties': '还没有派对',
    'dashboard.noPartiesDesc': '创建您的第一个派对开始管理邀请函和RSVP',
    'dashboard.planFirst': '规划您的第一个派对',
    'dashboard.partyTitle': '{childName}的{age}岁生日派对',
    'dashboard.stats.invited': '已邀请',
    'dashboard.stats.yes': '参加',
    'dashboard.stats.no': '不参加',
    'dashboard.stats.maybe': '待定',
    'dashboard.today': '今天',
    'dashboard.daysLeft': '{days}天',
    'dashboard.manageParty': '管理派对',
    'dashboard.edit': '编辑',
    'dashboard.delete': '删除',
    'dashboard.deleting': '删除中...',
    'dashboard.deleteConfirm': '确定要删除{childName}的派对吗？此操作无法撤销。',

    // 模板相关
    'templates.title': '选择邀请卡样式',
    'templates.scrollHint': '横向滑动查看更多',
    'templates.free': '基础版',
    'templates.freeDesc': '简单清洁的设计',
    'templates.premium1': '优雅花卉',
    'templates.premium1Desc': '专业渐变背景，优雅设计',
    'templates.premium2': '可爱卡通',
    'templates.premium2Desc': '充满童趣的卡通风格',
    'templates.premium3': '简约现代',
    'templates.premium3Desc': '极简主义，现代感设计',
    'templates.premium4': '节日庆典',
    'templates.premium4Desc': '充满节日气息的动感设计',
    'templates.price': '免费',
    'templates.premiumPrice': '¥9.9',
    'templates.needsPurchase': '需要购买',
    'templates.currentlyUsing': '当前使用',
    'templates.selectTemplate': '选择此模板',
    'templates.purchaseUse': '购买使用 ¥9.9',
    'templates.purchaseTitle': '购买精美付费模板',
    'templates.payNow': '立即支付',
    'templates.payLater': '稍后再说',

    // 新建派对页面
    'newParty.title': '规划新派对',
    'newParty.subtitle': '为您孩子的派对填写详细信息',
    'newParty.selectChild': '选择孩子',
    'newParty.chooseChild': '选择一个孩子...',
    'newParty.addNewChild': '+ 添加新孩子',
    'newParty.enterManually': '手动输入孩子信息',
    'newParty.selectExisting': '← 改为从现有孩子中选择',
    'newParty.celebratingAge': '庆祝几岁生日？',
    'newParty.agePlaceholder': '例如：5',
    'newParty.ageHelp': '如果不填写，将根据孩子生日自动计算。如果派对提前举行，请手动填写。',
    'newParty.childName': '孩子姓名',
    'newParty.age': '年龄',
    'newParty.date': '日期',
    'newParty.time': '时间',
    'newParty.location': '地点',
    'newParty.locationPlaceholder': '例如：123 主街，城市公园，社区中心',
    'newParty.theme': '派对主题',
    'newParty.themePlaceholder': '例如：恐龙，公主，超级英雄',
    'newParty.notes': '额外说明',
    'newParty.notesPlaceholder': '任何特殊说明、礼品偏好或重要细节...',
    'newParty.cancel': '取消',
    'newParty.creating': '创建中...',
    'newParty.createParty': '创建派对',
    'newParty.selectChildRequired': '请选择一个孩子',

    // 登录页面
    'login.title': '登录',
    'login.subtitle': '登录管理您的派对',
    'login.email': '邮箱',
    'login.password': '密码',
    'login.showPassword': '显示密码',
    'login.hidePassword': '隐藏密码',
    'login.signInWithGoogle': '使用 Google 登录',
    'login.signIn': '登录',
    'login.signingIn': '登录中...',
    'login.signUpLink': '注册',
    'login.noAccount': '还没有账户？',
    'login.orContinueWith': '或者使用邮箱继续',

    // 注册页面
    'register.title': '创建账户',
    'register.subtitle': '创建您的账户',
    'register.email': '邮箱',
    'register.password': '密码',
    'register.showPassword': '显示密码',
    'register.hidePassword': '隐藏密码',
    'register.signUpWithGoogle': '使用 Google 注册',
    'register.signUp': '创建账户',
    'register.creatingAccount': '创建账户中...',
    'register.signInLink': '登录',
    'register.haveAccount': '已有账户？',
    'register.passwordRequirements': '密码必须包含：',
    'register.atLeast8Chars': '至少8个字符',
    'register.oneUppercase': '一个大写字母',
    'register.oneLowercase': '一个小写字母',
    'register.oneNumber': '一个数字',
    'register.googleSignUpFailed': 'Google 注册失败，请重试。',

    // 儿童管理页面
    'children.title': '我的孩子',
    'children.subtitle': '管理您孩子的信息，便于派对规划',
    'children.addChild': '+ 添加孩子',
    'children.noChildren': '还没有孩子记录',
    'children.noChildrenDesc': '添加孩子的信息以便快速创建派对邀请',
    'children.name': '姓名',
    'children.birthDate': '出生日期',
    'children.age': '年龄',
    'children.allergies': '过敏信息',
    'children.notes': '备注',
    'children.save': '保存',
    'children.cancel': '取消',
    'children.edit': '编辑',
    'children.delete': '删除',
    'children.saving': '保存中...',
    'children.years': '岁',
    'children.createParty': '创建派对',
    'children.born': '出生：',
    'children.allergiesLabel': '过敏：',
    'children.notesLabel': '备注：',

    // 错误和提示
    'error.title': '错误',
    'error.tryAgain': '重试',
    'error.trySolutions': '尝试这些解决方案：',
    'error.refreshPage': '刷新页面',
    'error.networkError': '网络连接错误',
    'error.validationError': '表单验证错误',
    'error.authError': '认证错误',
    'error.loadingError': '加载失败',

    // RSVP 页面
    'rsvp.title': '您收到了邀请！🎉',
    'rsvp.invitationNotFound': '未找到邀请',
    'rsvp.invitationNotFoundDesc': '此邀请链接无效或已过期。',
    'rsvp.submittedTitle': '回复已提交！',
    'rsvp.submittedDesc': '感谢您的回复。我们期待与您一起庆祝！',
    'rsvp.goGuestPage': '前往派对页面',
    'rsvp.when': '时间：',
    'rsvp.where': '地点：',
    'rsvp.specialNotes': '特别说明：',
    'rsvp.createAccountTitle': '创建账户以回复',
    'rsvp.createAccountDesc': '我们需要为您创建一个临时账户，以便您管理回复并接收派对动态。',
    'rsvp.haveAccount': '您已经有账户了吗？',
    'rsvp.createAccountBtn': '创建新账户',
    'rsvp.signInBtn': '登录',
    'rsvp.emailLabel': '邮箱地址 *',
    'rsvp.passwordLabel': '密码 *',
    'rsvp.creatingAccount': '正在创建账户...',
    'rsvp.createAndContinue': '创建账户并继续',
    'rsvp.backToOptions': '← 返回选项',
    'rsvp.pleaseRSVP': '请回复',
    'rsvp.parentNameLabel': '家长/监护人姓名 *',
    'rsvp.childSelectLabel': '选择孩子 *',
    'rsvp.childNameLabel': '孩子姓名 *',
    'rsvp.phoneLabel': '电话号码',
    'rsvp.phonePlaceholder': '可选 - 用于派对更新通知',
    'rsvp.attendingLabel': '您会参加吗？ *',
    'rsvp.yes': '参加！🎉',
    'rsvp.no': '抱歉，无法参加 😢',
    'rsvp.maybe': '待定 🤔',
    'rsvp.numChildrenLabel': '参加的孩子人数 *',
    'rsvp.parentStayingLabel': '家长/监护人是否陪同？',
    'rsvp.parentStayingYes': '是',
    'rsvp.parentStayingNo': '否 (仅送到)',
    'rsvp.allergiesLabel': '食物过敏或饮食限制',
    'rsvp.allergiesPlaceholder': '请列出任何过敏或饮食需求',
    'rsvp.autoFilled': '✓ 已根据 {name} 的资料自动填写',
    'rsvp.submitting': '正在提交...',
    'rsvp.submitBtn': '提交回复',

    // 我的邀请页面
    'invitations.title': '我的邀请函',
    'invitations.subtitle': '管理您收到的儿童派对邀请',
    'invitations.upcoming': '即将到来的派对 ({count})',
    'invitations.noUpcoming': '没有即将到来的邀请',
    'invitations.noUpcomingDesc': '当朋友邀请您参加派对时，它们会出现在这里',
    'invitations.host': '主办人：',
    'invitations.lastUpdated': '最后更新：',
    'invitations.updateRSVP': '更新回复',
    'invitations.rsvpNow': '立即回复',
    'invitations.past': '往期派对 ({count})',
    'invitations.status.attending': '参加',
    'invitations.status.notAttending': '不参加',
    'invitations.status.maybe': '待定',
    'invitations.status.noResponse': '未回复',

    // 管理派对页面 (Manage Party)
    'manage.overview': '概览',
    'manage.guests': '宾客',
    'manage.invitation': '邀请函',
    'manage.photos': '相册',
    'manage.totalInvited': '总邀请',
    'manage.attending': '确认参加',
    'manage.responseRate': '回复率',
    'manage.quickActions': '快捷操作',
    'manage.copyLink': '复制链接',
    'manage.linkCopied': 'RSVP链接已复制到剪贴板！',
    'manage.exportList': '导出名单',
    'manage.editParty': '编辑派对',
    'manage.backToDashboard': '返回仪表板',
    'manage.addGuests': '添加宾客',
    'manage.addGuestsDesc': '从以前的派对中选择朋友进行邀请。',
    'manage.guestList': '宾客名单 & 回复',
    'manage.noRsvps': '暂无回复。分享您的邀请函以开始！',
    'manage.guest': '宾客',
    'manage.contact': '联系方式',
    'manage.status': '状态',
    'manage.details': '详情',
    'manage.premiumPurchased': '已购买高级模板',
    'manage.currentInvitation': '当前邀请函',
    'manage.generating': '生成邀请函中...',
    'manage.child': '{count} 个孩子',
    'manage.staying': '家长陪同',
    'manage.dropOff': '家长不陪同',

    // 邀请宾客组件 (InviteGuests)
    'invite.loading': '加载联系人...',
    'invite.noContacts': '您还没有联系人。',
    'invite.noContactsDesc': '当有人回复您的派对邀请时，联系人会自动添加。',
    'invite.name': '姓名',
    'invite.email': '邮箱',
    'invite.child': '孩子：{name}',
    'invite.selected': '已选择 {count} 人',
    'invite.send': '发送邀请',
    'invite.sending': '发送中...',
    'invite.success': '成功发送 {count} 份邀请！',
    'invite.error': '发送邀请失败，请重试。',
    'invite.sendError': '发送邀请时发生错误。',
  },
  en: {
    // 导航
    'nav.dashboard': 'Dashboard',
    'nav.invitations': 'Invitations',
    'nav.myChildren': 'My Children',
    'nav.newParty': 'New Party',
    'nav.logout': 'Logout',
    'nav.login': 'Login',
    'nav.signUp': 'Sign Up',

    // 主页
    'home.title': 'Kid Party RSVP',
    'home.subtitle': 'Simple, beautiful party invitations and RSVP management for children\'s parties. Managing guest responses has never been easier!',
    'home.loading': 'Loading...',
    'home.goToDashboard': 'Go to Dashboard',
    'home.createNewParty': 'Create New Party',
    'home.startPlanning': 'Start Planning',
    'home.haveAccount': 'I Have an Account',
    'home.getStartedFree': 'Get Started Free',
    'home.featuresTitle': 'Everything You Need',
    'home.featuresSubtitle': 'Built for busy parents who want beautiful, stress-free party planning',

    // 功能介绍
    'features.qrCode.title': 'QR Code Invitations',
    'features.qrCode.desc': 'Generate beautiful QR codes for your paper invitations. Guests just scan and RSVP!',
    'features.noLogin.title': 'Secure Access',
    'features.noLogin.desc': 'Guests log in to RSVP, keeping your party details private and secure.',
    'features.dashboard.title': 'Real-time Dashboard',
    'features.dashboard.desc': 'Track RSVPs in real-time. See who\'s coming, dietary restrictions, and parent contact info.',
    'features.contacts.title': 'Reuse Contacts',
    'features.contacts.desc': 'Planning another party? Instantly invite the same group of friends with one click.',
    'features.reminders.title': 'Smart Reminders',
    'features.reminders.desc': 'Automatic friendly reminders sent 7 days, 2 days, and the morning of your party.',
    'features.privacy.title': 'Private & Safe',
    'features.privacy.desc': 'Your parties are completely private. Guests can\'t see other attendees\' information.',

    // CTA部分
    'cta.title': 'Ready to make your child\'s day special?',
    'cta.subtitle': 'Join thousands of parents who use Kid Party RSVP to plan perfect, stress-free birthday celebrations.',
    'auth.verifySent': 'Verification email sent to',
    'auth.verifyReminder': 'Your email is not verified. Please check your inbox at',
    'auth.resendVerify': 'Resend verification email',
    'auth.sending': 'Sending...',
    'auth.sendFailed': 'Failed to send. Please try again later.',

    // Dashboard
    'dashboard.title': 'My Dashboard',
    'dashboard.subtitle': 'Manage your party invitations and RSVPs',
    'dashboard.noParties': 'No parties yet',
    'dashboard.noPartiesDesc': 'Create your first party to start managing invitations and RSVPs',
    'dashboard.planFirst': 'Plan Your First Party',
    'dashboard.partyTitle': '{childName}\'s {age}th Birthday',
    'dashboard.stats.invited': 'Invited',
    'dashboard.stats.yes': 'Yes',
    'dashboard.stats.no': 'No',
    'dashboard.stats.maybe': 'Maybe',
    'dashboard.today': 'Today',
    'dashboard.daysLeft': '{days} days',
    'dashboard.manageParty': 'Manage Party',
    'dashboard.edit': 'Edit',
    'dashboard.delete': 'Delete',
    'dashboard.deleting': 'Deleting...',
    'dashboard.deleteConfirm': 'Are you sure you want to delete {childName}\'s party? This action cannot be undone.',

    // 模板相关
    'templates.title': 'Choose Invitation Template',
    'templates.scrollHint': 'Scroll to see more',
    'templates.free': 'Basic',
    'templates.freeDesc': 'Simple and clean design',
    'templates.premium1': 'Elegant Floral',
    'templates.premium1Desc': 'Professional gradient background with elegant design',
    'templates.premium2': 'Cute Cartoon',
    'templates.premium2Desc': 'Fun cartoon style full of childhood charm',
    'templates.premium3': 'Modern Minimal',
    'templates.premium3Desc': 'Minimalist design with modern aesthetics',
    'templates.premium4': 'Festival Celebration',
    'templates.premium4Desc': 'Dynamic design full of festive atmosphere',
    'templates.price': 'Free',
    'templates.premiumPrice': '¥9.9',
    'templates.needsPurchase': 'Purchase Required',
    'templates.currentlyUsing': 'Currently Using',
    'templates.selectTemplate': 'Select Template',
    'templates.purchaseUse': 'Purchase & Use ¥9.9',
    'templates.purchaseTitle': 'Purchase Premium Template',
    'templates.payNow': 'Pay Now',
    'templates.payLater': 'Maybe Later',

    // 新建派对页面
    'newParty.title': 'Plan a New Party',
    'newParty.subtitle': 'Fill in the details for your child\'s party',
    'newParty.selectChild': 'Select Child',
    'newParty.chooseChild': 'Choose a child...',
    'newParty.addNewChild': '+ Add New Child',
    'newParty.enterManually': 'Enter child details manually',
    'newParty.selectExisting': '← Select from existing children instead',
    'newParty.celebratingAge': 'Celebrating which birthday?',
    'newParty.agePlaceholder': 'e.g., 5',
    'newParty.ageHelp': 'If left blank, it will be calculated from birth date. Fill this if the party is held before the actual birthday.',
    'newParty.childName': 'Child\'s Name',
    'newParty.age': 'Age',
    'newParty.date': 'Date',
    'newParty.time': 'Time',
    'newParty.location': 'Location',
    'newParty.locationPlaceholder': 'e.g., 123 Main St, City Park, Community Center',
    'newParty.theme': 'Party Theme',
    'newParty.themePlaceholder': 'e.g., Dinosaurs, Princess, Superhero',
    'newParty.notes': 'Additional Notes',
    'newParty.notesPlaceholder': 'Any special instructions, gift preferences, or important details...',
    'newParty.cancel': 'Cancel',
    'newParty.creating': 'Creating...',
    'newParty.createParty': 'Create Party',
    'newParty.selectChildRequired': 'Please select a child',

    // 登录页面
    'login.title': 'Sign In',
    'login.subtitle': 'Sign in to manage your parties',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.showPassword': 'Show password',
    'login.hidePassword': 'Hide password',
    'login.signInWithGoogle': 'Sign in with Google',
    'login.signIn': 'Sign in',
    'login.signingIn': 'Signing in...',
    'login.signUpLink': 'Sign up',
    'login.noAccount': 'Don\'t have an account?',
    'login.orContinueWith': 'Or continue with email',

    // 注册页面
    'register.title': 'Create Account',
    'register.subtitle': 'Create your account',
    'register.email': 'Email',
    'register.password': 'Password',
    'register.showPassword': 'Show password',
    'register.hidePassword': 'Hide password',
    'register.signUpWithGoogle': 'Sign up with Google',
    'register.signUp': 'Create account',
    'register.creatingAccount': 'Creating account...',
    'register.signInLink': 'Sign in',
    'register.haveAccount': 'Already have an account?',
    'register.passwordRequirements': 'Password must contain:',
    'register.atLeast8Chars': 'At least 8 characters',
    'register.oneUppercase': 'One uppercase letter',
    'register.oneLowercase': 'One lowercase letter',
    'register.oneNumber': 'One number',
    'register.googleSignUpFailed': 'Google sign-up failed. Please try again.',

    // 儿童管理页面
    'children.title': 'My Children',
    'children.subtitle': 'Manage your children\'s information for easy party planning',
    'children.addChild': '+ Add Child',
    'children.noChildren': 'No children yet',
    'children.noChildrenDesc': 'Add your children\'s information to quickly create party invitations',
    'children.name': 'Name',
    'children.birthDate': 'Birth Date',
    'children.age': 'Age',
    'children.allergies': 'Allergies',
    'children.notes': 'Notes',
    'children.save': 'Save',
    'children.cancel': 'Cancel',
    'children.edit': 'Edit',
    'children.delete': 'Delete',
    'children.saving': 'Saving...',
    'children.years': 'years old',
    'children.createParty': 'Create Party',
    'children.born': 'Born:',
    'children.allergiesLabel': 'Allergies:',
    'children.notesLabel': 'Notes:',

    // 错误和提示
    'error.title': 'Error',
    'error.tryAgain': 'Try Again',
    'error.trySolutions': 'Try these solutions:',
    'error.refreshPage': 'Refresh the page',
    'error.networkError': 'Network connection error',
    'error.validationError': 'Form validation error',
    'error.authError': 'Authentication error',
    'error.loadingError': 'Loading failed',

    // RSVP Page
    'rsvp.title': "You're Invited! 🎉",
    'rsvp.invitationNotFound': 'Invitation not found',
    'rsvp.invitationNotFoundDesc': 'This invitation link is invalid or has expired.',
    'rsvp.submittedTitle': 'RSVP Submitted!',
    'rsvp.submittedDesc': "Thank you for your response. We're looking forward to celebrating with you!",
    'rsvp.goGuestPage': 'Go to Party Page',
    'rsvp.when': 'When:',
    'rsvp.where': 'Where:',
    'rsvp.specialNotes': 'Special Notes:',
    'rsvp.createAccountTitle': 'Create Account to RSVP',
    'rsvp.createAccountDesc': 'We need to create a quick account so you can manage your RSVP and receive updates about the party.',
    'rsvp.haveAccount': 'Do you already have an account with us?',
    'rsvp.createAccountBtn': 'Create New Account',
    'rsvp.signInBtn': 'Sign In',
    'rsvp.emailLabel': 'Email Address *',
    'rsvp.passwordLabel': 'Password *',
    'rsvp.creatingAccount': 'Creating Account...',
    'rsvp.createAndContinue': 'Create Account & Continue',
    'rsvp.backToOptions': '← Back to options',
    'rsvp.pleaseRSVP': 'Please RSVP',
    'rsvp.parentNameLabel': 'Parent/Guardian Name *',
    'rsvp.childSelectLabel': 'Select Child *',
    'rsvp.childNameLabel': "Child's Name *",
    'rsvp.phoneLabel': 'Phone Number',
    'rsvp.phonePlaceholder': 'Optional - for party updates',
    'rsvp.attendingLabel': 'Will you be attending? *',
    'rsvp.yes': 'Yes! 🎉',
    'rsvp.no': "Sorry, can't make it 😢",
    'rsvp.maybe': 'Maybe 🤔',
    'rsvp.numChildrenLabel': 'Number of children attending *',
    'rsvp.parentStayingLabel': 'Will a parent/guardian stay?',
    'rsvp.parentStayingYes': 'Yes',
    'rsvp.parentStayingNo': 'No (drop-off)',
    'rsvp.allergiesLabel': 'Food allergies or dietary restrictions',
    'rsvp.allergiesPlaceholder': 'Please list any allergies or dietary needs',
    'rsvp.autoFilled': "✓ Auto-filled from {name}'s profile",
    'rsvp.submitting': 'Submitting...',
    'rsvp.submitBtn': 'Submit RSVP',

    // My Invitations Page
    'invitations.title': 'My Invitations',
    'invitations.subtitle': "Manage invitations you've received to children's parties",
    'invitations.upcoming': 'Upcoming Parties ({count})',
    'invitations.noUpcoming': 'No Upcoming Invitations',
    'invitations.noUpcomingDesc': "When friends invite you to their parties, they'll appear here",
    'invitations.host': 'Host:',
    'invitations.lastUpdated': 'Last updated:',
    'invitations.updateRSVP': 'Update RSVP',
    'invitations.rsvpNow': 'RSVP Now',
    'invitations.past': 'Past Parties ({count})',
    'invitations.status.attending': 'Attending',
    'invitations.status.notAttending': 'Not Attending',
    'invitations.status.maybe': 'Maybe',
    'invitations.status.noResponse': 'No Response',

    // Manage Party Page
    'manage.overview': 'Overview',
    'manage.guests': 'Guests',
    'manage.invitation': 'Invitation',
    'manage.photos': 'Photos',
    'manage.totalInvited': 'Total Invited',
    'manage.attending': 'Attending',
    'manage.responseRate': 'Response Rate',
    'manage.quickActions': 'Quick Actions',
    'manage.copyLink': 'Copy RSVP Link',
    'manage.linkCopied': 'RSVP link copied to clipboard!',
    'manage.exportList': 'Export Guest List',
    'manage.editParty': 'Edit Party Details',
    'manage.backToDashboard': 'Back to Dashboard',
    'manage.addGuests': 'Add Guests',
    'manage.addGuestsDesc': 'Select friends from previous parties to invite.',
    'manage.guestList': 'Guest List & RSVPs',
    'manage.noRsvps': 'No RSVPs yet. Share your invitation to get started!',
    'manage.guest': 'Guest',
    'manage.contact': 'Contact',
    'manage.status': 'Status',
    'manage.details': 'Details',
    'manage.premiumPurchased': 'Premium Template Purchased',
    'manage.currentInvitation': 'Current Invitation',
    'manage.generating': 'Generating invitation...',
    'manage.child': '{count} child{s}',
    'manage.staying': 'Parent staying',
    'manage.dropOff': 'Parent not staying',

    // InviteGuests Component
    'invite.loading': 'Loading contacts...',
    'invite.noContacts': "You don't have any contacts yet.",
    'invite.noContactsDesc': 'Contacts are automatically added when people RSVP to your parties.',
    'invite.name': 'Name',
    'invite.email': 'Email',
    'invite.child': 'Child: {name}',
    'invite.selected': '{count} selected',
    'invite.send': 'Send Invitations',
    'invite.sending': 'Sending...',
    'invite.success': 'Successfully sent {count} invitations!',
    'invite.error': 'Failed to send invitations. Please try again.',
    'invite.sendError': 'An error occurred while sending invitations.',
  }
}

export function LanguageProvider({
  children,
  locale
}: {
  children: ReactNode
  locale: Locale
}) {
  const normalizedLocale = (locale as string).startsWith('zh') ? 'zh' : 'en' as Locale

  const t = (key: string, params?: Record<string, any>) => {
    // 规范化 locale，处理 zh-CN 等情况
    // const normalizedLocale = (locale as string).startsWith('zh') ? 'zh' : 'en' as Locale
    // Use the outer normalizedLocale variable

    // Fallback to English if translation is missing for the key
    const localeTranslations = (translations as any)[normalizedLocale] || translations.en
    let translation = localeTranslations[key] || key

    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        // 使用全局替换，处理同一个变量多次出现的情况
        const regex = new RegExp(`{${param}}`, 'g')
        translation = translation.replace(regex, `${value}`)
      })
    }

    return translation
  }

  return (
    <LanguageContext.Provider value={{ locale: normalizedLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// 导出一个简单的useLocale hook用于兼容
export function useLocale() {
  const { locale } = useLanguage()
  return locale
}

export function useTranslations(namespace: string) {
  const { t } = useLanguage()
  return (key: string) => t(`${namespace}.${key}`)
}