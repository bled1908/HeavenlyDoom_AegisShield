import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { DisruptionSeverity } from '@prisma/client';

export interface WeatherCheckResult {
  isDisruption: boolean;
  severity: string;
  title: string;
  description: string;
  source: string;
  rawData?: unknown;
}

// AQI thresholds (India AQI)
const AQI_THRESHOLDS = { MEDIUM: 201, HIGH: 301, CRITICAL: 401 };

// Rainfall thresholds in mm/h
const RAIN_THRESHOLDS = { MEDIUM: 7.6, HIGH: 35.5, CRITICAL: 64.5 };

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async checkCity(city: string): Promise<WeatherCheckResult> {
    const apiKey = this.config.get<string>('OPENWEATHER_API_KEY');

    if (!apiKey) {
      this.logger.debug('No OpenWeather API key – using mock data');
      return this.getMockWeatherData(city);
    }

    try {
      const baseUrl = this.config.get<string>('OPENWEATHER_BASE_URL');
      const response = await firstValueFrom(
        this.httpService.get(`${baseUrl}/weather`, {
          params: { q: `${city},IN`, appid: apiKey, units: 'metric' },
          timeout: 5000,
        }),
      );

      return this.analyzeWeatherData(response.data);
    } catch (err) {
      this.logger.warn(`OpenWeather API error for ${city}: ${err} – falling back to mock`);
      return this.getMockWeatherData(city);
    }
  }

  private analyzeWeatherData(data: any): WeatherCheckResult {
    const weatherId = data?.weather?.[0]?.id ?? 800;
    const rain1h = data?.rain?.['1h'] ?? 0;
    const windSpeed = data?.wind?.speed ?? 0;

    // Thunderstorm or extreme weather codes (2xx, 502, 503, 504, 511, 521, 522, 531)
    const isExtreme = weatherId < 300 || [502, 503, 504, 511, 521, 522, 531].includes(weatherId);
    const isMonsoon = rain1h > RAIN_THRESHOLDS.MEDIUM;

    if (!isExtreme && !isMonsoon) {
      return { isDisruption: false, severity: 'LOW', title: 'Normal', description: 'No disruption', source: 'openweather' };
    }

    let severity = DisruptionSeverity.MEDIUM;
    if (rain1h > RAIN_THRESHOLDS.CRITICAL || weatherId < 300) severity = DisruptionSeverity.CRITICAL;
    else if (rain1h > RAIN_THRESHOLDS.HIGH) severity = DisruptionSeverity.HIGH;

    return {
      isDisruption: true,
      severity,
      title: `${data.weather[0].main} Alert – ${data.name}`,
      description: data.weather[0].description,
      source: 'openweather',
      rawData: data,
    };
  }

  private getMockWeatherData(city: string): WeatherCheckResult {
    // Probabilistic mock: ~20% chance of disruption for demo
    const seed = city.charCodeAt(0) + new Date().getHours();
    const isDisruption = seed % 5 === 0;

    if (!isDisruption) {
      return { isDisruption: false, severity: 'LOW', title: 'Clear skies', description: 'No disruption detected', source: 'mock' };
    }

    return {
      isDisruption: true,
      severity: DisruptionSeverity.HIGH,
      title: `Heavy Monsoon Rainfall – ${city}`,
      description: 'Simulated heavy rainfall event for parametric trigger testing',
      source: 'mock',
    };
  }
}
