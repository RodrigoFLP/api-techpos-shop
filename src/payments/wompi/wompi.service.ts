import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { lastValueFrom, map } from 'rxjs';
import { IAccessToken } from '../interfaces/wompi';
import { PaymentsService } from '../payments.service';

@Injectable()
export class WompiService {
  constructor(
    @Inject('WOMPI_ACCESS_TOKEN') private accessToken: IAccessToken,
    private httpService: HttpService,
    private paymentsService: PaymentsService,
  ) {}

  async createPaymentLink(orderId: string, total: number) {
    if (
      Date.now() - this.accessToken.createdAt >
      (this.accessToken.expires_in - 300) * 1000
    ) {
      this.accessToken =
        await this.paymentsService.createOrRefreshAccessToken();
    }

    const response = await lastValueFrom(
      this.httpService
        .post(
          'https://api.wompi.sv/EnlacePago',
          {
            identificadorEnlaceComercio: 'string',
            monto: total,
            nombreProducto: `Orden #${orderId.split('-')[0]}`,
            configuracion: {
              urlWebhook: 'https://google.com/ticket?id=orderId',
              urlRedirect: 'https://panchos.com.sv/confirm-payment-redirect',
            },
          },
          {
            headers: {
              authorization: `Bearer ${this.accessToken.access_token}`,
            },
          },
        )
        .pipe(map((res) => res.data)),
    );
    return { ...response };
  }
}
