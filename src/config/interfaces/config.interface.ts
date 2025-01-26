export interface IConfig {
    environment: string;
    port: number;
    database: {
      uri: string;
    };
  }