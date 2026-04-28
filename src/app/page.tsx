'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const user = localStorage.getItem('medfile-user');
    if (user) {
      router.replace('/order-entry');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div className="skeleton" style={{ width: 200, height: 40 }} />
    </div>
  );
}
