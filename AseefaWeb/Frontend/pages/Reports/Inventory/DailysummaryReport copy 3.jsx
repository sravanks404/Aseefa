import React, { useState, useEffect } from 'react';
import api from "../../apiService";
import ExpandableCustomerRow from '../Inventory/ExpandableCustomerRow';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  ButtonGroup,
  TableRow,
  TablePagination,
  Card,
  CardContent,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Chip,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Divider,
  LinearProgress,
  Avatar,
  InputAdornment,
  Pagination,
  Collapse,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormGroup,
  FormControlLabel,
  DialogContentText,
  Snackbar
} from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptIcon from '@mui/icons-material/Receipt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EmailIcon from '@mui/icons-material/Email';
import ScheduleIcon from '@mui/icons-material/Schedule';
import FilterListIcon from '@mui/icons-material/FilterList';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import DescriptionIcon from '@mui/icons-material/Description';
import CloseIcon from '@mui/icons-material/Close';
// Customer Card Component
const CustomerCard = ({ customer, formatCurrency }) => {
  const [expanded, setExpanded] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const statusColor = customer.Outstanding === 0 ? 'success' :
                     customer.Outstanding <= 5000 ? 'warning' : 'error';
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };
  const handleRowExpand = (customerId) => {
  setExpandedRows(prev => ({
    ...prev,
    [customerId]: !prev[customerId]
  }));
};
// Add this function to create company header
  return (
    <Card sx={{
      borderRadius: 2,
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
      }
    }}>
      {/* Header */}
      <Box sx={{
        p: 2,
        bgcolor: 'primary.main',
        color: 'white',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'white',
                color: 'primary.main',
                fontWeight: 'bold'
              }}
            >
              {customer.AccountName ? customer.AccountName.charAt(0).toUpperCase() : 'C'}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" noWrap sx={{ maxWidth: 150 }}>
                {customer.AccountName || 'Unknown Customer'}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                ID: {customer.CustomerID} • {customer.CreditDays || 0} days credit
              </Typography>
            </Box>
          </Box>
       
          <Chip
            label={customer.Outstanding === 0 ? 'Clear' : 'Pending'}
            size="small"
            color={statusColor}
            sx={{ fontWeight: 'bold', color: 'white' }}
          />
        </Box>
      </Box>
   
      {/* Quick Stats */}
      <CardContent sx={{ p: 2 }}>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="caption" color="textSecondary" display="block">
                Sales
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {formatCurrency(customer.BillAmount)}
              </Typography>
            </Box>
          </Grid>
       
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="caption" color="textSecondary" display="block">
                Collections
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="success.main">
                {formatCurrency(customer.ReceiptAmount)}
              </Typography>
            </Box>
          </Grid>
       
          <Grid item xs={12}>
            <Box sx={{
              mt: 1,
              p: 1.5,
              bgcolor: customer.Outstanding > 0 ? '#fff8e1' : '#e8f5e9',
              borderRadius: 1,
              border: `1px solid ${customer.Outstanding > 0 ? '#ffd54f' : '#c8e6c9'}`
            }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" fontWeight="medium">
                  Outstanding Balance
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  color={customer.Outstanding > 0 ? 'error' : 'success'}
                >
                  {formatCurrency(customer.Outstanding)}
                </Typography>
              </Box>
           
              {customer.Outstanding > 0 && (
                <Box sx={{ mt: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((customer.Outstanding / (customer.BillAmount + customer.OpeningBalance)) * 100, 100)}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: '#ffcdd2',
                      '& .MuiLinearProgress-bar': { bgcolor: '#f44336' }
                    }}
                  />
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                    {((customer.Outstanding / (customer.BillAmount + customer.OpeningBalance)) * 100).toFixed(1)}% of total
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
   
      {/* Expandable Details */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={{ pt: 0 }}>
          <Divider sx={{ my: 1 }} />
       
          <Grid container spacing={2}>
            {/* Sales Breakdown */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom color="textSecondary">
                Sales Breakdown
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Box sx={{ p: 1, bgcolor: '#f0f7ff', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Cash Sales
                    </Typography>
                    <Typography variant="body2" fontWeight="medium" color="success.main">
                      {formatCurrency(customer.BillCash)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 1, bgcolor: '#fff0f7', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Credit Sales
                    </Typography>
                    <Typography variant="body2" fontWeight="medium" color="warning.main">
                      {formatCurrency(customer.BillCredit)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
         
            {/* Collections Breakdown */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom color="textSecondary">
                Collections Breakdown
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f0f9ff', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Cash
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(customer.ReceiptCash)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f0f9ff', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary" display="block">
                      NEFT
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(customer.ReceiptNEFT)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f0f9ff', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Bank
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(customer.ReceiptBank)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
         
            {/* Additional Info */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom color="textSecondary">
                Additional Information
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Opening Balance
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(customer.OpeningBalance)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Returns
                    </Typography>
                    <Typography variant="body2" fontWeight="medium" color="error">
                      {formatCurrency(customer.ReturnedBillAmount)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="caption" color="textSecondary" display="block">
                      30 Days Sales
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(customer.SalesIn30Days)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="caption" color="textSecondary" display="block">
                      30 Days Collection
                    </Typography>
                    <Typography variant="body2" fontWeight="medium" color="success.main">
                      {formatCurrency(customer.Collection30Days)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
         
            {/* Dates */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom color="textSecondary">
                Activity Dates
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <Box>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Last Billed
                    </Typography>
                    <Typography variant="caption" fontWeight="medium">
                      {customer.LastBilledOn && customer.LastBilledOn !== '1900-01-01'
                        ? new Date(customer.LastBilledOn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                        : 'Never'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Last Visited
                    </Typography>
                    <Typography variant="caption" fontWeight="medium">
                      {customer.LastVisitedOn && customer.LastVisitedOn !== '1900-01-01'
                        ? new Date(customer.LastVisitedOn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                        : 'Never'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Last Payment
                    </Typography>
                    <Typography variant="caption" fontWeight="medium">
                      {customer.LastPaymentOn && customer.LastPaymentOn !== '1900-01-01'
                        ? new Date(customer.LastPaymentOn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                        : 'Never'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
         
            {/* Status Indicators */}
            <Grid item xs={12}>
              <Box display="flex" gap={1} flexWrap="wrap">
                {customer.AgingCount > 0 && (
                  <Chip
                    icon={<ScheduleIcon sx={{ fontSize: 14 }} />}
                    label={`${customer.AgingCount} overdue`}
                    size="small"
                    color="error"
                    variant="outlined"
                  />
                )}
                {customer.HoldingCheque > 0 && (
                  <Chip
                    icon={<AccountBalanceIcon sx={{ fontSize: 14 }} />}
                    label={`Cheque: ${formatCurrency(customer.HoldingCheque)}`}
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Collapse>
   
      {/* Footer Actions */}
      <CardActions sx={{ p: 1, justifyContent: 'space-between' }}>
        <Button
          size="small"
          onClick={handleExpandClick}
          startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        >
          {expanded ? 'Show Less' : 'View Details'}
        </Button>
     
        <Box>
          <Tooltip title="View Full Details">
            <IconButton size="small">
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Send Reminder">
            <IconButton size="small" disabled={customer.Outstanding <= 0}>
              <EmailIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Payment History">
            <IconButton size="small">
              <ReceiptIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );
};
const DailySummary = () => {
  const companyID = sessionStorage.getItem("CompanyID");
  const [data, setData] = useState({
    summary: [],
    customers: [],
    expenses: [],
    stockMovement: []
  });
  const [loading, setLoading] = useState(false);
  const [salesmenLoading, setSalesmenLoading] = useState(false);
  const [error, setError] = useState('');
  const [salesmen, setSalesmen] = useState([]);
  const [filters, setFilters] = useState({
    CompanyID: companyID || '',
    FromDate: new Date().toISOString().split('T')[0],
    ToDate: new Date().toISOString().split('T')[0],
    SalesmanID: ''
  });
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('outstanding');
  const [filterBy, setFilterBy] = useState('all');
    const [companyData, setCompanyData] = useState(null);
  // Excel Export States
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    summary: true,
    customers: true,
    expenses: true,
    stockMovement: true,
    customerItems: true, // Add this
    includeAllCustomers: true
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
    useEffect(() => {
    const storedCompanyData = sessionStorage.getItem("companyResponse");
    if (storedCompanyData) {
      setCompanyData(JSON.parse(storedCompanyData));
    }
  }, []);
  // Fetch salesmen list when component mounts
  useEffect(() => {
    const fetchSalesmen = async () => {
      const currentCompanyID = filters.CompanyID || companyID;
   
      if (!currentCompanyID) {
        console.log("No CompanyID found for fetching salesmen");
        return;
      }
   
      setSalesmenLoading(true);
      try {
        const response = await api.get(`/api/GetUser`, {
          params: {
            CompanyID: currentCompanyID
          }
        });
     
        if (response.data && Array.isArray(response.data)) {
          setSalesmen(response.data);
        } else {
          console.error("Unexpected response format:", response.data);
          setSalesmen([]);
        }
      } catch (err) {
        console.error('Failed to fetch salesmen:', err);
        setError('Failed to load salesmen list');
        setSalesmen([]);
      } finally {
        setSalesmenLoading(false);
      }
    };
 
    fetchSalesmen();
  }, [filters.CompanyID, companyID]);
  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };
  const createCompanyHeader = () => {
    return [
      // Company details (merged cells style)
      [companyData?.CompanyName || 'Company Name'],
      [], // Empty row for spacing
      ['DAILY SUMMARY REPORT'],
      [`Date Range: ${filters.FromDate} to ${filters.ToDate}`],
      [`Salesman: ${filters.SalesmanID ? salesmen.find(s => s.UserId === filters.SalesmanID)?.Name || 'All' : 'All Salesmen'}`],
      [], // Empty row for spacing
    ];
  };
const fetchData = async () => {
  if (!filters.CompanyID || !filters.FromDate || !filters.ToDate) {
    setError('CompanyID, FromDate, and ToDate are required');
    return;
  }
  setLoading(true);
  setError('');
  try {
    const params = new URLSearchParams({
      CompanyID: filters.CompanyID,
      FromDate: filters.FromDate,
      ToDate: filters.ToDate,
      ...(filters.SalesmanID && { SalesmanID: filters.SalesmanID })
    });
    const response = await api.get(`/api/DailySummary?${params}`);
 
    if (response.data && response.data.length >= 4) {
      const customers = response.data[1] || [];
   
      // Process customers to parse BilledItems JSON
      const processedCustomers = customers.map(customer => {
        // You might want to process BilledItems here if needed
        return customer;
      });
   
      setData({
        summary: response.data[0] || [],
        customers: processedCustomers,
        expenses: response.data[2] || [],
        stockMovement: response.data[3] || []
      });
    } else {
      setData({
        summary: [],
        customers: [],
        expenses: [],
        stockMovement: []
      });
    }
  } catch (err) {
    console.error('Failed to fetch data:', err);
    setError(err.response?.data?.error || err.message || 'Failed to fetch data');
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    if (filters.CompanyID && filters.FromDate && filters.ToDate) {
      fetchData();
    }
  }, [filters.CompanyID]);
  // Calculate totals from customers for the summary card
  const calculateCustomerTotals = () => {
    const totals = {
      totalBillAmount: data.customers.reduce((sum, cust) => sum + (cust.BillAmount || 0), 0),
      totalBillCash: data.customers.reduce((sum, cust) => sum + (cust.BillCash || 0), 0),
      totalBillCredit: data.customers.reduce((sum, cust) => sum + (cust.BillCredit || 0), 0),
      totalReceiptCash: data.customers.reduce((sum, cust) => sum + (cust.ReceiptCash || 0), 0),
      totalReceiptNEFT: data.customers.reduce((sum, cust) => sum + (cust.ReceiptNEFT || 0), 0),
      totalReceiptBank: data.customers.reduce((sum, cust) => sum + (cust.ReceiptBank || 0), 0),
      totalReceiptAmount: data.customers.reduce((sum, cust) => sum + (cust.ReceiptAmount || 0), 0),
      totalReturnedBill: data.customers.reduce((sum, cust) => sum + (cust.ReturnedBillAmount || 0), 0),
      totalOpeningBal: data.customers.reduce((sum, cust) => sum + (cust.OpeningBalance || 0), 0),
      totalDebitAmount: data.customers.reduce((sum, cust) => sum + (cust.DebitAmount || 0), 0),
      totalCreditAmount: data.customers.reduce((sum, cust) => sum + (cust.CreditAmount || 0), 0),
      totalOutstanding: data.customers.reduce((sum, cust) => sum + (cust.Outstanding || 0), 0),
      totalSalesIn30Days: data.customers.reduce((sum, cust) => sum + (cust.SalesIn30Days || 0), 0),
      totalCollection30Days: data.customers.reduce((sum, cust) => sum + (cust.Collection30Days || 0), 0),
      totalAgingCount: data.customers.reduce((sum, cust) => sum + (cust.AgingCount || 0), 0),
      totalHoldingCheque: data.customers.reduce((sum, cust) => sum + (cust.HoldingCheque || 0), 0)
    };
 
    // Calculate percentages
    totals.cashPercentage = totals.totalBillAmount > 0
      ? ((totals.totalBillCash / totals.totalBillAmount) * 100).toFixed(1)
      : 0;
    totals.creditPercentage = totals.totalBillAmount > 0
      ? ((totals.totalBillCredit / totals.totalBillAmount) * 100).toFixed(1)
      : 0;
    totals.collectionRatio = totals.totalBillAmount > 0
      ? ((totals.totalReceiptAmount / totals.totalBillAmount) * 100).toFixed(1)
      : 0;
 
    return totals;
  };
  const customerTotals = calculateCustomerTotals();
  // Prepare chart data
  const summaryChartData = data.summary.filter(item => item.Description !== 'Balance');
const customerOutstandingData = data.customers
  .slice(0, 10)
  .filter(cust => (cust.Outstanding || 0) > 0) // Only positive outstanding
  .map(cust => ({
    name: cust.AccountName ?
      (cust.AccountName.substring(0, 15) + (cust.AccountName.length > 15 ? '...' : '')) :
      `Customer ${cust.CustomerID || 'Unknown'}`,
    value: Math.abs(cust.Outstanding || 0)
  }))
  .sort((a, b) => b.value - a.value);
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  // Format currency for display
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  // Format currency for Excel (without symbol for calculations)
  const formatCurrencyForExcel = (value) => {
    if (value === null || value === undefined) return 0;
    return Number(value);
  };
  // Filter and sort customers
  const getFilteredAndSortedCustomers = () => {
    let filtered = [...data.customers];
 
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(customer =>
        customer.AccountName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.CustomerID?.toString().includes(searchQuery)
      );
    }
 
    // Filter by condition
    if (filterBy === 'outstanding') {
      filtered = filtered.filter(customer => customer.Outstanding > 0);
    } else if (filterBy === 'aging') {
      filtered = filtered.filter(customer => customer.AgingCount > 0);
    } else if (filterBy === 'holdingCheque') {
      filtered = filtered.filter(customer => customer.HoldingCheque > 0);
    }
 
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'outstanding':
          return (b.Outstanding || 0) - (a.Outstanding || 0);
        case 'outstandingLow':
          return (a.Outstanding || 0) - (b.Outstanding || 0);
        case 'sales':
          return (b.BillAmount || 0) - (a.BillAmount || 0);
        case 'name':
          return (a.AccountName || '').localeCompare(b.AccountName || '');
        default:
          return 0;
      }
    });
 
    return filtered;
  };
  const displayedCustomers = getFilteredAndSortedCustomers();
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const handlePrint = () => {
    window.print();
  };
  // Excel Export Functions
  const prepareExpensesSheet = () => {
    const expenseData = data.expenses.map(expense => ({
      'Date': expense.Date ? new Date(expense.Date).toLocaleDateString('en-IN') : 'N/A',
      'Expense Name': expense.ExpenceName || 'Unknown',
      'Amount': formatCurrencyForExcel(expense.Amount),
      'Percentage': expense.TotalAmount > 0
        ? `${((expense.Amount / expense.TotalAmount) * 100).toFixed(1)}%`
        : '0%'
    }));
    // Add totals row
    if (expenseData.length > 0) {
      expenseData.push({
        'Expense Name': 'TOTAL EXPENSES',
        'Amount': expenseData.reduce((sum, row) => sum + (row['Amount'] || 0), 0),
        'Percentage': '100%'
      });
    }
    return {
      sheetName: 'Expenses',
      data: expenseData,
      columns: [
        { header: 'Date', key: 'Date', width: 12 },
        { header: 'Expense Name', key: 'Expense Name', width: 30 },
        { header: 'Amount', key: 'Amount', width: 15 },
        { header: 'Percentage', key: 'Percentage', width: 12 }
      ]
    };
  };
  const prepareStockMovementSheet = () => {
    const stockData = data.stockMovement.map(item => ({
      'Item Description': item.ItemDescription || 'Unknown',
      'Category': item.Category || 'N/A',
      'MRP': formatCurrencyForExcel(item.MRP),
      'Opening Stock': item.Opening || 0,
      'Dealer Stock': item.DealerStock || 0,
      'Sold Quantity': item.Sold || 0,
      'Damage Quantity': item.Damage || 0,
   
      'Free Quantity': item.Free || 0,
      'Closing Stock': item.Closing || 0,
      'Damage Value': formatCurrencyForExcel(item.DamageValue),
      'Free Value': formatCurrencyForExcel(item.FreeValue)
    }));
    // Add totals row
    if (stockData.length > 0) {
      stockData.push({
        'Item Description': 'TOTAL',
        'Opening Stock': stockData.reduce((sum, row) => sum + (row['Opening Stock'] || 0), 0),
        'Dealer Stock': stockData.reduce((sum, row) => sum + (row['Dealer Stock'] || 0), 0),
        'Sold Quantity': stockData.reduce((sum, row) => sum + (row['Sold Quantity'] || 0), 0),
        'Damage Quantity': stockData.reduce((sum, row) => sum + (row['Damage Quantity'] || 0), 0),
        'Free Quantity': stockData.reduce((sum, row) => sum + (row['Free Quantity'] || 0), 0),
        'Closing Stock': stockData.reduce((sum, row) => sum + (row['Closing Stock'] || 0), 0),
        'Damage Value': stockData.reduce((sum, row) => sum + (row['Damage Value'] || 0), 0),
        'Free Value': stockData.reduce((sum, row) => sum + (row['Free Value'] || 0), 0)
      });
    }
    return {
      sheetName: 'Stock Movement',
      data: stockData,
      columns: [
        { header: 'Item Description', key: 'Item Description', width: 30 },
        { header: 'Category', key: 'Category', width: 20 },
        { header: 'MRP', key: 'MRP', width: 15 },
        { header: 'Opening Stock', key: 'Opening Stock', width: 15 },
        { header: 'Dealer Stock', key: 'Dealer Stock', width: 15 },
        { header: 'Sold Quantity', key: 'Sold Quantity', width: 15 },
        { header: 'Damage Quantity', key: 'Damage Quantity', width: 15 },
        { header: 'Free Quantity', key: 'Free Quantity', width: 15 },
        { header: 'Closing Stock', key: 'Closing Stock', width: 15 },
        { header: 'Damage Value', key: 'Damage Value', width: 15 },
        { header: 'Free Value', key: 'Free Value', width: 15 }
      ]
    };
  };
// Update the prepareSummarySheet function (remove Grand Total)
const prepareSummarySheet = () => {
  const summaryData = data.summary.map(item => ({
    'Description': item.Description || '',
    'Sales Amount': formatCurrencyForExcel(item.Sales),
    'Cash': formatCurrencyForExcel(item.Cash),
    'Bank/UPI': formatCurrencyForExcel(item['Bank/UPI']),
    'Cheque': formatCurrencyForExcel(item.Cheque),
    'Total Collection': formatCurrencyForExcel(item['Total Collection'])
  }));
  // Keep all rows including Balance
  return {
    sheetName: 'Summary',
    data: summaryData,
    columns: [
      { header: 'Description', key: 'Description', width: 25 },
      { header: 'Sales Amount', key: 'Sales Amount', width: 15 },
      { header: 'Cash', key: 'Cash', width: 15 },
      { header: 'Bank/UPI', key: 'Bank/UPI', width: 15 },
      { header: 'Cheque', key: 'Cheque', width: 15 },
      { header: 'Total Collection', key: 'Total Collection', width: 15 }
    ]
  };
};
// Updated prepareCustomersSheet to use array-of-arrays for better column control, without Customer ID, and repeat headers for each customer
const prepareCustomersSheet = () => {
  const customersToExport = exportOptions.includeAllCustomers
    ? data.customers
    : displayedCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Define headers matching the desired structure (starting with Customer Name, no ID)
  const headers = [
    'Customer Name',
    'Credit Days',
    'Opening Balance',
    'Bill Amount',
    'Bill Cash',
    'Bill Credit',
    'Receipt Cash',
    'Receipt NEFT',
    'Receipt Bank',
    'Receipt Total',
    'Returned',
    'Debit',
    'Credit',
    'Outstanding',
    'Aging',
    'Last Billed',
    'Sales 30 Days',
    'Last Visited',
    'Collection 30 Days',
    'Last Payment',
    'Holding Cheque'
  ];

  const contentData = [];

  // Indices for grand totals (numeric columns, adjusted without ID)
  const totalIndices = {
    opening: 2,
    billAmount: 3,
    billCash: 4,
    billCredit: 5,
    receiptCash: 6,
    receiptNEFT: 7,
    receiptBank: 8,
    receiptTotal: 9,
    returned: 10,
    debit: 11,
    credit: 12,
    outstanding: 13,
    sales30: 16,
    collection30: 18,
    holding: 20
  };

  let grandTotals = new Array(headers.length).fill(0);

  customersToExport.forEach((customer) => {
    // Push headers for each customer
    contentData.push([...headers]);

    // Customer row (adjusted indices)
    const row = new Array(headers.length).fill('');
    row[0] = customer.AccountName || 'Unknown';
    row[1] = customer.CreditDays || 0;
    row[2] = formatCurrencyForExcel(customer.OpeningBalance);
    row[3] = formatCurrencyForExcel(customer.BillAmount);
    row[4] = formatCurrencyForExcel(customer.BillCash);
    row[5] = formatCurrencyForExcel(customer.BillCredit);
    row[6] = formatCurrencyForExcel(customer.ReceiptCash);
    row[7] = formatCurrencyForExcel(customer.ReceiptNEFT);
    row[8] = formatCurrencyForExcel(customer.ReceiptBank);
    row[9] = formatCurrencyForExcel(customer.ReceiptAmount);
    row[10] = formatCurrencyForExcel(customer.ReturnedBillAmount);
    row[11] = formatCurrencyForExcel(customer.DebitAmount);
    row[12] = formatCurrencyForExcel(customer.CreditAmount);
    row[13] = formatCurrencyForExcel(customer.Outstanding);
    row[14] = customer.AgingCount || 0;
    row[15] = customer.LastBilledOn && customer.LastBilledOn !== '1900-01-01'
      ? new Date(customer.LastBilledOn).toLocaleDateString('en-IN')
      : 'Never';
    row[16] = formatCurrencyForExcel(customer.SalesIn30Days);
    row[17] = customer.LastVisitedOn && customer.LastVisitedOn !== '1900-01-01'
      ? new Date(customer.LastVisitedOn).toLocaleDateString('en-IN')
      : 'Never';
    row[18] = formatCurrencyForExcel(customer.Collection30Days);
    row[19] = customer.LastPaymentOn && customer.LastPaymentOn !== '1900-01-01'
      ? new Date(customer.LastPaymentOn).toLocaleDateString('en-IN')
      : 'Never';
    row[20] = formatCurrencyForExcel(customer.HoldingCheque);

    contentData.push(row);

    // Update grand totals (only for customer-level numeric fields)
    Object.keys(totalIndices).forEach(key => {
      const idx = totalIndices[key];
      grandTotals[idx] += Number(row[idx]) || 0;
    });

    // Billed items section if available and customerItems enabled
    if (exportOptions.customerItems && customer.BilledItems) {
      try {
        const billedItems = JSON.parse(customer.BilledItems);
        if (Array.isArray(billedItems) && billedItems.length > 0) {
          // Sub-header row
          const subRow = new Array(headers.length).fill('');
          subRow[0] = 'BILLED ITEMS:';
          contentData.push(subRow);

          // Item header row (updated: removed Rate and Amount, added Damage, Replaced, Dealer Stock)
          const itemHeader = new Array(headers.length).fill('');
          itemHeader[0] = 'Sl.No';
          itemHeader[1] = 'Item Name';
          itemHeader[2] = 'Sale Qty';
          itemHeader[3] = 'Free Qty';
          itemHeader[4] = 'Total Qty';
          itemHeader[5] = 'Damage';
          itemHeader[6] = 'Replaced';
          itemHeader[7] = 'Dealer Stock';
          // Rest empty
          contentData.push(itemHeader);

          // Item rows (updated columns)
          let itemsTotalSale = 0;
          let itemsTotalFree = 0;
          let itemsTotalDamage = 0;
          let itemsTotalReplaced = 0;
          let itemsTotalDealerStock = 0;
          billedItems.forEach((item, idx) => {
            const iRow = new Array(headers.length).fill('');
            iRow[0] = idx + 1;
            iRow[1] = item.ItemName || 'Unknown Item';
            const saleQty = item.SaleQty || 0;
            const freeQty = item.FreeQty || 0;
            const damageQty = item.DamageQty || 0;
            const replacedQty = item.ReplacedQty || 0;
            const dealerStock = item.DealerStock || 0;
            iRow[2] = saleQty;
            iRow[3] = freeQty;
            iRow[4] = saleQty + freeQty;
            iRow[5] = damageQty;
            iRow[6] = replacedQty;
            iRow[7] = dealerStock;
            // Columns 8+ empty
            contentData.push(iRow);

            itemsTotalSale += saleQty;
            itemsTotalFree += freeQty;
            itemsTotalDamage += damageQty;
            itemsTotalReplaced += replacedQty;
            itemsTotalDealerStock += dealerStock;
          });

          // Items total row (updated)
          const itemsTotalRow = new Array(headers.length).fill('');
          itemsTotalRow[0] = 'Items Total:';
          itemsTotalRow[2] = itemsTotalSale;
          itemsTotalRow[3] = itemsTotalFree;
          itemsTotalRow[4] = itemsTotalSale + itemsTotalFree;
          itemsTotalRow[5] = itemsTotalDamage;
          itemsTotalRow[6] = itemsTotalReplaced;
          itemsTotalRow[7] = itemsTotalDealerStock;
          // Columns 1, 8+ empty for totals
          contentData.push(itemsTotalRow);

          // Empty row for spacing
          contentData.push(new Array(headers.length).fill(''));
        }
      } catch (error) {
        console.error('Error parsing BilledItems for customer', customer.CustomerID, error);
      }
    }

    // Empty row between customers for better separation
    if (customersToExport.indexOf(customer) < customersToExport.length - 1) {
      contentData.push(new Array(headers.length).fill(''));
    }
  });

  // Grand total section: push headers then total row
  if (customersToExport.length > 0) {
    contentData.push([...headers]);
    const gtRow = new Array(headers.length).fill('');
    gtRow[0] = 'GRAND TOTAL';
    // Place totals in appropriate columns
    gtRow[2] = grandTotals[2];  // Opening
    gtRow[3] = grandTotals[3];  // Bill Amount
    gtRow[4] = grandTotals[4];  // Bill Cash
    gtRow[5] = grandTotals[5];  // Bill Credit
    gtRow[6] = grandTotals[6];  // Receipt Cash
    gtRow[7] = grandTotals[7];  // Receipt NEFT
    gtRow[8] = grandTotals[8];  // Receipt Bank
    gtRow[9] = grandTotals[9];  // Receipt Total
    gtRow[10] = grandTotals[10];  // Returned
    gtRow[11] = grandTotals[11];  // Debit
    gtRow[12] = grandTotals[12];  // Credit
    gtRow[13] = grandTotals[13];  // Outstanding
    gtRow[16] = grandTotals[16];  // Sales 30 Days
    gtRow[18] = grandTotals[18];  // Collection 30 Days
    gtRow[20] = grandTotals[20];  // Holding Cheque
    contentData.push(gtRow);
  }

  return {
    sheetName: 'Customers',
    data: contentData,  // Now array-of-arrays
    columns: headers.map(header => ({ header, key: header, width: 15 })),  // Approximate widths
    isAoa: true  // Flag for aoa_to_sheet
  };
};
  const exportToExcel = () => {
  setExportLoading(true);
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
 
    // Add metadata
    workbook.Props = {
      Title: `Daily Summary Report - ${filters.FromDate} to ${filters.ToDate}`,
      Subject: 'Daily Summary Report',
      Author: 'System',
      CreatedDate: new Date()
    };
 
    // Prepare sheets based on selected options
    const sheets = [];
 
    if (exportOptions.summary && data.summary.length > 0) {
      sheets.push(prepareSummarySheet());
    }
 
    if (exportOptions.customers && data.customers.length > 0) {
      sheets.push(prepareCustomersSheet());
    }
 
    if (exportOptions.expenses && data.expenses.length > 0) {
      sheets.push(prepareExpensesSheet());
    }
 
    if (exportOptions.stockMovement && data.stockMovement.length > 0) {
      sheets.push(prepareStockMovementSheet());
    }
 
    // Add each sheet to workbook
    sheets.forEach(sheetConfig => {
      // Check if sheet has data
      if (!sheetConfig.data || (Array.isArray(sheetConfig.data) && sheetConfig.data.length <= 1)) {
        return; // Skip empty sheets (only header)
      }
   
      let worksheet;
      if (sheetConfig.isAoa) {
        // For aoa sheets (Customers), create directly
        worksheet = XLSX.utils.aoa_to_sheet(sheetConfig.data);
      } else {
        // For json sheets
        // Remove style markers before creating worksheet
        const cleanData = sheetConfig.data.map(row => {
          const cleanRow = { ...row };
          delete cleanRow.__style;
          return cleanRow;
        });
     
        worksheet = XLSX.utils.json_to_sheet(cleanData);
      }
   
      // Add company header if applicable
      if (sheetConfig.addHeader !== false && companyData) {
        const headerData = createCompanyHeader();
        const numCols = sheetConfig.columns ? sheetConfig.columns.length : 6;  // Default to 6 for summary
   
        if (worksheet['!ref']) {
          if (sheetConfig.isAoa) {
            // For aoa: Prepend padded header rows to the data (but since worksheet already created, rebuild)
            const paddedHeader = headerData.map(row => [...row, ...new Array(numCols - row.length).fill('')]);
            const fullAoa = [...paddedHeader, ...sheetConfig.data];
            worksheet = XLSX.utils.aoa_to_sheet(fullAoa);
          } else {
            // For json: Shift existing data down (existing logic)
            const range = XLSX.utils.decode_range(worksheet['!ref']);
            const headerRows = headerData.length;
            for (let R = range.e.r; R >= 0; --R) {
              for (let C = range.e.c; C >= 0; --C) {
                const cell_address = {c: C, r: R + headerRows};
                const cell_ref = XLSX.utils.encode_cell(cell_address);
                const old_cell_ref = XLSX.utils.encode_cell({c: C, r: R});
             
                if (worksheet[old_cell_ref]) {
                  worksheet[cell_ref] = worksheet[old_cell_ref];
                  delete worksheet[old_cell_ref];
                }
              }
            }
         
            // Add header data
            headerData.forEach((row, rowIndex) => {
              row.forEach((cell, colIndex) => {
                const cellRef = XLSX.utils.encode_cell({c: colIndex, r: rowIndex});
                worksheet[cellRef] = { t: 's', v: cell };
             
                // Style for header rows
                if (rowIndex === 0) {
                  // Company name - bold and larger
                  worksheet[cellRef].s = {
                    font: { bold: true, sz: 16 },
                    fill: { fgColor: { rgb: "E8F4FF" } } // Light blue background
                  };
                } else if (rowIndex === 2) {  // Adjusted for empty row
                  // Report title - bold
                  worksheet[cellRef].s = {
                    font: { bold: true, sz: 14 },
                    fill: { fgColor: { rgb: "FFF2CC" } } // Light yellow background
                  };
                } else if (rowIndex === 3 || rowIndex === 4) {
                  // Date range and salesman
                  worksheet[cellRef].s = {
                    font: { bold: true },
                    fill: { fgColor: { rgb: "F2F2F2" } } // Light gray background
                  };
                }
              });
            });
         
            // Merge cells for company name (adjust for numCols)
            worksheet['!merges'] = [
              { s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } }, // Company name
              { s: { r: 2, c: 0 }, e: { r: 2, c: numCols - 1 } }, // Report title
              { s: { r: 3, c: 0 }, e: { r: 3, c: numCols - 1 } }, // Date range
              { s: { r: 4, c: 0 }, e: { r: 4, c: numCols - 1 } }, // Salesman
            ];
         
            // Update the sheet range
            range.e.r += headerRows;
            worksheet['!ref'] = XLSX.utils.encode_range(range);
          }
        }
      }
   
      // Apply column widths
      if (sheetConfig.columns) {
        worksheet['!cols'] = sheetConfig.columns.map(col => ({ width: col.width }));
      }
   
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetConfig.sheetName);
    });
 
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });
 
    // Create blob and download
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
 
    const fileName = `${companyData?.CompanyName || 'Daily_Summary'}_${filters.FromDate}_to_${filters.ToDate}.xlsx`;
    saveAs(blob, fileName);
 
    // Show success message
    setSnackbar({
      open: true,
      message: `Excel file exported successfully with ${sheets.length} sheet(s)`,
      severity: 'success'
    });
 
    // Close dialog
    setExportDialogOpen(false);
 
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    setSnackbar({
      open: true,
      message: 'Error exporting to Excel. Please try again.',
      severity: 'error'
    });
  } finally {
    setExportLoading(false);
  }
};
  const handleExportClick = () => {
    setExportDialogOpen(true);
  };
  const handleExportOptionChange = (option) => (event) => {
    setExportOptions({
      ...exportOptions,
      [option]: event.target.checked
    });
  };
  const selectAllExportOptions = () => {
    setExportOptions({
      summary: true,
      customers: true,
      expenses: true,
      stockMovement: true,
      includeAllCustomers: true
    });
  };
  const deselectAllExportOptions = () => {
    setExportOptions({
      summary: false,
      customers: false,
      expenses: false,
      stockMovement: false,
      includeAllCustomers: false
    });
  };
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">
          Daily Summary Report
        </Typography>
        <Box>
          <Tooltip title="Print Report">
            <IconButton onClick={handlePrint} sx={{ mr: 1 }}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export to Excel">
            <IconButton onClick={handleExportClick}>
              <FileDownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="From Date"
              name="FromDate"
              type="date"
              value={filters.FromDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="To Date"
              name="ToDate"
              type="date"
              value={filters.ToDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Salesman</InputLabel>
              <Select
                name="SalesmanID"
                value={filters.SalesmanID}
                onChange={handleChange}
                label="Salesman"
                disabled={salesmenLoading}
              >
                <MenuItem value="">
                  <em>All Salesmen</em>
                </MenuItem>
                {salesmenLoading ? (
                  <MenuItem disabled>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CircularProgress size={20} />
                      <Typography variant="body2">Loading salesmen...</Typography>
                    </Box>
                  </MenuItem>
                ) : salesmen.length === 0 ? (
                  <MenuItem disabled>
                    No salesmen available
                  </MenuItem>
                ) : (
                  salesmen.map((salesman) => (
                    <MenuItem
                      key={salesman.UserId || salesman.userId || salesman.id}
                      value={salesman.UserId}
                    >
                      {salesman.Name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              variant="contained"
              onClick={fetchData}
              disabled={loading || !filters.CompanyID}
              fullWidth
              sx={{ height: '56px' }}
            >
              {loading ? (
                <Box display="flex" alignItems="center" gap={1}>
                  <CircularProgress size={24} color="inherit" />
                  <Typography>Loading...</Typography>
                </Box>
              ) : 'Generate Report'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Dashboard" />
          <Tab label="Customer Details" />
          <Tab label="Expenses" />
          <Tab label="Stock Movement" />
        </Tabs>
      </Paper>
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Dashboard Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              {/* ENHANCED SALES CARD */}
              <Grid item xs={12}>
                <Card sx={{ mb: 3, borderLeft: '6px solid #1976d2' }}>
                  <CardContent>
                    <Grid container spacing={3}>
                      {/* Main Sales Overview */}
                      <Grid item xs={12} md={4}>
                        <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                          <Box display="flex" alignItems="center" mb={2}>
                            <AttachMoneyIcon sx={{ mr: 1, color: '#1976d2' }} />
                            <Typography variant="h5" fontWeight="bold">
                              Sales Overview
                            </Typography>
                          </Box>
                       
                          <Box mb={3}>
                            <Typography variant="caption" color="textSecondary" display="block">
                              Total Sales
                            </Typography>
                            <Typography variant="h4" fontWeight="bold">
                              {formatCurrency(customerTotals.totalBillAmount)}
                            </Typography>
                          </Box>
                       
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                                <Box display="flex" alignItems="center" mb={1}>
                                  <CreditCardIcon sx={{ mr: 1, color: '#4caf50', fontSize: 18 }} />
                                  <Typography variant="caption" color="textSecondary">
                                    Cash Sales
                                  </Typography>
                                </Box>
                                <Typography variant="h6" color="success.main">
                                  {formatCurrency(customerTotals.totalBillCash)}
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={customerTotals.cashPercentage}
                                  sx={{ mt: 1, height: 6, borderRadius: 3 }}
                                />
                                <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                                  {customerTotals.cashPercentage}% of total
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                                <Box display="flex" alignItems="center" mb={1}>
                                  <ReceiptIcon sx={{ mr: 1, color: '#ff9800', fontSize: 18 }} />
                                  <Typography variant="caption" color="textSecondary">
                                    Credit Sales
                                  </Typography>
                                </Box>
                                <Typography variant="h6" color="warning.main">
                                  {formatCurrency(customerTotals.totalBillCredit)}
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={customerTotals.creditPercentage}
                                  sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: '#ffe0b2', '& .MuiLinearProgress-bar': { bgcolor: '#ff9800' } }}
                                />
                                <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                                  {customerTotals.creditPercentage}% of total
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      </Grid>
                      {/* Receipts Breakdown */}
                      <Grid item xs={12} md={4}>
                        <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                          <Box display="flex" alignItems="center" mb={2}>
                            <AccountBalanceIcon sx={{ mr: 1, color: '#2e7d32' }} />
                            <Typography variant="h5" fontWeight="bold">
                              Collections
                            </Typography>
                          </Box>
                       
                          <Box mb={3}>
                            <Typography variant="caption" color="textSecondary" display="block">
                              Total Collections
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="success.main">
                              {formatCurrency(customerTotals.totalReceiptAmount)}
                            </Typography>
                            <Box display="flex" alignItems="center">
                              <TrendingUpIcon sx={{ fontSize: 16, color: '#2e7d32', mr: 0.5 }} />
                              <Typography variant="caption" color="success.main">
                                {customerTotals.collectionRatio}% collection ratio
                              </Typography>
                            </Box>
                          </Box>
                       
                          <Grid container spacing={2}>
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                                <Typography variant="caption" color="textSecondary" display="block">
                                  Cash
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                  {formatCurrency(customerTotals.totalReceiptCash)}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                                <Typography variant="caption" color="textSecondary" display="block">
                                  NEFT
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                  {formatCurrency(customerTotals.totalReceiptNEFT)}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
  <Box sx={{
    textAlign: 'center',
    p: 1,
    bgcolor: 'white',
    borderRadius: 2,
    border: '1px solid #e0e0e0'
  }}>
    <Typography variant="caption" color="textSecondary" display="block">
      Bank
    </Typography>
    <Typography variant="body1" fontWeight="medium">
      {formatCurrency(customerTotals.totalReceiptBank)}
    </Typography>
  </Box>
</Grid>
                          </Grid>
                       
                          {/* Holding Cheque */}
                          <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fff8e1', borderRadius: 2, border: '1px solid #ffd54f' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" color="textSecondary">
                                Holding Cheque Amount
                              </Typography>
                              <Chip
                                label={formatCurrency(customerTotals.totalHoldingCheque)}
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                        </Box>
                      </Grid>
                      {/* Performance Metrics */}
                      <Grid item xs={12} md={4}>
                        <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                          <Box display="flex" alignItems="center" mb={2}>
                            <TrendingUpIcon sx={{ mr: 1, color: '#9c27b0' }} />
                            <Typography variant="h5" fontWeight="bold">
                              Performance
                            </Typography>
                          </Box>
                       
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                                <Typography variant="caption" color="textSecondary" display="block">
                                  30 Days Sales
                                </Typography>
                                <Typography variant="h6" color="primary">
                                  {formatCurrency(customerTotals.totalSalesIn30Days)}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                                <Typography variant="caption" color="textSecondary" display="block">
                                  30 Days Collection
                                </Typography>
                                <Typography variant="h6" color="success.main">
                                  {formatCurrency(customerTotals.totalCollection30Days)}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                                <Typography variant="caption" color="textSecondary" display="block">
                                  Returns
                                </Typography>
                                <Typography variant="h6" color="error">
                                  {formatCurrency(customerTotals.totalReturnedBill)}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                                <Typography variant="caption" color="textSecondary" display="block">
                                  Aging Customers
                                </Typography>
                                <Box display="flex" alignItems="center">
                                  <Typography variant="h6" color="error">
                                    {customerTotals.totalAgingCount}
                                  </Typography>
                                  <ArrowUpwardIcon sx={{ fontSize: 16, color: '#d32f2f', ml: 0.5 }} />
                                </Box>
                              </Box>
                            </Grid>
                          </Grid>
                       
                          {/* Outstanding Summary */}
                          <Box sx={{ mt: 2, p: 1.5, bgcolor: '#ffebee', borderRadius: 2, border: '1px solid #ffcdd2' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Box>
                                <Typography variant="caption" color="textSecondary" display="block">
                                  Total Outstanding
                                </Typography>
                                <Typography variant="h6" color="error" fontWeight="bold">
                                  {formatCurrency(customerTotals.totalOutstanding)}
                                </Typography>
                              </Box>
                              <TrendingDownIcon sx={{ color: '#d32f2f' }} />
                            </Box>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              {/* Other Summary Cards */}
              {data.summary.map((item, index) => {
                if (item.Description === 'Sales') return null;
             
                return (
                  <Grid item xs={12} md={4} key={index}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom variant="subtitle1">
                          {item.Description || 'N/A'}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color={
                          item.Description === 'Expense' ? 'error' :
                          item.Description === 'Collection' ? 'success.main' : 'primary'
                        }>
                          {formatCurrency(item.Sales)}
                        </Typography>
                     
                        <Box sx={{ mt: 2 }}>
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary" display="block">
                                Cash:
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {formatCurrency(item.Cash)}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary" display="block">
                                Bank/UPI:
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {formatCurrency(item['Bank/UPI'])}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary" display="block">
                                Cheque:
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {formatCurrency(item.Cheque)}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary" display="block">
                                Total:
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {formatCurrency(item['Total Collection'])}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
              {/* Charts Section */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Sales vs Collection Trend
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={summaryChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="Description" />
                      <YAxis />
                      <RechartsTooltip
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                      />
                      <Legend />
                      <Bar dataKey="Sales" fill="#8884d8" name="Sales" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Total Collection" fill="#82ca9d" name="Collection" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
  <Paper sx={{ p: 2, height: '100%' }}>
    <Typography variant="h6" gutterBottom>
      Outstanding Distribution
    </Typography>
 
    {customerOutstandingData.length === 0 ? (
      <Box
        sx={{
          height: 300,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'text.secondary'
        }}
      >
        <AccountBalanceIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
        <Typography variant="body1" gutterBottom>
          No outstanding balances
        </Typography>
        <Typography variant="caption">
          All customers have cleared their outstanding amounts
        </Typography>
      </Box>
    ) : (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={customerOutstandingData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              percent > 0.05 ? `${name}: ${(percent * 100).toFixed(1)}%` : ''
            }
            outerRadius={80}
            innerRadius={40}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
          >
            {customerOutstandingData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <RechartsTooltip
            formatter={(value) => [formatCurrency(value), 'Outstanding']}
            contentStyle={{
              borderRadius: 8,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    )}
  </Paper>
</Grid>
            </Grid>
          )}
          {/* Customer Details Tab - Card View */}
{/* Customer Details Tab - Card View */}
{activeTab === 1 && (
  <Box>
    {/* Quick Stats Cards */}
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={6} sm={3}>
        <Card sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: 2, height: '100%' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="caption" display="block">Total Customers</Typography>
            <Typography variant="h4" fontWeight="bold">{data.customers.length}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>All active customers</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Card sx={{ bgcolor: 'success.main', color: 'white', borderRadius: 2, height: '100%' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="caption" display="block">Clear Accounts</Typography>
            <Typography variant="h4" fontWeight="bold">
              {data.customers.filter(c => c.Outstanding === 0).length}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>No outstanding</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Card sx={{ bgcolor: 'error.main', color: 'white', borderRadius: 2, height: '100%' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="caption" display="block">Total Outstanding</Typography>
            <Typography variant="h4" fontWeight="bold">
              {formatCurrency(customerTotals.totalOutstanding)}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Across all customers</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Card sx={{ bgcolor: 'warning.main', color: 'white', borderRadius: 2, height: '100%' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="caption" display="block">Avg. Outstanding</Typography>
            <Typography variant="h4" fontWeight="bold">
              {formatCurrency(
                data.customers.filter(c => c.Outstanding > 0).length > 0
                  ? customerTotals.totalOutstanding /
                    data.customers.filter(c => c.Outstanding > 0).length
                  : 0
              )}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Per customer with dues</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
    {/* View Toggle + Filters */}
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={2}>
          <ButtonGroup>
            <Button
              variant={viewMode === 'cards' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('cards')}
              startIcon={<DashboardIcon />}
            >
              Cards
            </Button>
            <Button
              variant={viewMode === 'table' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('table')}
              startIcon={<ViewListIcon />}
            >
              Table
            </Button>
          </ButtonGroup>
       
          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Sort By"
            >
              <MenuItem value="outstanding">Highest Outstanding</MenuItem>
              <MenuItem value="outstandingLow">Lowest Outstanding</MenuItem>
              <MenuItem value="sales">Highest Sales</MenuItem>
              <MenuItem value="name">Name A-Z</MenuItem>
            </Select>
          </FormControl>
       
          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel>Filter</InputLabel>
            <Select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              label="Filter"
            >
              <MenuItem value="all">All Customers</MenuItem>
              <MenuItem value="outstanding">With Outstanding</MenuItem>
              <MenuItem value="aging">Aging Accounts</MenuItem>
              <MenuItem value="holdingCheque">Holding Cheque</MenuItem>
            </Select>
          </FormControl>
        </Box>
     
        <TextField
          placeholder="Search customers..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ width: 250 }}
        />
      </Box>
    </Paper>
    {/* CARD VIEW */}
    {viewMode === 'cards' ? (
      <>
        <Grid container spacing={3}>
          {displayedCustomers.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 2 }}>
                <Box sx={{ mb: 2 }}>
                  <PeopleIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
                </Box>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No customer data found
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  {searchQuery ? 'Try adjusting your search query' : 'Try adjusting your filters'}
                </Typography>
                <Button variant="outlined" onClick={() => { setSearchQuery(''); setFilterBy('all'); }}>
                  Clear Filters
                </Button>
              </Paper>
            </Grid>
          ) : (
            displayedCustomers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((customer) => (
                <Grid item xs={12} sm={6} md={4} key={customer.CustomerID}>
                  <CustomerCard
                    customer={customer}
                    formatCurrency={formatCurrency}
                  />
                </Grid>
              ))
          )}
        </Grid>
        {displayedCustomers.length > 0 && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Paper sx={{ p: 1, borderRadius: 2 }}>
              <Pagination
                count={Math.ceil(displayedCustomers.length / rowsPerPage)}
                page={page + 1}
                onChange={(e, value) => setPage(value - 1)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Paper>
          </Box>
        )}
      </>
    ) : (
      /* TABLE VIEW */
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 60 }}>Actions</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell align="right">Opening</TableCell>
                <TableCell align="right">Bill Amount</TableCell>
                <TableCell align="right">Bill Cash</TableCell>
                <TableCell align="right">Bill Credit</TableCell>
                <TableCell align="right">Receipt Cash</TableCell>
                <TableCell align="right">Receipt NEFT</TableCell>
                <TableCell align="right">Receipt Bank</TableCell>
                <TableCell align="right">Receipt Total</TableCell>
                <TableCell align="right">Returned</TableCell>
                <TableCell align="right">Debit</TableCell>
                <TableCell align="right">Credit</TableCell>
                <TableCell align="right">Outstanding</TableCell>
                <TableCell align="center">Aging</TableCell>
                <TableCell>Last Billed</TableCell>
                <TableCell align="right">Sales 30 Days</TableCell>
                <TableCell>Last Visited</TableCell>
                <TableCell align="right">Collection 30 Days</TableCell>
                <TableCell>Last Payment</TableCell>
                <TableCell>Holding Cheque</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={21} align="center" sx={{ py: 5 }}>
                    <Typography color="textSecondary">No customer data available</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                displayedCustomers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((customer) => (
                    <ExpandableCustomerRow
                      key={customer.CustomerID}
                      customer={customer}
                      formatCurrency={formatCurrency}
                    />
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {displayedCustomers.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={displayedCustomers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </Paper>
    )}
  </Box>
)}
          {/* Expenses Tab */}
        {activeTab === 2 && (
                   <Grid container spacing={3}>
                     <Grid item xs={12} md={8}>
                       <Paper sx={{ p: 2 }}>
                         <Typography variant="h6" gutterBottom>
                           Expense Details
                         </Typography>
                         <TableContainer>
                           <Table>
                             <TableHead>
                               <TableRow>
                                 <TableCell>Date</TableCell>
                                 <TableCell>Expense Name</TableCell>
                                 <TableCell align="right">Amount</TableCell>
                                 <TableCell align="right">% of Total</TableCell>
                               </TableRow>
                             </TableHead>
                             <TableBody>
                               {data.expenses.length === 0 ? (
                                 <TableRow>
                                   <TableCell colSpan={4} align="center">
                                     <Typography color="textSecondary" py={3}>
                                       No expense data available
                                     </Typography>
                                   </TableCell>
                                 </TableRow>
                               ) : (
                                 data.expenses.map((expense, index) => {
                                   const percentage = expense.TotalAmount > 0
                                     ? ((expense.Amount / expense.TotalAmount) * 100).toFixed(1)
                                     : '0';
                                   return (
                                     <TableRow key={index}>
                                       <TableCell>
                                         {expense.Date ?
                                           new Date(expense.Date).toLocaleDateString() : 'N/A'
                                         }
                                       </TableCell>
                                       <TableCell>{expense.ExpenceName || 'Unknown'}</TableCell>
                                       <TableCell align="right">
                                         {formatCurrency(expense.Amount)}
                                       </TableCell>
                                       <TableCell align="right">
                                         <Chip
                                           label={`${percentage}%`}
                                           size="small"
                                           color="primary"
                                           variant="outlined"
                                         />
                                       </TableCell>
                                     </TableRow>
                                   );
                                 })
                               )}
                             </TableBody>
                           </Table>
                         </TableContainer>
                       </Paper>
                     </Grid>
                     <Grid item xs={12} md={4}>
                       <Paper sx={{ p: 2 }}>
                         <Typography variant="h6" gutterBottom>
                           Expense Distribution
                         </Typography>
                         {data.expenses.length > 0 ? (
                           <ResponsiveContainer width="100%" height={300}>
                             <PieChart>
                               <Pie
                                 data={data.expenses.map(exp => ({
                                   name: exp.ExpenceName || 'Unknown',
                                   value: exp.Amount || 0
                                 }))}
                                 cx="50%"
                                 cy="50%"
                                 outerRadius={80}
                                 fill="#8884d8"
                                 dataKey="value"
                                 label={({ name, percent }) =>
                                   `${name}: ${(percent * 100).toFixed(0)}%`
                                 }
                               >
                                 {data.expenses.map((entry, index) => (
                                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                 ))}
                               </Pie>
                               <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                             </PieChart>
                           </ResponsiveContainer>
                         ) : (
                           <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                             <Typography color="textSecondary">
                               No expense data to display
                             </Typography>
                           </Box>
                         )}
                       </Paper>
                     </Grid>
                   </Grid>
                 )}
          {/* Stock Movement Tab */}
          {activeTab === 3 && (
<Paper sx={{ width: '100%', overflow: 'hidden', position: 'relative', pb: 7 }}>
  <TableContainer sx={{ maxHeight: 600, position: 'relative' }}>
    <Table stickyHeader>
      <TableHead>
        <TableRow>
          <TableCell>Item</TableCell>
          <TableCell>Category</TableCell>
          <TableCell align="right">MRP</TableCell>
          <TableCell align="right">Opening</TableCell>
          <TableCell align="right">Dealer Stock</TableCell>
          <TableCell align="right">Sold</TableCell>
          <TableCell align="right">Damage</TableCell>
          <TableCell align="right">ReplaceQty</TableCell>
          <TableCell align="right">Free</TableCell>
          <TableCell align="right">Closing</TableCell>
          <TableCell align="right">Damage Value</TableCell>
          <TableCell align="right">Free Value</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.stockMovement.length === 0 ? (
          <TableRow>
            <TableCell colSpan={12} align="center">
              <Typography color="textSecondary" py={3}>
                No stock movement data available
              </Typography>
            </TableCell>
          </TableRow>
        ) : (
          <>
            {data.stockMovement
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((item, index) => (
                <TableRow key={item.Sl || index} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {item.ItemDescription || 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.Category || 'N/A'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(item.MRP)}
                  </TableCell>
                  <TableCell align="right">{item.Opening || 0}</TableCell>
                  <TableCell align="right">{item.DealerStock || 0}</TableCell>
                  <TableCell align="right">
                    <Typography color="success.main" fontWeight="medium">
                      {item.Sold || 0}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography color="error">
                      {item.Damage || 0}
                    </Typography>
                  </TableCell>
                  {/* ✅ ReplaceQty (quantity only) */}
                  <TableCell align="right">
                    <Typography color="warning.main" fontWeight="bold">
                      {item.ReplacedQty || 0}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography color="warning.main">
                      {item.Free || 0}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      fontWeight="bold"
                      color={item.Closing < 0 ? 'error' : 'inherit'}
                    >
                      {item.Closing || 0}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography color="error" fontWeight="medium">
                      {formatCurrency(item.DamageValue)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography color="warning.main" fontWeight="medium">
                      {formatCurrency(item.FreeValue)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            {/* ✅ TOTALS ROW */}
            <TableRow
              sx={{
                position: 'sticky',
                bottom: 0,
                zIndex: 2,
                backgroundColor: 'primary.main',
                '& .MuiTableCell-root': {
                  color: 'white',
                  borderTop: '2px solid white',
                  fontWeight: 'bold'
                }
              }}
            >
              <TableCell colSpan={2}>TOTALS</TableCell>
              <TableCell align="right">
                {formatCurrency(
                  data.stockMovement.reduce((s, i) => s + (i.MRP || 0), 0)
                )}
              </TableCell>
              <TableCell align="right">
                {data.stockMovement.reduce((s, i) => s + (i.Opening || 0), 0)}
              </TableCell>
              <TableCell align="right">
                {data.stockMovement.reduce((s, i) => s + (i.DealerStock || 0), 0)}
              </TableCell>
              <TableCell align="right">
                {data.stockMovement.reduce((s, i) => s + (i.Sold || 0), 0)}
              </TableCell>
              <TableCell align="right">
                {data.stockMovement.reduce((s, i) => s + (i.Damage || 0), 0)}
              </TableCell>
              <TableCell align="right">
                {data.stockMovement.reduce((s, i) => s + (i.ReplacedQty || 0), 0)}
              </TableCell>
              <TableCell align="right">
                {data.stockMovement.reduce((s, i) => s + (i.Free || 0), 0)}
              </TableCell>
              <TableCell align="right">
                {data.stockMovement.reduce((s, i) => s + (i.Closing || 0), 0)}
              </TableCell>
              <TableCell align="right">
                {formatCurrency(
                  data.stockMovement.reduce((s, i) => s + (i.DamageValue || 0), 0)
                )}
              </TableCell>
              <TableCell align="right">
                {formatCurrency(
                  data.stockMovement.reduce((s, i) => s + (i.FreeValue || 0), 0)
                )}
              </TableCell>
            </TableRow>
          </>
        )}
      </TableBody>
    </Table>
  </TableContainer>
</Paper>
)}
        </>
      )}
      {/* Excel Export Dialog - Updated to include customer items */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <DescriptionIcon color="primary" />
            <Typography variant="h6">Export to Excel</Typography>
          </Box>
        </DialogTitle>
     
        <DialogContent>
          <DialogContentText gutterBottom>
            Select the data sheets you want to include in the Excel export:
          </DialogContentText>
       
          <Box sx={{ mt: 2 }}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportOptions.summary}
                    onChange={handleExportOptionChange('summary')}
                  />
                }
                label="Summary Data"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportOptions.customers}
                    onChange={handleExportOptionChange('customers')}
                  />
                }
                label="Customer Details"
              />
              {exportOptions.customers && (
                <Box sx={{ ml: 4, mb: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={exportOptions.includeAllCustomers}
                        onChange={handleExportOptionChange('includeAllCustomers')}
                        size="small"
                      />
                    }
                    label="Export all customers (unchecked exports only current view)"
                  />
                </Box>
              )}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportOptions.expenses}
                    onChange={handleExportOptionChange('expenses')}
                  />
                }
                label="Expense Details"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportOptions.stockMovement}
                    onChange={handleExportOptionChange('stockMovement')}
                  />
                }
                label="Stock Movement"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportOptions.customerItems}
                    onChange={handleExportOptionChange('customerItems')}
                  />
                }
                label="Customer Billed Items"
              />
            </FormGroup>
         
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button size="small" onClick={selectAllExportOptions}>
                Select All
              </Button>
              <Button size="small" onClick={deselectAllExportOptions}>
                Deselect All
              </Button>
            </Box>
          </Box>
        </DialogContent>
     
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={exportToExcel}
            variant="contained"
            disabled={exportLoading || !Object.values(exportOptions).slice(0, 5).some(v => v)}
            startIcon={exportLoading ? <CircularProgress size={20} /> : <FileDownloadIcon />}
          >
            {exportLoading ? 'Exporting...' : 'Export to Excel'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};
export default DailySummary;