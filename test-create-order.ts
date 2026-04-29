// using native fetch

async function testPost() {
  const payload = {
    orderName: "Complete Blood Count Test",
    hasComponents: false,
    testCode: "CBC-001",
    displayOrderName: "CBC",
    department: "HEMATOLOGY",
    amount: "450",
    processTime: "2 hours",
    machineName: "Sysmex XN-1000",
    sampleType: "Blood",
    method: "Automated",
    resultNotes: "<div class=\"page-1\">Normal range is 4.5-5.5</div>",
    advice: "Drink plenty of water",
    workSheet: "Worksheet info here",
    purpose: "Routine checkup",
    orderType: "Internal",
    ipBillingCategoryType: "Category 1",
    recurring: false,
    serviceDoctorRequired: false,
    inactive: false
  };

  try {
    const res = await fetch('http://localhost:3000/api/tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Success! Order created successfully in the backend:');
      console.log(data);
    } else {
      const errorText = await res.text();
      console.error('❌ Failed! Status:', res.status);
      console.error('Response:', errorText);
    }
  } catch (err) {
    console.error('❌ Network error:', err);
  }
}

testPost();
