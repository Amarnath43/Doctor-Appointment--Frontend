import AxiosInstances from '../apiManager'

export const fetcher = (url) => AxiosInstances.get(url).then(res => res.data);