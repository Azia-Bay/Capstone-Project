import { useState, useEffect } from 'react';
import { Lato } from "next/font/google";
import Head from "next/head";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

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
		// Create variable to store cleanup function
		let cleanupFunction: (() => void) | undefined;
		
		// Function to fetch tweets
		const fetchTweets = async () => {
			try {
				// Initial delay to simulate the original behavior
				await new Promise(resolve => setTimeout(resolve, 2000));
				
				const response = await axios.get('http://localhost:8000/nondisaster-data');
				setData(response.data);
				
				// Simulating a successful response for now
				const mockData: TweetData[] = [
					{ tweet: "Just felt a small earthquake, everything is fine though. #earthquake", disasterType: 1 },
					{ tweet: "Beautiful day outside today! Going for a hike.", disasterType: 0 },
					{ tweet: "Flood warnings in effect for the eastern part of the county. Stay safe! #flood", disasterType: 2 }
				];
				setData(mockData);
				setLoading(false);
				
				// Set up polling for new tweets
				cleanupFunction = startPolling();
			} catch (err) {
				console.error('Failed to fetch tweets:', err);
				setError('Failed to fetch tweet data');
				setLoading(false);
			}
		};
		
		// Function to poll for new tweets at regular intervals
		const startPolling = (): (() => void) => {
			const pollingInterval = setInterval(async () => {
				try {
					const response = await axios.get('http://localhost:8000/nondisaster-data');
					
					// For now, simulate new data
					const mockNewData: TweetData[] = [
						{ tweet: "Hurricane warning issued for coastal areas. #hurricane", disasterType: 3 }
					];
					
					// Update state by appending new tweets
					setData(prevData => {
						// Avoid duplicate tweets
						const uniqueNewTweets = mockNewData.filter(
							newTweet => !prevData.some(
								existingTweet => 
									existingTweet.tweet === newTweet.tweet && 
									existingTweet.disasterType === newTweet.disasterType
							)
						);
						
						return [...prevData, ...uniqueNewTweets];
					});
				} catch (err) {
					console.error('Polling failed:', err);
					// Don't set error state here to avoid disrupting the UI if just one poll fails
				}
			}, 5000); // Poll every 5 seconds
			
			// Return cleanup function
			return () => clearInterval(pollingInterval);
		};
		
		// Start the initial fetch
		fetchTweets();
		
		// Cleanup function
		return () => {
			if (cleanupFunction) {
				cleanupFunction();
			}
		};
	}, []);

	// Async function to fetch data on demand (could be used for refresh button)
	const refreshData = async () => {
		setLoading(true);
		try {
			const response = await axios.get('http://localhost:8000/nondisaster-data');
			
			// For now, simulate new data
			const mockNewData: TweetData[] = [
				{ tweet: "Tornado spotted near downtown! Take shelter immediately! #tornado", disasterType: 4 },
				{ tweet: "Wildfire contained, firefighters monitoring the situation. #wildfire", disasterType: 5 }
			];
			
			// Update state with the fetched data while preserving existing data
			setData(prevData => {
				// Avoid duplicate tweets
				const uniqueNewTweets = mockNewData.filter(
					newTweet => !prevData.some(
						existingTweet => 
							existingTweet.tweet === newTweet.tweet && 
							existingTweet.disasterType === newTweet.disasterType
					)
				);
				
				return [...prevData, ...uniqueNewTweets];
			});
			setLoading(false);
		} catch (err) {
			console.error('Failed to refresh data:', err);
			setError('Failed to refresh tweet data');
			setLoading(false);
		}
	};

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
					<button 
						onClick={refreshData}
						style={{
							padding: '8px 16px',
							backgroundColor: '#0088FE',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer'
						}}
					>
						Try Again
					</button>
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
				
				<button 
					onClick={refreshData}
					style={{
						padding: '8px 16px',
						backgroundColor: '#0088FE',
						color: 'white',
						border: 'none',
						borderRadius: '4px',
						cursor: 'pointer',
						marginBottom: '20px'
					}}
				>
					Refresh Data
				</button>

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