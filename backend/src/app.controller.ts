import {
  Controller,
  Get,
  Post,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  async upload(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Res() res: Response,
  ) {
    const xlsxFile = await this.appService.upload(files);
    if (!xlsxFile) {
      return res.status(400).send('Something went wrong');
    }

    res.setHeader(
      'Content-disposition',
      'attachment; filename=excel-file-bundle.zip',
    );

    return xlsxFile.pipe(res);
  }
}
