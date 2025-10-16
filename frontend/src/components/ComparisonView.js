import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const ComparisonView = ({ sheets }) => {
  const [sheet1Id, setSheet1Id] = useState('');
  const [sheet2Id, setSheet2Id] = useState('');
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (!sheet1Id || !sheet2Id) {
      toast.error('Please select two sheets to compare');
      return;
    }

    if (sheet1Id === sheet2Id) {
      toast.error('Please select different sheets');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API}/sheets/compare/${sheet1Id}/${sheet2Id}`);
      setComparison(response.data);
    } catch (error) {
      toast.error('Failed to compare sheets');
    } finally {
      setLoading(false);
    }
  };

  const PercentageIndicator = ({ value }) => {
    if (value === 0) {
      return (
        <div className="flex items-center text-gray-500">
          <Minus className="w-4 h-4 mr-1" />
          <span>0%</span>
        </div>
      );
    }
    
    const isPositive = value > 0;
    return (
      <div className={`flex items-center ${isPositive ? 'text-red-600' : 'text-green-600'}`}>
        {isPositive ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
        <span className="font-semibold">{Math.abs(value).toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <div className="fade-in">
      <h1 className="text-4xl font-bold text-gray-800 mb-8" data-testid="comparison-title">Compare Expense Sheets</h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-xl p-8 mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <Label>First Sheet</Label>
            <Select value={sheet1Id} onValueChange={setSheet1Id}>
              <SelectTrigger data-testid="sheet1-select">
                <SelectValue placeholder="Select sheet" />
              </SelectTrigger>
              <SelectContent>
                {sheets.map(sheet => (
                  <SelectItem key={sheet.id} value={sheet.id}>
                    {sheet.name} ({sheet.month})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Second Sheet</Label>
            <Select value={sheet2Id} onValueChange={setSheet2Id}>
              <SelectTrigger data-testid="sheet2-select">
                <SelectValue placeholder="Select sheet" />
              </SelectTrigger>
              <SelectContent>
                {sheets.map(sheet => (
                  <SelectItem key={sheet.id} value={sheet.id}>
                    {sheet.name} ({sheet.month})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleCompare}
            data-testid="compare-button"
            className="bg-blue-600 hover:bg-blue-700 py-6 rounded-xl"
            disabled={loading}
          >
            {loading ? 'Comparing...' : 'Compare'}
          </Button>
        </div>
      </motion.div>

      {comparison && (
        <div className="space-y-6">
          {/* Total Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-xl p-8"
            data-testid="total-comparison"
          >
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Total Expenses</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">{comparison.sheet1.name}</p>
                <p className="text-3xl font-bold text-blue-600">
                  ${comparison.comparison.total.sheet1.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">{comparison.sheet2.name}</p>
                <p className="text-3xl font-bold text-blue-600">
                  ${comparison.comparison.total.sheet2.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Change</p>
                <p className="text-3xl font-bold text-gray-800 mb-2">
                  ${Math.abs(comparison.comparison.total.difference).toFixed(2)}
                </p>
                <PercentageIndicator value={comparison.comparison.total.percent_change} />
              </div>
            </div>
          </motion.div>

          {/* Category Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-effect rounded-xl p-8"
          >
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">By Category</h2>
            <div className="space-y-4">
              {Object.entries(comparison.comparison.categories).map(([category, data]) => (
                <div
                  key={category}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white bg-opacity-50 rounded-lg"
                  data-testid={`category-comparison-${category}`}
                >
                  <div>
                    <p className="font-semibold text-gray-800">{category}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Sheet 1</p>
                    <p className="font-semibold text-blue-600">${data.sheet1.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Sheet 2</p>
                    <p className="font-semibold text-blue-600">${data.sheet2.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Change</p>
                    <p className="font-semibold text-gray-800 mb-1">
                      ${Math.abs(data.difference).toFixed(2)}
                    </p>
                    <div className="flex justify-center">
                      <PercentageIndicator value={data.percent_change} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Transaction Count */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-effect rounded-xl p-8"
          >
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Transaction Count</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">{comparison.sheet1.name}</p>
                <p className="text-3xl font-bold text-green-600">
                  {comparison.comparison.count.sheet1} transactions
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">{comparison.sheet2.name}</p>
                <p className="text-3xl font-bold text-green-600">
                  {comparison.comparison.count.sheet2} transactions
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {!comparison && (
        <div className="glass-effect rounded-xl p-16 text-center" data-testid="no-comparison-message">
          <p className="text-gray-500 text-lg">Select two sheets and click Compare to see the analysis</p>
        </div>
      )}
    </div>
  );
};

export default ComparisonView;