export type DataObject = {
  pageTables: PageTable[];
  numPages: number;
  currentPages: number;
};

export type PageTable = {
  page: number;
  tables: string[][];
  merges: {
    [key: string]: {
      row: number;
      col: number;
      width: number;
      height: number;
    };
  };
  merge_alias: {
    [key: string]: string;
  };
  width: number;
  height: number;
};
