import { useEffect, useState } from 'react';
import axios from 'axios';

const API_KEY = import.meta.env.VITE_LASTFM_API_KEY;
const USERNAME = import.meta.env.VITE_LASTFM_USERNAME;

function groupByDate(tracks) {
  const counts = {}; // hash

  tracks.forEach(track => {
    if (!track.date) return; // skip currently playing track

    const date = new Date(track.date.uts * 1000);
    const key = date.toISOString().split('T')[0]; // "2024-01-15"

    counts[key] = (counts[key] || 0) + 1;
  });

  return counts;
}


function App() {
    const [dayCounts, setDayCounts] = useState({});

    useEffect(() => {
        const fetchTracks = async () => {
            const firstRes = await axios.get('https://ws.audioscrobbler.com/2.0/', {
                params: {
                    method: 'user.getRecentTracks',
                    user: USERNAME,
                    api_key: API_KEY,
                    format: 'json',
                    limit: 200,
                    page: 1,
                }
            });

            const totalPages = parseInt(firstRes.data.recenttracks['@attr'].totalPages);
            console.log('total pages:', totalPages);
          
            let tracks = [...firstRes.data.recenttracks.track];

            const pageRequests = [];
            for (let page = 2; page <= totalPages; page++) {
              pageRequests.push(
                axios.get('https://ws.audioscrobbler.com/2.0/', {
                    params: {
                        method: 'user.getRecentTracks',
                        user: USERNAME,
                        api_key: API_KEY,
                        format: 'json',
                        limit: 200,
                        page: page,
                    }
                })
              );
            }

          const responses = await Promise.all(pageRequests);
          responses.forEach(res => {
              tracks = [...tracks, ...res.data.recenttracks.track];
          });

          const counts = groupByDate(tracks);
          console.log(counts);
          setDayCounts(counts);
        };



        fetchTracks();
    }, []);

    return <div>{Object.entries(dayCounts).map(([date, count]) => (
        <div key={date}>{date}: {count} scrobbles</div>
    ))}</div>;
}

export default App;