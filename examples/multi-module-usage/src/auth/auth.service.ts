import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  login(username: string, password: string) {
    return {
      success: true,
      message: `User ${username} logged in successfully`,
      token: 'mock-jwt-token'
    };
  }

  register(userData: any) {
    return {
      success: true,
      message: 'User registered successfully',
      userId: Math.floor(Math.random() * 1000)
    };
  }

  resetPassword(email: string) {
    return {
      success: true,
      message: `Password reset email sent to ${email}`
    };
  }
}