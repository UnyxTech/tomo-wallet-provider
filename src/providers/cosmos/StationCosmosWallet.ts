import { CosmosProvider } from './CosmosProvider'
import { getWindow, ProviderOption } from '../../WalletProvider'
import { TomoWallet } from '../../types'
import stationIcon from '../../icons/station.svg'

export class StationCosmosWallet extends CosmosProvider {
  constructor(option: ProviderOption) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const provider = getWindow(option).station?.keplr
    if (!provider) {
      throw new Error('Station Wallet extension not found')
    }
    super(option, provider)
  }
  getWalletProviderName(): Promise<string> {
    return Promise.resolve(stationCosmosWalletOption.name)
  }
  getWalletProviderIcon(): Promise<string> {
    return Promise.resolve(stationCosmosWalletOption.img)
  }
}

export const stationCosmosWalletOption = {
  id: 'cosmos_station',
  img: stationIcon,
  name: 'Station',
  chainType: 'cosmos',
  connectProvider: StationCosmosWallet,
  type: 'extension'
} as TomoWallet
