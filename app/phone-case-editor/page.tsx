'use client';

import { useSearchParams } from 'next/navigation';
import PhoneCaseEditor from '@/components/case-editor';

function EditorPage() {
  const searchParams = useSearchParams();
  
  const type = searchParams.get('type') || 'transparent';
  const color = searchParams.get('color') || '#ffffff';
  const phoneModel = searchParams.get('phoneModel') || 'Iphone 12 Pro Max';

  return (
    <main className="flex flex-col w-full min-h-screen">
      <PhoneCaseEditor
        type={type}
        color={color}
        phoneModel={phoneModel}
      />
    </main>
  );
}

export default EditorPage;