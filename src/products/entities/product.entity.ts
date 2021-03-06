import {} from '@nestjs/typeorm';
import { IsNumber, IsString, IsUrl } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TicketItem } from '../../tickets/entities/ticketItem.entity';
import { Category } from './category.entity';

@Entity()
export class Product {
  @PrimaryColumn({ unique: true })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'numeric', precision: 15, scale: 4 })
  price: number;

  @Column({ type: 'jsonb' })
  portions: Portion[];

  @Column({ type: 'jsonb' })
  tags: Tag[];

  @IsUrl()
  @Column({ type: 'varchar', length: 255 })
  image: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @ManyToMany(() => Category, (category) => category.products)
  categories: Category[];

  @OneToMany(() => TicketItem, (ticketItem) => ticketItem.ticket)
  ticketItems: TicketItem[];
}

export class Portion {
  id: number;
  @IsString()
  name: string;
  @IsNumber()
  price: number;
  tagGroups: TagGroup[];
}

export class TagGroup {
  id: number;
  name: string;
  color: string;
  max: number;
  min: number;
  hidden: boolean;
  tags: Tag[];
}

export class Tag {
  id: number;
  name: string;
  value: string;
  price: number;
  ratio: number;
}
