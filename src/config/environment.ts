interface Config {
  apiUrl: string;
  env: string;
}

const config: Config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  env: process.env.REACT_APP_ENV || 'development',
};

export default config; 