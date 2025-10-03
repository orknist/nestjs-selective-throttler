import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    // AuthModule only defines its own throttlers
    ThrottlerModule.forRoot([
      {
        name: 'auth-login',
        ttl: 60 * 1000, // 1 minute
        limit: 5, // 5 login attempts per minute
      },
      {
        name: 'auth-register',
        ttl: 60 * 1000, // 1 minute
        limit: 3, // 3 registration attempts per minute
      },
      {
        name: 'auth-password-reset',
        ttl: 300 * 1000, // 5 minutes
        limit: 2, // 2 password resets per 5 minutes
      }
    ])
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService]
})
export class AuthModule {}