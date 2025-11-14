import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'

@Injectable()
export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || ''

  constructor(private prisma: PrismaService) {}

  async register(data: {
    email: string
    password: string
    name: string
    role: 'PATIENT' | 'DOCTOR' | 'NURSE' | 'ADMIN'
    phone?: string
  }) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      throw new UnauthorizedException('User already exists')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role,
        phone: data.phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
      }
    })

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      this.JWT_SECRET,
      { expiresIn: '7d' }
    )

    return { user, token }
  }

  async login(email: string, password: string) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        patient: true,
        doctor: true,
      }
    })

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials')
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      this.JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return { user: userWithoutPassword, token }
  }

  async validateToken(token: string) {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET) as any
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          isActive: true,
          patient: true,
          doctor: true,
        }
      })

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid token')
      }

      return user
    } catch (error) {
      throw new UnauthorizedException('Invalid token')
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        patient: {
          include: {
            appointments: {
              include: {
                doctor: true,
              },
              orderBy: { scheduledAt: 'desc' }
            }
          }
        },
        doctor: {
          include: {
            appointments: {
              include: {
                patient: true,
              },
              orderBy: { scheduledAt: 'desc' }
            }
          }
        },
      }
    })

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    return user
  }
}
