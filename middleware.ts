import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Chỉ bắt những thằng nào gọi POST
  const contentType = request.headers.get('content-type') || ''
  
  // BẮT QUẢ TANG: Nếu chuỗi boundary trùng khớp với kẻ spam
  if (contentType.includes('WebKitFormBoundaryx8jO2oVc6SWP3Sad')) {
    console.log('🚫 Đã chặn Bot Spam từ Milvus Service')
    // Trả về lỗi 403 (Cấm) ngay lập tức
    return new NextResponse(JSON.stringify({ message: 'Bot detected' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  if (request.method === 'POST') {
    console.log('\n=================================================')
    console.log('🚨 PHÁT HIỆN REQUEST POST LẠ:')
    console.log('📍 URL:', request.url)
    console.log('👤 Kẻ gọi (User-Agent):', request.headers.get('user-agent'))
    console.log('📦 Content-Type:', request.headers.get('content-type'))
    console.log('🔗 Referer (Nguồn):', request.headers.get('referer'))
    console.log('=================================================\n')
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/:path*', // Áp dụng cho mọi đường dẫn
}