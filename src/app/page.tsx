import { redirect } from 'next/navigation'

export default function RootPage() {
  // 重定向到中文版本（默认语言）
  redirect('/zh')
}