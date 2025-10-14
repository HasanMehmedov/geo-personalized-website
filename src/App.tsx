import { useState, useEffect } from 'react';
import { MapPin, Loader } from 'lucide-react';

interface LocationData {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

function App() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchLocationAndBackground();
  }, []);

  const fetchLocationAndBackground = async () => {
    try {
      setLoading(true);
      setError('');

      let initialLocationData: LocationData;

      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipInfo = await ipResponse.json();

        const geoResponse = await fetch(`https://freeipapi.com/api/json/${ipInfo.ip}`);
        const geoData = await geoResponse.json();

        initialLocationData = {
          city: geoData.cityName || 'Unknown',
          country: geoData.countryName || 'Unknown',
          latitude: geoData.latitude || 0,
          longitude: geoData.longitude || 0,
        };
      } catch (geoError) {
        console.warn('Geolocation failed, using default location:', geoError);
        initialLocationData = {
          city: 'New York',
          country: 'United States',
          latitude: 40.7128,
          longitude: -74.0060,
        };
      }

      const webhookUrl = 'https://nass11.app.n8n.cloud/webhook-test/0ed3d82f-8c6a-4746-8423-226584100d86';
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          city: initialLocationData.city,
          country: initialLocationData.country,
          latitude: initialLocationData.latitude,
          longitude: initialLocationData.longitude,
        }),
      });

      if (!webhookResponse.ok) {
        throw new Error(`Webhook returned status ${webhookResponse.status}`);
      }

      const jsonData = await webhookResponse.json();

      if (jsonData.imgUrl) {
        setBackgroundImage(jsonData.imgUrl);
      } else {
        throw new Error('No image URL in response');
      }

      const finalLocationData: LocationData = {
        city: jsonData.city || initialLocationData.city,
        country: jsonData.country || initialLocationData.country,
        latitude: initialLocationData.latitude,
        longitude: initialLocationData.longitude,
      };

      setLocation(finalLocationData);

    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${backgroundImage})`,
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>
      )}

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        {loading ? (
          <div className="text-center">
            <Loader className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
            <p className="text-white text-xl font-light">Discovering your location...</p>
          </div>
        ) : error ? (
          <div className="text-center bg-red-500 bg-opacity-90 p-8 rounded-lg max-w-md">
            <p className="text-white text-xl font-semibold mb-2">Error</p>
            <p className="text-white">{error}</p>
          </div>
        ) : location ? (
          <div className="text-center max-w-4xl">
            <h1 className="text-7xl md:text-9xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">
              Welcome
            </h1>

            <p className="text-xl md:text-2xl text-white text-opacity-90 mb-10 font-light">
              Discover the beauty of your location
            </p>

            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-10 shadow-2xl border border-white border-opacity-20">
              <div className="flex items-center justify-center gap-3 mb-4">
                <MapPin className="w-8 h-8 text-white" />
                <p className="text-3xl md:text-5xl font-light text-white">
                  {location.city}
                </p>
              </div>
              <p className="text-2xl md:text-3xl font-light text-white text-opacity-90">
                {location.country}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default App;
