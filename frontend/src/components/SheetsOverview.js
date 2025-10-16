import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

const SheetsOverview = ({ sheets, onCreateSheet }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [month, setMonth] = useState('');
  const navigate = useNavigate();

  const handleCreate = () => {
    if (name && month) {
      onCreateSheet(name, month);
      setName('');
      setMonth('');
      setOpen(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2" data-testid="overview-title">
            Your Expense Sheets
          </h1>
          <p className="text-gray-600">Manage and track your monthly expenses</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              data-testid="create-sheet-button"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-6 rounded-xl text-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Sheet
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="create-sheet-dialog">
            <DialogHeader>
              <DialogTitle>Create New Expense Sheet</DialogTitle>
              <DialogDescription>
                Add a new monthly expense sheet to track your spending
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="sheet-name">Sheet Name</Label>
                <Input
                  id="sheet-name"
                  data-testid="sheet-name-input"
                  placeholder="e.g., January 2024"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sheet-month">Month (YYYY-MM)</Label>
                <Input
                  id="sheet-month"
                  data-testid="sheet-month-input"
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </div>
              <Button
                onClick={handleCreate}
                data-testid="create-sheet-submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Create Sheet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {sheets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-effect rounded-2xl p-16 text-center"
          data-testid="no-sheets-message"
        >
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-2xl font-semibold text-gray-700 mb-2">No sheets yet</h3>
          <p className="text-gray-600">Create your first expense sheet to get started</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sheets.map((sheet, index) => (
            <motion.div
              key={sheet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-effect rounded-xl p-6 sheet-card cursor-pointer"
              onClick={() => navigate(`/sheet/${sheet.id}`)}
              data-testid={`sheet-card-${sheet.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  {sheet.month}
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2">{sheet.name}</h3>
              <p className="text-gray-600 text-sm">
                {sheet.expenses?.length || 0} transactions
              </p>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-2xl font-bold text-blue-600">
                  ${(sheet.expenses || []).reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total expenses</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SheetsOverview;