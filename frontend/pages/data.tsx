import { useState, useEffect } from 'react';
import { Lato } from "next/font/google";
import Head from "next/head";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, LineChart, Line, Area, AreaChart
} from 'recharts';
import axios from 'axios';

import Header from "../components/header";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

const lato = Lato({
	subsets: ["latin"],
	weight: ["300", "400"]
});

interface TweetData {
	tweet_id?: number;
	tweet: string;
	disasterType?: number;
	model?: string;
	state?: string;
	city?: string;
	latitude?: string;
	longitude?: string;
	timestamp?: string;
}

interface PopupData {
  isOpen: boolean;
  title: string;
  tweets: TweetData[];
}

const disasterLabels = [
	"Earthquake",
	"Flood",
	"Hurricane",
	"Tornado",
	"Wildfire"
];

const COLORS = ['#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF5733'];

// Common words to filter out from word frequency analysis
const COMMON_WORDS = ['the', 'and', 'for', 'this', 'that', 'with', 'you', 'was', 'are', 'not', 'have'];

// Modal component to display tweets
const TweetPopup = ({ data, onClose }: { data: PopupData, onClose: () => void }) => {
  if (!data.isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        width: '80%',
        maxWidth: '800px',
        maxHeight: '80vh',
        padding: '20px',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>{data.title}</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer'
            }}
          >
            &times;
          </button>
        </div>
        
        {data.tweets.length > 0 ? (
          <div>
            <p>Showing {data.tweets.length} tweets:</p>
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {data.tweets.map((tweet, index) => (
                <div 
                  key={tweet.tweet_id || index} 
                  style={{
                    padding: '10px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    backgroundColor: '#f9f9f9'
                  }}
                >
                  <p style={{ margin: '0 0 5px 0' }}>{tweet.tweet}</p>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    <span>
                      {tweet.city && tweet.state ? `${tweet.city}, ${tweet.state}` : 'Location unknown'}
                    </span>
                    <span>
                      {tweet.timestamp ? new Date(tweet.timestamp).toLocaleString() : 'Time unknown'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p>No tweets available for this selection.</p>
        )}
      </div>
    </div>
  );
};

export default function Data() {
	const [data, setData] = useState<TweetData[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [eventSource, setEventSource] = useState<EventSource | null>(null);
	const [popupData, setPopupData] = useState<PopupData>({
	  isOpen: false,
	  title: '',
	  tweets: []
	});

	// Map API response to our internal format
	const mapApiResponseToTweetData = (apiResponse: any[]): TweetData[] => {
		return apiResponse.map(item => ({
			tweet_id: item.tweet_id,
			tweet: item.tweet,
			disasterType: item.model ? parseInt(item.model) : 0,
			model: item.model,
			state: item.state,
			city: item.city,
			latitude: item.latitude,
			longitude: item.longitude,
			timestamp: item.timestamp
		}));
	};

	useEffect(() => {
		// Function to fetch initial tweets
		const fetchTweets = async () => {
			try {
				setLoading(true);
				// Fetch all existing data from the disaster-data endpoint
				const response = await axios.get(`http://${process.env.NEXT_PUBLIC_BASE_URL}/disaster-data`);
				const mappedData = mapApiResponseToTweetData(response.data);
				setData(mappedData);
				setLoading(false);
				
				// After initial data load, set up event source for real-time updates
				setupEventSource();
			} catch (err) {
				console.error('Failed to fetch tweets:', err);
				setError('Failed to fetch tweet data');
				setLoading(false);
			}
		};
		
		// Start the initial fetch
		fetchTweets();
		
		// Cleanup function
		return () => {
			if (eventSource) {
				eventSource.close();
			}
		};
	}, []);

	// Set up event source for server-sent events
	const setupEventSource = () => {
		if (eventSource) {
			// Close existing connection before creating a new one
			eventSource.close();
		}

		const newEventSource = new EventSource(`http://${process.env.NEXT_PUBLIC_BASE_URL}/stream`);
		
		newEventSource.addEventListener('newTweets', (event) => {
			try {
				const newTweetsData = JSON.parse(event.data);
				const mappedNewTweets = mapApiResponseToTweetData(newTweetsData);
				
				// Update state by appending new tweets
				setData(prevData => {
					// Avoid duplicate tweets by checking tweet_id
					const uniqueNewTweets = mappedNewTweets.filter(
						newTweet => !prevData.some(
							existingTweet => 
								existingTweet.tweet_id === newTweet.tweet_id
						)
					);
					
					return [...prevData, ...uniqueNewTweets];
				});
			} catch (err) {
				console.error('Error processing event data:', err);
			}
		});
		
		newEventSource.onerror = (err) => {
			console.error('EventSource error:', err);
			newEventSource.close();
			// Try to reconnect after a delay
			setTimeout(setupEventSource, 5000);
		};
		
		setEventSource(newEventSource);
	};

	// Function to manually refresh/force update data
	const refreshData = () => {
		// Close and reestablish the event source connection
		setupEventSource();
		
		// Let the user know we're listening for new data
		setLoading(true);
		
		// Set a timeout to switch loading state back off if no new data comes in
		setTimeout(() => {
			setLoading(false);
		}, 3000);
	};

	// Calculate disaster type distribution
	const getDisasterDistribution = () => {
		// Create a counter for each disaster type (1-5)
		const distribution = new Array(5).fill(0);
		
		data.forEach(item => {
			// Adjust index since we're only tracking disaster types 1-5
			if (item.disasterType && item.disasterType >= 1 && item.disasterType <= 5) {
				distribution[item.disasterType - 1]++;
			}
		});
		
		return distribution.map((count, index) => ({
			name: disasterLabels[index],
			value: count
		})).filter(item => item.value > 0); // Only include items with values > 0
	};

	// Calculate average tweet length by disaster type
	const getAverageTweetLengthByDisaster = () => {
		const lengthSum = new Array(5).fill(0);
		const count = new Array(5).fill(0);
		
		data.forEach(item => {
			if (item.disasterType && item.disasterType >= 1 && item.disasterType <= 5) {
				lengthSum[item.disasterType - 1] += item.tweet.length;
				count[item.disasterType - 1]++;
			}
		});
		
		return lengthSum.map((sum, index) => ({
			name: disasterLabels[index],
			length: count[index] ? Math.round(sum / count[index]) : 0
		}));
	};

	// Calculate word frequency analysis
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
		
		// Get top 10 words, filtering out common words
		return Object.entries(wordCounts)
			.filter(([word]) => !COMMON_WORDS.includes(word))
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10)
			.map(([word, count]) => ({ word, count }));
	};

	// Calculate tweets timeline data (by hour)
	const getTweetsTimeline = () => {
		// Create a map to store counts by hour
		const hourlyData: Record<string, {time: string, count: number, disasterCount: Record<number, number>}> = {};
		
		data.forEach(item => {
			if (item.timestamp && item.disasterType && item.disasterType >= 1 && item.disasterType <= 5) {
				// Format the timestamp to just show the hour
				const date = new Date(item.timestamp);
				const hourKey = date.toLocaleString('en-US', { 
					month: 'short', 
					day: 'numeric', 
					hour: 'numeric'
				});
				
				if (!hourlyData[hourKey]) {
					hourlyData[hourKey] = { 
						time: hourKey, 
						count: 0,
						disasterCount: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
					};
				}
				
				hourlyData[hourKey].count++;
				hourlyData[hourKey].disasterCount[item.disasterType]++;
			}
		});
		
		// Convert to array and sort by time
		return Object.values(hourlyData)
			.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
			.map(item => ({
				time: item.time,
				count: item.count,
				earthquake: item.disasterCount[1],
				flood: item.disasterCount[2],
				hurricane: item.disasterCount[3],
				tornado: item.disasterCount[4],
				wildfire: item.disasterCount[5]
			}));
	};

	// Calculate disaster location data (for map)
	const getLocationData = () => {
		return data
			.filter(item => 
				item.latitude && 
				item.longitude && 
				item.disasterType && 
				item.disasterType >= 1 && 
				item.disasterType <= 5
			)
			.map(item => ({
				lat: parseFloat(item.latitude || "0"),
				lng: parseFloat(item.longitude || "0"),
				type: item.disasterType,
				location: `${item.city || 'Unknown'}, ${item.state || 'Unknown'}`
			}));
	};

	// Simple sentiment analysis based on keyword matching
	const getSentimentAnalysis = () => {
		// Define positive and negative keywords
		const positiveWords = ['safe', 'rescued', 'survived', 'helping', 'help', 'recovery', 'saved'];
		const negativeWords = ['dead', 'death', 'died', 'destroyed', 'damage', 'scary', 'danger', 'emergency'];
		
		const sentiments = new Array(5).fill(0).map(() => ({ positive: 0, negative: 0, neutral: 0 }));
		
		data.forEach(item => {
			if (item.disasterType && item.disasterType >= 1 && item.disasterType <= 5) {
				const tweetLower = item.tweet.toLowerCase();
				let foundPositive = false;
				let foundNegative = false;
				
				// Check for positive words
				for (const word of positiveWords) {
					if (tweetLower.includes(word)) {
						sentiments[item.disasterType - 1].positive++;
						foundPositive = true;
						break;
					}
				}
				
				// Check for negative words if no positive found
				if (!foundPositive) {
					for (const word of negativeWords) {
						if (tweetLower.includes(word)) {
							sentiments[item.disasterType - 1].negative++;
							foundNegative = true;
							break;
						}
					}
				}
				
				// If neither positive nor negative, consider neutral
				if (!foundPositive && !foundNegative) {
					sentiments[item.disasterType - 1].neutral++;
				}
			}
		});
		
		// Format for chart
		return disasterLabels.map((label, index) => ({
			name: label,
			positive: sentiments[index].positive,
			negative: sentiments[index].negative,
			neutral: sentiments[index].neutral
		}));
	};

  // Handler for pie chart clicks
  const handlePieClick = (data: any, index: number) => {
    const disasterType = index + 1; // Convert index to disaster type (1-5)
    const disasterName = disasterLabels[index];
    
    // Filter tweets for this disaster type
    const relevantTweets = data.filter((item: TweetData) => 
      item.disasterType === disasterType
    );
    
    setPopupData({
      isOpen: true,
      title: `${disasterName} Tweets`,
      tweets: relevantTweets
    });
  };

  // Handler for bar chart clicks
  const handleBarClick = (data: any, index: number, chartType: string) => {
    let title = '';
    let relevantTweets: TweetData[] = [];
    
    if (chartType === 'length') {
      // For tweet length chart
      const disasterType = index + 1;
      const disasterName = disasterLabels[index];
      
      relevantTweets = data.filter((item: TweetData) => 
        item.disasterType === disasterType
      );
      
      title = `${disasterName} Tweets`;
    } 
    else if (chartType === 'wordFrequency') {
      // For word frequency chart
      const word = data[index].word;
      
      relevantTweets = data.filter((item: TweetData) => 
        item.tweet.toLowerCase().includes(word.toLowerCase())
      );
      
      title = `Tweets containing "${word}"`;
    }
    else if (chartType === 'sentiment') {
      // For sentiment analysis chart
      const clickedValue = data.activeLabel; // This gets which stack was clicked
      const disasterName = data[index].name;
      const sentiment = data.dataKey;
      
      // Define lookup for sentiment words based on sentiment type
      const sentimentKeywords: Record<string, string[]> = {
        positive: ['safe', 'rescued', 'survived', 'helping', 'help', 'recovery', 'saved'],
        negative: ['dead', 'death', 'died', 'destroyed', 'damage', 'scary', 'danger', 'emergency'],
        neutral: []
      };
      
      // Get the keywords for the clicked sentiment
      const keywords = sentimentKeywords[sentiment] || [];
      const disasterType = disasterLabels.indexOf(disasterName) + 1;
      
      // For neutral sentiment, show tweets that don't contain positive or negative keywords
      if (sentiment === 'neutral') {
        const allKeywords = [...sentimentKeywords.positive, ...sentimentKeywords.negative];
        relevantTweets = data.filter((item: TweetData) => {
          if (item.disasterType !== disasterType) return false;
          
          const tweetLower = item.tweet.toLowerCase();
          return !allKeywords.some(word => tweetLower.includes(word));
        });
      } else {
        // For positive or negative sentiment, filter by keywords
        relevantTweets = data.filter((item: TweetData) => {
          if (item.disasterType !== disasterType) return false;
          
          const tweetLower = item.tweet.toLowerCase();
          return keywords.some(word => tweetLower.includes(word));
        });
      }
      
      title = `${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)} ${disasterName} Tweets`;
    }
    
    setPopupData({
      isOpen: true,
      title,
      tweets: relevantTweets
    });
  };

  // Handler for area chart clicks (timeline)
  const handleAreaClick = (data: any) => {
    if (!data || !data.activeLabel) return;
    
    const timeSlot = data.activeLabel;
    const dataKey = data.activeTooltipIndex?.dataKey;
    
    let relevantTweets: TweetData[] = [];
    let title = `Tweets from ${timeSlot}`;
    
    // Parse the time to match with tweet timestamps
    const clickTime = new Date(timeSlot);
    const hourStart = new Date(clickTime);
    hourStart.setMinutes(0, 0, 0);
    const hourEnd = new Date(hourStart);
    hourEnd.setHours(hourStart.getHours() + 1);
    
    // If a specific disaster type was clicked, filter by that
    if (dataKey && dataKey !== 'count') {
      const disasterType = disasterLabels.findIndex(label => 
        label.toLowerCase() === dataKey.toLowerCase()
      ) + 1;
      
      relevantTweets = data.filter((item: TweetData) => {
        if (!item.timestamp || item.disasterType !== disasterType) return false;
        
        const tweetTime = new Date(item.timestamp);
        return tweetTime >= hourStart && tweetTime < hourEnd;
      });
      
      title = `${dataKey.charAt(0).toUpperCase() + dataKey.slice(1)} Tweets from ${timeSlot}`;
    } else {
      // Otherwise show all tweets from that time period
      relevantTweets = data.filter((item: TweetData) => {
        if (!item.timestamp) return false;
        
        const tweetTime = new Date(item.timestamp);
        return tweetTime >= hourStart && tweetTime < hourEnd;
      });
    }
    
    setPopupData({
      isOpen: true,
      title,
      tweets: relevantTweets
    });
  };

  // Close the popup
  const closePopup = () => {
    setPopupData({
      isOpen: false,
      title: '',
      tweets: []
    });
  };

	// Render data visualization content
	const renderContent = () => {
		if (loading && data.length === 0) {
			return (
				<div style={{ padding: '20px' }}>
					<h1>Data Analysis</h1>
					<p>Waiting for disaster tweets to stream in...</p>
				</div>
			);
		}

		if (error && data.length === 0) {
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
		const timelineData = getTweetsTimeline();
		const sentimentData = getSentimentAnalysis();

		// Count disaster tweets
		const disasterTweetCount = data.filter(item => 
			item.disasterType && item.disasterType >= 1 && item.disasterType <= 5
		).length;

		return (
			<div style={{ padding: '20px' }}>
				<h1>Disaster Tweets Analysis</h1>
				<p>Analyzing {disasterTweetCount} disaster tweets</p>
				
				<div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
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
						{loading ? 'Refreshing...' : 'Refresh Data'}
					</button>
					{loading && <span>Listening for new tweets...</span>}
				</div>

        <p style={{ backgroundColor: '#f0f9ff', padding: '10px', borderRadius: '4px', borderLeft: '4px solid #0088FE' }}>
          <strong>Pro Tip:</strong> Click on any chart segment to view the related tweets!
        </p>

				{/* Timeline Chart */}
				<div style={{ 
					width: '100%', 
					height: '400px', 
					backgroundColor: 'white', 
					borderRadius: '8px',
					boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
					padding: '20px',
					marginBottom: '20px'
				}}>
					<h2>Disaster Tweet Timeline</h2>
					<ResponsiveContainer width="100%" height={300}>
						<AreaChart 
              data={timelineData}
              onClick={(chartData) => handleAreaClick(chartData)}
            >
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="time" />
							<YAxis label={{ value: 'Number of Tweets', angle: -90, position: 'insideLeft' }} />
							<Tooltip />
							<Legend />
							<Area type="monotone" dataKey="earthquake" stackId="1" stroke="#00C49F" fill="#00C49F" name="Earthquake" />
							<Area type="monotone" dataKey="flood" stackId="1" stroke="#FFBB28" fill="#FFBB28" name="Flood" />
							<Area type="monotone" dataKey="hurricane" stackId="1" stroke="#FF8042" fill="#FF8042" name="Hurricane" />
							<Area type="monotone" dataKey="tornado" stackId="1" stroke="#8884d8" fill="#8884d8" name="Tornado" />
							<Area type="monotone" dataKey="wildfire" stackId="1" stroke="#FF5733" fill="#FF5733" name="Wildfire" />
						</AreaChart>
					</ResponsiveContainer>
				</div>

				<div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '30px' }}>
					{/* Disaster Distribution Pie Chart with Fixed Labels */}
					<div style={{ 
						width: '500px', 
						height: '400px', 
						backgroundColor: 'white', 
						borderRadius: '8px',
						boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
						padding: '20px'
					}}>
						<h2>Disaster Type Distribution</h2>
						{disasterDistribution.length > 0 ? (
							<ResponsiveContainer width="100%" height={300}>
								<PieChart>
									<Pie
										data={disasterDistribution}
										cx="50%"
										cy="50%"
										labelLine={true}
										label={({ name, percent }) => {
											// Only show label if percent is significant enough
											return percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : "";
										}}
										outerRadius={100}
										fill="#8884d8"
										dataKey="value"
                    onClick={(entry, index) => handlePieClick(data, index)}
									>
										{disasterDistribution.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ cursor: 'pointer' }} />
										))}
									</Pie>
									<Tooltip formatter={(value, name) => [`${value} tweets`, name]} />
									<Legend onClick={(entry, index) => handlePieClick(data, index)} />
								</PieChart>
							</ResponsiveContainer>
						) : (
							<div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
								<p>No disaster data available</p>
							</div>
						)}
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
								<Bar 
                  dataKey="length" 
                  fill="#8884d8" 
                  name="Avg. Characters" 
                  onClick={(entry, index) => handleBarClick(data, index, 'length')}
                  style={{ cursor: 'pointer' }}
                />
							</BarChart>
						</ResponsiveContainer>
					</div>

					{/* Word Frequency Bar Chart with disclaimer */}
					<div style={{ 
						width: '500px', 
						height: '400px', 
						backgroundColor: 'white', 
						borderRadius: '8px',
						boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
						padding: '20px'
					}}>
						<h2>Most Common Words in Tweets</h2>
						<p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
							Note: Common words like 'the', 'and', 'for', 'you', etc. have been filtered out
						</p>
						<ResponsiveContainer width="100%" height={260}>
							<BarChart 
                data={wordFrequencyData} 
                layout="vertical"
              >
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis type="number" />
								<YAxis dataKey="word" type="category" width={80} />
								<Tooltip />
								<Legend />
								<Bar 
                  dataKey="count" 
                  fill="#82ca9d" 
                  name="Frequency" 
                  onClick={(entry, index) => handleBarClick(data, index, 'wordFrequency')}
                  style={{ cursor: 'pointer' }}
                />
							</BarChart>
						</ResponsiveContainer>
					</div>

					{/* Sentiment Analysis Graph */}
					<div style={{ 
						width: '500px', 
						height: '400px', 
						backgroundColor: 'white', 
						borderRadius: '8px',
						boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
						padding: '20px'
					}}>
						<h2>Tweet Sentiment by Disaster Type</h2>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart 
                data={sentimentData} 
                layout="horizontal"
                onClick={(chartData) => handleBarClick(data, chartData.activeTooltipIndex, 'sentiment')}
              >
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="name" />
								<YAxis />
								<Tooltip />
								<Legend />
								<Bar dataKey="positive" stackId="a" fill="#82ca9d" name="Positive" style={{ cursor: 'pointer' }} />
								<Bar dataKey="neutral" stackId="a" fill="#8884d8" name="Neutral" style={{ cursor: 'pointer' }} />
								<Bar dataKey="negative" stackId="a" fill="#ff8042" name="Negative" style={{ cursor: 'pointer' }} />
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
								<Bar 
                  dataKey="value" 
                  fill="#FF8042" 
                  name="Tweet Count" 
                  onClick={(entry, index) => handlePieClick(data, index)}
                  style={{ cursor: 'pointer' }}
                />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>
        
        {/* Tweet Popup Component */}
        <TweetPopup 
          data={popupData} 
          onClose={closePopup} 
        />
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