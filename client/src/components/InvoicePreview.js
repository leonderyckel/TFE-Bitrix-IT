import React from 'react';

const InvoicePreview = ({
  companyName,
  companyAddress,
  companyVAT,
  companyLogoUrl,
  invoiceNumber,
  date,
  dueDate,
  salesRep,
  discount,
  clientName,
  clientAddress,
  clientVAT,
  items = [],
  totalDiscount,
  totalExclusive,
  totalVAT,
  subTotal,
  totalDue,
  notes,
  bankDetails
}) => (
  <div style={{ maxWidth: 800, margin: '0 auto', padding: 32, background: '#fff', fontFamily: 'Arial, sans-serif' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ fontSize: 14 }}>
        <div style={{ fontWeight: 'bold' }}>{companyName}</div>
        <div>{companyAddress}</div>
        <div>VAT No: {companyVAT}</div>
      </div>
      {companyLogoUrl && <img src={companyLogoUrl} alt="Logo" style={{ maxWidth: 160 }} />}
      <div style={{ fontSize: 14, textAlign: 'right' }}>
        <div><span style={{ fontWeight: 'bold' }}>Number:</span> {invoiceNumber}</div>
        <div><span style={{ fontWeight: 'bold' }}>Date:</span> {date}</div>
        <div><span style={{ fontWeight: 'bold' }}>Due Date:</span> {dueDate}</div>
        <div><span style={{ fontWeight: 'bold' }}>Sales Rep:</span> {salesRep}</div>
        <div><span style={{ fontWeight: 'bold' }}>Discount:</span> {discount}%</div>
      </div>
    </div>
    <div style={{ margin: '24px 0 12px 0', fontSize: 15 }}>
      <div style={{ fontWeight: 'bold' }}>{clientName}</div>
      <div>{clientAddress}</div>
      <div>Customer VAT No: {clientVAT}</div>
    </div>
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
      <thead>
        <tr>
          <th style={{ border: '1px solid #ccc', padding: 8, background: '#eee', textAlign: 'left' }}>Description</th>
          <th style={{ border: '1px solid #ccc', padding: 8, background: '#eee', textAlign: 'left' }}>Quantity</th>
          <th style={{ border: '1px solid #ccc', padding: 8, background: '#eee', textAlign: 'left' }}>Incl. Price</th>
          <th style={{ border: '1px solid #ccc', padding: 8, background: '#eee', textAlign: 'left' }}>Total</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, idx) => (
          <tr key={idx}>
            <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.description}</td>
            <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.quantity}</td>
            <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.unitPrice}</td>
            <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.total}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <table style={{ marginTop: 24, width: '100%' }}>
      <tbody>
        <tr>
          <td style={{ textAlign: 'right', fontWeight: 'bold', border: 'none' }}>Total Discount:</td>
          <td style={{ textAlign: 'right', border: 'none' }}>{totalDiscount}</td>
        </tr>
        <tr>
          <td style={{ textAlign: 'right', fontWeight: 'bold', border: 'none' }}>Total Exclusive:</td>
          <td style={{ textAlign: 'right', border: 'none' }}>{totalExclusive}</td>
        </tr>
        <tr>
          <td style={{ textAlign: 'right', fontWeight: 'bold', border: 'none' }}>Total VAT:</td>
          <td style={{ textAlign: 'right', border: 'none' }}>{totalVAT}</td>
        </tr>
        <tr>
          <td style={{ textAlign: 'right', fontWeight: 'bold', border: 'none' }}>Sub Total:</td>
          <td style={{ textAlign: 'right', border: 'none' }}>{subTotal}</td>
        </tr>
        <tr>
          <td style={{ textAlign: 'right', fontWeight: 'bold', border: 'none' }}>Total Due:</td>
          <td style={{ textAlign: 'right', border: 'none' }}>{totalDue}</td>
        </tr>
      </tbody>
    </table>
    <div style={{ marginTop: 24, fontSize: 13 }}>
      <div style={{ fontWeight: 'bold' }}>Notes:</div>
      <div>{notes}</div>
      <div>{bankDetails}</div>
    </div>
  </div>
);

export default InvoicePreview; 