import { IsEnum, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Platform, PolicyTier } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreatePolicyDto {
  @ApiProperty({ enum: PolicyTier })
  @IsEnum(PolicyTier)
  tier: PolicyTier;
}

export class QuotePremiumDto {
  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  city: string;

  @ApiProperty({ example: 4500 })
  @IsNumber()
  @Min(500)
  @Type(() => Number)
  weeklyBaseEarning: number;

  @ApiProperty({ example: 8 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  avgHoursPerDay: number;

  @ApiProperty({ example: 6 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  workingDaysPerWeek: number;

  @ApiProperty({ enum: Platform })
  @IsEnum(Platform)
  platform: Platform;

  @ApiProperty({ enum: PolicyTier })
  @IsEnum(PolicyTier)
  tier: PolicyTier;
}
