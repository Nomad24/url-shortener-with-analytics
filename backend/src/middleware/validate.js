import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

export function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        next(new AppError('Validation failed', 400, errors));
        return;
      }
      next(error);
    }
  };
}
