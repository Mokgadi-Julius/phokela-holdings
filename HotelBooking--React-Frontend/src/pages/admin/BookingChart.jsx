
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const formatCurrency = (value) => `R${value.toLocaleString()}`;

const BookingChart = ({ data }) => {
  const chartData = data.map(item => ({
    name: item.month,
    revenue: item.revenue,
    expenses: item.expenses || 0,
    profit: item.profit ?? (item.revenue - (item.expenses || 0)),
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Overview</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={formatCurrency} />
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} name="Revenue" />
          <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={false} name="Expenses" />
          <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={false} name="Profit" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BookingChart;
