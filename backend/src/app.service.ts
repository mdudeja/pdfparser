import { Injectable } from '@nestjs/common';
import * as PDFTableExtractor from 'pdf-table-extractor';
import writeXlsxFile from 'write-excel-file/node';
import { DataObject } from './globals/interfaces/DataObject';
import * as AdmZip from 'adm-zip';
import { Readable } from 'stream';

@Injectable()
export class AppService {
  async upload(
    files: Array<Express.Multer.File>,
  ): Promise<Readable | undefined> {
    if (!files || files.length === 0) {
      return;
    }

    const dataObjects = await this.getDataObjects(
      files.map((file) => file.path),
    );

    return this.makeExcelFileBundle(dataObjects);
  }

  private async getDataObjects(
    filePaths: string[],
  ): Promise<Array<{ data: DataObject; filePath: string }> | undefined> {
    const value = await Promise.all(
      filePaths.map((filePath) => {
        return new Promise((resolve, reject) => {
          PDFTableExtractor(
            filePath,
            (data: DataObject) => {
              resolve({ data, filePath });
            },
            (err: string) => {
              reject(err);
            },
          );
        });
      }),
    );

    return value as unknown as
      | Array<{ data: DataObject; filePath: string }>
      | undefined;
  }

  private async makeExcelFileBundle(
    dataObjects: Array<{ data: DataObject; filePath: string }>,
  ) {
    const zip = new AdmZip();

    await Promise.all(
      dataObjects.map(async (dataObject) => {
        const { data, filePath } = dataObject;
        const fileName = filePath.split('/').pop()?.split('.')[0];

        const sheetData = data.pageTables
          .map((pageTable) => {
            const merges = pageTable.merges;
            const merge_alias = pageTable.merge_alias;
            return pageTable.tables.map((row, rowIndex) => {
              return row.map((item, columnIndex) => {
                const r_c = `${rowIndex}-${columnIndex}`;

                if (merge_alias[r_c]) {
                  return;
                }

                const base = {
                  type: String,
                  value: item?.trim().length ? item : undefined,
                };

                if (merges[r_c]) {
                  if (merges[r_c].width > 1) {
                    base['span'] = merges[r_c].width;
                    base['align'] = 'center';
                  }
                  // if (merges[r_c].height > 1) {
                  //   base['rowSpan'] = merges[r_c].height;
                  //   base['alignVertical'] = 'center';
                  // }
                }

                return base;
              });
            });
          })
          .flat()
          .filter((item) => item);

        const buffer = await writeXlsxFile([sheetData], {
          sheets: ['Sheet1'],
          buffer: true,
        });

        zip.addFile(`${fileName}.xlsx`, buffer);
      }),
    );

    return Readable.from(zip.toBuffer());
  }
}
