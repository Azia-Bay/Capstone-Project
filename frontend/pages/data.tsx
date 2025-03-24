import { useState, useEffect } from 'react';
import { Lato } from "next/font/google";
import Head from "next/head";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

import Header from "../components/header";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

const lato = Lato({
	subsets: ["latin"],
	weight: ["300", "400"]
});

interface TweetData {
	tweet: string;
	disasterType: number;
}

const disasterLabels = [
	"No Disaster",
	"Earthquake",
	"Flood",
	"Hurricane",
	"Tornado",
	"Wildfire"
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF5733'];

// Sample data as fallback if CSV loading fails
const sampleData: TweetData[] = [
	{ tweet: "Sample tweet about an earthquake", disasterType: 1 },
	{ tweet: "Sample tweet about a flood", disasterType: 2 },
	{ tweet: "Sample tweet about nothing important", disasterType: 0 },
	{ tweet: "Sample tweet about a hurricane warning", disasterType: 3 },
	{ tweet: "Sample tweet about tornado damage", disasterType: 4 },
	{ tweet: "Sample tweet about wildfire evacuation", disasterType: 5 }
];

export default function Data() {
	const [data, setData] = useState<TweetData[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				console.log("Attempting to fetch data...");
				const response = await fetch('/preprocessed_data_utf8.csv');
				console.log("Fetch response:", response);
				const csvText = await response.text();
				console.log("CSV text length:", csvText.length);
				
				Papa.parse(csvText, {
					delimiter: '\t',
					header: false,
					skipEmptyLines: true,
					complete: (results) => {
						console.log("Parse complete, rows:", results.data.length);
						const parsedData = results.data.map((row: any) => ({
							tweet: row[0],
							disasterType: parseInt(row[1])
						}));
						console.log("First few records:", parsedData.slice(0, 3));
						setData(parsedData);
						setLoading(false);
					},
					error: (error) => {
						console.error("Papa parse error:", error);
						setError('Error parsing CSV: ' + error.message);
						setLoading(false);
					}
				});
			} catch (err) {
				console.error("Fetch error:", err);
				console.log("Using sample data instead");
				setData(sampleData);
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	// Calculate disaster type distribution
	const getDisasterDistribution = () => {
		const distribution = new Array(6).fill(0);
		
		data.forEach(item => {
			if (item.disasterType >= 0 && item.disasterType <= 5) {
				distribution[item.disasterType]++;
			}
		});
		
		return distribution.map((count, index) => ({
			name: disasterLabels[index],
			value: count
		}));
	};

	// Calculate average tweet length by disaster type
	const getAverageTweetLengthByDisaster = () => {
		const lengthSum = new Array(6).fill(0);
		const count = new Array(6).fill(0);
		
		data.forEach(item => {
			if (item.disasterType >= 0 && item.disasterType <= 5) {
				lengthSum[item.disasterType] += item.tweet.length;
				count[item.disasterType]++;
			}
		});
		
		return lengthSum.map((sum, index) => ({
			name: disasterLabels[index],
			length: count[index] ? Math.round(sum / count[index]) : 0
		}));
	};

	// Calculate word frequency analysis (just for common words)
	const getWordFrequency = () => {
		const wordCounts: Record<string, number> = {};
		
		data.forEach(item => {
			const words = item.tweet.toLowerCase().split(/\s+/);
			words.forEach(word => {
				// Remove punctuation and only count words with 3+ characters
				const cleanWord = word.replace(/[^\w]/g, '');
				if (cleanWord.length >= 3) {
					wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
				}
			});
		});
		
		// Get top 10 words
		return Object.entries(wordCounts)
			.filter(([word]) => !['the', 'and', 'for', 'this', 'that', 'with'].includes(word)) // Filter common stop words
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10)
			.map(([word, count]) => ({ word, count }));
	};

	// Render data visualization content
	const renderContent = () => {
		if (loading) {
			return (
				<div style={{ padding: '20px' }}>
					<h1>Data Analysis</h1>
					<p>Loading disaster tweet data...</p>
				</div>
			);
		}

		if (error) {
			return (
				<div style={{ padding: '20px' }}>
					<h1>Data Analysis</h1>
					<p style={{ color: 'red' }}>{error}</p>
				</div>
			);
		}

		const disasterDistribution = getDisasterDistribution();
		const tweetLengthData = getAverageTweetLengthByDisaster();
		const wordFrequencyData = getWordFrequency();

		return (
			<div style={{ padding: '20px' }}>
				<h1>Disaster Tweets Analysis</h1>
				<p>Analyzing {data.length} tweets classified by disaster type</p>

				<div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '30px' }}>
					{/* Disaster Distribution Pie Chart */}
					<div style={{ 
						width: '500px', 
						height: '400px', 
						backgroundColor: 'white', 
						borderRadius: '8px',
						boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
						padding: '20px'
					}}>
						<h2>Disaster Type Distribution</h2>
						<ResponsiveContainer width="100%" height={300}>
							<PieChart>
								<Pie
									data={disasterDistribution}
									cx="50%"
									cy="50%"
									labelLine={true}
									label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
									outerRadius={100}
									fill="#8884d8"
									dataKey="value"
								>
									{disasterDistribution.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
									))}
								</Pie>
								<Tooltip formatter={(value) => [`${value} tweets`, 'Count']} />
								<Legend />
							</PieChart>
						</ResponsiveContainer>
					</div>

					{/* Average Tweet Length Bar Chart */}
					<div style={{ 
						width: '500px', 
						height: '400px', 
						backgroundColor: 'white', 
						borderRadius: '8px',
						boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
						padding: '20px'
					}}>
						<h2>Average Tweet Length by Disaster Type</h2>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={tweetLengthData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="name" />
								<YAxis label={{ value: 'Characters', angle: -90, position: 'insideLeft' }} />
								<Tooltip />
								<Legend />
								<Bar dataKey="length" fill="#8884d8" name="Avg. Characters" />
							</BarChart>
						</ResponsiveContainer>
					</div>

					{/* Word Frequency Bar Chart */}
					<div style={{ 
						width: '500px', 
						height: '400px', 
						backgroundColor: 'white', 
						borderRadius: '8px',
						boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
						padding: '20px'
					}}>
						<h2>Most Common Words in Tweets</h2>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={wordFrequencyData} layout="vertical">
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis type="number" />
								<YAxis dataKey="word" type="category" width={80} />
								<Tooltip />
								<Legend />
								<Bar dataKey="count" fill="#82ca9d" name="Frequency" />
							</BarChart>
						</ResponsiveContainer>
					</div>

					{/* Tweet Count by Disaster Type */}
					<div style={{ 
						width: '500px', 
						height: '400px', 
						backgroundColor: 'white', 
						borderRadius: '8px',
						boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
						padding: '20px'
					}}>
						<h2>Tweet Count by Disaster Type</h2>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={disasterDistribution}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="name" />
								<YAxis label={{ value: 'Number of Tweets', angle: -90, position: 'insideLeft' }} />
								<Tooltip />
								<Legend />
								<Bar dataKey="value" fill="#FF8042" name="Tweet Count" />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className={lato.className} style={{minHeight: "125vh"}}>
			<Head>
				<title>Bluesky Disaster Analytics | Data</title>
			</Head>

			<Header />
			<Navbar />
			
			<main style={{ marginLeft: '200px', paddingTop: '50px' }}>
				{renderContent()}
			</main>
			
			<Footer />

			<style jsx global>{`
				html,
				body {
					padding: 0;
					margin: 0;
					font-family:
						var(--font-lato),
						sans-serif;
				}
				* {
					box-sizing: border-box;
				}
			`}</style>
		</div>
	);
}