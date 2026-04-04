import {
  IsString, IsEmail, IsEnum, IsNumber, Min, Max, IsArray, ArrayMinSize,
  IsOptional, IsPhoneNumber, IsDecimal,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Platform } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateWorkerDto {
  @ApiProperty({ example: 'Rahul Kumar' })
  @IsString()
  name: string;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  city: string;

  @ApiProperty({ example: ['zone-1', 'zone-2'], type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  zones: string[];

  @ApiProperty({ enum: Platform })
  @IsEnum(Platform)
  platform: Platform;

  @ApiProperty({ example: 4500, description: 'Expected weekly earnings in INR' })
  @IsNumber()
  @Min(500)
  @Type(() => Number)
  weeklyBaseEarning: number;

  @ApiProperty({ example: 8, description: 'Average working hours per day' })
  @IsNumber()
  @Min(1)
  @Max(18)
  @Type(() => Number)
  avgHoursPerDay: number;

  @ApiPropertyOptional({ example: 6 })
  @IsNumber()
  @Min(1)
  @Max(7)
  @IsOptional()
  @Type(() => Number)
  workingDaysPerWeek?: number;
}

export class UpdateWorkerDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  zones?: string[];

  @ApiPropertyOptional()
  @IsNumber()
  @Min(1)
  @Max(18)
  @IsOptional()
  @Type(() => Number)
  avgHoursPerDay?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(1)
  @Max(7)
  @IsOptional()
  @Type(() => Number)
  workingDaysPerWeek?: number;
}
