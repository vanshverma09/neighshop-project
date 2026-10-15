// Production and Development API Configuration for Seller Mobile App
export const CONFIG = {
  // Toggle between deployed production API or local host
  // In production / physical Android device, use your deployed HTTPS endpoint:
  PROD_API_URL: 'https://neighshop-api.onrender.com/api',
  // For local Android Emulator: 10.0.2.2 maps to host machine localhost:
  EMULATOR_API_URL: 'http://10.0.2.2:5000/api',
  // Default localhost fallback:
  DEV_API_URL: 'http://localhost:5000/api',

  // Set to true to point mobile builds to the live deployed cloud API
  USE_PRODUCTION: process.env.NODE_ENV === 'production' || Boolean(process.env.API_BASE_URL),

  get API_BASE(): string {
    if (process.env.API_BASE_URL) {
      return process.env.API_BASE_URL;
    }
    return this.USE_PRODUCTION ? this.PROD_API_URL : this.DEV_API_URL;
  }
};
