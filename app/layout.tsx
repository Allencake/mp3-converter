import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '免费MP3转换器 | 在线音频格式转换工具',
  description: '免费在线MP3转换器，支持MP3、WAV、FLAC、OGG等音频格式互转。无需安装，浏览器本地转换，保护隐私安全。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
