import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UUIDVersion } from 'class-validator';
import { Repository } from 'typeorm';
import { ProductsService } from '../products/products.service';
import { AddressesService } from '../users/addresses/addresses.service';
import { CustomersService } from '../users/customers/customers.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Ticket } from './entities/ticket.entity';
import { TicketItem } from './entities/ticketItem.entity';
import { StatusService } from './status/status.service';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(TicketItem)
    private readonly ticketItemsRepo: Repository<TicketItem>,
    private readonly statusService: StatusService,
    @InjectRepository(Ticket) private readonly ticketsRepo: Repository<Ticket>,
    private readonly customerService: CustomersService,
    private readonly addressService: AddressesService,
    private readonly productService: ProductsService,
  ) {}

  async create(data: CreateTicketDto, customerId: number) {
    //create Ticket

    const newTicket = this.ticketsRepo.create({ ...data, totalAmount: 0 });

    let total = 0;
    const ticketItems = [];

    const customer = await this.customerService.findOne(customerId); //todo: change how customer id is found
    if (!customer) {
      throw new NotFoundException(`user doesn't exist`);
    }
    const address = await this.addressService.findOne(data.customerAddressId);
    if (!address) {
      throw new NotFoundException(`address doesn't exist`);
    }

    const status = await this.statusService.create();

    newTicket.status = status;
    newTicket.customer = customer;
    newTicket.address = address;
    // newTicket.status = 'unpaid';

    await this.ticketsRepo.save(newTicket);

    // add ticketItems and bind each one to ticket
    for await (const item of data.ticketItems) {
      const serializedItem = {
        ...item,
        tags: item.tagsGroups.reduce((acc, val) => acc.concat(val.tags), []),
      };

      this.ticketItemsRepo.create(serializedItem);

      const product = await this.productService.findOne(item.productId);

      const newTicketItem = this.ticketItemsRepo.create(item);
      newTicketItem.product = product;
      newTicketItem.ticket = newTicket;
      newTicketItem.tags = serializedItem.tags;

      console.log(newTicketItem.tags);

      const portion = product.portions.find(
        (portion) => portion.name === item.portion.name,
      );

      if (!portion) {
        throw new NotFoundException(`Portion not found`);
      }

      newTicketItem.totalAmount = portion.price;

      if (serializedItem.tags.length !== 0) {
        for await (const tag of serializedItem.tags) {
          const tagGroup = portion.tagGroups.find(
            (tagGroup) => tagGroup.name === tag.name,
          );
          if (!tagGroup) {
            throw new NotFoundException(
              `Portion of ${tag.name} not found in product portions`,
            );
          }

          const nTag = tagGroup.tags.find((nTag) => nTag.value === tag.value);
          if (!nTag) {
            throw new NotFoundException(
              `tag ${tag.value} not found in portion tags`,
            );
          }
          newTicketItem.totalAmount =
            newTicketItem.totalAmount + nTag.price * tag.quantity;
        }
      }

      newTicketItem.totalAmount = newTicketItem.totalAmount * item.quantity;
      total = total + newTicketItem.totalAmount;
      this.ticketItemsRepo.save(newTicketItem);

      ticketItems.push(newTicketItem);
    }
    newTicket.totalAmount = total;

    await this.ticketsRepo.save(newTicket);
    return newTicket;
  }

  findAll() {
    return this.ticketsRepo.find();
  }

  async findOne(id: number) {
    const ticketWithItemsAndProducts = await this.ticketsRepo
      .createQueryBuilder('tickets')
      .innerJoinAndSelect('tickets.ticketItems', 'ticketItems')
      .innerJoinAndSelect('ticketItems.product', 'product.id')
      .where('tickets.id = :id', { id })
      .getOne();
    return ticketWithItemsAndProducts;
  }

  async confirmPayment(id: string) {
    const ticket = await this.ticketsRepo.findOne(id);

    // ticket.status = 'placed';

    return this.ticketsRepo.save(ticket);
  }

  update(id: number, updateTicketDto: UpdateTicketDto) {
    return `This action updates a #${id} ticket`;
  }

  remove(id: number) {
    return this.ticketsRepo.delete(id);
  }

  async calculatePrice(data: CreateTicketDto) {
    const newTicket = this.ticketsRepo.create(data);

    let total = 0;
    const ticketItems = [];

    // add ticketItems and bind each one to ticket
    for await (const item of data.ticketItems) {
      const serializedItem = {
        ...item,
        tags: item.tagsGroups.reduce((acc, val) => acc.concat(val.tags), []),
      };

      this.ticketItemsRepo.create(serializedItem);

      const product = await this.productService.findOne(item.productId);

      const newTicketItem = this.ticketItemsRepo.create(item);
      newTicketItem.product = product;
      newTicketItem.ticket = newTicket;

      newTicketItem.tags = serializedItem.tags;

      const portion = product.portions.find(
        (portion) => portion.name === item.portion.name,
      );

      if (!portion) {
        throw new NotFoundException(`Portion not found`);
      }

      newTicketItem.totalAmount = portion.price;

      if (serializedItem.tags.length !== 0) {
        for await (const tag of serializedItem.tags) {
          const tagGroup = portion.tagGroups.find(
            (tagGroup) => tagGroup.name === tag.name,
          );
          if (!tagGroup) {
            throw new NotFoundException(
              `Portion of ${tag.name} not found in product portions`,
            );
          }

          const nTag = tagGroup.tags.find((nTag) => nTag.value === tag.value);
          if (!nTag) {
            throw new NotFoundException(
              `tag ${tag.value} not found in portion tags`,
            );
          }
          newTicketItem.totalAmount =
            newTicketItem.totalAmount + nTag.price * tag.quantity;
        }
      }

      newTicketItem.totalAmount = newTicketItem.totalAmount * item.quantity;
      total = total + newTicketItem.totalAmount;

      ticketItems.push(newTicketItem);
    }

    newTicket.totalAmount = total;

    return newTicket;
  }

  async ordersByCustomer(customerId: number) {
    const ticketWithItemsAndProducts = await this.ticketsRepo
      .createQueryBuilder('tickets')
      .innerJoinAndSelect('tickets.ticketItems', 'ticketItems')
      .innerJoinAndSelect('ticketItems.product', 'product.id')
      .where('tickets.customerId = :id', { id: customerId })
      .getMany();
    return ticketWithItemsAndProducts;
  }

  async orderByCustomer(customerId: number, ticketId: string) {
    const ticketWithItemsAndProducts = await this.ticketsRepo
      .createQueryBuilder('tickets')
      .innerJoinAndSelect('tickets.status', 'status')
      .innerJoinAndSelect('tickets.ticketItems', 'ticketItems')
      .innerJoinAndSelect('ticketItems.product', 'product')
      .where('tickets.customerId = :id', { id: customerId })
      .andWhere('tickets.id = :ticketId', { ticketId: ticketId })
      .getOne();

    if (!ticketWithItemsAndProducts) {
      throw new BadRequestException('ticket not found');
    }

    return ticketWithItemsAndProducts;
  }
}
