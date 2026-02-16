import { useState, useEffect, useRef } from 'react';
import apiClient from '../config/api';
import * as XLSX from 'xlsx';
import ConfirmModal from '../components/ConfirmModal';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [status, setStatus] = useState('');
  const hasMountedRef = useRef(false);
  const [exporting, setExporting] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]);

  useEffect(() => {
    // Avoid duplicate fetch on first render (already covered by page effect)
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const debounceTimer = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination((prev) => ({ ...prev, page: 1 }));
        return;
      }

      fetchPayments(1);
    }, 250);

    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, fromDate, toDate, minAmount, maxAmount, status]);

  const fetchPayments = async (pageOverride, filtersOverride = null) => {
    setLoading(true);
    try {
      const currentPage = pageOverride || pagination.page;
      const effectiveFilters = filtersOverride || {
        search,
        fromDate,
        toDate,
        minAmount,
        maxAmount,
        status,
      };
      const params = {
        page: currentPage,
        limit: pagination.limit,
      };

      if (effectiveFilters.search) params.search = effectiveFilters.search;
      if (effectiveFilters.fromDate) params.fromDate = effectiveFilters.fromDate;
      if (effectiveFilters.toDate) params.toDate = effectiveFilters.toDate;
      if (effectiveFilters.minAmount) params.minAmount = effectiveFilters.minAmount;
      if (effectiveFilters.maxAmount) params.maxAmount = effectiveFilters.maxAmount;
      if (effectiveFilters.status) params.status = effectiveFilters.status;

      const response = await apiClient.get('/admin/api/payments', {
        params,
      });

      setPayments(response.data.data.payments);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setFromDate('');
    setToDate('');
    setMinAmount('');
    setMaxAmount('');
    setStatus('');
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchPayments(1, {
      search: '',
      fromDate: '',
      toDate: '',
      minAmount: '',
      maxAmount: '',
      status: '',
    });
  };

  const formatCurrency = (amountInPaise) => {
    // Convert paise to rupees
    const amountInRupees = amountInPaise / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amountInRupees);
  };

  const formatPaymentId = (payment) => {
    const id = payment.razorpayPaymentId || payment.razorpayOrderId || '-';
    return id.length > 20 ? `${id.substring(0, 20)}...` : id;
  };

  const getStatusClass = (paymentStatus) => {
    if (paymentStatus === 'success') return 'bg-green-100 text-green-800';
    if (paymentStatus === 'failed') return 'bg-red-100 text-red-800';
    if (paymentStatus === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (paymentStatus === 'refunded') return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const handleExport = () => {
    if (payments.length === 0 || exporting) return;

    try {
      setExporting(true);
      const rows = payments.map((payment) => ({
        'Payment ID': payment.razorpayPaymentId || payment.razorpayOrderId || '-',
        'Donor Name': payment.name || '-',
        Email: payment.email || '-',
        Phone: payment.phone || '-',
        Amount: (payment.amount || 0) / 100,
        Status: (payment.status || '').toUpperCase(),
        Date: new Date(payment.createdAt).toLocaleString(),
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');
      XLSX.writeFile(workbook, `payments-page-${pagination.page}.xlsx`, {
        compression: true,
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!deleteTarget) return;

    try {
      setDeleteError('');
      setDeletingId(deleteTarget._id);
      await apiClient.delete(`/admin/api/payments/${deleteTarget._id}`);
      setDeleteTarget(null);

      if (payments.length === 1 && pagination.page > 1) {
        setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
      } else {
        await fetchPayments(pagination.page);
      }
    } catch (error) {
      console.error('Failed to delete payment:', error);
      setDeleteError('Failed to delete payment. Please try again.');
    } finally {
      setDeletingId('');
    }
  };

  const inputClass =
    'w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-colors';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
          <p className="mt-1 text-sm text-slate-500">Search and filter payment records</p>
        </div>
        <button
          onClick={handleExport}
          disabled={loading || exporting || payments.length === 0}
          className="h-10 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {exporting ? 'Exporting...' : 'Export to Excel'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full md:w-64">
            <label className="sr-only">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, Email, Phone, Payment ID"
              className={inputClass}
            />
          </div>

          <div className="w-full sm:w-44">
            <label className="sr-only">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="w-full sm:w-44">
            <label className="sr-only">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="w-full sm:w-36">
            <label className="sr-only">Min Amount</label>
            <input
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="₹"
              className={inputClass}
            />
          </div>

          <div className="w-full sm:w-36">
            <label className="sr-only">Max Amount</label>
            <input
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              placeholder="₹"
              className={inputClass}
            />
          </div>

          <div className="w-full sm:w-36">
            <label className="sr-only">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={inputClass}
            >
              <option value="">All</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <button
            onClick={handleClearFilters}
            className="h-10 px-4 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {deleteError ? (
          <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {deleteError}
          </div>
        ) : null}
        {loading ? (
          <div className="p-12 text-center">
            <div className="flex items-center justify-center gap-3 text-slate-500">
              <svg
                className="animate-spin h-6 w-6 text-cyan-500"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Loading payments...
            </div>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No payments found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Payment ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Donor Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {payments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                        {formatPaymentId(payment)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-medium">
                        {payment.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {payment.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {payment.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(payment.status)}`}>
                          {(payment.status || '').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(payment.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(payment)}
                          disabled={deletingId === payment._id}
                          className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        >
                          {deletingId === payment._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      setPagination({ ...pagination, page: pagination.page - 1 })
                    }
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPagination({ ...pagination, page: pagination.page + 1 })
                    }
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete payment"
        description={`Delete payment ${
          deleteTarget?.razorpayPaymentId || deleteTarget?.razorpayOrderId || ''
        }? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={Boolean(deletingId)}
        onConfirm={handleDeletePayment}
        onCancel={() => {
          if (!deletingId) setDeleteTarget(null);
        }}
        danger
      />
    </div>
  );
};

export default Payments;
