import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilterDto, PaginationDto } from 'src/common/dtos/filter.dto';
import { PrismaHelper } from 'src/common/helpers/prisma.helper';
import { IPaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { CreateProductDto } from './dtos/create-product.dto';
import { BaseProductUpdateData, StockUpdateData, UpdateProductDto } from './dtos/update-product.dto';
import { PRODUCT_UPDATE_ACTION } from './enums';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    paginationDto: PaginationDto,
    filterDto?: FilterDto,
  ): Promise<IPaginatedResponse<any>> {
    const where = PrismaHelper.buildWhere(filterDto, ['nombre', 'categoria', 'talla']);
    const orderBy = PrismaHelper.buildOrderBy(filterDto);

    const result = await PrismaHelper.paginate(
      (args) => this.prisma.product.findMany({ ...args }),
      (args) => this.prisma.product.count(args),
      paginationDto,
      where,
      orderBy,
    );

    this.logger.log(`Products found: ${result.pagination.total}`);
    return result;
  }

  async create(dto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: {
        nombre: dto.nombre,
        categoria: dto.categoria,
        talla: dto.talla,
        stock: dto.stock,
      },
    });

    this.logger.log(`Product created: ${product.id}`);
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    switch (dto.action) {
      case PRODUCT_UPDATE_ACTION.BASE_UPDATE:
        return this.handleBaseUpdate(id, dto.data as BaseProductUpdateData);
      case PRODUCT_UPDATE_ACTION.ADD_STOCK:
        return this.handleAddStock(id, dto.data as StockUpdateData);
      case PRODUCT_UPDATE_ACTION.SUBTRACT_STOCK:
        return this.handleSubtractStock(id, dto.data as StockUpdateData);
    }
  }

  private async findById(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  private async handleBaseUpdate(id: string, data: BaseProductUpdateData) {
    await this.findById(id);

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...(data.nombre !== undefined && { nombre: data.nombre }),
        ...(data.categoria !== undefined && { categoria: data.categoria }),
        ...(data.talla !== undefined && { talla: data.talla }),
        ...(data.stock !== undefined && { stock: data.stock }),
      },
    });

    this.logger.log(`Product updated: ${id}`);
    return product;
  }

  private async handleAddStock(id: string, data: StockUpdateData) {
    const product = await this.findById(id);
    const updated = await this.prisma.product.update({
      where: { id },
      data: { stock: product.stock + data.cantidad },
    });
    this.logger.log(`Stock added for product ${id}: ${product.stock} -> ${updated.stock}`);
    return updated;
  }

  private async handleSubtractStock(id: string, data: StockUpdateData) {
    const product = await this.findById(id);
    const newStock = product.stock - data.cantidad;
    if (newStock < 0) throw new BadRequestException('Stock insuficiente para realizar la operación');
    const updated = await this.prisma.product.update({
      where: { id },
      data: { stock: newStock },
    });
    this.logger.log(`Stock subtracted for product ${id}: ${product.stock} -> ${updated.stock}`);
    return updated;
  }
}
