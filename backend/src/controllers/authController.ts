import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { env } from "../config/env";

function signToken(userId: string): string {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign({ userId }, env.jwtSecret, options);
}

function serializeUser(user: { _id: unknown; name: string; email: string }) {
  return { id: String(user._id), name: user.name, email: user.email };
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as { name?: string; email?: string; password?: string };

  if (!name || !email || !password) {
    throw ApiError.badRequest("Name, email and password are required");
  }
  if (password.length < 6) {
    throw ApiError.badRequest("Password must be at least 6 characters");
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email: email.toLowerCase().trim(), password: hashed });

  const token = signToken(String(user._id));
  res.status(201).json({ token, user: serializeUser(user) });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    throw ApiError.badRequest("Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const matches = await bcrypt.compare(password, user.password);
  if (!matches) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const token = signToken(String(user._id));
  res.json({ token, user: serializeUser(user) });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) throw ApiError.notFound("User not found");
  res.json({ user: serializeUser(user) });
});
