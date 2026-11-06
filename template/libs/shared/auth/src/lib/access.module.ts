import { type DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AccessGuard } from './access.guard';
import { TOKEN_SETTINGS, TokenVerifier, type TokenSettings } from './token-verifier';

@Module({})
export class AccessModule {
  static forRoot(tokenSettings: TokenSettings): DynamicModule {
    return {
      module: AccessModule,
      providers: [
        { provide: TOKEN_SETTINGS, useValue: tokenSettings },
        { provide: TokenVerifier, useFactory: (settings: TokenSettings) => new TokenVerifier(settings), inject: [TOKEN_SETTINGS] },
        { provide: APP_GUARD, useClass: AccessGuard },
      ],
      exports: [TokenVerifier],
    };
  }
}
