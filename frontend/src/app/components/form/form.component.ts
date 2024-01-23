import { CommonModule } from '@angular/common';
import { Component, Renderer2, ViewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { ProgressComponent } from '../alerts/progress/progress.component';
import { ErrorComponent } from '../alerts/error/error.component';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    ProgressComponent,
    ErrorComponent,
  ],
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
})
export class FormComponent {
  @ViewChild('fileInput') fileInput: any;
  files: FileList | null = null;
  filenames: string[] = [];
  showProgress: boolean = false;
  showError: boolean = false;
  errorMessage: string = '';

  constructor(private renderer: Renderer2) {}

  onFilesChange(event: Event) {
    this.files = (event.target as HTMLInputElement).files;

    if (this.files) {
      this.filenames = Array.from(this.files).map((file) => file.name);
    }

    if (this.filenames.length > 5) {
      this.showError = true;
      this.errorMessage =
        "Please don't upload more than 5 files. It will take a long time to process and the request might time out.";
      this.hideErrorAlert();
    }
  }

  async onUpload() {
    if (!this.files || this.files.length === 0 || this.files.length > 5) {
      return;
    }

    this.showProgress = true;

    const formData = new FormData();

    for (let i = 0; i < this.files.length; i++) {
      formData.append('files', this.files[i]);
    }

    try {
      const resp = await fetch(`${environment.backendUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      this.showProgress = false;

      if (resp.status === 200 || resp.status === 201) {
        const file = await resp.blob();
        const url = window.URL.createObjectURL(file);
        const link = this.renderer.createElement('a');
        link.href = url;
        link.download = `excel-file-bundle.zip`;
        link.click();
      } else {
        this.errorMessage =
          'Oops! Something went wrong... Please try again in some time';
        this.showError = true;
        this.hideErrorAlert();
      }
    } catch (e) {
      this.showProgress = false;
      this.errorMessage =
        'Oops! Something went wrong... Please try again in some time';
      this.showError = true;
      this.hideErrorAlert();
    } finally {
      this.reset();
    }
  }

  hideErrorAlert() {
    setTimeout(() => {
      this.showError = false;
      this.errorMessage = '';
    }, 5000);
  }

  reset() {
    this.files = null;
    this.filenames = [];
    this.fileInput.nativeElement.value = '';
  }
}
