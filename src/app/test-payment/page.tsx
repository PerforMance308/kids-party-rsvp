'use client'

import { useState, useEffect } from 'react'
import { initializeStripe, createPaymentIntent, defaultPaymentConfig } from '@/lib/stripe'
import { Stripe, StripeElements } from '@stripe/stripe-js'
import type { StripeElementsOptions } from '@stripe/stripe-js'

export default function TestPaymentPage() {
  const [step, setStep] = useState(1)
  const [logs, setLogs] = useState<string[]>([])
  const [stripe, setStripe] = useState<Stripe | null>(null)
  const [elements, setElements] = useState<StripeElements | null>(null)
  const [clientSecret, setClientSecret] = useState('')
  const [paymentIntent, setPaymentIntent] = useState<any>(null)

  const addLog = (message: string) => {
    console.log(message)
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // Step 1: Initialize Stripe
  const handleInitialize = async () => {
    try {
      addLog('🔄 正在初始化 Stripe SDK...')
      addLog(`🔑 使用 Publishable Key: ${defaultPaymentConfig.publishableKey.substring(0, 20)}...`)
      addLog(`📏 Key 长度: ${defaultPaymentConfig.publishableKey.length}`)

      const stripeInstance = await initializeStripe(defaultPaymentConfig)
      setStripe(stripeInstance)
      addLog('✅ Stripe SDK 初始化成功')
      setStep(2)
    } catch (error) {
      if (error instanceof Error) {
        addLog(`❌ 初始化失败: ${error.message}`)
        console.error('Complete error:', error)
      } else {
        addLog(`❌ 初始化失败: ${String(error)}`)
      }

      // Check if it's a network issue
      addLog('💡 提示: 请检查:')
      addLog('  1. 网络连接是否正常')
      addLog('  2. .env 文件中的 NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 是否正确')
    }
  }

  // Step 2: Create Payment Intent
  const handleCreateIntent = async () => {
    try {
      addLog('🔄 正在创建支付意图...')
      const intent = await createPaymentIntent({
        amount: 2.99,
        currency: 'USD',
        description: '测试支付',
        metadata: { test: 'true' }
      })

      setPaymentIntent(intent)
      setClientSecret(intent.client_secret)
      addLog('✅ 支付意图创建成功')
      addLog(`📄 Payment ID: ${intent.id}`)
      addLog(`💰 Amount: $${intent.amount}`)
      addLog(`🔑 Client Secret: ${intent.client_secret.substring(0, 30)}...`)
      setStep(3)
    } catch (error: any) {
      addLog(`❌ 创建支付意图失败: ${error.message || error}`)

      // Display detailed error information if available
      if (error.details) {
        addLog(`📝 详细信息: ${error.details}`)
      }
      if (error.code) {
        addLog(`🔢 错误代码: ${error.code}`)
      }
      if (error.statusCode) {
        addLog(`📊 HTTP 状态码: ${error.statusCode}`)
      }
      if (error.stripeError) {
        addLog(`🔍 Stripe 错误: ${JSON.stringify(error.stripeError, null, 2)}`)
      }

      addLog('💡 提示: 请检查服务器控制台日志获取更多信息')
      console.error('Payment intent creation error:', error)
    }
  }

  // Step 3: Setup Elements
  const handleSetupElements = async () => {
    if (!stripe || !clientSecret) {
      addLog('❌ 缺少必要的数据')
      return
    }

    try {
      addLog('🔄 正在设置支付元素...')

      const elementsOptions: StripeElementsOptions = {
        clientSecret: clientSecret,
        appearance: defaultPaymentConfig.appearance,
      }

      const elementsInstance = stripe.elements(elementsOptions)
      setElements(elementsInstance)
      addLog('✅ Elements 实例创建成功')

      // Mount payment element
      addLog('🔄 正在挂载支付表单...')
      const paymentElement = elementsInstance.create('payment', {
        layout: 'tabs',
        paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
        wallets: {
          applePay: 'auto',
          googlePay: 'auto',
        },
      })

      // Check if element exists
      const container = document.getElementById('payment-element-test')
      if (!container) {
        addLog('❌ 找不到支付元素容器 #payment-element-test')
        return
      }

      paymentElement.mount('#payment-element-test')
      addLog('✅ 支付表单挂载成功')
      addLog('📋 现在你应该能看到卡号输入框了')

      setStep(4)
    } catch (error) {
      addLog(`❌ 设置支付元素失败: ${error}`)
      console.error('Setup error details:', error)
    }
  }

  // Step 4: Confirm Payment
  const handleConfirmPayment = async () => {
    if (!stripe || !elements) {
      addLog('❌ 支付系统未准备好')
      return
    }

    try {
      addLog('🔄 正在确认支付...')
      addLog('⏰ 请填写卡号信息后再点击确认')
      addLog('💳 测试卡号: 4242 4242 4242 4242')

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required',
      })

      addLog(`📊 确认支付结果: ${JSON.stringify(result, null, 2)}`)

      if (result.error) {
        addLog(`❌ 支付失败: ${result.error.message}`)
      } else if (result.paymentIntent) {
        addLog(`✅ 支付成功!`)
        addLog(`📄 Payment Intent ID: ${result.paymentIntent.id}`)
        addLog(`📊 Status: ${result.paymentIntent.status}`)
        setStep(5)
      }
    } catch (error) {
      addLog(`❌ 确认支付失败: ${error}`)
      console.error('Confirm error details:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🧪 支付流程测试 (Stripe)
          </h1>

          <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>当前步骤:</strong> {step} / 5
            </p>
            <p className="text-sm text-blue-700 mt-1">
              {step === 1 && '初始化 Stripe SDK'}
              {step === 2 && '创建支付意图'}
              {step === 3 && '设置支付元素'}
              {step === 4 && '填写卡号并确认支付'}
              {step === 5 && '支付完成'}
            </p>
          </div>

          {/* Step Buttons */}
          <div className="space-y-3 mb-8">
            <button
              onClick={handleInitialize}
              disabled={step !== 1}
              className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              步骤 1: 初始化 Stripe
            </button>

            <button
              onClick={handleCreateIntent}
              disabled={step !== 2}
              className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              步骤 2: 创建支付意图 ($2.99)
            </button>

            <button
              onClick={handleSetupElements}
              disabled={step !== 3}
              className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              步骤 3: 加载支付表单
            </button>

            <button
              onClick={handleConfirmPayment}
              disabled={step !== 4}
              className="w-full btn btn-success disabled:opacity-50 disabled:cursor-not-allowed"
            >
              步骤 4: 确认支付
            </button>
          </div>

          {/* Payment Element Container */}
          {step >= 3 && (
            <div className="mb-8 p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <h3 className="text-lg font-semibold mb-4">支付表单区域</h3>
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ 重要:</strong> 在点击"步骤 4"之前，请在下方输入测试卡号信息
                </p>
                <p className="text-sm text-yellow-700 mt-2">
                  测试卡号: <code className="bg-yellow-100 px-2 py-1 rounded">4242 4242 4242 4242</code>
                </p>
                <p className="text-sm text-yellow-700">
                  日期: <code className="bg-yellow-100 px-2 py-1 rounded">12/25</code>,
                  CVV: <code className="bg-yellow-100 px-2 py-1 rounded">123</code>
                </p>
              </div>

              {/* Stripe Payment Element will be mounted here */}
              <div id="payment-element-test" className="min-h-[200px]"></div>

              {step === 3 && (
                <p className="text-sm text-gray-500 mt-4">
                  ℹ️ 如果上方没有显示表单，请检查浏览器控制台的错误信息
                </p>
              )}
            </div>
          )}

          {/* Logs */}
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            <div className="mb-2 text-gray-400">📋 操作日志:</div>
            {logs.length === 0 ? (
              <div className="text-gray-500">等待操作...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>

          {/* Debug Info */}
          {paymentIntent && (
            <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="text-sm font-semibold text-purple-900 mb-2">
                🔍 Payment Intent 信息:
              </h3>
              <pre className="text-xs text-purple-800 overflow-x-auto">
                {JSON.stringify(paymentIntent, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
