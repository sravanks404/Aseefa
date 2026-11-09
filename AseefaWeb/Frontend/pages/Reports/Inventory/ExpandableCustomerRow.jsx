import React, { useState } from "react";
import {
  TableRow,
  TableCell,
  Collapse,
  Box,
  Typography,
  IconButton,
  Paper,
  Tooltip,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  Chip
} from "@mui/material";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ExpandLess from "@mui/icons-material/ExpandLess";
// Add these icons to your existing imports
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import PaidIcon from '@mui/icons-material/Paid';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CalculateIcon from '@mui/icons-material/Calculate';
import PercentIcon from '@mui/icons-material/Percent';
import WarningIcon from '@mui/icons-material/Warning';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';


const getZeroBg = (value) => {
  return value === 0 ? '#fdecea' : 'transparent'; // red if zero
};
const getDaysDiff = (date) => {
  if (!date) return Infinity;
  const d = new Date(date);
  if (isNaN(d)) return Infinity;

  const today = new Date();
  return Math.floor((today - d) / (1000 * 60 * 60 * 24));
};

const getCellBg = (date) => {
  const days = getDaysDiff(date);

  if (days <= 7) return '#def3e0';   // green
  if (days <= 14) return '#eed1a5';  // yellow
  if (days <= 21) return '#fff3e0';  // orange
  return '#fdecea';                  // red
};


const ExpandableCustomerRow = ({ customer, formatCurrency ,onChequeClick,onAgingClick }) => {
  const [open, setOpen] = useState(false);

  // ✅ CORRECT SOURCE OF ITEMS
  let items = [];
  try {
    if (customer.BilledItems) {
      items =
        typeof customer.BilledItems === "string"
          ? JSON.parse(customer.BilledItems)
          : customer.BilledItems;
    }
  } catch (err) {
    console.error("Invalid BilledItems JSON", err);
    items = [];
  }

  const hasItems = items.length > 0;

  return (
    <>
      {/* MAIN ROW */}
      <TableRow hover sx={{ '& > td': { borderBottom: open ? 'none' : 'inherit' } }}>
        <TableCell width={60}>
          {hasItems && (
            <Tooltip title={open ? "Hide items" : "Show items"}>
              <IconButton
                size="small"
                onClick={() => setOpen(!open)}
                sx={{
                  backgroundColor: open ? 'primary.light' : 'transparent',
                  '&:hover': { backgroundColor: open ? 'primary.main' : 'action.hover' }
                }}
              >
                {open ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Tooltip>
          )}
        </TableCell>

        <TableCell>
          <Typography fontWeight="bold" variant="subtitle1">
            {customer.AccountName}
          </Typography>
          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
            <Chip
              label={`ID: ${customer.CustomerID}`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`${customer.CreditDays || 0} days credit`}
              size="small"
              variant="outlined"
              color="info"
            />
            {hasItems && (
              <Chip
                label={`${items.length} items`}
                size="small"
                color="primary"
                icon={<ShoppingCartIcon fontSize="small" />}
              />
            )}
          </Box>
        </TableCell>

        <TableCell align="right">
          <Tooltip title="Opening Balance">
            <Typography variant="body2">
              {formatCurrency(customer.OpeningBalance)}
            </Typography>
          </Tooltip>
        </TableCell>

        <TableCell align="right">
          <Tooltip title="Total Bill Amount">
            <Typography variant="body2" fontWeight="medium">
              {formatCurrency(customer.BillAmount)}
            </Typography>
          </Tooltip>
        </TableCell>

        <TableCell align="right">
          <Tooltip title="Cash Sales">
            <Typography variant="body2" color="success.main">
              {formatCurrency(customer.BillCash)}
            </Typography>
          </Tooltip>
        </TableCell>

        <TableCell align="right">
          <Tooltip title="Credit Sales">
            <Typography variant="body2" color="warning.main">
              {formatCurrency(customer.BillCredit)}
            </Typography>
          </Tooltip>
        </TableCell>

        <TableCell align="right">
          <Tooltip title="Cash Receipts">
            <Typography variant="body2" color="success.main">
              {formatCurrency(customer.ReceiptCash)}
            </Typography>
          </Tooltip>
        </TableCell>

        <TableCell align="right">
          <Tooltip title="NEFT Receipts">
            <Typography variant="body2">
              {formatCurrency(customer.ReceiptNEFT)}
            </Typography>
          </Tooltip>
        </TableCell>

        <TableCell align="right">
          <Tooltip title="Bank Receipts">
            <Typography variant="body2">
              {formatCurrency(customer.ReceiptBank)}
            </Typography>
          </Tooltip>
        </TableCell>

        <TableCell align="right">
          <Tooltip title="Total Receipts">
            <Typography variant="body2" fontWeight="medium" color="success.main">
              {formatCurrency(customer.ReceiptAmount)}
            </Typography>
          </Tooltip>
        </TableCell>

        <TableCell align="right">
          <Tooltip title="Returned Amount">
            <Typography variant="body2" color="error" fontWeight="medium">
              {formatCurrency(customer.ReturnedBillAmount)}
            </Typography>
          </Tooltip>
        </TableCell>

        <TableCell align="right">
          <Tooltip title="Debit Amount">
            <Typography variant="body2">
              {formatCurrency(customer.DebitAmount)}
            </Typography>
          </Tooltip>
        </TableCell>

        <TableCell align="right">
          <Tooltip title="Credit Amount">
            <Typography variant="body2">
              {formatCurrency(customer.CreditAmount)}
            </Typography>
          </Tooltip>
        </TableCell>

        <TableCell align="right">
          <Tooltip title="Outstanding Balance">
            <Typography
              variant="body2"
              fontWeight="bold"
              sx={{
                color: customer.DebitAmount > 0 ? 'error.main' : 'success.main',
                backgroundColor: customer.DebitAmount > 0 ? 'error.lighter' : 'success.lighter',
                padding: '4px 8px',
                borderRadius: 1
              }}
            >
              {formatCurrency(customer.Outstanding)}
            </Typography>
           </Tooltip>
        </TableCell>
<TableCell align="center">
          <Tooltip title={customer.BillCount > 0 ? "Overdue invoices" : "No overdue invoices"}>
            <Chip
              label={customer.BillCount || 0}
              size="small"
              color={customer.BillCount > 0 ? "error" : "default"}
              variant={customer.BillCount > 0 ? "filled" : "outlined"}
              icon={customer.BillCount > 0 ? <WarningIcon fontSize="small" /> : undefined}
            />
          </Tooltip>
        </TableCell>
       <TableCell align="center">
  <Tooltip title={customer.AgingCount > 0 ? "Overdue invoices" : "No overdue invoices"}>
    <Chip
      label={customer.AgingCount || 0}
      size="small"
      color={customer.AgingCount > 0 ? "error" : "default"}
      variant={customer.AgingCount > 0 ? "filled" : "outlined"}
      icon={customer.AgingCount > 0 ? <WarningIcon fontSize="small" /> : undefined}
      onClick={() => customer.AgingCount > 0 && onAgingClick?.(customer.CustomerID, customer.AccountName, customer.AgingCount)}
      sx={{
        cursor: customer.AgingCount > 0 ? 'pointer' : 'default',
        transition: customer.AgingCount > 0 ? 'transform 0.2s' : 'none',
        '&:hover': customer.AgingCount > 0 ? {
          backgroundColor: 'error.light',
          transform: 'scale(1.05)'
        } : {}
      }}
    />
  </Tooltip>
</TableCell>

<TableCell align="right">
  <Tooltip title="Aging Due Amount">
    <Typography
      variant="body2"
      fontWeight="medium"
      sx={{
        color: customer.AgingDueAmountExcludingCreditDays > 0 ? 'error.main' : 'text.secondary',
        backgroundColor: customer.AgingDueAmountExcludingCreditDays > 0 ? 'error.lighter' : 'transparent',
        padding: '4px 8px',
        borderRadius: 1
      }}
    >
      {formatCurrency(customer.AgingDueAmountExcludingCreditDays || 0)}
    </Typography>
  </Tooltip>
</TableCell>
        {/* <TableCell>
          <Tooltip title="Last Billed Date">
            <Typography variant="caption" display="block">
              {new Date(customer.LastBilledOn).toLocaleDateString()}
            </Typography>
          </Tooltip>
        </TableCell> */}
<TableCell
  sx={{
    backgroundColor: getCellBg(customer.LastBilledOn),
    borderRadius: 1
  }}
>
  <Tooltip title="Last Billed Date">
    <Typography variant="caption" display="block">
      {new Date(customer.LastBilledOn).toLocaleDateString()}
    </Typography>
  </Tooltip>
</TableCell>

        {/* <TableCell align="right">
          <Tooltip title="Sales in last 30 days">
            <Typography variant="body2">
              {formatCurrency(customer.SalesIn30Days)}
            </Typography>
          </Tooltip>
        </TableCell> */}
<TableCell
  align="right"
  sx={{
    backgroundColor: getZeroBg(customer.SalesIn30Days),
    borderRadius: 1,
    transition: 'background-color 0.3s'
  }}
>
  <Tooltip title="Sales in last 30 days">
    <Typography variant="body2">
      {formatCurrency(customer.SalesIn30Days)}
    </Typography>
  </Tooltip>
</TableCell>

        {/* <TableCell>
          <Tooltip title="Last Visited Date">
            <Typography variant="caption" display="block">
              {new Date(customer.LastVisitedOn).toLocaleDateString()}
            </Typography>
          </Tooltip>
        </TableCell> */}
<TableCell
  sx={{
    backgroundColor: getCellBg(customer.LastVisitedOn),
    borderRadius: 1
  }}
>
  <Tooltip title="Last Visited Date">
    <Typography variant="caption" display="block">
      {new Date(customer.LastVisitedOn).toLocaleDateString()}
    </Typography>
  </Tooltip>
</TableCell>
<TableCell
  align="right"
  sx={{
    backgroundColor: getZeroBg(customer.Collection30Days),
    borderRadius: 1,
    transition: 'background-color 0.3s'
  }}
>
  <Tooltip title="Collection in last 30 days">
    <Typography variant="body2" color="success.main">
      {formatCurrency(customer.Collection30Days)}
    </Typography>
  </Tooltip>
</TableCell>

        {/* <TableCell align="right">
          <Tooltip title="Collection in last 30 days">
            <Typography variant="body2" color="success.main">
              {formatCurrency(customer.Collection30Days)}
            </Typography>
          </Tooltip>
        </TableCell> */}
{/* 
        <TableCell>
          <Tooltip title="Last Payment Date">
            <Typography variant="caption" display="block">
              {customer.LastPaymentOn && customer.LastPaymentOn.startsWith("1900")
                ? <Chip label="Never" size="small" variant="outlined" />
                : new Date(customer.LastPaymentOn).toLocaleDateString()}
            </Typography>
          </Tooltip>
        </TableCell> */}
<TableCell
  sx={{
    backgroundColor: customer.LastPaymentOn?.startsWith("1900")
      ? '#fdecea'
      : getCellBg(customer.LastPaymentOn),
    borderRadius: 1
  }}
>
  <Tooltip title="Last Payment Date">
    <Typography variant="caption" display="block">
      {customer.LastPaymentOn?.startsWith("1900")
        ? <Chip label="Never" size="small" />
        : new Date(customer.LastPaymentOn).toLocaleDateString()}
    </Typography>
  </Tooltip>
</TableCell>

       <TableCell>
  <Tooltip title="Holding Cheque Amount">
    <Chip
      label={formatCurrency(customer.HoldingCheque)}
      size="small"
      color={customer.HoldingCheque > 0 ? "warning" : "default"}
      variant={customer.HoldingCheque > 0 ? "filled" : "outlined"}
      icon={customer.HoldingCheque > 0 ? <AccountBalanceIcon fontSize="small" /> : undefined}
      onClick={() => customer.HoldingCheque > 0 && onChequeClick && 
        onChequeClick(customer.CustomerID, customer.AccountName, customer.HoldingCheque)}  // FIXED
      sx={{
        cursor: customer.HoldingCheque > 0 ? 'pointer' : 'default',
        '&:hover': customer.HoldingCheque > 0 ? {
          backgroundColor: 'warning.light',
          transform: 'scale(1.05)',
          transition: 'transform 0.2s'
        } : {}
      }}
    />
  </Tooltip>
</TableCell>
      </TableRow>

      {/* EXPANDED ROW - ENHANCED VERSION */}
      <TableRow>
        <TableCell colSpan={21} sx={{ p: 0, borderBottom: open ? 1 : 0, borderColor: 'divider' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{
              p: 3,
              backgroundColor: "primary.50",
              borderTop: 1,
              borderBottom: 1,
              borderColor: 'primary.100'
            }}>
              {/* HEADER */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{
                    p: 1,
                    backgroundColor: "primary.main",
                    borderRadius: 1,
                    color: 'white'
                  }}>
                    <ShoppingCartIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Billed Items for {customer.AccountName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {items.length} items billed | Customer ID: {customer.CustomerID}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" gap={1}>
                  <Chip
                    label={`Total Items: ${items.length}`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={`Total Quantity: ${items.reduce((sum, item) => sum + (item.SaleQty || 0), 0)}`}
                    color="secondary"
                    variant="outlined"
                  />
                  <Chip
                    label={`Free Items: ${items.reduce((sum, item) => sum + (item.FreeQty || 0), 0)}`}
                    color="info"
                    variant="outlined"
                  />
                </Box>
              </Box>

              {/* ITEMS TABLE */}
              <Paper elevation={0} sx={{
                backgroundColor: 'white',
                borderRadius: 2,
                overflow: 'hidden',
                border: 1,
                borderColor: 'divider'
              }}>
                <TableContainer
                  sx={{
                    maxHeight: 400,        // 👈 adjust height as needed
                    overflowY: 'auto'
                  }}>
                  <Table size="medium">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'primary.50' }}>
                        <TableCell>#</TableCell>
                        <TableCell>Item Name</TableCell>
                        <TableCell align="center">Item Category</TableCell>
                        <TableCell align="center">Sale Qty</TableCell>
                        <TableCell align="center">Free Qty</TableCell>

                        {/* ✅ NEW */}
                        <TableCell align="center">Damage</TableCell>
                        <TableCell align="center">Replaced</TableCell>
                        <TableCell align="center">Dealer Stock</TableCell>
                             
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {items.map((item, idx) => {
                        const totalQty = (item.SaleQty || 0) + (item.FreeQty || 0);
                        const freePercentage = item.SaleQty > 0 ?
                          Math.round(((item.FreeQty || 0) / item.SaleQty) * 100) : 0;

                        return (
                          <TableRow
                            key={idx}
                            hover
                            sx={{
                              '&:last-child td, &:last-child th': { border: 0 },
                              backgroundColor: idx % 2 === 0 ? 'background.default' : 'white'
                            }}
                          >
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {idx + 1}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {item.ItemName || 'Unnamed Item'}
                              </Typography>
                              {item.ItemCode && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Code: {item.ItemCode}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={item.CatgoryName || 'N/A'}
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={item.SaleQty || 0}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ minWidth: '60px' }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={item.FreeQty || 0}
                                size="small"
                                color={item.FreeQty > 0 ? "info" : "default"}
                                variant={item.FreeQty > 0 ? "filled" : "outlined"}
                                sx={{ minWidth: '60px' }}
                              />
                            </TableCell>

                            <TableCell align="center">
                              <Chip
                                label={item.DamageQty || 0}
                                size="small"
                                color={item.DamageQty > 0 ? "error" : "default"}
                                variant={item.DamageQty > 0 ? "filled" : "outlined"}
                              />
                            </TableCell>

                            {/* ✅ REPLACED */}
                            <TableCell align="center">
                              <Chip
                                label={item.ReplacedQty || 0}
                                size="small"
                                color={item.ReplacedQty > 0 ? "warning" : "default"}
                                variant={item.ReplacedQty > 0 ? "filled" : "outlined"}
                              />
                            </TableCell>

                            {/* ✅ DEALER STOCK */}
                            <TableCell align="center">
                              <Chip
                                label={item.DealerStock || 0}
                                size="small"
                                color="secondary"
                                variant="outlined"
                              />
                            </TableCell>
                              
                          </TableRow>
                        );
                      })}

                      {/* SUMMARY ROW */}

                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>


            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export default ExpandableCustomerRow;
