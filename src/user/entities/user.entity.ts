export class User {
  id: string;
  login: string;
  password: string;
  role: 'admin' | 'editor' | 'viewer';
  version: number;
  createdAt: number;
  updatedAt: number;
}
