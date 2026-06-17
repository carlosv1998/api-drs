import { Body, Controller, Get, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { PaginatedQueryDto } from 'src/common/dtos/filter.dto';
import { ProductsService } from './products.service';
import { RequirePermissions } from 'src/permissions/decorators/require-permissions.decorator';
import { SCOPE_NAME } from 'src/common/enums/scopes.enum';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';

@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(private readonly productsService: ProductsService) {}

  @RequirePermissions([SCOPE_NAME.LOGISTIC_PRODUCTS_READ])
  @Get()
  findAll(@Query() query: PaginatedQueryDto) {
    this.logger.debug('Received request to find all products');
    const { page, pageSize, filterDto } = query;
    return this.productsService.findAll({ page, pageSize }, filterDto);
  }

  @RequirePermissions([SCOPE_NAME.LOGISTIC_PRODUCTS_CREATE])
  @Post()
  create(@Body() dto: CreateProductDto) {
    this.logger.debug('Received request to create product');
    return this.productsService.create(dto);
  }

  @RequirePermissions([SCOPE_NAME.LOGISTIC_PRODUCTS_UPDATE])
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    this.logger.debug(`Received request to update product ${id}`);
    return this.productsService.update(id, dto);
  }
}
