import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '免费MP3转换器 | 在线音频格式转换工具',
  description: '免费在线MP3转换器，支持MP3、WAV、FLAC、OGG等音频格式互转。无需安装，浏览器本地转换，保护隐私安全。',
  keywords: 'mp3 converter, 音频转换, 免费转换器, wav to mp3, flac to mp3, 音频格式转换',
};

export default function Mp3ConverterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
