import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.test') });

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers?: Record<string, string>;
}

export class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(config?: Partial<ApiConfig>) {
    const defaultConfig: ApiConfig = {
      baseURL: process.env.API_BASE_URL || 'https://api.mycompany.local:8443/wp-json',
      timeout: parseInt(process.env.TEST_TIMEOUT || '30000', 10),
      headers: {
        'Content-Type': 'application/json',
      },
    };

    this.client = axios.create({
      ...defaultConfig,
      ...config,
      // Disable SSL verification for local development
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0',
      }),
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use((config) => {
      if (this.token && config.headers) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  /**
   * Authenticate and store JWT token
   */
  async authenticate(username?: string, password?: string): Promise<string> {
    const response = await this.client.post('/jwt-auth/v1/token', {
      username: username || process.env.WP_TEST_USERNAME,
      password: password || process.env.WP_TEST_PASSWORD,
    });

    this.token = response.data.token;
    return this.token;
  }

  /**
   * Clear authentication token
   */
  clearAuth(): void {
    this.token = null;
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Make a GET request
   */
  async get(endpoint: string, config?: AxiosRequestConfig) {
    return this.client.get(endpoint, config);
  }

  /**
   * Make a POST request
   */
  async post(endpoint: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.post(endpoint, data, config);
  }

  /**
   * Make a PUT request
   */
  async put(endpoint: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.put(endpoint, data, config);
  }

  /**
   * Make a DELETE request
   */
  async delete(endpoint: string, config?: AxiosRequestConfig) {
    return this.client.delete(endpoint, config);
  }

  /**
   * Get the underlying axios instance
   */
  getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
