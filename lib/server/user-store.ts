import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  goal: string;
  age: number;
  createdAt: string;
};

const filePath = path.join(process.cwd(), "data", "users.json");

async function readUsers(): Promise<StoredUser[]> {
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as StoredUser[];
}

async function writeUsers(users: StoredUser[]) {
  await fs.writeFile(filePath, JSON.stringify(users, null, 2), "utf-8");
}

export function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function findUserByEmail(email: string) {
  const users = await readUsers();
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function createUser(input: Omit<StoredUser, "id" | "createdAt" | "passwordHash"> & { password: string }) {
  const users = await readUsers();
  const existing = users.find((user) => user.email.toLowerCase() === input.email.toLowerCase());
  if (existing) {
    throw new Error("A user with this email already exists.");
  }

  const user: StoredUser = {
    id: crypto.randomUUID(),
    name: input.name,
    email: input.email,
    passwordHash: hashPassword(input.password),
    goal: input.goal,
    age: input.age,
    createdAt: new Date().toISOString(),
  };

  users.unshift(user);
  await writeUsers(users);
  return user;
}

export async function verifyUser(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) {
    return null;
  }

  return user.passwordHash === hashPassword(password) ? user : null;
}
