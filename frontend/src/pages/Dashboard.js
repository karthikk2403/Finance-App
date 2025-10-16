import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';
import SheetsOverview from '../components/SheetsOverview';
import ExpenseSheet from '../components/ExpenseSheet';
import ComparisonView from '../components/ComparisonView';
import Sidebar from '../components/Sidebar';

const Dashboard = ({ user, onLogout }) => {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchSheets = async () => {
    try {
      const response = await axios.get(`${API}/sheets`);
      setSheets(response.data);
    } catch (error) {
      toast.error('Failed to load sheets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheets();
  }, []);

  const handleCreateSheet = async (name, month) => {
    try {
      const response = await axios.post(`${API}/sheets`, { name, month });
      setSheets([response.data, ...sheets]);
      toast.success('Sheet created successfully!');
      navigate(`/sheet/${response.data.id}`);
    } catch (error) {
      toast.error('Failed to create sheet');
    }
  };

  const handleDeleteSheet = async (sheetId) => {
    try {
      await axios.delete(`${API}/sheets/${sheetId}`);
      setSheets(sheets.filter(s => s.id !== sheetId));
      toast.success('Sheet deleted successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to delete sheet');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex">
      <Sidebar user={user} onLogout={onLogout} sheets={sheets} />
      
      <div className="flex-1 ml-64">
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Routes>
              <Route
                index
                element={
                  <SheetsOverview
                    sheets={sheets}
                    onCreateSheet={handleCreateSheet}
                  />
                }
              />
              <Route
                path="sheet/:sheetId"
                element={
                  <ExpenseSheet
                    sheets={sheets}
                    onDeleteSheet={handleDeleteSheet}
                  />
                }
              />
              <Route
                path="compare"
                element={<ComparisonView sheets={sheets} />}
              />
            </Routes>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;