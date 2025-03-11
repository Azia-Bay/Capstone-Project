import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import Papa from "papaparse";

// Register required components
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Graph() {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    // fetch("/preprocessed_data_utf8.csv") // Ensure data.csv is in the `public` folder
    //   .then(response => response.text())
    //   .then(csvData => {
    //     Papa.parse(csvData, {
    //       header: true,
    //       dynamicTyping: true,
    //       complete: function (result) {
    //         const labels = result.data.map(row => row.Category);
    //         const values = result.data.map(row => row.Value);
            
    //         setChartData({
    //           labels,
    //           datasets: [
    //             {
    //               label: "Graph Data",
    //               data: values,
    //               backgroundColor: "rgba(75,192,192,0.6)",
    //             },
    //           ],
    //         });
    //       },
    //     });
    //   });
  }, []);

  if (!chartData) return <p>Loading...</p>;

  return (
    <div style={{ width: "300px", height: "200px" }}>
      <Bar data={chartData} />
    </div>
  );
}