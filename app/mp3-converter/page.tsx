'use client';

import dynamic from 'next/dynamic';

const ConverterClient = dynamic(() => import('./client'), {
  ssr: false,
  loading: () => (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '20px'
    }}>
      正在加载转换器...
    </div>
  ),
});

export default function Mp3ConverterPage() {
  return <ConverterClient />;
}
