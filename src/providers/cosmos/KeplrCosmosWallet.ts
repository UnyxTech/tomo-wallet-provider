import { CosmosProvider } from './CosmosProvider'
import { getWindow, ProviderOption } from '../../WalletProvider'
import { TomoWallet } from '../../types'
import keplrIcon from '../../icons/keplr_wallet.png'

const providerName = 'keplr'
export class KeplrCosmosWallet extends CosmosProvider {
  constructor(option: ProviderOption) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const provider = getWindow(option)[providerName]
    // check whether there is Keplr extension
    if (!provider) {
      throw new Error('Keplr Wallet extension not found')
    }
    super(option, provider)
  }
  getWalletProviderName(): Promise<string> {
    return Promise.resolve(keplrCosmosWalletOption.name)
  }
  getWalletProviderIcon(): Promise<string> {
    return Promise.resolve(keplrCosmosWalletOption.img)
  }
}

export const keplrCosmosWalletOption = {
  id: 'cosmos_keplr',
  img: keplrIcon,
  name: 'Keplr',
  chainType: 'cosmos',
  connectProvider: KeplrCosmosWallet,
  type: 'extension'
} as TomoWallet
