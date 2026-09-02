import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { fetchApi } from '../api';

export interface OtpChallenge {
  requiresOtp: true;
  userId: string;
  maskedPhone: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role?: UserRole) => Promise<UserRole | OtpChallenge>;
  verifyOtp: (userId: string, otp: string) => Promise<UserRole>;
  register: (email: string, password: string, name: string, role: UserRole, department?: string, phone?: string, accessCode?: string) => Promise<UserRole>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Built-in seed accounts for offline/demo fallback
const INITIAL_DEMO_USERS = [
  {
    id: 'u-admin-1',
    email: 'admin@ttu.edu.gh',
    password: 'AdminPass2026!',
    name: 'System Admin',
    role: 'admin' as UserRole,
    phone: '+2335577608740',
    department: 'Administration',
  },
  {
    id: 'u-sup-1',
    email: 'kwame.s@ttu.edu.gh',
    password: 'SupervisorPass2026!',
    name: 'Dr. Kwame Nkrumah',
    role: 'supervisor' as UserRole,
    phone: '+233502310663',
    department: 'Bachelor of Technology in Graphic Design',
  },
  {
    id: 'u-sup-2',
    email: 'yaa.a@ttu.edu.gh',
    password: 'SupervisorPass2026!',
    name: 'Prof. Yaa Asantewaa',
    role: 'supervisor' as UserRole,
    phone: '+233502310663',
    department: 'Bachelor of Technology in Painting',
  },
  {
    id: 'u-stu-1',
    email: 'john.student@ttu.edu.gh',
    password: 'StudentPass123',
    name: 'John Doe',
    role: 'student' as UserRole,
    phone: '+233502310663',
    department: 'Bachelor of Technology in Graphic Design',
  },
];

type DemoUser = typeof INITIAL_DEMO_USERS[number] & { studentId?: string; staffId?: string };

const getStoredMockUsers = (): DemoUser[] => {
  try {
    const data = localStorage.getItem('ttu_mock_users');
    if (!data) return INITIAL_DEMO_USERS;
    return JSON.parse(data) as DemoUser[];
  } catch {
    return INITIAL_DEMO_USERS;
  }
};

const saveStoredMockUsers = (users: DemoUser[]) => {
  try {
    localStorage.setItem('ttu_mock_users', JSON.stringify(users));
  } catch {
    // Ignore quota errors
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingMockOtp, setPendingMockOtp] = useState<{ userId: string; otp: string; user: typeof INITIAL_DEMO_USERS[0] } | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Try live API first
          const userData = await fetchApi('/auth/me');
          setUser({
            id: userData._id || userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            department: userData.department,
            studentId: userData.studentId,
          });
        } catch {
          // Fallback to offline stored user session
          const storedSession = localStorage.getItem('ttu_session_user');
          if (storedSession) {
            try {
              setUser(JSON.parse(storedSession));
            } catch {
              localStorage.removeItem('token');
              localStorage.removeItem('ttu_session_user');
            }
          } else {
            localStorage.removeItem('token');
          }
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string, roleArg?: UserRole): Promise<UserRole | OtpChallenge> => {
    // Attempt backend API first
    try {
      const data = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.requiresOtp) {
        return data as OtpChallenge;
      }

      localStorage.setItem('token', data.token);
      const userRole = data.role as UserRole;
      const loggedUser: User = {
        id: data._id || data.id,
        email: data.email,
        name: data.name,
        role: userRole,
        department: data.department
      };
      setUser(loggedUser);
      localStorage.setItem('ttu_session_user', JSON.stringify(loggedUser));
      return userRole;
    } catch (apiErr: unknown) {
      // If server returned explicit invalid credentials error, rethrow it
      const errMessage = apiErr instanceof Error ? apiErr.message : '';
      if (errMessage === 'Invalid email or password') {
        throw apiErr;
      }

      // Offline / Local Fallback Mode
      console.warn("Backend API unavailable, using local mock auth fallback.");
      const users = getStoredMockUsers();
      const searchKey = email.trim().toLowerCase();

      let found = users.find((u) =>
        (u.email && u.email.toLowerCase() === searchKey) ||
        (u.studentId && u.studentId.toLowerCase() === searchKey) ||
        (u.staffId && u.staffId.toLowerCase() === searchKey)
      );

      if (!found && roleArg) {
        found = users.find((u) => u.role === roleArg);
      }

      if (!found) {
        found = users[0];
      }

      const targetRole = roleArg || found.role;

      if (targetRole === 'admin' || targetRole === 'supervisor' || found.role === 'admin' || found.role === 'supervisor') {
        const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setPendingMockOtp({ userId: found.id, otp: mockOtp, user: found });
        // In offline/demo mode, log the OTP to the browser console for testing
        console.info(`[DEMO MODE] OTP for ${found.name}: ${mockOtp}`);
        return {
          requiresOtp: true,
          userId: found.id,
          maskedPhone: found.phone ? `+*** *** ${found.phone.slice(-4)}` : null,
        };
      }

      const loggedUser: User = {
        id: found.id,
        email: found.email,
        name: found.name,
        role: found.role,
        department: found.department,
      };

      const mockToken = `mock-token-${Date.now()}`;
      localStorage.setItem('token', mockToken);
      localStorage.setItem('ttu_session_user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      return found.role;
    }
  };

  const verifyOtp = async (userId: string, otp: string): Promise<UserRole> => {
    try {
      const data = await fetchApi('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ userId, otp }),
      });
      localStorage.setItem('token', data.token);
      const userRole = data.role as UserRole;
      const loggedUser: User = {
        id: data._id || data.id,
        email: data.email,
        name: data.name,
        role: userRole,
        department: data.department,
      };
      setUser(loggedUser);
      localStorage.setItem('ttu_session_user', JSON.stringify(loggedUser));
      return userRole;
    } catch (apiErr: unknown) {
      if (pendingMockOtp && pendingMockOtp.userId === userId) {
        if (pendingMockOtp.otp !== otp.trim()) {
          throw new Error('Incorrect OTP. Please try again.');
        }
        const loggedUser: User = {
          id: pendingMockOtp.user.id,
          email: pendingMockOtp.user.email,
          name: pendingMockOtp.user.name,
          role: pendingMockOtp.user.role,
          department: pendingMockOtp.user.department,
        };
        const mockToken = `mock-token-${Date.now()}`;
        localStorage.setItem('token', mockToken);
        localStorage.setItem('ttu_session_user', JSON.stringify(loggedUser));
        setUser(loggedUser);
        setPendingMockOtp(null);
        return pendingMockOtp.user.role;
      }
      throw apiErr;
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    department?: string,
    phone?: string,
    accessCode?: string
  ): Promise<UserRole> => {
    // Staff access code validation
    if ((role === 'admin' || role === 'supervisor') && accessCode !== 'TTU-STAFF-2026') {
      throw new Error('Invalid or missing Staff Access Code for staff account registration.');
    }

    try {
      const payload: Record<string, unknown> = { email, password, name, role };
      if (department) payload.department = department;
      if (phone) payload.phone = phone;
      if (accessCode) payload.accessCode = accessCode;

      const data = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      localStorage.setItem('token', data.token);
      const userRole = data.role as UserRole;
      const loggedUser: User = {
        id: data._id || data.id,
        email: data.email,
        name: data.name,
        role: userRole,
        department: data.department
      };
      setUser(loggedUser);
      localStorage.setItem('ttu_session_user', JSON.stringify(loggedUser));
      return userRole;
    } catch (apiErr: unknown) {
      const errMessage = apiErr instanceof Error ? apiErr.message : '';
      if (errMessage === 'User already exists') {
        throw apiErr;
      }

      // Offline / Local Mock Fallback Registration
      console.warn("Backend API unavailable, saving registered user locally.");
      const users = getStoredMockUsers();
      if (users.some((u: typeof INITIAL_DEMO_USERS[0]) => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('User already exists');
      }

      const newUser = {
        id: `u-${Date.now()}`,
        email,
        password,
        name,
        role,
        phone: phone || '',
        department: department || 'Industrial Attachment',
      };

      users.push(newUser);
      saveStoredMockUsers(users);

      const loggedUser: User = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        department: newUser.department,
      };

      const mockToken = `mock-token-${Date.now()}`;
      localStorage.setItem('token', mockToken);
      localStorage.setItem('ttu_session_user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      return role;
    }
  };

  const logout = () => {
    setUser(null);
    setPendingMockOtp(null);
    localStorage.removeItem('token');
    localStorage.removeItem('ttu_session_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        verifyOtp,
        register,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

