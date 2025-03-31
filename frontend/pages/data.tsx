import { useState, useEffect } from 'react';
import { Lato } from "next/font/google";
import Head from "next/head";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

export default function Data() {
	const [data, setData] = useState<TweetData[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const setUpStream = async () => {
			const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
			await sleep(2000);
			
			// Create EventSource for SSE endpoint
			const eventSource = new EventSource('http://localhost:8000/all-data');

			eventSource.onopen = () => {
				console.log('EventSource connected');
				setLoading(false);
			}

			eventSource.addEventListener('newTweets', function (event) {
				const newTweets: TweetData[] = JSON.parse(event.data);
				console.log('new tweets:', newTweets);
				
				// Update state by appending new tweets
				setData(prevData => {
					// Avoid duplicate tweets
					const uniqueNewTweets = newTweets.filter(
						newTweet => !prevData.some(
							existingTweet => 
								existingTweet.tweet === newTweet.tweet && 
								existingTweet.disasterType === newTweet.disasterType
						)
					);
					
					return [...prevData, ...uniqueNewTweets];
				});
			});

			// Error handling
			eventSource.onerror = (error) => {
				console.error('EventSource failed', error);
				setError('Failed to connect to tweet stream');
				eventSource.close();
				setLoading(false);
			}

			// Cleanup function to close EventSource
			return () => {
				eventSource.close();
			};
		}

		const streamSetup = setUpStream();
		
		// Cleanup on component unmount
		return () => {
			streamSetup.then(cleanup => cleanup && cleanup());
		};
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
					<p>Waiting for tweets to stream in...</p>
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