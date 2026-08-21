import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from '../../common/dto';
import { ApiResponse, IUser } from '../../common/interfaces';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<ApiResponse<any>> {
    const data = await this.authService.login(loginDto);
    return {
      success: true,
      data,
      message: 'Login successful',
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<ApiResponse<any>> {
    const data = await this.authService.refreshToken(refreshTokenDto);
    return {
      success: true,
      data,
      message: 'Token refreshed',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: IUser): Promise<ApiResponse<any>> {
    const data = await this.authService.getMe(user.id);
    return {
      success: true,
      data,
      message: 'User profile retrieved',
    };
  }
}
