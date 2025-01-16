import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import styles from './WeatherWidget.module.css';

interface WeatherData {
    list: Array<{
        dt: number;
        main: {
            temp: number;
            temp_max: number;
            temp_min: number;
        };
        weather: Array<{
            icon: string;
            description: string;
        }>;
    }>;
    city: {
        name: string;
    };
}

interface HourlyForecast {
    time: number;
    temp: number;
    icon: string;
    description: string;
}

// Fetcher function for SWR
const fetcher = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch weather data');
    return response.json();
};

const WeatherWidget: React.FC = () => {
    const [city, setCity] = useState('San Francisco');
    const [unit, setUnit] = useState('metric');
    const [showSettings, setShowSettings] = useState(false);
    const [inputCity, setInputCity] = useState(city);
    const [errorMessage, setErrorMessage] = useState('');

    const { data: weatherData, error, isLoading } = useSWR<WeatherData>(
        `/api/weather?city=${encodeURIComponent(city)}&units=${unit}`,
        fetcher
    );

    useEffect(() => {
        const widget = document.querySelector(`.${styles.widget}`) as HTMLDivElement;
        if (!widget) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = widget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const angle = Math.atan2(y - rect.height / 2, x - rect.width / 2) * 180 / Math.PI;
            widget.style.setProperty('--angle', `${angle}deg`);
        };

        widget.addEventListener('mousemove', handleMouseMove);
        return () => widget.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleUnitChange = (newUnit: string) => {
        setUnit(newUnit);
    };

    const handleLocationChange = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputCity.trim()) {
            setErrorMessage('Please enter a city name.');
            return;
        }
        setCity(inputCity);
        setErrorMessage('');
        setShowSettings(false);
    };

    const capitalizeWords = (str: string) => {
        return str.replace(/\b\w/g, char => char.toUpperCase());
    };

    const getCurrentAndNext8HoursForecast = () => {
        if (!weatherData) return { current: null, next8Hours: [] };

        const currentTime = Math.floor(new Date().getTime() / 1000);

        // Get the current hour forecast
        const current = weatherData.list.find(item => item.dt >= currentTime) || weatherData.list[0];

        // Generate the next eight hourly forecasts, excluding the current hour
        const next8Hours = [];
        for (let i = 1; i <= 8; i++) {
            const targetTime = currentTime + (i * 3600);
            const closestForecast = weatherData.list.reduce((prev, curr) => {
                return Math.abs(curr.dt - targetTime) < Math.abs(prev.dt - targetTime) ? curr : prev;
            });
            next8Hours.push({
                time: targetTime,
                temp: closestForecast.main.temp,
                icon: closestForecast.weather[0].icon,
                description: closestForecast.weather[0].description
            });
        }

        return { current, next8Hours };
    };

    const formatHour = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        let hours = date.getHours();
        const period = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
        return `${hours}${period}`;
    };

    const { current, next8Hours } = getCurrentAndNext8HoursForecast();

    const handleCloseErrorMessage = () => {
        setErrorMessage('');
    };

    if (isLoading) return <div className={styles.widget}>Loading weather data...</div>;
    if (error) return <div className={styles.error}>Error loading weather data</div>;

    return (
        <div className={styles.widget}>
            <div className={styles.title}>Weather</div>
            <button 
                onClick={() => setShowSettings(!showSettings)} 
                className={styles.settingsButton}
                aria-label="Settings"
            >
                ⚙️
            </button>

            <div className={styles.header}>
                <div className={styles.weatherInfo}>
                    <div className={styles.currentTemp}>
                        {current ? `${Math.round(current.main.temp)}°` : '--°'}
                    </div>
                    <div className={styles.separator}>|</div>
                    <div className={styles.weatherDetails}>
                        <div className={styles.currentCondition}>
                            {current?.weather[0].description && capitalizeWords(current.weather[0].description)}
                        </div>
                        <div className={styles.highLow}>
                            H: {current ? `${Math.round(current.main.temp_max)}° ` : '--° '}
                            L: {current ? `${Math.round(current.main.temp_min)}°` : '--°'}
                        </div>
                    </div>
                </div>
                <div className={styles.cityName}>
                    {weatherData?.city.name}
                </div>
            </div>

            {showSettings && (
                <form onSubmit={handleLocationChange} className={styles.settingsForm}>
                    <input
                        type="text"
                        value={inputCity}
                        onChange={(e) => setInputCity(e.target.value)}
                        placeholder="Enter city"
                        className={styles.input}
                    />
                    <button type="submit" className={styles.searchButton}>
                        Search
                    </button>
                    {errorMessage && (
                        <div className={styles.error}>
                            {errorMessage}
                            <button className={styles.closeErrorButton} onClick={handleCloseErrorMessage}>
                                ✖️
                            </button>
                        </div>
                    )}
                    <div className={styles.unitToggle}>
                        <span className={unit === 'metric' ? styles.active : ''} onClick={() => handleUnitChange('metric')}>°C</span>
                        <span className={unit === 'imperial' ? styles.active : ''} onClick={() => handleUnitChange('imperial')}>°F</span>
                    </div>
                </form>
            )}

            <div className={styles.forecast}>
                {next8Hours.map((forecast, index) => (
                    <div key={index} className={styles.forecastItem}>
                        <img 
                            src={`https://openweathermap.org/img/wn/${forecast.icon}@2x.png`}
                            alt={forecast.description}
                        />
                        <span>{formatHour(forecast.time)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeatherWidget;