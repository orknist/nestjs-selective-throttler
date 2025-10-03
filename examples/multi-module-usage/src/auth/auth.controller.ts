import { Controller, Post, Body, Get } from '@nestjs/common';
import { SingleThrottle, SelectiveThrottle } from 'nestjs-selective-throttler/decorators';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ✅ This works - auth-login is defined in AuthModule
  @Post('login')
  @SingleThrottle('auth-login')
  login(@Body() loginDto: { username: string; password: string }) {
    return {
      ...this.authService.login(loginDto.username, loginDto.password),
      throttler: 'auth-login (5 req/min)',
      module: 'AuthModule'
    };
  }

  // ✅ This works - auth-register is defined in AuthModule
  @Post('register')
  @SingleThrottle('auth-register')
  register(@Body() registerDto: any) {
    return {
      ...this.authService.register(registerDto),
      throttler: 'auth-register (3 req/min)',
      module: 'AuthModule'
    };
  }

  // ✅ This works - auth-password-reset is defined in AuthModule
  @Post('reset-password')
  @SingleThrottle('auth-password-reset')
  resetPassword(@Body() resetDto: { email: string }) {
    return {
      ...this.authService.resetPassword(resetDto.email),
      throttler: 'auth-password-reset (2 req/5min)',
      module: 'AuthModule'
    };
  }

  // ❌ PROBLEM: api-public is defined in ApiModule, NOT in AuthModule!
  @Get('profile')
  @SingleThrottle('api-public')
  getProfile() {
    return {
      message: 'User profile data',
      throttler: 'api-public (UNDEFINED in AuthModule!)',
      module: 'AuthModule',
      problem: 'This throttler is not defined in AuthModule - will not work properly!'
    };
  }

  // ❌ PROBLEM: Mixed throttlers - some are not in AuthModule
  @Post('change-password')
  @SelectiveThrottle({
    'auth-password-reset': {}, // ✅ Available in AuthModule
    'payment-verify': {},      // ❌ Defined in PaymentModule, NOT in AuthModule!
    'api-internal': {}         // ❌ Defined in ApiModule, NOT in AuthModule!
  })
  changePassword(@Body() changeDto: { oldPassword: string; newPassword: string }) {
    return {
      message: 'Password changed successfully',
      throttlers: 'auth-password-reset (✅) + payment-verify (❌) + api-internal (❌)',
      module: 'AuthModule',
      problem: 'Only auth-password-reset will work, others are undefined!'
    };
  }
}