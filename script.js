// 天气应用主逻辑
class WeatherApp {
    constructor() {
        // OpenWeatherMap API密钥 (用户需要替换为自己的密钥)
        this.apiKey = 'YOUR_API_KEY_HERE';
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';

        // DOM元素
        this.elements = {
            cityInput: document.getElementById('cityInput'),
            searchBtn: document.getElementById('searchBtn'),
            locationBtn: document.getElementById('locationBtn'),
            loader: document.getElementById('loader'),
            weatherCard: document.getElementById('weatherCard'),
            errorMessage: document.getElementById('errorMessage'),
            errorText: document.getElementById('errorText'),
            cityName: document.getElementById('cityName'),
            dateTime: document.getElementById('dateTime'),
            temperature: document.getElementById('temperature'),
            weatherDesc: document.getElementById('weatherDesc'),
            weatherIcon: document.getElementById('weatherIcon'),
            feelsLike: document.getElementById('feelsLike'),
            humidity: document.getElementById('humidity'),
            windSpeed: document.getElementById('windSpeed'),
            pressure: document.getElementById('pressure'),
            hourlyForecast: document.getElementById('hourlyForecast'),
            weeklyForecast: document.getElementById('weeklyForecast'),
            particles: document.getElementById('particles')
        };

        this.init();
    }

    init() {
        // 创建粒子背景
        this.createParticles();

        // 绑定事件监听器
        this.elements.searchBtn.addEventListener('click', () => this.searchWeather());
        this.elements.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchWeather();
        });
        this.elements.locationBtn.addEventListener('click', () => this.getLocationWeather());

        // 更新日期时间
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 60000);

        // 加载默认城市天气
        this.loadWeather('Beijing');
    }

    // 创建粒子背景效果
    createParticles() {
        const particleCount = 50;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            const size = Math.random() * 5 + 2;
            const startX = Math.random() * 100;
            const duration = Math.random() * 10 + 10;
            const delay = Math.random() * 5;

            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${startX}%`;
            particle.style.animationDuration = `${duration}s`;
            particle.style.animationDelay = `${delay}s`;

            this.elements.particles.appendChild(particle);
        }
    }

    // 更新日期时间
    updateDateTime() {
        const now = new Date();
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit'
        };
        const dateTimeStr = now.toLocaleDateString('zh-CN', options);
        this.elements.dateTime.textContent = dateTimeStr;
    }

    // 显示加载状态
    showLoader(show = true) {
        if (show) {
            this.elements.loader.classList.add('active');
            this.elements.weatherCard.classList.add('hidden');
            this.elements.errorMessage.classList.remove('show');
        } else {
            this.elements.loader.classList.remove('active');
            this.elements.weatherCard.classList.remove('hidden');
        }
    }

    // 显示错误消息
    showError(message) {
        this.elements.errorText.textContent = message;
        this.elements.errorMessage.classList.add('show');
        this.elements.loader.classList.remove('active');
        this.elements.weatherCard.classList.add('hidden');

        setTimeout(() => {
            this.elements.errorMessage.classList.remove('show');
        }, 5000);
    }

    // 搜索天气
    searchWeather() {
        const city = this.elements.cityInput.value.trim();
        if (city) {
            this.loadWeather(city);
            this.elements.cityInput.value = '';
        }
    }

    // 获取地理位置天气
    getLocationWeather() {
        if (navigator.geolocation) {
            this.showLoader();
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    this.loadWeatherByCoords(latitude, longitude);
                },
                (error) => {
                    this.showError('无法获取您的位置');
                }
            );
        } else {
            this.showError('您的浏览器不支持地理定位');
        }
    }

    // 通过城市名加载天气
    async loadWeather(city) {
        this.showLoader();

        try {
            // 如果没有设置API密钥，使用模拟数据
            if (this.apiKey === 'YOUR_API_KEY_HERE') {
                this.loadMockData(city);
                return;
            }

            const weatherUrl = `${this.baseUrl}/weather?q=${city}&appid=${this.apiKey}&units=metric&lang=zh_cn`;
            const forecastUrl = `${this.baseUrl}/forecast?q=${city}&appid=${this.apiKey}&units=metric&lang=zh_cn`;

            const [weatherResponse, forecastResponse] = await Promise.all([
                fetch(weatherUrl),
                fetch(forecastUrl)
            ]);

            if (!weatherResponse.ok || !forecastResponse.ok) {
                throw new Error('城市未找到');
            }

            const weatherData = await weatherResponse.json();
            const forecastData = await forecastResponse.json();

            this.displayWeather(weatherData, forecastData);
        } catch (error) {
            this.showError('获取天气数据失败，请检查城市名称');
        }
    }

    // 通过坐标加载天气
    async loadWeatherByCoords(lat, lon) {
        try {
            if (this.apiKey === 'YOUR_API_KEY_HERE') {
                this.loadMockData('当前位置');
                return;
            }

            const weatherUrl = `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=zh_cn`;
            const forecastUrl = `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=zh_cn`;

            const [weatherResponse, forecastResponse] = await Promise.all([
                fetch(weatherUrl),
                fetch(forecastUrl)
            ]);

            if (!weatherResponse.ok || !forecastResponse.ok) {
                throw new Error('无法获取天气数据');
            }

            const weatherData = await weatherResponse.json();
            const forecastData = await forecastResponse.json();

            this.displayWeather(weatherData, forecastData);
        } catch (error) {
            this.showError('获取天气数据失败');
        }
    }

    // 加载模拟数据（用于演示）
    loadMockData(city) {
        setTimeout(() => {
            const mockData = {
                current: {
                    name: city,
                    main: {
                        temp: Math.round(Math.random() * 20 + 15),
                        feels_like: Math.round(Math.random() * 20 + 15),
                        humidity: Math.round(Math.random() * 40 + 40),
                        pressure: Math.round(Math.random() * 50 + 990)
                    },
                    wind: {
                        speed: Math.round(Math.random() * 20 + 5)
                    },
                    weather: [{
                        main: 'Clear',
                        description: '晴朗'
                    }]
                },
                forecast: {
                    list: this.generateMockForecast()
                }
            };

            this.displayWeather(mockData.current, mockData.forecast);
        }, 1000);
    }

    // 生成模拟预报数据
    generateMockForecast() {
        const forecast = [];
        const weatherTypes = ['Clear', 'Clouds', 'Rain', 'Snow'];

        for (let i = 0; i < 40; i++) {
            forecast.push({
                dt: Date.now() / 1000 + (i * 3 * 3600),
                main: {
                    temp: Math.round(Math.random() * 15 + 10)
                },
                weather: [{
                    main: weatherTypes[Math.floor(Math.random() * weatherTypes.length)],
                    description: '多云'
                }]
            });
        }

        return forecast;
    }

    // 显示天气数据
    displayWeather(weatherData, forecastData) {
        // 更新城市名称
        this.elements.cityName.textContent = weatherData.name;

        // 更新温度
        this.elements.temperature.textContent = `${Math.round(weatherData.main.temp)}°`;
        this.elements.weatherDesc.textContent = weatherData.weather[0].description;

        // 更新详细信息
        this.elements.feelsLike.textContent = `${Math.round(weatherData.main.feels_like)}°`;
        this.elements.humidity.textContent = `${weatherData.main.humidity}%`;
        this.elements.windSpeed.textContent = `${Math.round(weatherData.wind.speed * 3.6)} km/h`;
        this.elements.pressure.textContent = `${weatherData.main.pressure} hPa`;

        // 更新天气图标
        this.updateWeatherIcon(weatherData.weather[0].main);

        // 更新每小时预报
        this.updateHourlyForecast(forecastData.list.slice(0, 8));

        // 更新7天预报
        this.updateWeeklyForecast(forecastData.list);

        this.showLoader(false);
    }

    // 更新天气图标
    updateWeatherIcon(weatherType) {
        const iconContainer = this.elements.weatherIcon;

        const iconMap = {
            'Clear': this.createSunIcon(),
            'Clouds': this.createCloudIcon(),
            'Rain': this.createRainIcon(),
            'Snow': this.createSnowIcon(),
            'Thunderstorm': this.createThunderstormIcon(),
            'Drizzle': this.createRainIcon(),
            'Mist': this.createCloudIcon(),
            'Fog': this.createCloudIcon()
        };

        iconContainer.innerHTML = iconMap[weatherType] || iconMap['Clear'];
    }

    // 创建太阳图标
    createSunIcon() {
        return `
            <div class="sun">
                <div class="sun-rays"></div>
            </div>
        `;
    }

    // 创建云图标
    createCloudIcon() {
        return `
            <div style="position: relative; width: 120px; height: 80px;">
                <div style="position: absolute; width: 60px; height: 60px; background: linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%); border-radius: 50%; top: 20px; left: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);"></div>
                <div style="position: absolute; width: 80px; height: 50px; background: linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%); border-radius: 50px; top: 30px; left: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);"></div>
            </div>
        `;
    }

    // 创建雨图标
    createRainIcon() {
        return `
            <div style="position: relative; width: 120px; height: 120px;">
                <div style="position: absolute; width: 60px; height: 60px; background: linear-gradient(135deg, #6b7c93 0%, #8b9bb3 100%); border-radius: 50%; top: 10px; left: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);"></div>
                <div style="position: absolute; width: 80px; height: 50px; background: linear-gradient(135deg, #6b7c93 0%, #8b9bb3 100%); border-radius: 50px; top: 20px; left: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);"></div>
                <div style="position: absolute; width: 3px; height: 15px; background: #4a9eff; border-radius: 2px; top: 75px; left: 30px; animation: rain 1s infinite;"></div>
                <div style="position: absolute; width: 3px; height: 15px; background: #4a9eff; border-radius: 2px; top: 75px; left: 50px; animation: rain 1s infinite 0.3s;"></div>
                <div style="position: absolute; width: 3px; height: 15px; background: #4a9eff; border-radius: 2px; top: 75px; left: 70px; animation: rain 1s infinite 0.6s;"></div>
            </div>
        `;
    }

    // 创建雪图标
    createSnowIcon() {
        return `
            <div style="position: relative; width: 120px; height: 120px;">
                <div style="position: absolute; width: 60px; height: 60px; background: linear-gradient(135deg, #b8c6db 0%, #f5f7fa 100%); border-radius: 50%; top: 10px; left: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);"></div>
                <div style="position: absolute; width: 80px; height: 50px; background: linear-gradient(135deg, #b8c6db 0%, #f5f7fa 100%); border-radius: 50px; top: 20px; left: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);"></div>
                <div style="position: absolute; width: 8px; height: 8px; background: white; border-radius: 50%; top: 75px; left: 30px; animation: snow 2s infinite;"></div>
                <div style="position: absolute; width: 8px; height: 8px; background: white; border-radius: 50%; top: 75px; left: 50px; animation: snow 2s infinite 0.4s;"></div>
                <div style="position: absolute; width: 8px; height: 8px; background: white; border-radius: 50%; top: 75px; left: 70px; animation: snow 2s infinite 0.8s;"></div>
            </div>
        `;
    }

    // 创建雷暴图标
    createThunderstormIcon() {
        return `
            <div style="position: relative; width: 120px; height: 120px;">
                <div style="position: absolute; width: 60px; height: 60px; background: linear-gradient(135deg, #4a4e69 0%, #6b7280 100%); border-radius: 50%; top: 10px; left: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);"></div>
                <div style="position: absolute; width: 80px; height: 50px; background: linear-gradient(135deg, #4a4e69 0%, #6b7280 100%); border-radius: 50px; top: 20px; left: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);"></div>
                <div style="position: absolute; width: 20px; height: 30px; top: 70px; left: 50px;">
                    <svg viewBox="0 0 20 30" fill="#ffd700">
                        <path d="M10 0 L0 15 L8 15 L5 30 L20 10 L12 10 Z"/>
                    </svg>
                </div>
            </div>
        `;
    }

    // 更新每小时预报
    updateHourlyForecast(hourlyData) {
        this.elements.hourlyForecast.innerHTML = '';

        hourlyData.forEach((hour, index) => {
            const time = new Date(hour.dt * 1000);
            const hourStr = time.getHours();
            const temp = Math.round(hour.main.temp);
            const icon = this.getWeatherEmoji(hour.weather[0].main);

            const hourlyItem = document.createElement('div');
            hourlyItem.className = 'hourly-item';
            hourlyItem.style.animationDelay = `${index * 0.1}s`;
            hourlyItem.innerHTML = `
                <div class="hourly-time">${hourStr}:00</div>
                <div class="hourly-icon">${icon}</div>
                <div class="hourly-temp">${temp}°</div>
            `;

            this.elements.hourlyForecast.appendChild(hourlyItem);
        });
    }

    // 更新7天预报
    updateWeeklyForecast(forecastList) {
        this.elements.weeklyForecast.innerHTML = '';

        // 按天分组
        const dailyData = this.groupByDay(forecastList);

        dailyData.slice(0, 7).forEach((day, index) => {
            const date = new Date(day.dt * 1000);
            const dayName = this.getDayName(date);
            const icon = this.getWeatherEmoji(day.weather);
            const maxTemp = Math.round(day.maxTemp);
            const minTemp = Math.round(day.minTemp);

            const weeklyItem = document.createElement('div');
            weeklyItem.className = 'weekly-item';
            weeklyItem.style.animationDelay = `${index * 0.1}s`;
            weeklyItem.innerHTML = `
                <div class="weekly-day">${dayName}</div>
                <div class="weekly-icon">${icon}</div>
                <div class="weekly-temp-range">
                    <span class="weekly-temp-max">${maxTemp}°</span>
                    <span class="weekly-temp-min">${minTemp}°</span>
                </div>
            `;

            this.elements.weeklyForecast.appendChild(weeklyItem);
        });
    }

    // 按天分组预报数据
    groupByDay(forecastList) {
        const grouped = {};

        forecastList.forEach(item => {
            const date = new Date(item.dt * 1000);
            const day = date.toDateString();

            if (!grouped[day]) {
                grouped[day] = {
                    dt: item.dt,
                    temps: [],
                    weather: item.weather[0].main
                };
            }

            grouped[day].temps.push(item.main.temp);
        });

        return Object.values(grouped).map(day => ({
            dt: day.dt,
            weather: day.weather,
            maxTemp: Math.max(...day.temps),
            minTemp: Math.min(...day.temps)
        }));
    }

    // 获取星期名称
    getDayName(date) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return '今天';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return '明天';
        } else {
            const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            return days[date.getDay()];
        }
    }

    // 获取天气表情符号
    getWeatherEmoji(weatherType) {
        const emojiMap = {
            'Clear': '☀️',
            'Clouds': '☁️',
            'Rain': '🌧️',
            'Drizzle': '🌦️',
            'Thunderstorm': '⛈️',
            'Snow': '❄️',
            'Mist': '🌫️',
            'Fog': '🌫️',
            'Haze': '🌫️'
        };

        return emojiMap[weatherType] || '☀️';
    }
}

// 添加雨滴和雪花动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes rain {
        0% {
            transform: translateY(0);
            opacity: 1;
        }
        100% {
            transform: translateY(25px);
            opacity: 0;
        }
    }

    @keyframes snow {
        0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(30px) rotate(360deg);
            opacity: 0;
        }
    }

    .hourly-item,
    .weekly-item {
        animation: fadeInUp 0.5s ease backwards;
    }
`;
document.head.appendChild(style);

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});
