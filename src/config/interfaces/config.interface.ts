export interface IConfig {
  environment: string;
  port: number;
  database: {
    uri: string;
  };

  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    accessExpiration: string;
    refreshExpiration: string;
  };
  bcrypt: {
    saltOrRounds: number;
  };
}