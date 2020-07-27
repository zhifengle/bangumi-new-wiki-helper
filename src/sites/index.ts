import { SiteConfig, ModelKey } from '../interface/wiki';
import { ITiming, IFuncPromise } from '../interface/types';

type FuncDict = {
  hooks?: {};
  infoUtils?: {
    category: string;
    dealFunc: (...args: any) => string;
  }[];
};

const noOps = () => Promise.resolve();
export function getHooks(
  siteConfig: SiteConfig,
  timing: ITiming
): IFuncPromise {
  const hooks: any = sitesFuncDict[siteConfig.key]?.hooks || {};
  return hooks[timing] || noOps;
}
export const sitesFuncDict: {
  [key in ModelKey]?: {
    hooks?: {
      beforeCreate?: IFuncPromise;
      afterCreate?: IFuncPromise;
    };
  };
} = {
  amazon_jp_book: {
    hooks: {
      async beforeCreate() {
        console.info('create');
      },
    },
  },
};
