import { NextFunction, Response, Request } from 'express';

export const cors = (req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-type, Authorization, X-CSRF-TOKEN, *');
  res.header('Access-Control-Allow-Methods', '*');
  if (req.method.toUpperCase() === 'OPTIONS') {
    res.status(200).send();
  } else {
    next();
  }
};
