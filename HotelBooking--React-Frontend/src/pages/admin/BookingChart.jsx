
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BookingChart = ({ data }) => {
  // Process data to fit the chart format if needed
  const chartData = data.map(item => ({
    name: item.month,
    bookings: item.bookings,
    revenue: item.revenue,
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Overview</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="bookings" fill="#8884d8" name="Bookings" />
          <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Revenue (R)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BookingChart;
