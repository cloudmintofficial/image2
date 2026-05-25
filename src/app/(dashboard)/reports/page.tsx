'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Calendar, MapPin, CreditCard, Users, FileText, X, Check, Search, 
  Tag, AlertTriangle, RefreshCw, Printer, Download, Percent, FilePieChart
} from 'lucide-react';

const reportTypes = [
  'Bill Reports', 'Collection Reports', 'Shift Collection', 'Doctor Reports',
  'Order Smry Report', 'OP Smry Report', 'Card Reports', 'Inventory Reports', 'Doctor Wise Smry'
];

interface Location {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
  displayName: string;
}

function ReportsPageContent() {
  const searchParams = useSearchParams();
  const active = searchParams.get('tab') || 'Bill Reports';
  
  // Form States
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [locationId, setLocationId] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [userId, setUserId] = useState('');
  const [orderType, setOrderType] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  
  // Checkbox States
  const [allOrderTypes, setAllOrderTypes] = useState(true);
  const [includeCancelled, setIncludeCancelled] = useState(false);

  // Dropdown Lists
  const [locations, setLocations] = useState<Location[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Inline Report Rendering States
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [printWithoutTotals, setPrintWithoutTotals] = useState(false);

  // Set default dates to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFromDate(today);
    setToDate(today);
  }, []);

  // Reset active inline report when switching tabs
  useEffect(() => {
    setActiveReport(null);
  }, [active]);

  // Fetch locations and users on mount
  useEffect(() => {
    fetch('/api/locations')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLocations(data);
      })
      .catch(console.error);

    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch(console.error);
  }, []);

  // Listen to afterprint event to reset print state
  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintWithoutTotals(false);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  // Reset form filters
  const handleClear = () => {
    const today = new Date().toISOString().split('T')[0];
    setFromDate(today);
    setToDate(today);
    setLocationId('');
    setPaymentType('');
    setUserId('');
    setOrderType('');
    setDiscountReason('');
    setAllOrderTypes(true);
    setIncludeCancelled(false);
  };

  // Convert date format from YYYY-MM-DD to DD-Mon-YYYY safely
  const formatDateForQuery = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day}-${months[parseInt(month) - 1]}-${year}`;
  };

  // Trigger inline report generation
  const handleRunReport = async (reportPath: string) => {
    setLoadingReport(true);
    setActiveReport(reportPath);
    setPrintWithoutTotals(false);

    const queryParams = new URLSearchParams({
      fromDate: formatDateForQuery(fromDate),
      toDate: formatDateForQuery(toDate),
      locationId,
      paymentType,
      userId,
      orderType: allOrderTypes ? '' : orderType,
      discountReason,
      includeCancelled: includeCancelled.toString(),
      reportType: reportPath
    });

    try {
      const res = await fetch(`/api/reports/bill-reports?${queryParams.toString()}`);
      const resData = await res.json();
      if (res.ok) {
        setReportData(resData);
      } else {
        console.error('Failed to query report:', resData.error);
        setReportData({ bills: [], totalExpenses: 0 });
      }
    } catch (e) {
      console.error(e);
      setReportData({ bills: [], totalExpenses: 0 });
    } finally {
      setLoadingReport(false);
    }
  };

  // Get name of selected user
  const getSelectedUserName = () => {
    if (!userId) return 'All Users';
    const found = users.find(u => u.id === parseInt(userId));
    return found ? found.displayName : 'All Users';
  };

  // Print Report Handler
  const handlePrint = (withoutTotals = false) => {
    if (withoutTotals) {
      setPrintWithoutTotals(true);
      setTimeout(() => {
        window.print();
      }, 100);
    } else {
      setPrintWithoutTotals(false);
      setTimeout(() => {
        window.print();
      }, 50);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!reportData || !reportData.bills) return;
    const billsList = reportData.bills;
    let headers: string[] = [];
    let rows: string[][] = [];

    if (activeReport === 'get-report') {
      headers = ['Bill Date', 'Bill No.', 'Patient Name', 'Age/Sex', 'Test', 'Billed', 'Disc.', 'Final', 'Paid', 'Bal', 'Created By', 'Referred By'];
      rows = billsList.map((b: any) => {
        const date = new Date(b.billDate);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
        const ordersStr = b.orders.map((o: any) => o.orderName).join(', ');
        const finalAmount = b.totalBill - b.discount;
        return [
          formattedDate,
          `#${b.billNumber}`,
          b.patient.name,
          `${b.patient.age || '-'}/${b.patient.gender}`,
          ordersStr,
          b.totalBill.toFixed(2),
          b.discount.toFixed(2),
          finalAmount.toFixed(2),
          b.paidAmount.toFixed(2),
          b.balance.toFixed(2),
          b.createdByUser?.displayName || 'System',
          b.doctor?.name || 'Self'
        ];
      });
    } else if (activeReport === 'non-financial') {
      headers = ['Bill Date', 'Bill No', 'Patient Name', 'Age', 'Gender', 'Orders', 'C/O'];
      rows = billsList.map((b: any) => {
        const date = new Date(b.billDate);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
        const ordersStr = b.orders.map((o: any) => o.orderName).join(', ');
        return [
          formattedDate,
          `#${b.billNumber}`,
          b.patient.name,
          (b.patient.age || '-').toString(),
          b.patient.gender === 'M' ? 'Male' : b.patient.gender === 'F' ? 'Female' : b.patient.gender,
          ordersStr,
          b.doctor?.name || 'Self'
        ];
      });
    } else if (activeReport === 'financial') {
      headers = ['Bill Date', 'Bill no.', 'Test', 'Billed', 'Dst', 'Final', 'Paid', 'Cash', 'Card', 'Cheque', 'UPI', 'Return', 'Bal', 'Credits'];
      rows = billsList.map((b: any) => {
        const date = new Date(b.billDate);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
        const ordersStr = b.orders.map((o: any) => o.orderName).join(', ');
        const final = b.totalBill - b.discount;
        let billCash = 0;
        let billCard = 0;
        let billCheque = 0;
        let billUpi = 0;

        b.payments.forEach((p: any) => {
          const billDateObj = new Date(b.billDate);
          const paidAtObj = new Date(p.paidAt);
          const isPreviousDue = (paidAtObj.getTime() - billDateObj.getTime()) > 60000;

          if (!isPreviousDue) {
            if (p.method === 'Cash') billCash += p.amount;
            else if (p.method === 'Card') billCard += p.amount;
            else if (p.method === 'Cheque') billCheque += p.amount;
            else if (p.method === 'UPI') billUpi += p.amount;
          }
        });
        return [
          formattedDate,
          `#${b.billNumber}`,
          ordersStr,
          b.totalBill.toFixed(2),
          b.discount.toFixed(2),
          final.toFixed(2),
          b.paidAmount.toFixed(2),
          billCash.toFixed(2),
          billCard.toFixed(2),
          billCheque.toFixed(2),
          billUpi.toFixed(2),
          '0.00',
          b.balance.toFixed(2),
          '0.00'
        ];
      });
    } else if (activeReport === 'cancelled') {
      headers = ['Bill Date', 'Bill no.', 'Patient Name', 'Test', 'Amount', 'Canceld User', 'Canceld Reason'];
      rows = billsList.map((b: any) => {
        const date = new Date(b.billDate);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
        const ordersStr = b.orders.map((o: any) => o.orderName).join(', ');
        return [
          formattedDate,
          `#${b.billNumber}`,
          b.patient.name,
          ordersStr,
          b.totalBill.toFixed(2),
          b.createdByUser?.displayName || 'System',
          b.discountReason || 'No reason specified'
        ];
      });
    } else if (activeReport === 'refunded') {
      headers = ['BillNo', 'Bill Dt', 'Patient Name', 'Ret Dt', 'Investigation', 'Total', 'Ret Amt', 'Ret User', 'Ret Reason'];
      billsList.forEach((b: any) => {
        const billDate = new Date(b.billDate);
        const formattedBillDate = `${billDate.getDate().toString().padStart(2, '0')}/${(billDate.getMonth() + 1).toString().padStart(2, '0')}/${billDate.getFullYear().toString().slice(-2)}`;
        
        const retDate = new Date(b.updatedAt);
        const formattedRetDate = `${retDate.getDate().toString().padStart(2, '0')}/${(retDate.getMonth() + 1).toString().padStart(2, '0')}/${retDate.getFullYear().toString().slice(-2)}`;

        b.orders.forEach((o: any) => {
          rows.push([
            `#${b.billNumber}`,
            formattedBillDate,
            b.patient.name,
            formattedRetDate,
            o.orderName,
            b.totalBill.toFixed(2),
            o.amount.toFixed(2),
            b.createdByUser?.displayName || 'System',
            b.discountReason || 'Cancelled/Refunded'
          ]);
        });
      });
    } else if (activeReport === 'discount') {
      headers = ['Bill Date', 'Bill no.', 'Patient Name', 'Test', 'Billed', 'Disc.', 'Final', 'Paid', 'Return', 'Bal', 'Discount Reason'];
      
      const groups: Record<string, any[]> = {};
      billsList.forEach((b: any) => {
        const reason = b.discountReason || 'No reason specified';
        if (!groups[reason]) groups[reason] = [];
        groups[reason].push(b);
      });

      Object.entries(groups).forEach(([reason, groupBills]) => {
        groupBills.forEach(b => {
          const date = new Date(b.billDate);
          const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
          const ordersStr = b.orders.map((o: any) => o.orderName).join(', ');
          const final = b.totalBill - b.discount;
          rows.push([
            formattedDate,
            `#${b.billNumber}`,
            b.patient.name,
            ordersStr,
            b.totalBill.toFixed(2),
            b.discount.toFixed(2),
            final.toFixed(2),
            b.paidAmount.toFixed(2),
            '0.00',
            b.balance.toFixed(2),
            reason
          ]);
        });
      });
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${activeReport}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group Discount Bills
  const getGroupedDiscountBills = (billsList: any[]) => {
    const groups: Record<string, any[]> = {};
    billsList.forEach(b => {
      const reason = b.discountReason || 'No reason specified';
      if (!groups[reason]) groups[reason] = [];
      groups[reason].push(b);
    });
    return groups;
  };

  // Subtotals helper
  const calcGroupSubtotals = (groupBills: any[]) => {
    const billed = groupBills.reduce((sum, b) => sum + b.totalBill, 0);
    const disc = groupBills.reduce((sum, b) => sum + b.discount, 0);
    const final = groupBills.reduce((sum, b) => sum + (b.totalBill - b.discount), 0);
    const paid = groupBills.reduce((sum, b) => sum + b.paidAmount, 0);
    const bal = groupBills.reduce((sum, b) => sum + b.balance, 0);
    return { billed, disc, final, paid, bal };
  };

  // Render inline report section
  const renderActiveReport = () => {
    if (loadingReport) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-muted)' }}>
          <div className="loader"></div>
          <p style={{ marginTop: 16, fontWeight: 500 }}>Fetching report data...</p>
          <style>{`.loader { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #e8751a; border-radius: 50%; animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }

    if (!reportData) return null;
    const billsList = reportData.bills || [];
    const displayUser = getSelectedUserName();
    const formattedFromDate = formatDateForQuery(fromDate);
    const formattedToDate = formatDateForQuery(toDate);

    // Calculate totals for report templates
    const totalBilled = billsList.reduce((sum: number, b: any) => sum + (b.totalBill || 0), 0);
    const totalDiscount = billsList.reduce((sum: number, b: any) => sum + (b.discount || 0), 0);
    const totalFinal = billsList.reduce((sum: number, b: any) => sum + ((b.totalBill - b.discount) || 0), 0);
    const totalPaid = billsList.reduce((sum: number, b: any) => sum + (b.paidAmount || 0), 0);
    const totalBalance = billsList.reduce((sum: number, b: any) => sum + (b.balance || 0), 0);

    // Calculations for Financial Report & Summary
    let cashReceived = 0;
    let cardReceived = 0;
    let chequeReceived = 0;
    let paytmReceived = 0;
    let upiReceived = 0;

    let prevDueCash = 0;
    let prevDueCard = 0;
    let prevDueCheque = 0;
    let prevDuePaytm = 0;
    let prevDueUpi = 0;

    billsList.forEach((b: any) => {
      b.payments.forEach((p: any) => {
        const billDateObj = new Date(b.billDate);
        const paidAtObj = new Date(p.paidAt);
        const isPreviousDue = (paidAtObj.getTime() - billDateObj.getTime()) > 60000;

        if (isPreviousDue) {
          if (p.method === 'Cash') prevDueCash += p.amount;
          else if (p.method === 'Card') prevDueCard += p.amount;
          else if (p.method === 'Cheque') prevDueCheque += p.amount;
          else if (p.method === 'UPI') prevDueUpi += p.amount;
          else prevDuePaytm += p.amount;
        } else {
          if (p.method === 'Cash') cashReceived += p.amount;
          else if (p.method === 'Card') cardReceived += p.amount;
          else if (p.method === 'Cheque') chequeReceived += p.amount;
          else if (p.method === 'UPI') upiReceived += p.amount;
          else paytmReceived += p.amount;
        }
      });
    });

    const totalReceivedInitial = cashReceived + cardReceived + chequeReceived + paytmReceived + upiReceived;
    const totalReceivedPrevDues = prevDueCash + prevDueCard + prevDueCheque + prevDuePaytm + prevDueUpi;
    const totalCash = cashReceived + prevDueCash;
    const totalCard = cardReceived + prevDueCard;
    const totalCheque = chequeReceived + prevDueCheque;
    const totalPaytm = paytmReceived + prevDuePaytm;
    const totalUpi = upiReceived + prevDueUpi;

    const totalGrossReceived = totalReceivedInitial + totalReceivedPrevDues;
    const remainingAmount = totalGrossReceived - (reportData.totalExpenses || 0);

    const hasTotals = activeReport === 'get-report' || activeReport === 'financial' || activeReport === 'discount';

    return (
      <div className={`print-report-card ${printWithoutTotals ? 'hide-totals-print' : ''}`}>
        {/* Actions bar */}
        <div className="report-action-bar no-print" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => setActiveReport(null)}>
            <X size={16} /> Exit
          </button>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--primary)', color: 'white', borderColor: 'var(--primary)' }} onClick={() => handlePrint(false)}>
            <Printer size={16} /> Print
          </button>
          {hasTotals && (
            <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--primary-dark)', color: 'white', borderColor: 'var(--primary-dark)' }} onClick={() => handlePrint(true)}>
              <Printer size={16} /> Print without Totals
            </button>
          )}
          {activeReport !== 'summary' && (
            <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#10b981', color: 'white', borderColor: '#10b981' }} onClick={handleExportCSV}>
              <Download size={16} /> CSV
            </button>
          )}
        </div>

        {/* Header Text matching the reference images */}
        <div className="report-header-title-text" style={{ paddingBottom: 16, borderBottom: '2px solid var(--border)', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#000', textTransform: 'uppercase' }}>
            {activeReport === 'get-report' && `Get Report Between the dates ${formattedFromDate} and ${formattedToDate} User : ${displayUser}`}
            {activeReport === 'non-financial' && `Non Financial Report Between the dates ${formattedFromDate} and ${formattedToDate} User : ${displayUser}`}
            {activeReport === 'financial' && `Financial Report Between the dates ${formattedFromDate} and ${formattedToDate} User : ${displayUser}`}
            {activeReport === 'cancelled' && `Cancelled Bills Report Between the dates ${formattedFromDate} and ${formattedToDate} UserName: ${displayUser}`}
            {activeReport === 'refunded' && `Cancelled Refunded Orders Report Between the dates ${formattedFromDate} and ${formattedToDate}`}
            {activeReport === 'summary' && `Bill Report Summary Between the dates ${formattedFromDate} and ${formattedToDate} User : ${displayUser}`}
            {activeReport === 'discount' && `Discount Bills Report Between the dates ${formattedFromDate} and ${formattedToDate}`}
          </h2>
        </div>

        {/* 1. GET REPORT VIEW */}
        {activeReport === 'get-report' && (
          <div className="table-card">
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th style={{ width: '9%' }}>Bill Date</th>
                    <th style={{ width: '7%' }}>Bill No.</th>
                    <th style={{ width: '13%' }}>Patient Name</th>
                    <th style={{ width: '8%' }}>Age/Sex</th>
                    <th style={{ width: '18%' }}>Test</th>
                    <th style={{ width: '8%', textAlign: 'right' }}>Billed</th>
                    <th style={{ width: '7%', textAlign: 'right' }}>Disc.</th>
                    <th style={{ width: '8%', textAlign: 'right' }}>Final</th>
                    <th style={{ width: '8%', textAlign: 'right' }}>Paid</th>
                    <th style={{ width: '8%', textAlign: 'right' }}>Bal</th>
                    <th style={{ width: '10%' }}>Created By</th>
                    <th style={{ width: '12%' }}>Referred By</th>
                  </tr>
                </thead>
                <tbody>
                  {billsList.map((bill: any) => {
                    const date = new Date(bill.billDate);
                    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
                    const ordersStr = bill.orders.map((o: any) => o.orderName).join(', ');
                    const finalAmount = bill.totalBill - bill.discount;

                    return (
                      <tr key={bill.id} className="table-row">
                        <td className="cell-date">{formattedDate}</td>
                        <td className="cell-id">#{bill.billNumber}</td>
                        <td className="cell-name">{bill.patient.name}</td>
                        <td className="cell-age">{bill.patient.age || '-'}/{bill.patient.gender}</td>
                        <td className="cell-orders">{ordersStr}</td>
                        <td align="right" className="cell-amount">₹{bill.totalBill.toFixed(2)}</td>
                        <td align="right" className="cell-amount" style={{ color: bill.discount > 0 ? 'var(--primary)' : 'inherit' }}>
                          {bill.discount > 0 ? `₹${bill.discount.toFixed(2)}` : '-'}
                        </td>
                        <td align="right" className="cell-amount" style={{ fontWeight: 600 }}>₹{finalAmount.toFixed(2)}</td>
                        <td align="right" className="cell-amount" style={{ color: 'var(--success)', fontWeight: 500 }}>₹{bill.paidAmount.toFixed(2)}</td>
                        <td align="right" className="cell-amount" style={{ color: bill.balance > 0 ? 'var(--danger)' : 'inherit', fontWeight: bill.balance > 0 ? 600 : 400 }}>
                          {bill.balance > 0 ? `₹${bill.balance.toFixed(2)}` : 'Paid'}
                        </td>
                        <td className="cell-user">{bill.createdByUser?.displayName || 'System'}</td>
                        <td className="cell-doctor">{bill.doctor?.name || 'Self'}</td>
                      </tr>
                    );
                  })}
                  {billsList.length === 0 && (
                    <tr>
                      <td colSpan={12} className="empty-state" style={{ textAlign: 'center', padding: 40 }}>
                        No billing records found matching the criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
                {billsList.length > 0 && (
                  <tfoot className="report-totals">
                    <tr style={{ background: '#f8fafc', fontWeight: 700, borderTop: '2px solid #cbd5e1' }}>
                      <td colSpan={5} style={{ padding: '12px 16px', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.5px' }}>Total Amount</td>
                      <td align="right" style={{ padding: '12px 16px' }}>₹{totalBilled.toFixed(2)}</td>
                      <td align="right" style={{ padding: '12px 16px', color: totalDiscount > 0 ? 'var(--primary)' : 'inherit' }}>₹{totalDiscount.toFixed(2)}</td>
                      <td align="right" style={{ padding: '12px 16px' }}>₹{totalFinal.toFixed(2)}</td>
                      <td align="right" style={{ padding: '12px 16px', color: 'var(--success)' }}>₹{totalPaid.toFixed(2)}</td>
                      <td align="right" style={{ padding: '12px 16px', color: totalBalance > 0 ? 'var(--danger)' : 'inherit' }}>₹{totalBalance.toFixed(2)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* 2. NON-FINANCIAL REPORT VIEW */}
        {activeReport === 'non-financial' && (
          <div className="table-card">
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th style={{ width: '12%' }}>Bill Date</th>
                    <th style={{ width: '10%' }}>Bill No.</th>
                    <th style={{ width: '22%' }}>Patient Name</th>
                    <th style={{ width: '8%', textAlign: 'center' }}>Age</th>
                    <th style={{ width: '12%' }}>Gender</th>
                    <th style={{ width: '21%' }}>Orders</th>
                    <th style={{ width: '15%' }}>Referred By</th>
                  </tr>
                </thead>
                <tbody>
                  {billsList.map((bill: any) => {
                    const date = new Date(bill.billDate);
                    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
                    const ordersStr = bill.orders.map((o: any) => o.orderName).join(', ');

                    return (
                      <tr key={bill.id} className="table-row">
                        <td className="cell-date">{formattedDate}</td>
                        <td className="cell-id">#{bill.billNumber}</td>
                        <td className="cell-name">{bill.patient.name}</td>
                        <td align="center" className="cell-age">{bill.patient.age || '-'}</td>
                        <td>
                          <span className={`gender-badge ${bill.patient.gender === 'M' ? 'badge-male' : bill.patient.gender === 'F' ? 'badge-female' : 'badge-neutral'}`} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                            {bill.patient.gender === 'M' ? 'Male' : bill.patient.gender === 'F' ? 'Female' : bill.patient.gender}
                          </span>
                        </td>
                        <td className="cell-orders">{ordersStr}</td>
                        <td className="cell-doctor">{bill.doctor?.name || 'Self'}</td>
                      </tr>
                    );
                  })}
                  {billsList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="empty-state" style={{ textAlign: 'center', padding: 40 }}>
                        No non-financial records found matching the criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {billsList.length > 0 && (
              <div className="report-summary-block" style={{ display: 'flex', gap: 40, padding: 16, background: '#f8fafc', borderTop: '2px solid #cbd5e1', fontSize: 13, fontWeight: 700 }}>
                <div>Total Count: <span style={{ color: 'var(--primary)' }}>{billsList.length}</span></div>
                <div>Dispatched Count: <span style={{ color: 'var(--success)' }}>{billsList.filter((b: any) => b.status === 'Completed' || b.status === 'Dispatched').length}</span></div>
              </div>
            )}
          </div>
        )}

        {/* 3. FINANCIAL REPORT VIEW */}
        {activeReport === 'financial' && (
          <div>
            {/* Top Summaries Box */}
            <div className="financial-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 15, marginBottom: 20 }}>
              <div style={{ background: '#fff', border: '1px solid var(--border)', padding: 15, borderRadius: 10 }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Billing Summary</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>Total Amount:</span><strong>₹{totalBilled.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>Discount:</span><strong style={{ color: 'var(--primary)' }}>₹{totalDiscount.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>Final Amount:</span><strong>₹{totalFinal.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>Advance:</span><strong style={{ color: 'var(--success)' }}>₹{totalReceivedInitial.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>Balance:</span><strong style={{ color: 'var(--danger)' }}>₹{totalBalance.toFixed(2)}</strong></div>
              </div>
              <div style={{ background: '#fff', border: '1px solid var(--border)', padding: 15, borderRadius: 10 }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Initial Receipts</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>Cash:</span><strong>₹{cashReceived.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>Card:</span><strong>₹{cardReceived.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>Cheque:</span><strong>₹{chequeReceived.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>UPI:</span><strong>₹{upiReceived.toFixed(2)}</strong></div>
              </div>
              <div style={{ background: '#fff', border: '1px solid var(--border)', padding: 15, borderRadius: 10 }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Previous Dues</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>Cash:</span><strong>₹{prevDueCash.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>Card:</span><strong>₹{prevDueCard.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>Cheque:</span><strong>₹{prevDueCheque.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>UPI:</span><strong>₹{prevDueUpi.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>Paytm:</span><strong>₹{prevDuePaytm.toFixed(2)}</strong></div>
              </div>
              <div style={{ background: 'var(--primary-light)', border: '1px solid #ffedd5', padding: 15, borderRadius: 10 }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: 12, color: 'var(--primary-dark)', textTransform: 'uppercase' }}>Net Totals</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, marginBottom: 4 }}><span>Total Received:</span><span style={{ color: 'var(--success)' }}>₹{totalGrossReceived.toFixed(2)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>Total Return:</span><strong>₹0.00</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>Total Credits:</span><strong>₹0.00</strong></div>
              </div>
            </div>

            {/* Table */}
            <div className="table-card">
              <div className="table-responsive">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th style={{ width: '8%' }}>Bill Date</th>
                      <th style={{ width: '6%' }}>Bill No.</th>
                      <th style={{ width: '18%' }}>Test</th>
                      <th style={{ width: '8%', textAlign: 'right' }}>Billed</th>
                      <th style={{ width: '6%', textAlign: 'right' }}>Dst</th>
                      <th style={{ width: '8%', textAlign: 'right' }}>Final</th>
                      <th style={{ width: '8%', textAlign: 'right' }}>Paid</th>
                      <th style={{ width: '7%', textAlign: 'right' }}>Cash</th>
                      <th style={{ width: '7%', textAlign: 'right' }}>Card</th>
                      <th style={{ width: '7%', textAlign: 'right' }}>Cheque</th>
                      <th style={{ width: '7%', textAlign: 'right' }}>UPI</th>
                      <th style={{ width: '7%', textAlign: 'right' }}>Return</th>
                      <th style={{ width: '8%', textAlign: 'right' }}>Bal</th>
                      <th style={{ width: '7%', textAlign: 'right' }}>Credits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billsList.map((bill: any) => {
                      const date = new Date(bill.billDate);
                      const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
                      const ordersStr = bill.orders.map((o: any) => o.orderName).join(', ');
                      const final = bill.totalBill - bill.discount;

                      let billCash = 0;
                      let billCard = 0;
                      let billCheque = 0;
                      let billUpi = 0;

                      bill.payments.forEach((p: any) => {
                        const billDateObj = new Date(bill.billDate);
                        const paidAtObj = new Date(p.paidAt);
                        const isPreviousDue = (paidAtObj.getTime() - billDateObj.getTime()) > 60000;

                        if (!isPreviousDue) {
                          if (p.method === 'Cash') billCash += p.amount;
                          else if (p.method === 'Card') billCard += p.amount;
                          else if (p.method === 'Cheque') billCheque += p.amount;
                          else if (p.method === 'UPI') billUpi += p.amount;
                        }
                      });

                      return (
                        <tr key={bill.id} className="table-row">
                          <td className="cell-date">{formattedDate}</td>
                          <td className="cell-id">#{bill.billNumber}</td>
                          <td className="cell-orders">{ordersStr}</td>
                          <td align="right">₹{bill.totalBill.toFixed(2)}</td>
                          <td align="right" style={{ color: bill.discount > 0 ? 'var(--primary)' : 'inherit' }}>
                            {bill.discount > 0 ? `₹${bill.discount.toFixed(2)}` : '-'}
                          </td>
                          <td align="right" style={{ fontWeight: 600 }}>₹{final.toFixed(2)}</td>
                          <td align="right" style={{ color: 'var(--success)', fontWeight: 500 }}>₹{bill.paidAmount.toFixed(2)}</td>
                          <td align="right">{billCash > 0 ? `₹${billCash.toFixed(2)}` : '-'}</td>
                          <td align="right">{billCard > 0 ? `₹${billCard.toFixed(2)}` : '-'}</td>
                          <td align="right">{billCheque > 0 ? `₹${billCheque.toFixed(2)}` : '-'}</td>
                          <td align="right">{billUpi > 0 ? `₹${billUpi.toFixed(2)}` : '-'}</td>
                          <td align="right">-</td>
                          <td align="right" style={{ color: bill.balance > 0 ? 'var(--danger)' : 'inherit', fontWeight: bill.balance > 0 ? 600 : 400 }}>
                            {bill.balance > 0 ? `₹${bill.balance.toFixed(2)}` : 'Paid'}
                          </td>
                          <td align="right">-</td>
                        </tr>
                      );
                    })}
                    {billsList.length === 0 && (
                      <tr>
                        <td colSpan={14} className="empty-state" style={{ textAlign: 'center', padding: 40 }}>
                          No billing records found matching the criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. CANCELLED BILLS VIEW */}
        {activeReport === 'cancelled' && (
          <div className="table-card">
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th style={{ width: '12%' }}>Bill Date</th>
                    <th style={{ width: '10%' }}>Bill No.</th>
                    <th style={{ width: '22%' }}>Patient Name</th>
                    <th style={{ width: '22%' }}>Test</th>
                    <th style={{ width: '10%', textAlign: 'right' }}>Amount</th>
                    <th style={{ width: '12%' }}>Canceld User</th>
                    <th style={{ width: '12%' }}>Canceld Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {billsList.map((bill: any) => {
                    const date = new Date(bill.billDate);
                    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
                    const ordersStr = bill.orders.map((o: any) => o.orderName).join(', ');

                    return (
                      <tr key={bill.id} className="table-row">
                        <td className="cell-date">{formattedDate}</td>
                        <td className="cell-id">#{bill.billNumber}</td>
                        <td className="cell-name">{bill.patient.name}</td>
                        <td className="cell-orders">{ordersStr}</td>
                        <td align="right" className="cell-amount" style={{ color: 'var(--danger)' }}>₹{bill.totalBill.toFixed(2)}</td>
                        <td className="cell-user">{bill.createdByUser?.displayName || 'System'}</td>
                        <td className="cell-reason" style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                          {bill.discountReason || 'No reason specified'}
                        </td>
                      </tr>
                    );
                  })}
                  {billsList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="empty-state" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                        No data available in table
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. REFUNDED / CANCELLED ORDERS VIEW */}
        {activeReport === 'refunded' && (
          <div className="table-card">
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th style={{ width: '8%' }}>BillNo</th>
                    <th style={{ width: '10%' }}>Bill Date</th>
                    <th style={{ width: '20%' }}>Patient Name</th>
                    <th style={{ width: '10%' }}>Ret Dt</th>
                    <th style={{ width: '22%' }}>Investigation</th>
                    <th style={{ width: '8%', textAlign: 'right' }}>Total</th>
                    <th style={{ width: '8%', textAlign: 'right' }}>Ret Amt</th>
                    <th style={{ width: '12%' }}>Ret User</th>
                    <th style={{ width: '12%' }}>Ret Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const rows: any[] = [];
                    billsList.forEach((b: any) => {
                      const billDate = new Date(b.billDate);
                      const formattedBillDate = `${billDate.getDate().toString().padStart(2, '0')}/${(billDate.getMonth() + 1).toString().padStart(2, '0')}/${billDate.getFullYear().toString().slice(-2)}`;
                      
                      const retDate = new Date(b.updatedAt);
                      const formattedRetDate = `${retDate.getDate().toString().padStart(2, '0')}/${(retDate.getMonth() + 1).toString().padStart(2, '0')}/${retDate.getFullYear().toString().slice(-2)}`;

                      b.orders.forEach((o: any) => {
                        rows.push(
                          <tr key={`${b.id}-${o.id}`} className="table-row">
                            <td className="cell-id">#{b.billNumber}</td>
                            <td className="cell-date">{formattedBillDate}</td>
                            <td className="cell-name">{b.patient.name}</td>
                            <td className="cell-date">{formattedRetDate}</td>
                            <td className="cell-orders">{o.orderName}</td>
                            <td align="right">₹{b.totalBill.toFixed(2)}</td>
                            <td align="right" className="cell-amount" style={{ fontWeight: 600, color: 'var(--danger)' }}>₹{o.amount.toFixed(2)}</td>
                            <td className="cell-user">{b.createdByUser?.displayName || 'System'}</td>
                            <td className="cell-reason" style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                              {b.discountReason || 'Cancelled/Refunded'}
                            </td>
                          </tr>
                        );
                      });
                    });
                    if (rows.length === 0) {
                      return (
                        <tr>
                          <td colSpan={9} className="empty-state" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                            No data available in table
                          </td>
                        </tr>
                      );
                    }
                    return rows;
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. SUMMARY REPORT VIEW */}
        {activeReport === 'summary' && (
          <div className="table-card" style={{ padding: '32px', maxWidth: '800px', margin: '0 auto', border: '1px solid var(--border)' }}>
            <div className="summary-list" style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              
              {/* Group 1: General Billing */}
              <div className="summary-group" style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 12, borderBottom: '1.5px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total billed amount:</span><strong>₹{totalBilled.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total credits:</span><strong>₹0.00</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>(-)Discount amount:</span><strong style={{ color: 'var(--primary)' }}>₹{totalDiscount.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}><span>Final amount:</span><strong>₹{totalFinal.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>(-)Return Amount:</span><strong>₹0.00</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}><span>Balance amount:</span><strong style={{ color: 'var(--danger)' }}>₹{totalBalance.toFixed(2)}</strong></div>
              </div>

              {/* Group 2: Initial Receipts */}
              <div className="summary-group" style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 12, borderBottom: '1.5px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>#1 Cash Received:</span><strong>₹{cashReceived.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>#2 Card Received:</span><strong>₹{cardReceived.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>#3 Cheque Received:</span><strong>₹{chequeReceived.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>#4 Paytm Received:</span><strong>₹{paytmReceived.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>#5 UPI Received:</span><strong>₹{upiReceived.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, background: '#f8fafc', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <span>Total Received [#1 + #2 + #3 + #4 + #5]:</span>
                  <span style={{ color: 'var(--success)' }}>₹{totalReceivedInitial.toFixed(2)}</span>
                </div>
              </div>

              {/* Group 3: Previous Dues */}
              <div className="summary-group" style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 12, borderBottom: '1.5px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>#6 Previous dues Received(Cash):</span><strong>₹{prevDueCash.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>#7 Previous dues Received(Card):</span><strong>₹{prevDueCard.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>#8 Previous dues Received(Cheque):</span><strong>₹{prevDueCheque.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>#9 Previous dues Received(Paytm):</span><strong>₹{prevDuePaytm.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>#10 Previous dues Received(UPI):</span><strong>₹{prevDueUpi.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, background: '#f8fafc', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <span>Total Previous dues Received [#6 + #7 + #8 + #9 + #10]:</span>
                  <span style={{ color: 'var(--success)' }}>₹{totalReceivedPrevDues.toFixed(2)}</span>
                </div>
              </div>

              {/* Group 4: Net Totals by Method */}
              <div className="summary-group" style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 12, borderBottom: '1.5px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Cash Received [#1 + #6]:</span><strong>₹{totalCash.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Card Received [#2 + #7]:</span><strong>₹{totalCard.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Cheque Received [#3 + #8]:</span><strong>₹{totalCheque.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Paytm Received [#4 + #9]:</span><strong>₹{totalPaytm.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total UPI Received [#5 + #10]:</span><strong>₹{totalUpi.toFixed(2)}</strong></div>
              </div>

              {/* Group 5: Expenses & Net Remaining */}
              <div className="summary-group last" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Expenses:</span><strong style={{ color: 'var(--danger)' }}>₹{(reportData.totalExpenses || 0).toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, borderTop: '2px solid #000', paddingTop: 10, marginTop: 5 }}>
                  <span style={{ color: '#000' }}>Remaining Amount:</span>
                  <span style={{ color: 'var(--success)' }}>₹{remainingAmount.toFixed(2)}</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 7. DISCOUNTBILLS REPORT (Grouped by Reason) */}
        {activeReport === 'discount' && (
          <div>
            {/* Summary Top row */}
            <div className="financial-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 15, marginBottom: 20 }}>
              <div style={{ background: '#fff', border: '1px solid var(--border)', padding: 15, borderRadius: 10 }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Discount Summary</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>Total Amount:</span><strong>₹{totalBilled.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>Discount Amount:</span><strong style={{ color: 'var(--primary)', fontWeight: 700 }}>₹{totalDiscount.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>Final Amount:</span><strong>₹{totalFinal.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>Paid Amount:</span><strong style={{ color: 'var(--success)' }}>₹{totalPaid.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>Balance Amount:</span><strong style={{ color: 'var(--danger)' }}>₹{totalBalance.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>Return:</span><strong>₹0.00</strong></div>
              </div>
            </div>

            {/* Table */}
            <div className="table-card">
              <div className="table-responsive">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th style={{ width: '10%' }}>Bill Date</th>
                      <th style={{ width: '8%' }}>Bill no.</th>
                      <th style={{ width: '18%' }}>Patient Name</th>
                      <th style={{ width: '20%' }}>Test</th>
                      <th style={{ width: '8%', textAlign: 'right' }}>Billed</th>
                      <th style={{ width: '8%', textAlign: 'right' }}>Disc.</th>
                      <th style={{ width: '8%', textAlign: 'right' }}>Final</th>
                      <th style={{ width: '8%', textAlign: 'right' }}>Paid</th>
                      <th style={{ width: '6%', textAlign: 'right' }}>Return</th>
                      <th style={{ width: '8%', textAlign: 'right' }}>Bal</th>
                      <th style={{ width: '12%' }}>Discount Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const grouped = getGroupedDiscountBills(billsList);
                      const elements: React.ReactNode[] = [];

                      Object.entries(grouped).forEach(([reason, groupBills]) => {
                        const subtotals = calcGroupSubtotals(groupBills);

                        // Header Row for group
                        elements.push(
                          <tr key={`header-${reason}`} style={{ background: '#f8fafc', fontWeight: 600 }}>
                            <td colSpan={10} style={{ paddingLeft: '16px', color: '#475569' }}>
                              Discount Reason: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{reason}</span>
                            </td>
                            <td></td>
                          </tr>
                        );

                        // Group Bills rows
                        groupBills.forEach((bill: any) => {
                          const date = new Date(bill.billDate);
                          const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
                          const ordersStr = bill.orders.map((o: any) => o.orderName).join(', ');
                          const final = bill.totalBill - bill.discount;

                          elements.push(
                            <tr key={bill.id} className="table-row">
                              <td className="cell-date">{formattedDate}</td>
                              <td className="cell-id">#{bill.billNumber}</td>
                              <td className="cell-name">{bill.patient.name}</td>
                              <td className="cell-orders">{ordersStr}</td>
                              <td align="right">₹{bill.totalBill.toFixed(2)}</td>
                              <td align="right" style={{ color: 'var(--primary)', fontWeight: 500 }}>₹{bill.discount.toFixed(2)}</td>
                              <td align="right" style={{ fontWeight: 600 }}>₹{final.toFixed(2)}</td>
                              <td align="right" style={{ color: 'var(--success)', fontWeight: 500 }}>₹{bill.paidAmount.toFixed(2)}</td>
                              <td align="right">-</td>
                              <td align="right" style={{ color: bill.balance > 0 ? 'var(--danger)' : 'inherit', fontWeight: bill.balance > 0 ? 600 : 400 }}>
                                {bill.balance > 0 ? `₹${bill.balance.toFixed(2)}` : 'Paid'}
                              </td>
                              <td className="cell-reason" style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                                {bill.discountReason}
                              </td>
                            </tr>
                          );
                        });

                        // Subtotal Row for group
                        elements.push(
                          <tr key={`subtotal-${reason}`} className="group-subtotal-row" style={{ background: '#f1f5f9', fontWeight: 700 }}>
                            <td colSpan={4} style={{ textAlign: 'right', paddingRight: '20px' }}>Subtotal:</td>
                            <td align="right">₹{subtotals.billed.toFixed(2)}</td>
                            <td align="right" style={{ color: 'var(--primary)' }}>₹{subtotals.disc.toFixed(2)}</td>
                            <td align="right">₹{subtotals.final.toFixed(2)}</td>
                            <td align="right" style={{ color: 'var(--success)' }}>₹{subtotals.paid.toFixed(2)}</td>
                            <td align="right">₹0.00</td>
                            <td align="right" style={{ color: subtotals.bal > 0 ? 'var(--danger)' : 'inherit' }}>₹{subtotals.bal.toFixed(2)}</td>
                            <td></td>
                          </tr>
                        );
                      });

                      if (elements.length === 0) {
                        return (
                          <tr>
                            <td colSpan={11} className="empty-state" style={{ textAlign: 'center', padding: 40 }}>
                              No discounted bills found matching the criteria.
                            </td>
                          </tr>
                        );
                      }
                      return elements;
                    })()}
                  </tbody>
                  {billsList.length > 0 && (
                    <tfoot className="report-totals">
                      <tr style={{ background: '#e2e8f0', fontWeight: 800, borderTop: '2px solid #94a3b8' }}>
                        <td colSpan={4} style={{ padding: '12px 16px', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.5px' }}>Grand Total</td>
                        <td align="right" style={{ padding: '12px 16px' }}>₹{totalBilled.toFixed(2)}</td>
                        <td align="right" style={{ padding: '12px 16px', color: 'var(--primary)' }}>₹{totalDiscount.toFixed(2)}</td>
                        <td align="right" style={{ padding: '12px 16px' }}>₹{totalFinal.toFixed(2)}</td>
                        <td align="right" style={{ padding: '12px 16px', color: 'var(--success)' }}>₹{totalPaid.toFixed(2)}</td>
                        <td align="right" style={{ padding: '12px 16px' }}>₹0.00</td>
                        <td align="right" style={{ padding: '12px 16px', color: totalBalance > 0 ? 'var(--danger)' : 'inherit' }}>₹{totalBalance.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Generate and view laboratory financial and administrative reports</p>
      </div>

      <div className="reports-layout">
        {/* Right Main Interface */}
        <div style={{ width: '100%' }}>
          {active === 'Bill Reports' ? (
            activeReport ? (
              renderActiveReport()
            ) : (
              <div className="bill-reports-section">
                {/* Reports Button Bar */}
                <div className="reports-btn-bar" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
                  <button className="btn btn-outline" onClick={() => handleRunReport('get-report')}>Get Report</button>
                  <button className="btn btn-outline" onClick={() => handleRunReport('non-financial')}>NonFinancial</button>
                  <button className="btn btn-outline" onClick={() => handleRunReport('financial')}>Financial</button>
                  <button className="btn btn-outline" onClick={() => handleRunReport('cancelled')}>Cancelled Bills</button>
                  <button className="btn btn-outline" onClick={() => handleRunReport('refunded')}>Refunded/Cancelled Orders</button>
                  <button className="btn btn-outline" onClick={() => handleRunReport('summary')}>Summary</button>
                </div>

                {/* Form Card */}
                <div className="card">
                  <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="card-title" style={{ fontSize: 16 }}>Bill Reports Configuration</span>
                    <button 
                      className="btn btn-danger" 
                      style={{ background: 'var(--danger)', color: '#fff', borderRadius: '8px' }}
                      onClick={() => handleRunReport('discount')}
                    >
                      DiscountBills Report
                    </button>
                  </div>
                  
                  <div className="card-body" style={{ padding: '24px 32px' }}>
                    <div className="form-row form-row-2" style={{ marginBottom: 16 }}>
                      {/* From Date */}
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600 }}>From Date</label>
                        <div style={{ position: 'relative' }}>
                          <Calendar size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input 
                            type="date" 
                            className="form-input" 
                            value={fromDate}
                            onChange={e => setFromDate(e.target.value)}
                            style={{ paddingLeft: 38 }}
                          />
                        </div>
                      </div>

                      {/* To Date */}
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600 }}>To Date</label>
                        <div style={{ position: 'relative' }}>
                          <Calendar size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input 
                            type="date" 
                            className="form-input" 
                            value={toDate}
                            onChange={e => setToDate(e.target.value)}
                            style={{ paddingLeft: 38 }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-row form-row-3" style={{ marginBottom: 16 }}>
                      {/* Location */}
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600 }}>Location</label>
                        <div style={{ position: 'relative' }}>
                          <MapPin size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 10 }} />
                          <select 
                            className="form-input form-select"
                            value={locationId}
                            onChange={e => setLocationId(e.target.value)}
                            style={{ paddingLeft: 38 }}
                          >
                            <option value="">Select Location</option>
                            {locations.map(loc => (
                              <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Payment Type */}
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600 }}>Payment Type</label>
                        <div style={{ position: 'relative' }}>
                          <CreditCard size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 10 }} />
                          <select 
                            className="form-input form-select"
                            value={paymentType}
                            onChange={e => setPaymentType(e.target.value)}
                            style={{ paddingLeft: 38 }}
                          >
                            <option value="">Select PaymentType</option>
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="UPI">UPI</option>
                            <option value="Online">Online</option>
                          </select>
                        </div>
                      </div>

                      {/* Users */}
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600 }}>Users</label>
                        <div style={{ position: 'relative' }}>
                          <Users size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 10 }} />
                          <select 
                            className="form-input form-select"
                            value={userId}
                            onChange={e => setUserId(e.target.value)}
                            style={{ paddingLeft: 38 }}
                          >
                            <option value="">Select User</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id}>{u.displayName}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="form-row form-row-2" style={{ marginBottom: 24 }}>
                      {/* Order Type */}
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600 }}>Order Type</label>
                        <div style={{ position: 'relative' }}>
                          <Tag size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Order Type"
                            value={orderType}
                            onChange={e => setOrderType(e.target.value)}
                            disabled={allOrderTypes}
                            style={{ paddingLeft: 38, opacity: allOrderTypes ? 0.6 : 1 }}
                          />
                        </div>
                      </div>

                      {/* Discount Reason */}
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600 }}>Discount Reason</label>
                        <div style={{ position: 'relative' }}>
                          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="DiscountReasonSearch"
                            value={discountReason}
                            onChange={e => setDiscountReason(e.target.value)}
                            style={{ paddingLeft: 38 }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Checkboxes & Clear Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                      <div style={{ display: 'flex', gap: 24 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>
                          <input 
                            type="checkbox" 
                            checked={allOrderTypes}
                            onChange={e => setAllOrderTypes(e.target.checked)}
                            style={{ width: 16, height: 16, cursor: 'pointer' }}
                          />
                          All Order Types
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>
                          <input 
                            type="checkbox" 
                            checked={includeCancelled}
                            onChange={e => setIncludeCancelled(e.target.checked)}
                            style={{ width: 16, height: 16, cursor: 'pointer' }}
                          />
                          Include Cancelled Bills
                        </label>
                      </div>

                      <button 
                        className="btn btn-danger" 
                        onClick={handleClear}
                        style={{ background: 'var(--primary)', color: '#fff', borderRadius: '10px', padding: '10px 24px', fontWeight: 600 }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
                <h3>{active}</h3>
                <p>Report generation interface coming soon</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* Style adjustments for responsiveness and layout */
        .reports-layout {
          width: 100%;
        }

        .reports-btn-bar {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .reports-btn-bar button {
          border-radius: 10px;
          font-weight: 600;
          padding: 8px 16px;
          transition: all 0.2s ease;
        }

        .reports-btn-bar button:hover {
          border-color: var(--primary);
          color: var(--primary);
          background-color: var(--primary-light);
        }

        /* Table responsiveness and modern formatting */
        .table-responsive {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: #fff;
          margin-bottom: 1.5rem;
        }

        .modern-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .modern-table th {
          background: #f8fafc;
          padding: 12px 14px;
          font-weight: 600;
          font-size: 12px;
          text-align: left;
          color: var(--text-secondary);
          border-bottom: 2px solid var(--border);
          white-space: nowrap;
        }

        .modern-table td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--border);
          color: var(--text-primary);
          white-space: nowrap;
          vertical-align: middle;
        }

        .modern-table tr:hover {
          background-color: #f8fafc;
        }

        /* Spacing and font-size adjustments for active reports */
        .report-header-title-text h2 {
          font-size: 1.1rem !important;
          line-height: 1.4;
        }

        .financial-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        @media (max-width: 640px) {
          .modern-table th, .modern-table td {
            padding: 8px 10px;
            font-size: 11px;
          }
          .report-header-title-text h2 {
            font-size: 0.95rem !important;
          }
          .reports-btn-bar button {
            padding: 6px 12px;
            font-size: 12px;
          }
        }

        /* Print media styles */
        @media print {
          body {
            background: #fff !important;
            color: #000 !important;
          }
          
          /* Hide everything except active report view */
          .page-header,
          .reports-btn-bar,
          .card:not(.print-report-card),
          .report-action-bar,
          aside,
          header,
          .sidebar,
          .sidebar-container,
          .topnav,
          .top-nav,
          .no-print {
            display: none !important;
          }
          
          .main-area {
            margin-left: 0 !important;
            padding-left: 0 !important;
            width: 100% !important;
          }
          
          .content-wrapper {
            padding: 0 !important;
            margin: 0 !important;
          }

          .print-report-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            position: absolute;
            left: 0;
            top: 0;
          }

          /* Hide totals if printWithoutTotals is active */
          .hide-totals-print .report-totals,
          .hide-totals-print .report-summary-block,
          .hide-totals-print .financial-summary-grid,
          .hide-totals-print .group-subtotal-row {
            display: none !important;
          }

          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            padding: 6px 8px !important;
            font-size: 10px !important;
            color: #000 !important;
          }
          th {
            background: #f8fafc !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-muted)' }}>
        <div className="loader"></div>
        <p style={{ marginTop: 16, fontWeight: 500 }}>Loading reports interface...</p>
        <style>{`.loader { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #e8751a; border-radius: 50%; animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <ReportsPageContent />
    </Suspense>
  );
}
