/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  getWindow,
  InscriptionResult,
  Network,
  ProviderOption
} from '../../WalletProvider'
import { BTCProvider } from './BTCProvider'
import unisatIcon from '../../icons/unisat_wallet.svg'
import { TomoWallet } from '../../types'

export const unisatProvider = 'unisat'

export class UniSatBTCWallet extends BTCProvider {
  constructor(option: ProviderOption) {
    // @ts-ignore
    const bitcoinNetworkProvider = getWindow(option)[unisatProvider]
    if (!bitcoinNetworkProvider) {
      throw new Error('UniSat Wallet extension not found')
    }
    super(option, bitcoinNetworkProvider)
  }

  connectWallet = async (): Promise<this> => {
    const unisatwallet = this.bitcoinNetworkProvider
    try {
      const accounts = await unisatwallet.requestAccounts()
      const compressedPublicKey = await unisatwallet.getPublicKey()
      if (!accounts || !compressedPublicKey) {
        throw new Error('Could not connect to unisat wallet')
      }
      return this
    } catch (error) {
      throw new Error('Failed to connect to unisat wallet')
    }
  }

  async switchNetwork(network: Network) {
    return await this.bitcoinNetworkProvider.switchNetwork(
      network.replace('mainnet', 'livenet') as Network
    )
  }

  async getNetwork(): Promise<Network> {
    const result = (await this.bitcoinNetworkProvider.getNetwork())
      .replace('livenet', 'mainnet')
      .replace('unknown', 'signet') as Network
    return result
  }

  async sendBitcoin(to: string, satAmount: number) {
    const result = await this.bitcoinNetworkProvider.sendBitcoin(to, satAmount)
    return result
  }

  getBalance = async (): Promise<number> => {
    // @ts-ignore
    const result = await this.bitcoinNetworkProvider.getBalance()
    // @ts-ignore
    return result.confirmed
  }

  pushTx = async (txHex: string): Promise<string> => {
    // @ts-ignore
    return await this.bitcoinNetworkProvider.pushTx(txHex)
  }
  async getInscriptions(
    cursor?: number,
    size?: number
  ): Promise<InscriptionResult> {
    // @ts-ignore
    return await this.bitcoinNetworkProvider.getInscriptions(cursor, size)
  }

  getWalletProviderName(): Promise<string> {
    return Promise.resolve(uniSatBTCWalletOption.name)
  }
  getWalletProviderIcon(): Promise<string> {
    return Promise.resolve(uniSatBTCWalletOption.img)
  }
}

export const uniSatBTCWalletOption = {
  id: 'bitcoin_unisat',
  img: unisatIcon,
  name: 'Unisat',
  chainType: 'bitcoin',
  connectProvider: UniSatBTCWallet,
  type: 'extension'
} as TomoWallet
