import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PrimaryColumn, Timestamp } from 'typeorm';

export class TagGroup {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  color: string;

  @IsInt()
  @Min(0)
  max: number;

  @IsInt()
  @Min(0)
  min: number;

  @IsBoolean()
  hidden: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => Tags)
  tags: Tags[];
}

export class Portions {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(0)
  @Type(() => TagGroup)
  tagGroups: TagGroup[];
}

export class Tags {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsString()
  value: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  ratio: number;
}

export class CreateProductDto {
  @PrimaryColumn()
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsUrl()
  @IsString()
  @IsOptional()
  image: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsNotEmpty()
  categoriesId: number[];

  @IsNumber()
  @Min(0)
  price: number;

  @IsDateString()
  lastUpdate: Timestamp;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => Portions)
  portions: Portions[];

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(0)
  @Type(() => Tags)
  tags?: Tags[];
}
