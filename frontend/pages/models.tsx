import React from "react";
import { Lato } from "next/font/google";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PieChart, Pie, Cell } from "recharts";

import Head from "next/head";
import Header from "../components/header";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

// Define the type for our model comparison data
interface ModelMetric {
  model: string;
  accuracy: number;
  f1Score: number;
  trainingTime: number;
  inferenceSpeed: number;
}

// Define the type for our class distribution data
interface ClassDistribution {
  name: string;
  label: number;
  count: number;
  percentage: number;
}

// Define the type for our minority class performance data
export default function Models() {
  const classDistributionData: ClassDistribution[] = [
    { name: "No Disaster", label: 0, count: 100000, percentage: 52.09 },
    { name: "Earthquake", label: 1, count: 21427, percentage: 11.16 },
    { name: "Flood", label: 2, count: 15121, percentage: 7.88 },
    { name: "Hurricane", label: 3, count: 43669, percentage: 22.75 },
    { name: "Tornado", label: 4, count: 5904, percentage: 3.08 },
    { name: "Wildfire", label: 5, count: 5849, percentage: 3.05 },
  ];

  // Model comparison data
  const modelComparisonData: ModelMetric[] = [
    {
      model: "LSTM",
      accuracy: 96,
      f1Score: 0.96,
      trainingTime: 45,
      inferenceSpeed: 150,
    },
    {
      model: "LinearSVM",
      accuracy: 95,
      f1Score: 0.95,
      trainingTime: 15,
      inferenceSpeed: 80,
    },
    {
      model: "LightGBM",
      accuracy: 96,
      f1Score: 0.96,
      trainingTime: 10,
      inferenceSpeed: 30,
    },
  ];

  // Minority class performance data
  const minorityClassData = [
    { model: "LSTM", tornado: 0.93, wildfire: 0.95, average: 0.94 },
    { model: "LinearSVM", tornado: 0.92, wildfire: 0.92, average: 0.92 },
    { model: "LightGBM", tornado: 0.95, wildfire: 0.95, average: 0.95 },
  ];

  // Colors for pie chart
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
  ];

  // Setup model metrics for comparison visualization
  const modelMetricsForAccuracy = modelComparisonData.map((item) => ({
    name: item.model,
    Accuracy: item.accuracy,
  }));

  const modelMetricsForF1 = modelComparisonData.map((item) => ({
    name: item.model,
    F1Score: item.f1Score,
  }));

  const modelMetricsForTiming = modelComparisonData.map((item) => ({
    name: item.model,
    TrainingTime: item.trainingTime,
    InferenceSpeed: item.inferenceSpeed,
  }));

  return (
    <div className={lato.className} style={{ minHeight: "125vh" }}>
      <Head>
        <title>Bluesky Disaster Analytics | Models</title>
      </Head>

      <Header />
      <Navbar />

      <main
        style={{
          marginLeft: "200px", // Matches navbar width
          marginTop: "70px", // Provides space below fixed header (50px + extra padding)
          padding: "20px 40px",
        }}
      >
        <div className="max-w-6xl mx-auto p-6">
          <h1 className="text-3xl font-bold text-center mb-8">
            Comparative Analysis of Machine Learning Models for Disaster Tweet
            Classification
          </h1>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">
              1. Introduction and Problem Statement
            </h2>
            <p className="mb-4">
              This report presents a comparative analysis of three machine
              learning models—LSTM, LinearSVM, and LightGBM—for classifying
              tweets into different disaster categories. Social media platforms
              like Twitter have become vital information sources during
              emergencies, making automated classification of disaster-related
              content increasingly important for emergency response and resource
              allocation.
            </p>
            <p className="mb-4">
              Our analysis focuses on classifying tweets into six categories:
            </p>
            <ul className="list-disc pl-8 mb-4">
              <li>0: No disaster</li>
              <li>1: Earthquake</li>
              <li>2: Flood</li>
              <li>3: Hurricane</li>
              <li>4: Tornado</li>
              <li>5: Wildfire</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">2. Data Analysis</h2>

            <h3 className="text-xl font-medium mb-3">2.1 Class Distribution</h3>
            <p className="mb-4">
              Our dataset consists of 191,970 labeled tweets with the following
              distribution:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              <div className="bg-white p-4 rounded shadow">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={classDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="name"
                      label={({ name, percentage }) =>
                        `${name}: ${percentage}%`
                      }
                    >
                      {classDistributionData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <p className="mb-6">
              This distribution reveals significant class imbalance, with "No
              Disaster" tweets comprising over half the dataset, while Tornado
              and Wildfire categories represent only a smaller portion. This was
              due to the lack of available training sets of tornado and wildfire
              tweets.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">
              3. Model Performance
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              <div className="bg-white p-4 rounded shadow">
                <h3 className="text-xl font-medium mb-3">Model Accuracy</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={modelMetricsForAccuracy}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[90, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="Accuracy"
                      fill="#8884d8"
                      name="Accuracy (%)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-4 rounded shadow">
                <h3 className="text-xl font-medium mb-3">Model F1 Score</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={modelMetricsForF1}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0.9, 1]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="F1Score" fill="#82ca9d" name="F1 Score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-4 rounded shadow mb-6">
              <h3 className="text-xl font-medium mb-3">
                Model Timing Performance
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={modelMetricsForTiming}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="TrainingTime"
                    fill="#8884d8"
                    name="Training Time (min)"
                  />
                  <Bar
                    dataKey="InferenceSpeed"
                    fill="#82ca9d"
                    name="Inference Speed (ms/batch)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-4 rounded shadow mb-6">
              <h3 className="text-xl font-medium mb-3">
                LSTM Training Progression
              </h3>
              <img
                src="/images/LSTM-Progression.png"
                alt="LSTM Training Progression"
              />
              <p className="mb-4">
                Note: The graphs show that while training accuracy continues to
                improve, reaching nearly 99% by epoch 10, validation accuracy
                plateaus around 96.5%. This suggests that stopping training
                around epoch 5-6 would likely provide the optimal model in terms
                of generalization ability
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">
                Model Confusion Matrix
              </h3>
              <div className="flex flex-row flex-wrap justify-center gap-8">
                {modelComparisonData.map((model, index) => (
                  <div key={index} className="text-center flex-shrink-0">
                    <p className="text-lg font-medium">{model.model}</p>
                    <img
                      src={`/images/${model.model}-CM.png`}
                      alt={`${model.model} Confusion Matrix`}
                      className="mx-auto mb-2"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">
              4. Performance on Minority Classes
            </h2>
            <p className="mb-4">
              A key challenge in this dataset is the significant class
              imbalance, particularly for tornado and wildfire categories.
            </p>

            <div className="bg-white p-4 rounded shadow mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tornado F1
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Wildfire F1
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg. Minority F1
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {minorityClassData.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.model}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.tornado}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.wildfire}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.average}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">
              5. Model Comparison Summary
            </h2>
            <div className="bg-white p-4 rounded shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aspect
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LSTM
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LinearSVM
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LightGBM
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      Overall Accuracy
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">97%</td>
                    <td className="px-6 py-4 whitespace-nowrap">95%</td>
                    <td className="px-6 py-4 whitespace-nowrap">96%</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      Weighted F1-Score
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">0.97</td>
                    <td className="px-6 py-4 whitespace-nowrap">0.94</td>
                    <td className="px-6 py-4 whitespace-nowrap">0.96</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      Minority Class Performance
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">Very Good</td>
                    <td className="px-6 py-4 whitespace-nowrap">Good</td>
                    <td className="px-6 py-4 whitespace-nowrap">Excellent</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      Training Time
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">~45 min</td>
                    <td className="px-6 py-4 whitespace-nowrap">~15 min</td>
                    <td className="px-6 py-4 whitespace-nowrap">~10 min</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      Inference Speed
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ~150ms/batch
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">~80ms/batch</td>
                    <td className="px-6 py-4 whitespace-nowrap">~30ms/batch</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      Memory Requirements
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">High</td>
                    <td className="px-6 py-4 whitespace-nowrap">Medium</td>
                    <td className="px-6 py-4 whitespace-nowrap">Low</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      Handling Imbalance
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">Strong</td>
                    <td className="px-6 py-4 whitespace-nowrap">Moderate</td>
                    <td className="px-6 py-4 whitespace-nowrap">Strong</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      Interpretability
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">Low</td>
                    <td className="px-6 py-4 whitespace-nowrap">High</td>
                    <td className="px-6 py-4 whitespace-nowrap">Medium</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">6. Recommendations</h2>
            <div className="bg-white p-4 rounded shadow mb-6">
              <h3 className="text-xl font-medium mb-3">Model Selection</h3>
              <ul className="list-disc pl-8 mb-4">
                <li>For highest overall accuracy: LSTM model</li>
                <li>
                  For the best balance of performance and computational
                  efficiency: LightGBM
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-4">7. Conclusion</h2>
            <p className="mb-4">
            This comparative analysis demonstrates the effectiveness of different machine learning approaches for disaster tweet classification. 
            The LSTM model and LightGBM show the best overall performance with a weighted F1-score of 0.96. However, LightGBM offers substantial 
            advantages in terms of training and efficiency and is easier for deployment.
            </p>
            <p className="mb-4">
            By implementing these classification systems, emergency response organizations can better monitor social media during crisis events, 
            potentially improving response times. The ability to automatically classify disaster-related content enables more efficient information 
            processing during critical situations when timely response is essential.
            </p>
          </section>
        </div>
      </main>

      <Footer />

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: var(--font-lato), sans-serif;
        }
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
