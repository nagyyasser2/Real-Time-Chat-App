import * as Joi from 'joi';

export const validationSchema = Joi.object({
    database: Joi.object({
        uri: Joi.string().required(),
        }).required(),
  port: Joi.number().default(3000),
  environment: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),    
});