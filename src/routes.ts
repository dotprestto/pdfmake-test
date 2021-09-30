import { Router, Request, Response } from 'express';
import { prismaClient } from './databases/prismaClient';
import PdfPrinter from 'pdfmake';
import { TableCell, TDocumentDefinitions } from 'pdfmake/interfaces';
import fs from 'fs';

const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

// eslint-disable-next-line new-cap
const routes = Router();

routes.get('/products', async (request: Request, response: Response) => {
  const products = await prismaClient.products.findMany();
  return response.json(products);
});

routes.get('/products/report', async (request: Request, response: Response) => {
  const products = await prismaClient.products.findMany();

  const printer = new PdfPrinter(fonts);
  const body = [];
  const columnsTitle: TableCell[] = [
    { text: 'ID', style: 'id' },
    { text: 'Descrição', style: 'columnsTitle' },
    { text: 'Preço', style: 'columnsTitle' },
    { text: 'Quantidade', style: 'columnsTitle' },
  ];

  const columnsBody: any = [];

  columnsTitle.forEach((column) => {
    columnsBody.push(column);
  });

  body.push(columnsBody);

  for await (const product of products) {
    const rows = [];
    rows.push(product.id);
    rows.push(product.description);
    rows.push(`R$ ${product.price}`);
    rows.push(product.quantity);

    body.push(rows);
  }

  const docDefinitions: TDocumentDefinitions = {
    defaultStyle: { font: 'Helvetica' },
    content: [
      {
        columns: [
          { text: 'Relatório de Produtos', style: 'header' },
          { text: new Date().toLocaleString('pt-BR'), style: 'header' },
        ],
      },
      {
        table: {
          heights: () => 30,
          widths: [200, 'auto', 'auto', 'auto'],
          body,
        },
      },
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        alignment: 'center',
      },
      columnsTitle: {
        fontSize: 13,
        bold: true,
        fillColor: '#7159C1',
        color: '#FFF',
        alignment: 'center',
      },
      id: {
        fillColor: '#999',
        color: '#FFF',
        alignment: 'center',
        margin: 4,
      },
    },
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinitions);
  // PdfDoc.pipe(fs.createWriteStream('Relatório.pdf'));

  const chunks: any = [];
  pdfDoc.on('data', (chunk) => {
    chunks.push(chunk);
  });

  pdfDoc.end();

  pdfDoc.on('end', () => {
    const result = Buffer.concat(chunks);
    response.end(result);
  });
});

export { routes };
