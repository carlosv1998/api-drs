import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    //consultar a la base de datos
    // ordenar los datos

    //devolverlos al cliente

    const datos = [
      { nombre: 'Juan', edad: 25, sexo: 'M' },
      { nombre: 'Pedro', edad: 30, sexo: 'M' },
      { nombre: 'Maria', edad: 20, sexo: 'F' },
      { nombre: 'Luis', edad: 35, sexo: 'M' },
      { nombre: 'Carlos', edad: 40, sexo: 'M' },
      { nombre: 'Ana', edad: 30, sexo: 'F' },
    ];

    return datos;
  }
}
