import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../config/api';
import ConfirmModal from '../components/ConfirmModal';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, graphRes] = await Promise.all([
        apiClient.get('/admin/api/dashboard/stats'),
        apiClient.get('/admin/api/dashboard/graph?days=30'),
      ]);

      setStats(statsRes.data.data);
      setGraphData(graphRes.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteError('');
      setDeletingId(deleteTarget._id);
      await apiClient.delete(`/admin/api/payments/${deleteTarget._id}`);
      await fetchDashboardData();
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete payment:', error);
      setDeleteError('Failed to delete payment. Please try again.');
    } finally {
      setDeletingId('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-500">
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
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-red-700">
        Failed to load dashboard data
      </div>
    );
  }

  const formatCurrency = (amountInPaise) => {
    // Convert paise to rupees
    const amountInRupees = amountInPaise / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amountInRupees);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of payment statistics and trends
          </p>
        </div>
        <Link
          to="/payments"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-600 transition-colors shadow-sm"
        >
          View Payments
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">
                Total Payment Amount
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-800">
                {formatCurrency(stats.totalAmount)}
              </div>
            </div>
            <div className="h-12 w-12 rounded-xl bg-cyan-50 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-cyan-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">
                Total Transactions
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-800">
                {stats.totalPayments}
              </div>
            </div>
            <div className="h-12 w-12 rounded-xl bg-cyan-50 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-cyan-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">
                Today&apos;s Collection
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-800">
                {formatCurrency(stats.todayAmount)}
              </div>
            </div>
            <div className="h-12 w-12 rounded-xl bg-cyan-50 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-cyan-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Graph */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Payment Trends (Last 30 Days)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={graphData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `₹${(value / 100).toLocaleString('en-IN')}`} />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="totalAmount"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={{ fill: '#06b6d4' }}
              activeDot={{ r: 4 }}
              name="Amount"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Recent Payments
          </h2>
          <Link
            to="/payments"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Open Full Payments Page
          </Link>
        </div>
        {deleteError ? (
          <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {deleteError}
          </div>
        ) : null}
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
              {stats.recentPayments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    No recent payments
                  </td>
                </tr>
              ) : (
                stats.recentPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                      {payment.razorpayPaymentId
                        ? `${payment.razorpayPaymentId.substring(0, 20)}...`
                        : payment.razorpayOrderId
                        ? `${payment.razorpayOrderId.substring(0, 20)}...`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-medium">
                      {payment.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payment.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : payment.status === 'refunded'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {(payment.status || '').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(payment.createdAt).toLocaleDateString()}
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
                ))
              )}
            </tbody>
          </table>
        </div>
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

export default Dashboard;
