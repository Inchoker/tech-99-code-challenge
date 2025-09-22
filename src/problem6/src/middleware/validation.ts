import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ActionType } from '../types';

const scoreUpdateSchema = Joi.object({
  actionType: Joi.string().valid(...Object.values(ActionType)).required(),
  scoreIncrement: Joi.number().integer().min(1).max(1000).required(),
  actionToken: Joi.string().required()
});

export function validateScoreUpdate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { error } = scoreUpdateSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: error.details[0].message,
        timestamp: new Date().toISOString()
      }
    }) as any;
  }

  next();
}
