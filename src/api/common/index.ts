import { DEFAULT_DICT, DEFAULT_DICT_ONE } from '@/constants/defaultDict'

/** Dictionaries are bundled client-side — there is no production `/dict/*` API. */
export const getDictApi = (): Promise<IResponse> => {
  return Promise.resolve({
    code: '0000',
    data: DEFAULT_DICT
  } as IResponse)
}

export const getDictOneApi = (): Promise<IResponse> => {
  return Promise.resolve({
    code: '0000',
    data: DEFAULT_DICT_ONE
  } as IResponse)
}
