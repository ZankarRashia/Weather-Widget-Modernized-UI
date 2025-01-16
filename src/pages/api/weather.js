export default async function handler(req, res) {
  const { city, units } = req.query;
  const API_KEY = process.env.OPENWEATHERMAP_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Geocode to get lat and lon
    const geoResponse = await fetch(
      `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`
    );
    if (!geoResponse.ok) {
      const errorData = await geoResponse.json();
      throw new Error(errorData.message || 'Geocoding API error');
    }
    const geoData = await geoResponse.json();
    if (!geoData[0]) {
      throw new Error('City not found');
    }

    const { lat, lon, name } = geoData[0];

    // Fetch 3-hour interval forecasts
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`
    );
    if (!weatherResponse.ok) {
      const errorData = await weatherResponse.json();
      throw new Error(errorData.message || 'Weather API error');
    }

    const weatherData = await weatherResponse.json();
    weatherData.city = { name }; // Add city name to weather data
    res.status(200).json(weatherData);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
}