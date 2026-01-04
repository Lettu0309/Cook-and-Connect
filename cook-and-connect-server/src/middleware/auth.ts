import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const SECRET_KEY = (process.env.JWT_SECRET || 'secreto_temporal_inseguro') as string;

// Extendemos la definición de Request para poder guardar los datos del usuario ahí
export interface AuthRequest extends Request {
  user?: any;
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // 1. Buscamos el token en la cabecera "Authorization"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer <TOKEN>"
  //console.log("Token recibido en middleware: ", token);

  if (!token) {
    res.status(401).json({ message: 'Acceso denegado. No hay token.' });
    return;
  }

  try {
    // 2. Verificamos que el token sea válido y no haya expirado
    const verified = jwt.verify(token, SECRET_KEY);
    req.user = verified; // Guardamos los datos del usuario (id, role) en la petición
    next(); // Dejamos pasar a la siguiente función
  } catch (error) {
    res.status(403).json({ message: 'Token inválido o expirado.' });
  }
};