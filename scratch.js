const fs = require('fs');

function processFile(filePath, componentName) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Add Suspense and useSearchParams import
  if (!content.includes('useSearchParams')) {
    content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect, Suspense } from 'react';\nimport { useSearchParams } from 'next/navigation';");
  }

  // Find the component definition
  const regex = new RegExp(`export default function ${componentName}\\(\\) \\{`);
  content = content.replace(regex, `function ${componentName}Content() {`);

  // Inject searchParams usage
  content = content.replace(`function ${componentName}Content() {`, `function ${componentName}Content() {\n  const searchParams = useSearchParams();\n  const fromDate = searchParams.get('fromDate') || '';\n  const toDate = searchParams.get('toDate') || '';\n`);

  // Replace fetching logic
  const fetchLogicRegex = /fetch\('\/api\/bills\/in-process'\)\s*\.then\(res => res\.json\(\)\)\s*\.then\(bills => \{([\s\S]*?)setLoading\(false\);\s*\}\)/;
  
  const fetchMatch = content.match(fetchLogicRegex);
  if (fetchMatch) {
    const newFetchLogic = `fetch('/api/bills/in-process')
      .then(res => res.json())
      .then(bills => {
        if (Array.isArray(bills)) {
          // Parse dates for filtering
          // fromDate/toDate format is DD-Mon-YYYY
          const parseDateStr = (dStr: string) => {
            if (!dStr) return null;
            const parts = dStr.split('-');
            if (parts.length !== 3) return null;
            const months: Record<string, number> = { 'Jan':0, 'Feb':1, 'Mar':2, 'Apr':3, 'May':4, 'Jun':5, 'Jul':6, 'Aug':7, 'Sep':8, 'Oct':9, 'Nov':10, 'Dec':11 };
            return new Date(parseInt(parts[2]), months[parts[1]], parseInt(parts[0]));
          };

          const fDate = parseDateStr(fromDate);
          const tDate = parseDateStr(toDate);

          let filtered = bills;
          if (fDate && tDate) {
            // Set tDate to end of day
            tDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter((b: any) => {
              const bd = new Date(b.billDate);
              return bd >= fDate && bd <= tDate;
            });
          }
          
          setData(filtered);
          
          // Re-calculate the specific counts/aggregates if needed...
          // We will let the individual components handle that if they have it, but for non-financial they just set the data.
          // Wait, non-financial-status calculates counts. Let me just replace the date finding part.
        }
        setLoading(false);
      })`;
      
      // I should do it file by file manually using replace_file_content instead of scripting, it's safer.
  }

}
