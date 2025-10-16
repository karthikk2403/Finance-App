import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';
import { Plus, Trash2, Download, Edit2, Save, X, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Other'];

const ExpenseSheet = ({ sheets, onDeleteSheet }) => {
  const { sheetId } = useParams();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    date: '',
    category: '',
    description: '',
    amount: ''
  });

  useEffect(() => {
    fetchSheet();
    fetchStats();
  }, [sheetId]);

  const fetchSheet = async () => {
    try {
      const response = await axios.get(`${API}/sheets/${sheetId}`);
      setSheet(response.data);
    } catch (error) {
      toast.error('Failed to load sheet');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/sheets/${sheetId}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats');
    }
  };

  const handleAddExpense = async () => {
    if (!expenseForm.date || !expenseForm.category || !expenseForm.amount) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await axios.post(`${API}/sheets/${sheetId}/expenses`, {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount)
      });
      setSheet(response.data);
      setExpenseForm({ date: '', category: '', description: '', amount: '' });
      setOpen(false);
      fetchStats();
      toast.success('Expense added!');
    } catch (error) {
      toast.error('Failed to add expense');
    }
  };

  const handleUpdateExpense = async (expenseId) => {
    try {
      const expense = sheet.expenses.find(e => e.id === expenseId);
      const response = await axios.put(`${API}/sheets/${sheetId}/expenses/${expenseId}`, {
        date: expense.date,
        category: expense.category,
        description: expense.description,
        amount: expense.amount
      });
      setSheet(response.data);
      setEditingId(null);
      fetchStats();
      toast.success('Expense updated!');
    } catch (error) {
      toast.error('Failed to update expense');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      const response = await axios.delete(`${API}/sheets/${sheetId}/expenses/${expenseId}`);
      setSheet(response.data);
      fetchStats();
      toast.success('Expense deleted');
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await axios.get(`${API}/sheets/${sheetId}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expense_report_${sheet.month}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF downloaded!');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const updateExpenseField = (expenseId, field, value) => {
    setSheet({
      ...sheet,
      expenses: sheet.expenses.map(e =>
        e.id === expenseId ? { ...e, [field]: value } : e
      )
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!sheet) {
    return <div className="text-center py-16">Sheet not found</div>;
  }

  const pieData = stats?.by_category
    ? Object.entries(stats.by_category).map(([name, value]) => ({ name, value }))
    : [];

  const barData = pieData;

  const expensesByDate = sheet.expenses.reduce((acc, expense) => {
    const date = expense.date;
    acc[date] = (acc[date] || 0) + expense.amount;
    return acc;
  }, {});

  const lineData = Object.entries(expensesByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }));

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2" data-testid="sheet-title">{sheet.name}</h1>
          <p className="text-gray-600">Month: {sheet.month}</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleDownloadPDF}
            data-testid="download-pdf-button"
            variant="outline"
            className="px-6 py-6 rounded-xl"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button
            onClick={() => onDeleteSheet(sheetId)}
            data-testid="delete-sheet-button"
            variant="destructive"
            className="px-6 py-6 rounded-xl"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Sheet
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-xl p-6"
          data-testid="total-expenses-card"
        >
          <p className="text-gray-600 mb-2">Total Expenses</p>
          <p className="text-3xl font-bold text-blue-600">${stats?.total.toFixed(2) || '0.00'}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-effect rounded-xl p-6"
        >
          <p className="text-gray-600 mb-2">Transactions</p>
          <p className="text-3xl font-bold text-green-600">{stats?.count || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-effect rounded-xl p-6"
        >
          <p className="text-gray-600 mb-2">Average per Transaction</p>
          <p className="text-3xl font-bold text-purple-600">
            ${stats?.count > 0 ? (stats.total / stats.count).toFixed(2) : '0.00'}
          </p>
        </motion.div>
      </div>

      {/* Charts */}
      {stats && stats.count > 0 && pieData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-effect rounded-xl p-6 chart-container"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <PieChartIcon className="w-5 h-5 mr-2 text-blue-600" />
              Expense Distribution
            </h3>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    animationDuration={800}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="glass-effect rounded-xl p-6 chart-container"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              By Category
            </h3>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {lineData.length > 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="glass-effect rounded-xl p-6 chart-container lg:col-span-2"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Daily Spending Trend</h3>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} animationDuration={800} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Expense Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-effect rounded-xl p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold text-gray-800">Expenses</h3>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-expense-button" className="bg-blue-600 hover:bg-blue-700 rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="add-expense-dialog">
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="expense-date">Date</Label>
                  <Input
                    id="expense-date"
                    data-testid="expense-date-input"
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-category">Category</Label>
                  <Select
                    value={expenseForm.category}
                    onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
                  >
                    <SelectTrigger data-testid="expense-category-select">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-description">Description</Label>
                  <Input
                    id="expense-description"
                    data-testid="expense-description-input"
                    placeholder="e.g., Grocery shopping"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-amount">Amount ($)</Label>
                  <Input
                    id="expense-amount"
                    data-testid="expense-amount-input"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  />
                </div>
                <Button
                  onClick={handleAddExpense}
                  data-testid="submit-expense-button"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Add Expense
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {sheet.expenses.length === 0 ? (
          <div className="text-center py-16 text-gray-500" data-testid="no-expenses-message">
            No expenses yet. Add your first expense to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="expenses-table">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sheet.expenses.sort((a, b) => b.date.localeCompare(a.date)).map((expense) => (
                  <tr
                    key={expense.id}
                    className="expense-row border-b border-gray-100"
                    data-testid={`expense-row-${expense.id}`}
                  >
                    <td className="py-3 px-4">
                      {editingId === expense.id ? (
                        <Input
                          type="date"
                          value={expense.date}
                          onChange={(e) => updateExpenseField(expense.id, 'date', e.target.value)}
                          className="w-36"
                        />
                      ) : (
                        <span className="text-gray-700">{expense.date}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editingId === expense.id ? (
                        <Select
                          value={expense.category}
                          onValueChange={(value) => updateExpenseField(expense.id, 'category', value)}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {expense.category}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editingId === expense.id ? (
                        <Input
                          value={expense.description}
                          onChange={(e) => updateExpenseField(expense.id, 'description', e.target.value)}
                        />
                      ) : (
                        <span className="text-gray-700">{expense.description}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {editingId === expense.id ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={expense.amount}
                          onChange={(e) => updateExpenseField(expense.id, 'amount', parseFloat(e.target.value))}
                          className="w-28 ml-auto"
                        />
                      ) : (
                        <span className="font-semibold text-gray-800">${expense.amount.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        {editingId === expense.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateExpense(expense.id)}
                              data-testid={`save-expense-${expense.id}`}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                              data-testid={`cancel-edit-${expense.id}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(expense.id)}
                              data-testid={`edit-expense-${expense.id}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteExpense(expense.id)}
                              data-testid={`delete-expense-${expense.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ExpenseSheet;