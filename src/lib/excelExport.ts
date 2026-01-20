import * as XLSX from 'xlsx';
import { formatKsh } from './formatters';

export interface ExportData {
  sheetName: string;
  data: Record<string, unknown>[];
  headers?: string[];
}

export const exportToExcel = (sheets: ExportData[], filename: string) => {
  const workbook = XLSX.utils.book_new();
  
  sheets.forEach(({ sheetName, data, headers }) => {
    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    
    // Auto-size columns
    const maxWidth = 20;
    const colWidths = headers?.map(h => ({ wch: Math.min(h.length + 5, maxWidth) })) || [];
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  });
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// Revenue Report
export const generateRevenueReport = (
  revenueData: { date: string; roomRevenue?: number; posRevenue?: number; total?: number }[],
  roomBreakdown: { type: string; rooms: number; rate: number; nights: number; revenue: number }[]
) => {
  const data = revenueData.map(r => ({
    date: r.date,
    roomRevenue: r.roomRevenue ?? 0,
    posRevenue: r.posRevenue ?? 0,
    total: r.total ?? 0,
  }));

  const revenueSheet = data.map(r => ({
    'Date': r.date,
    'Room Revenue (KSH)': r.roomRevenue,
    'POS Revenue (KSH)': r.posRevenue,
    'Total (KSH)': r.total,
  }));
  
  const roomSheet = roomBreakdown.map(r => ({
    'Room Type': r.type,
    'Total Rooms': r.rooms,
    'Rate (KSH)': r.rate,
    'Nights Sold': r.nights,
    'Revenue (KSH)': r.revenue,
  }));
  
  const totals = data.reduce((acc, r) => ({
    roomRevenue: acc.roomRevenue + r.roomRevenue,
    posRevenue: acc.posRevenue + r.posRevenue,
    total: acc.total + r.total,
  }), { roomRevenue: 0, posRevenue: 0, total: 0 });
  
  revenueSheet.push({
    'Date': 'TOTAL',
    'Room Revenue (KSH)': totals.roomRevenue,
    'POS Revenue (KSH)': totals.posRevenue,
    'Total (KSH)': totals.total,
  });
  
  return [
    { sheetName: 'Daily Revenue', data: revenueSheet },
    { sheetName: 'Room Breakdown', data: roomSheet },
  ];
};

// Occupancy Report
export const generateOccupancyReport = (
  occupancyData: { date: string; occupancy: number; rooms?: number }[],
  totalRooms: number
) => {
  const data = occupancyData.map(o => ({
    date: o.date,
    occupancy: o.occupancy,
    rooms: o.rooms ?? 0,
  }));
  
  const sheet = data.map(o => ({
    'Date': o.date,
    'Occupancy %': o.occupancy,
    'Rooms Occupied': o.rooms,
    'Rooms Available': totalRooms,
    'Vacant Rooms': totalRooms - o.rooms,
  }));
  
  const avgOccupancy = data.length > 0 
    ? Math.round(data.reduce((sum, o) => sum + o.occupancy, 0) / data.length)
    : 0;
  
  sheet.push({
    'Date': 'AVERAGE',
    'Occupancy %': avgOccupancy,
    'Rooms Occupied': Math.round(data.reduce((sum, o) => sum + o.rooms, 0) / data.length),
    'Rooms Available': totalRooms,
    'Vacant Rooms': 0,
  });
  
  return [{ sheetName: 'Occupancy Report', data: sheet }];
};

// Inventory Report
export const generateInventoryReport = (
  inventory: { 
    name: string; 
    category: string; 
    currentStock: number; 
    minStock: number; 
    openingStock: number;
    purchasesIn: number;
    stockOut: number;
    unit: string;
    unitPrice: number;
  }[]
) => {
  const stockSheet = inventory.map(i => ({
    'Item Name': i.name,
    'Category': i.category,
    'Opening Stock': i.openingStock,
    'Purchases': i.purchasesIn,
    'Stock Out': i.stockOut,
    'Current Stock': i.currentStock,
    'Min Stock': i.minStock,
    'Unit': i.unit,
    'Unit Price (KSH)': i.unitPrice,
    'Stock Value (KSH)': i.currentStock * i.unitPrice,
    'Status': i.currentStock <= i.minStock ? 'LOW STOCK' : 'OK',
  }));
  
  const categoryTotals: Record<string, { items: number; value: number }> = {};
  inventory.forEach(i => {
    if (!categoryTotals[i.category]) {
      categoryTotals[i.category] = { items: 0, value: 0 };
    }
    categoryTotals[i.category].items++;
    categoryTotals[i.category].value += i.currentStock * i.unitPrice;
  });
  
  const categorySheet = Object.entries(categoryTotals).map(([category, data]) => ({
    'Category': category,
    'Total Items': data.items,
    'Total Value (KSH)': data.value,
  }));
  
  return [
    { sheetName: 'Stock Details', data: stockSheet },
    { sheetName: 'Category Summary', data: categorySheet },
  ];
};

// Expense Report
export const generateExpenseReport = (
  expenses: { category: string; description: string; amount: number; isEtims: boolean; date: string }[]
) => {
  const detailSheet = expenses.map(e => ({
    'Date': e.date,
    'Category': e.category,
    'Description': e.description,
    'Amount (KSH)': e.amount,
    'eTIMS': e.isEtims ? 'Yes' : 'No',
  }));
  
  const categoryTotals: Record<string, { etims: number; nonEtims: number }> = {};
  expenses.forEach(e => {
    if (!categoryTotals[e.category]) {
      categoryTotals[e.category] = { etims: 0, nonEtims: 0 };
    }
    if (e.isEtims) {
      categoryTotals[e.category].etims += e.amount;
    } else {
      categoryTotals[e.category].nonEtims += e.amount;
    }
  });
  
  const summarySheet = Object.entries(categoryTotals).map(([category, data]) => ({
    'Category': category,
    'eTIMS Amount (KSH)': data.etims,
    'Non-eTIMS Amount (KSH)': data.nonEtims,
    'Total (KSH)': data.etims + data.nonEtims,
  }));
  
  const totalEtims = Object.values(categoryTotals).reduce((sum, c) => sum + c.etims, 0);
  const totalNonEtims = Object.values(categoryTotals).reduce((sum, c) => sum + c.nonEtims, 0);
  
  summarySheet.push({
    'Category': 'TOTAL',
    'eTIMS Amount (KSH)': totalEtims,
    'Non-eTIMS Amount (KSH)': totalNonEtims,
    'Total (KSH)': totalEtims + totalNonEtims,
  });
  
  return [
    { sheetName: 'Expense Details', data: detailSheet },
    { sheetName: 'Category Summary', data: summarySheet },
  ];
};

// POS Sales Report
export const generatePOSSalesReport = (
  transactions: { 
    date: string; 
    guestName: string; 
    roomNumber: string; 
    items: { name: string; quantity: number; price: number }[]; 
    total: number;
    paymentMethod: string;
  }[],
  topItems: { name: string; category?: string; quantity: number; revenue: number }[]
) => {
  const salesSheet = transactions.map(t => ({
    'Date': t.date,
    'Guest': t.guestName,
    'Room': t.roomNumber,
    'Items': t.items.map(i => `${i.quantity}x ${i.name}`).join(', '),
    'Total (KSH)': t.total,
    'Payment': t.paymentMethod,
  }));
  
  const topItemsSheet = topItems.map(i => ({
    'Item': i.name,
    'Category': i.category || 'Uncategorized',
    'Quantity Sold': i.quantity,
    'Revenue (KSH)': i.revenue,
  }));
  
  return [
    { sheetName: 'Sales Transactions', data: salesSheet },
    { sheetName: 'Top Selling Items', data: topItemsSheet },
  ];
};

// Department Performance Report
export const generateDepartmentReport = (
  departments: { department: string; tasksCompleted: number; avgResponseTime?: number; satisfaction?: number }[]
) => {
  const sheet = departments.map(d => ({
    'Department': d.department,
    'Tasks Completed': d.tasksCompleted,
    'Avg Response Time (min)': d.avgResponseTime ?? 0,
    'Satisfaction %': d.satisfaction ?? 0,
  }));
  
  return [{ sheetName: 'Department Performance', data: sheet }];
};

// Comprehensive Monthly Report
export const generateMonthlyReport = (
  month: string,
  revenueData: { date: string; roomRevenue?: number; posRevenue?: number; total?: number }[],
  occupancyData: { date: string; occupancy: number; rooms?: number }[],
  departments: { department: string; tasksCompleted: number; avgResponseTime?: number; satisfaction?: number }[],
  topItems: { name: string; category?: string; quantity: number; revenue: number }[],
  expenses: { category: string; description: string; amount: number; isEtims: boolean; date: string }[]
) => {
  const normalizedRevenue = revenueData.map(r => ({
    date: r.date,
    roomRevenue: r.roomRevenue ?? 0,
    posRevenue: r.posRevenue ?? 0,
    total: r.total ?? 0,
  }));
  // Summary sheet
  const totalRevenue = normalizedRevenue.reduce((sum, r) => sum + r.total, 0);
  const totalRoomRevenue = normalizedRevenue.reduce((sum, r) => sum + r.roomRevenue, 0);
  const totalPosRevenue = normalizedRevenue.reduce((sum, r) => sum + r.posRevenue, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avgOccupancy = occupancyData.length > 0 
    ? Math.round(occupancyData.reduce((sum, o) => sum + o.occupancy, 0) / occupancyData.length)
    : 0;
  
  const summarySheet = [
    { 'Metric': 'Total Revenue', 'Value': totalRevenue, 'Unit': 'KSH' },
    { 'Metric': 'Room Revenue', 'Value': totalRoomRevenue, 'Unit': 'KSH' },
    { 'Metric': 'POS Revenue', 'Value': totalPosRevenue, 'Unit': 'KSH' },
    { 'Metric': 'Total Expenses', 'Value': totalExpenses, 'Unit': 'KSH' },
    { 'Metric': 'Gross Profit', 'Value': totalRevenue - totalExpenses, 'Unit': 'KSH' },
    { 'Metric': 'Average Occupancy', 'Value': avgOccupancy, 'Unit': '%' },
    { 'Metric': 'Total Tasks', 'Value': departments.reduce((sum, d) => sum + d.tasksCompleted, 0), 'Unit': 'tasks' },
  ];
  
  const revenueSheet = normalizedRevenue.map(r => ({
    'Date': r.date,
    'Room Revenue (KSH)': r.roomRevenue,
    'POS Revenue (KSH)': r.posRevenue,
    'Total (KSH)': r.total,
  }));
  
  const expenseSheet = expenses.map(e => ({
    'Date': e.date,
    'Category': e.category,
    'Description': e.description,
    'Amount (KSH)': e.amount,
    'eTIMS': e.isEtims ? 'Yes' : 'No',
  }));
  
  const topItemsSheet = topItems.slice(0, 20).map(i => ({
    'Item': i.name,
    'Category': i.category || 'Uncategorized',
    'Quantity': i.quantity,
    'Revenue (KSH)': i.revenue,
  }));
  
  return [
    { sheetName: 'Summary', data: summarySheet },
    { sheetName: 'Daily Revenue', data: revenueSheet },
    { sheetName: 'Expenses', data: expenseSheet },
    { sheetName: 'Top Items', data: topItemsSheet },
    { sheetName: 'Departments', data: departments.map(d => ({
      'Department': d.department,
      'Tasks': d.tasksCompleted,
      'Response Time (min)': d.avgResponseTime ?? 0,
      'Satisfaction %': d.satisfaction ?? 0,
    })) },
  ];
};
