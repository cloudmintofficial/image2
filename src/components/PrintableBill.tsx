import React from 'react';

interface PrintableBillProps {
  bill: any; // We'll pass the full bill object including patient and orders
}

export const PrintableBill = React.forwardRef<HTMLDivElement, PrintableBillProps>(
  ({ bill }, ref) => {
    if (!bill) return null;

    return (
      <div ref={ref} style={{ padding: '40px', fontFamily: 'Arial, sans-serif', color: '#000', backgroundColor: '#fff', width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #ea580c', paddingBottom: '20px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ color: '#ea580c', margin: 0, fontSize: '28px', fontWeight: 800 }}>MEDFILE LABS</h1>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#555' }}>
              123 Health Ave, Hyderabad, Telangana<br />
              Phone: +91 99999 99999<br />
              Email: info@medfilelabs.com
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, fontSize: '24px', color: '#333' }}>TAX INVOICE</h2>
            <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 600 }}>Bill No: {bill.billNo || bill.billNumber}</p>
            <p style={{ margin: '4px 0 0', fontSize: '14px' }}>Date: {bill.date || new Date(bill.billDate).toLocaleDateString('en-GB')}</p>
          </div>
        </div>

        {/* Patient Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 8px', color: '#666', fontSize: '12px', textTransform: 'uppercase' }}>Patient Details</h4>
            <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600 }}>{bill.patient?.name || bill.patient}</p>
            <p style={{ margin: '0 0 4px', fontSize: '14px' }}>Age/Sex: {bill.patient?.age || bill.age} / {bill.patient?.gender || bill.gender}</p>
            <p style={{ margin: '0 0 4px', fontSize: '14px' }}>Phone: {bill.patient?.phone || bill.phone}</p>
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <h4 style={{ margin: '0 0 8px', color: '#666', fontSize: '12px', textTransform: 'uppercase' }}>Referred By</h4>
            <p style={{ margin: '0', fontSize: '14px', fontWeight: 600 }}>{bill.doctor?.name || 'Self'}</p>
          </div>
        </div>

        {/* Orders Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '13px', textTransform: 'uppercase' }}>S.No</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '13px', textTransform: 'uppercase' }}>Test Name</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', borderBottom: '1px solid #ddd', fontSize: '13px', textTransform: 'uppercase' }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {(bill.rawOrders || bill.orders || []).map((order: any, idx: number) => (
              <tr key={order.id || idx}>
                <td style={{ padding: '12px 8px', borderBottom: '1px solid #eee', fontSize: '14px' }}>{idx + 1}</td>
                <td style={{ padding: '12px 8px', borderBottom: '1px solid #eee', fontSize: '14px' }}>{order.orderName || order.name || order}</td>
                <td style={{ padding: '12px 8px', borderBottom: '1px solid #eee', fontSize: '14px', textAlign: 'right' }}>{(order.amount || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
          <div style={{ width: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
              <span style={{ fontSize: '14px' }}>Total Amount:</span>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>₹{(bill.totalBill || bill.balance || 0).toFixed(2)}</span>
            </div>
            {(bill.discount > 0) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                <span style={{ fontSize: '14px' }}>Discount:</span>
                <span style={{ fontSize: '14px', color: '#ea580c' }}>-₹{bill.discount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '2px solid #000' }}>
              <span style={{ fontSize: '16px', fontWeight: 800 }}>Net Payable:</span>
              <span style={{ fontSize: '16px', fontWeight: 800 }}>₹{(bill.balance || bill.totalBill || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>
            * This is a computer generated invoice.<br />
            * Subject to Hyderabad jurisdiction.
          </div>
          <div style={{ textAlign: 'center', width: '200px' }}>
            <div style={{ borderBottom: '1px solid #000', marginBottom: '8px', height: '40px' }}></div>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Authorized Signatory</span>
          </div>
        </div>
      </div>
    );
  }
);

PrintableBill.displayName = 'PrintableBill';
