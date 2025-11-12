import { Body, Controller, Get, Post, Headers, UnauthorizedException } from '@nestjs/common'
import { AuthService } from '../auth.service'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: {
    email: string
    password: string
    name: string
    role: 'PATIENT' | 'DOCTOR' | 'NURSE' | 'ADMIN'
    phone?: string
  }) {
    return this.authService.register(body)
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password)
  }

  @Get('profile')
  async getProfile(@Headers('authorization') authorization?: string) {
    if (!authorization) {
      throw new UnauthorizedException('No token provided')
    }

    const token = authorization.replace('Bearer ', '')
    const user = await this.authService.validateToken(token)
    return this.authService.getProfile(user.id)
  }

  @Post('validate')
  async validateToken(@Body() body: { token: string }) {
    return this.authService.validateToken(body.token)
  }
}
