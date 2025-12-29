// 邮件测试工具
// 使用方法：node test-email.js your-email@gmail.com

const { sendEmail } = require('./src/lib/email.ts')

async function testEmail() {
  const testEmail = process.argv[2] || 'test@example.com'
  
  console.log(`Testing email to: ${testEmail}`)
  
  try {
    await sendEmail({
      to: testEmail,
      subject: 'KidParty RSVP - 测试邮件',
      text: `你好！

这是来自KidParty RSVP系统的测试邮件。

如果你收到这封邮件，说明邮件系统工作正常！

Party Details:
🎂 小明的5岁生日派对
📅 2025年1月15日，下午2:00
📍 我们家后院

期待与你一起庆祝！

KidParty RSVP Team`
    })
    
    console.log('✅ Email test completed!')
  } catch (error) {
    console.error('❌ Email test failed:', error)
  }
}

testEmail()