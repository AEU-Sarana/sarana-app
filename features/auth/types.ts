import { UserSession } from '../../services/tokenStorage';

export interface AuthState {
  user: UserSession | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}
