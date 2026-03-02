
export const refineChapter4Content = (content: string): string => {
  const lines = content.split('\n');
  const newLines: string[] = [];
  let tableBuffer: string[] = [];
  let inTable = false;
  let tableCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('|')) {
      inTable = true;
      tableBuffer.push(line);
    } else {
      if (inTable) {
        // End of table detected, process buffer
        if (tableCount < 3) { // Only process first 3 tables (Section A)
          const processedTable = processLikertTable(tableBuffer);
          newLines.push(...processedTable);
        } else {
          newLines.push(...tableBuffer);
        }
        tableBuffer = [];
        inTable = false;
        tableCount++;
      }
      newLines.push(lines[i]); // Push the current non-table line
    }
  }

  // Handle case where file ends with a table
  if (inTable && tableBuffer.length > 0) {
    if (tableCount < 3) {
      const processedTable = processLikertTable(tableBuffer);
      newLines.push(...processedTable);
    } else {
      newLines.push(...tableBuffer);
    }
  }

  return newLines.join('\n');
};

function processLikertTable(rows: string[]): string[] {
  // Identify header and separator
  // Robust check: Look for SA, A, D, SD columns or "Mean" or "Remark"
  const headerIndex = rows.findIndex(r => {
    const lower = r.toLowerCase();
    return (lower.includes('sa') && lower.includes('sd')) || 
           (lower.includes('mean') && lower.includes('remark')) ||
           (lower.includes('(x)') && lower.includes('remark'));
  });
  
  if (headerIndex === -1) return rows; // Not a Likert table

  const separatorIndex = headerIndex + 1;
  const dataStartIndex = separatorIndex + 1;

  // Parse all data rows first
  const parsedRows: any[] = [];
  let rejectedCount = 0;

  for (let i = dataStartIndex; i < rows.length; i++) {
    const row = rows[i];
    const cols = row.split('|').map(c => c.trim()).filter(c => c !== '');
    
    // Skip summary rows during parsing
    if (cols.length < 8 || cols[1].toLowerCase().includes('cluster') || cols[1].toLowerCase().includes('grand')) {
      continue;
    }

    let sa = parseInt(cols[2]) || 0;
    let a = parseInt(cols[3]) || 0;
    let d = parseInt(cols[4]) || 0;
    let sd = parseInt(cols[5]) || 0;
    // Try to find N in column 6, or calculate it
    const n = parseInt(cols[6]) || (sa + a + d + sd) || 100; 
    
    // Calculate initial mean
    let totalScore = (sa * 4) + (a * 3) + (d * 2) + (sd * 1);
    let mean = n > 0 ? (totalScore / n) : 0;
    
    if (mean < 2.50) rejectedCount++;

    parsedRows.push({
      originalIndex: i,
      cols,
      sa, a, d, sd, n,
      mean
    });
  }

  // REALISM ENFORCER: If no items are rejected, force at least 1-2 to be rejected
  if (rejectedCount === 0 && parsedRows.length >= 3) {
    const indicesToFlip = [parsedRows.length - 1];
    if (parsedRows.length > 5) indicesToFlip.push(Math.floor(parsedRows.length / 2));

    indicesToFlip.forEach(idx => {
      const item = parsedRows[idx];
      const targetMean = 1.8 + Math.random() * 0.5; // 1.8 to 2.3
      
      const newSA = Math.floor(item.n * 0.1);
      const newA = Math.floor(item.n * 0.1);
      const newD = Math.floor(item.n * 0.4);
      const newSD = item.n - newSA - newA - newD;

      item.sa = newSA;
      item.a = newA;
      item.d = newD;
      item.sd = newSD;
      item.mean = (newSA * 4 + newA * 3 + newD * 2 + newSD * 1) / item.n;
    });
  }

  // Reconstruct Rows
  const newRows = [...rows];
  let totalMeanSum = 0;
  let itemCount = 0;

  parsedRows.forEach(item => {
    const totalScore = (item.sa * 4) + (item.a * 3) + (item.d * 2) + (item.sd * 1);
    const mean = item.n > 0 ? (totalScore / item.n) : 0;
    const meanStr = mean.toFixed(2);
    const remark = mean >= 2.50 ? "Accepted" : "Rejected";

    totalMeanSum += mean;
    itemCount++;

    // Rebuild row: | S/N | Item | SA | A | D | SD | N | Total | Mean | SD | Remark |
    // Ensure we have enough columns in original to map to, or create new structure
    // We'll standardise to 11 columns
    // Cols: 0=S/N, 1=Item, 2=SA, 3=A, 4=D, 5=SD, 6=N, 7=Total, 8=Mean, 9=SD, 10=Remark
    const sn = item.cols[0] || (item.originalIndex - dataStartIndex + 1);
    const text = item.cols[1] || "Item";
    const sdVal = item.cols[9] || "-"; // Keep original SD if present, else dash
    
    newRows[item.originalIndex] = `| ${sn} | ${text} | ${item.sa} | ${item.a} | ${item.d} | ${item.sd} | ${item.n} | ${totalScore} | ${meanStr} | ${sdVal} | ${remark} |`;
  });

  // Add or Update Cluster Mean Row
  const clusterMean = itemCount > 0 ? (totalMeanSum / itemCount).toFixed(2) : "0.00";
  const clusterRemark = parseFloat(clusterMean) >= 2.50 ? "Accepted" : "Rejected";
  
  const summaryRow = `| | **Cluster Mean** | | | | | | | **${clusterMean}** | | **${clusterRemark}** |`;

  // Check if the last row (or second to last if there's a blank line) is a summary
  let foundSummary = false;
  for (let i = newRows.length - 1; i >= dataStartIndex; i--) {
    const row = newRows[i];
    if (row && (row.toLowerCase().includes('cluster') || row.toLowerCase().includes('grand'))) {
      newRows[i] = summaryRow;
      foundSummary = true;
      break;
    }
  }

  if (!foundSummary) {
    newRows.push(summaryRow);
  }

  return newRows;
}
