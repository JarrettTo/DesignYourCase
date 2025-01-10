'use client';

import { useSearchParams } from 'next/navigation';
import PhoneCaseEditor from '@/components/case-editor';



function EditorPage() {
  const searchParams = useSearchParams();
  
  const allowedTypes = ['Transparent', 'Colored'] as const;
  const typeParam = searchParams.get('type');
  const type = allowedTypes.includes(typeParam as any) ? typeParam : 'transparent';

  const color = searchParams.get('color') || '#ffffff';
  const phoneModel = searchParams.get('phoneModel') || 'Iphone 12 Pro Max';

  return (
    <main className="flex flex-col w-full min-h-screen">
      <PhoneCaseEditor
        type={type as 'Transparent' | 'Colored'}
        color={color}
        phoneModel={phoneModel} caseType={''} caseSecondType={''}      />
    </main>
  );
}

export default EditorPage;