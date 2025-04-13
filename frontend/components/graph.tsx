import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import Papa from "papaparse";
import { Tweet } from "../components/disaster_map";

// Register required components
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface GraphProps {
  tweets: Tweet[];
}

const categoryLabels: Record<string, string> = {
  "1": "Earthquake",
  "2": "Flood",
  "3": "Hurricane",
  "4": "Tornado",
  "5": "Wildfire",
};

export default function Graph({ tweets }: GraphProps) {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const categoryCounts: Record<number, number> = {1:0, 2:0, 3:0, 4:0, 5:0};

    tweets.forEach(tweet => {
      const category = Number(tweet.model);
      if (categoryCounts[category] !== undefined) {
        categoryCounts[category]++;
      }
    });

    const labels = Object.keys(categoryCounts).map(c => categoryLabels[c] || `Category ${c}`);
    const values = Object.values(categoryCounts);

    setChartData({
      labels,
      datasets: [
        {
          label: "Tweets",
          data: values,
          backgroundColor: "rgba(75,192,192,0.6)",
        },
      ],
    });
  }, [tweets]);
  
    /*fetch("/preprocessed_data_utf8.csv")
      .then(response => response.text())
      .then(csvData => {
        interface DataRow {
          Category: string;
          Value: number;
        }

        Papa.parse<DataRow>(csvData, {
          header: true,
          dynamicTyping: true,
          complete: function (result) {
            const labels = result.data.map(row => row.Category);
            const values = result.data.map(row => row.Value);  
            setChartData({
              labels,
              datasets: [
                {
                  label: "Graph Data",
                  data: values,
                  backgroundColor: "rgba(75,192,192,0.6)",
                },
              ],
            });
          },
        });
      });
  }, []);
  */
  if (!chartData) return <p>Loading...</p>;

  return (
    <div style={{ width: "300px", height: "200px" }}>
      <Bar data={chartData} />
    </div>
  );
}