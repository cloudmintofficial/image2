'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import OrderForm from '../../components/OrderForm';
import { Loader2 } from 'lucide-react';

export default function EditOrderPage() {
  const params = useParams();
  const id = params.id;
  const [testData, setTestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/tests/${id}`);
        if (res.ok) {
          const data = await res.json();
          setTestData(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <div style={{ height: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6f8' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={40} style={{ color: '#e25838', margin: '0 auto 16px' }} />
          <p style={{ color: '#697386', fontWeight: 500 }}>Loading order details...</p>
        </div>
      </div>
    );
  }

  return <OrderForm initialData={testData} isEdit={true} />;
}
