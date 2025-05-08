'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PhoneCaseEditor from '@/components/case-editor';



function EditorPage() {
  const searchParams = useSearchParams();
  
  const allowedTypes = ['Transparent', 'Colored'] as const;
  const typeParam = searchParams.get('type');
  const type = allowedTypes.includes(typeParam as any) ? typeParam : 'transparent';

  const color = searchParams.get('color') || '#ffffff';
  const phoneModel = searchParams.get('phoneModel') || 'Iphone 12 Pro Max';
  const modelIndex = searchParams.get('modelIndex') || '0';

  return (
    <main className="flex flex-col w-full min-h-screen">
      
    </main>
  );
}

export default EditorPage;