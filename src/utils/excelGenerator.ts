import * as XLSX from 'xlsx';
import { ProjectContent, ProjectDetails } from '../types';

export const generateExcel = (details: ProjectDetails, content: ProjectContent) => {
  const wb = XLSX.utils.book_new();
  
  // Create a summary sheet with project details
  const summaryData = [
    ['Project Title', details.topic],
    ['Student Name', `${details.surname} ${details.firstName} ${details.middleName}`],
    ['Reg No', details.regNo],
    ['Department', details.department],
    ['Supervisor', details.supervisorName],
    ['Submission Date', details.submissionDate],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Project Details");

  // Parse Chapter 4 for tables
  const chapter4 = content.chapter4 || "";
  
  // Regex to find Markdown tables
  // Matches: | Header | Header | ... \n | --- | --- | ... \n | Row | Row | ...
  const tableRegex = /\|(.+)\|\n\|[-:| ]+\|\n((?:\|.*\|\n?)+)/g;
  
  let match;
  let tableCount = 1;

  while ((match = tableRegex.exec(chapter4)) !== null) {
    const headerRow = match[1].split('|').map(cell => cell.trim()).filter(cell => cell !== "");
    const bodyRows = match[2].trim().split('\n').map(row => 
      row.split('|').map(cell => cell.trim()).filter(cell => cell !== "")
    );

    const tableData = [headerRow, ...bodyRows];
    
    // Create a sheet for each table found
    const ws = XLSX.utils.aoa_to_sheet(tableData);
    
    // Try to extract a title from the text preceding the table
    // Look backwards from match.index for "Table X:" or similar
    const precedingText = chapter4.substring(Math.max(0, match.index - 100), match.index);
    const titleMatch = precedingText.match(/Table \d+:? .*/i);
    let sheetName = `Table ${tableCount}`;
    
    if (titleMatch) {
      // Use part of the title for sheet name, but keep it short (max 31 chars for Excel)
      // sheetName = titleMatch[0].substring(0, 31).replace(/[\\/?*[\]]/g, "");
    }

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    tableCount++;
  }

  if (tableCount === 1) {
    // No tables found, maybe add a placeholder sheet
    const wsEmpty = XLSX.utils.aoa_to_sheet([["No tables found in Chapter 4"]]);
    XLSX.utils.book_append_sheet(wb, wsEmpty, "Data Analysis");
  }

  // Generate file name
  const fileName = `${details.surname}_Data_Analysis.xlsx`;
  
  // Download file
  XLSX.writeFile(wb, fileName);
};
