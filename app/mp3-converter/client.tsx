'use client';

import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export default function ConverterClient() {
  const [file, setFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState('mp3');
  const [quality, setQuality] = useState(192);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [ffmpeg] = useState(() => new FFmpeg());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const audioFormats = [
    { value: 'mp3', label: 'MP3', desc: '最通用，文件小' },
    { value: 'wav', label: 'WAV', desc: '无损音质' },
    { value: 'flac', label: 'FLAC', desc: '无损压缩' },
    { value: 'ogg', label: 'OGG', desc: '开源格式' },
  ];

  const qualities = [
    { value: 128, label: '128 kbps', desc: '标准质量' },
    { value: 192, label: '192 kbps', desc: '高质量' },
    { value: 256, label: '256 kbps', desc: '极高质量' },
    { value: 320, label: '320 kbps', desc: '最高质量' },
  ];

  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        setLoaded(true);
      } catch (err) {
        console.error('Failed to load FFmpeg:', err);
        setError('加载转换器失败，请刷新页面重试');
      }
    };

    loadFFmpeg();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('audio/')) {
      setError('请选择音频文件');
      return;
    }
    setFile(selectedFile);
    setOutputUrl(null);
    setError('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const convertAudio = async () => {
    if (!file || !loaded) return;

    setConverting(true);
    setProgress(0);
    setError('');

    try {
      const inputName = `input${getFileExtension(file.name)}`;
      const outputName = `output.${outputFormat}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Build ffmpeg command based on output format
      let command = ['-i', inputName];

      if (outputFormat === 'mp3') {
        command.push('-b:a', `${quality}k`);
      } else if (outputFormat === 'wav') {
        command.push('-c:a', 'pcm_s16le');
      } else if (outputFormat === 'flac') {
        command.push('-c:a', 'flac');
      } else if (outputFormat === 'ogg') {
        command.push('-c:a', 'libvorbis', '-b:a', `${quality}k`);
      }

      command.push(outputName);

      // Setup progress logging
      ffmpeg.on('progress', ({ progress }) => {
        setProgress(Math.round(progress * 100));
      });

      await ffmpeg.exec(command);

      const data = await ffmpeg.readFile(outputName);
      // @ts-ignore - FFmpeg returns Uint8Array but TypeScript has issues with the type
      const blob = new Blob([data], { type: `audio/${outputFormat}` });
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);
      setProgress(100);
    } catch (err) {
      console.error('Conversion error:', err);
      setError('转换失败，请重试');
    } finally {
      setConverting(false);
      ffmpeg.on('progress', () => {});
    }
  };

  const downloadOutput = () => {
    if (!outputUrl || !file) return;
    const a = document.createElement('a');
    a.href = outputUrl;
    const inputName = file.name.replace(/\.[^.]+$/, '');
    a.download = `${inputName}.${outputFormat}`;
    a.click();
  };

  const getFileExtension = (filename: string) => {
    const ext = filename.split('.').pop();
    return ext ? `.${ext}` : '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', color: 'white', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5em', fontWeight: 800, margin: '0 0 10px 0' }}>
            免费MP3转换器
          </h1>
          <p style={{ fontSize: '1.1em', opacity: 0.9 }}>
            在线音频格式转换 | 无需上传 | 保护隐私
          </p>
          {!loaded && (
            <div style={{
              marginTop: '16px',
              padding: '12px 20px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '10px',
              display: 'inline-block',
              fontSize: '14px'
            }}>
              正在加载转换器...
            </div>
          )}
        </div>

        {/* Tool Card */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed #d1d5db',
              borderRadius: '16px',
              padding: '48px 24px',
              textAlign: 'center',
              cursor: loaded ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              background: file ? '#f0fdf4' : '#fafafa'
            }}
            onMouseEnter={(e) => {
              if (loaded) e.currentTarget.style.borderColor = '#667eea';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) handleFileSelect(selectedFile);
              }}
            />
            {file ? (
              <div>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎵</div>
                <div style={{ fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  {formatFileSize(file.size)}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📁</div>
                <div style={{ fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                  拖拽音频文件到这里
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  或点击选择文件
                </div>
                <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '8px' }}>
                  支持 MP3, WAV, FLAC, OGG, M4A 等格式
                </div>
              </div>
            )}
          </div>

          {/* Format Selection */}
          {file && (
            <div style={{ marginTop: '24px' }}>
              <label style={{
                display: 'block',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '12px',
                fontSize: '14px'
              }}>
                选择输出格式：
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px'
              }}>
                {audioFormats.map((format) => (
                  <button
                    key={format.value}
                    onClick={() => setOutputFormat(format.value)}
                    disabled={!loaded || converting}
                    style={{
                      padding: '16px 12px',
                      border: '2px solid',
                      borderColor: outputFormat === format.value ? '#667eea' : '#e5e7eb',
                      borderRadius: '12px',
                      background: outputFormat === format.value ? '#f5f3ff' : 'white',
                      cursor: loaded && !converting ? 'pointer' : 'not-allowed',
                      opacity: loaded && !converting ? 1 : 0.6,
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                      {format.label}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {format.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quality Selection for MP3/OGG */}
          {file && (outputFormat === 'mp3' || outputFormat === 'ogg') && (
            <div style={{ marginTop: '24px' }}>
              <label style={{
                display: 'block',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '12px',
                fontSize: '14px'
              }}>
                选择比特率：
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px'
              }}>
                {qualities.map((q) => (
                  <button
                    key={q.value}
                    onClick={() => setQuality(q.value)}
                    disabled={!loaded || converting}
                    style={{
                      padding: '12px',
                      border: '2px solid',
                      borderColor: quality === q.value ? '#667eea' : '#e5e7eb',
                      borderRadius: '10px',
                      background: quality === q.value ? '#f5f3ff' : 'white',
                      cursor: loaded && !converting ? 'pointer' : 'not-allowed',
                      opacity: loaded && !converting ? 1 : 0.6
                    }}
                  >
                    <div style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>
                      {q.label}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                      {q.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Convert Button */}
          {file && (
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <button
                onClick={convertAudio}
                disabled={!loaded || converting}
                style={{
                  padding: '16px 48px',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: loaded && !converting ? 'pointer' : 'not-allowed',
                  background: loaded && !converting
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : '#d1d5db',
                  color: 'white',
                  boxShadow: loaded && !converting ? '0 4px 15px rgba(102, 126, 234, 0.4)' : 'none',
                  opacity: loaded && !converting ? 1 : 0.6
                }}
              >
                {converting ? `转换中... ${progress}%` : '开始转换'}
              </button>
            </div>
          )}

          {/* Progress Bar */}
          {converting && (
            <div style={{ marginTop: '20px' }}>
              <div style={{
                width: '100%',
                height: '8px',
                background: '#e5e7eb',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  transition: 'width 0.3s'
                }} />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: '#fee2e2',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Output */}
          {outputUrl && !converting && (
            <div style={{
              marginTop: '24px',
              padding: '24px',
              background: '#f0fdf4',
              border: '2px solid #22c55e',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
              <div style={{ fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                转换完成！
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                点击下方按钮下载您的文件
              </div>
              <button
                onClick={downloadOutput}
                style={{
                  padding: '14px 32px',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)'
                }}
              >
                ⬇️ 下载 {outputFormat.toUpperCase()} 文件
              </button>
            </div>
          )}

          {/* Features */}
          <div style={{
            marginTop: '40px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            {[
              { icon: '🔒', title: '隐私安全', desc: '本地转换，文件不上传服务器' },
              { icon: '⚡', title: '快速转换', desc: '浏览器直接处理，无需等待' },
              { icon: '🆓', title: '完全免费', desc: '无限制使用，无需注册' },
              { icon: '🎯', title: '多种格式', desc: '支持MP3、WAV、FLAC、OGG互转' }
            ].map((feature, i) => (
              <div key={i} style={{
                background: '#f9fafb',
                padding: '20px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{feature.icon}</div>
                <div style={{ fontWeight: '700', color: '#111827', marginBottom: '6px', fontSize: '14px' }}>
                  {feature.title}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                  {feature.desc}
                </div>
              </div>
            ))}
          </div>

          {/* SEO Content */}
          <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
              免费MP3转换器 - 在线音频格式转换指南
            </h2>
            <div style={{ fontSize: '15px', lineHeight: '1.8', color: '#374151' }}>
              <p style={{ marginBottom: '12px' }}>
                寻找免费MP3转换器？你找对地方了。我们的在线音频转换工具支持MP3、WAV、FLAC、OGG等多种格式互转，完全免费，无需注册。
              </p>

              <h3 style={{ fontSize: '16px', fontWeight: '600', marginTop: '20px', marginBottom: '8px', color: '#111827' }}>
                为什么选择我们的MP3转换器？
              </h3>
              <ul style={{ marginBottom: '16px', paddingLeft: '20px' }}>
                <li><strong>隐私保护：</strong>所有转换都在你的浏览器中完成，文件不会上传到任何服务器</li>
                <li><strong>高质量输出：</strong>支持128kbps到320kbps比特率选择，满足不同需求</li>
                <li><strong>多种格式：</strong>支持MP3、WAV、FLAC、OGG等主流音频格式</li>
                <li><strong>完全免费：</strong>无限制使用，无需付费，无需注册账户</li>
              </ul>

              <h3 style={{ fontSize: '16px', fontWeight: '600', marginTop: '20px', marginBottom: '8px', color: '#111827' }}>
                支持的音频格式
              </h3>
              <ul style={{ marginBottom: '16px', paddingLeft: '20px' }}>
                <li><strong>MP3：</strong>最通用的音频格式，兼容所有设备，文件体积小</li>
                <li><strong>WAV：</strong>无损音质，适合专业音频制作</li>
                <li><strong>FLAC：</strong>无损压缩格式，保留原始音质的同时减小文件大小</li>
                <li><strong>OGG：</strong>开源音频格式，音质与MP3相当但文件更小</li>
              </ul>

              <h3 style={{ fontSize: '16px', fontWeight: '600', marginTop: '20px', marginBottom: '8px', color: '#111827' }}>
                如何使用？
              </h3>
              <ol style={{ marginBottom: '16px', paddingLeft: '20px' }}>
                <li>拖拽或点击上传你的音频文件</li>
                <li>选择你想要的输出格式</li>
                <li>（可选）选择比特率（适用于MP3和OGG格式）</li>
                <li>点击"开始转换"按钮</li>
                <li>转换完成后下载你的文件</li>
              </ol>

              <div style={{
                marginTop: '24px',
                padding: '16px',
                background: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '10px',
                fontSize: '14px',
                color: '#92400e'
              }}>
                💡 <strong>提示：</strong>首次使用时需要下载转换组件（约20MB），之后的转换会非常快速。
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '40px',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.8)',
          fontSize: '14px'
        }}>
          <p>© 2024 免费MP3转换器 - 在线音频格式转换工具</p>
          <p style={{ marginTop: '8px', fontSize: '13px' }}>
            <a href="/" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
              返回首页
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
